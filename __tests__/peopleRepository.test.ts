/**
 * Unit Tests for People Profiles Repository
 * 
 * Per repo rules: Unit tests (Vitest) required for Definition of Done
 * Tests data access layer following repository pattern
 */

import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { peopleProfiles, jobPeopleRefs, jobs } from '../db/schema';
import { 
  getPeopleForJob, 
  savePersonAndLink, 
  unlinkPersonFromJob,
  getPersonById,
  updatePerson,
  isPersonLinkedToJob
} from '../db/peopleRepository';
import { v4 as uuidv4 } from 'uuid';

// Test database (in-memory)
const sqlite = new Database(':memory:');
const db = drizzle(sqlite);

// Test data
const TEST_JOB_ID = uuidv4();
const TEST_PERSON_ID = uuidv4();

describe('People Repository', () => {
  
  beforeEach(() => {
    // Setup tables
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS people_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT,
        company_id TEXT,
        linkedin_url TEXT,
        updated_at INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS job_people_refs (
        job_id TEXT NOT NULL,
        person_id TEXT NOT NULL,
        rel_type TEXT NOT NULL,
        PRIMARY KEY (job_id, person_id)
      );
      
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        company TEXT NOT NULL,
        title TEXT NOT NULL,
        user_id TEXT,
        status TEXT,
        created_at INTEGER NOT NULL
      );
    `);
    
    // Insert test job
    sqlite.prepare(`
      INSERT INTO jobs (id, company, title, user_id, status, created_at)
      VALUES (?, 'Test Company', 'Test Role', 'user123', 'new', ?)
    `).run(TEST_JOB_ID, Date.now());
  });
  
  describe('savePersonAndLink', () => {
    it('should create a person and link to job', async () => {
      const personId = await savePersonAndLink(
        TEST_JOB_ID,
        {
          name: 'Jane Doe',
          title: 'Senior Recruiter',
          linkedinUrl: 'https://linkedin.com/in/janedoe',
        },
        'recruiter'
      );
      
      expect(personId).toBeTruthy();
      expect(typeof personId).toBe('string');
      
      // Verify person was created
      const person = await getPersonById(personId);
      expect(person).toBeTruthy();
      expect(person?.name).toBe('Jane Doe');
      expect(person?.title).toBe('Senior Recruiter');
      
      // Verify link was created
      const isLinked = await isPersonLinkedToJob(TEST_JOB_ID, personId);
      expect(isLinked).toBe(true);
    });
    
    it('should support all relationship types', async () => {
      const relTypes = ['recruiter', 'hiring_manager', 'peer', 'other'];
      
      for (const relType of relTypes) {
        const personId = await savePersonAndLink(
          TEST_JOB_ID,
          { name: `Person ${relType}`, linkedinUrl: `https://linkedin.com/in/${relType}` },
          relType
        );
        
        expect(personId).toBeTruthy();
      }
      
      // Verify all 4 people linked
      const people = await getPeopleForJob(TEST_JOB_ID);
      expect(people.length).toBe(4);
    });
  });
  
  describe('getPeopleForJob', () => {
    it('should return empty array for job with no people', async () => {
      const people = await getPeopleForJob(TEST_JOB_ID);
      expect(people).toEqual([]);
    });
    
    it('should return all linked people with relationship types', async () => {
      // Add 2 people
      const person1Id = await savePersonAndLink(
        TEST_JOB_ID,
        { name: 'Recruiter Jane', title: 'Recruiter' },
        'recruiter'
      );
      
      const person2Id = await savePersonAndLink(
        TEST_JOB_ID,
        { name: 'Manager Bob', title: 'Engineering Manager' },
        'hiring_manager'
      );
      
      const people = await getPeopleForJob(TEST_JOB_ID);
      
      expect(people.length).toBe(2);
      expect(people[0].name).toBe('Recruiter Jane');
      expect(people[0].relType).toBe('recruiter');
      expect(people[1].name).toBe('Manager Bob');
      expect(people[1].relType).toBe('hiring_manager');
    });
  });
  
  describe('unlinkPersonFromJob', () => {
    it('should remove link but keep person record', async () => {
      // Add person
      const personId = await savePersonAndLink(
        TEST_JOB_ID,
        { name: 'Test Person' },
        'recruiter'
      );
      
      // Verify linked
      let isLinked = await isPersonLinkedToJob(TEST_JOB_ID, personId);
      expect(isLinked).toBe(true);
      
      // Unlink
      await unlinkPersonFromJob(TEST_JOB_ID, personId);
      
      // Verify unlinked
      isLinked = await isPersonLinkedToJob(TEST_JOB_ID, personId);
      expect(isLinked).toBe(false);
      
      // Verify person still exists (for reuse)
      const person = await getPersonById(personId);
      expect(person).toBeTruthy();
      expect(person?.name).toBe('Test Person');
    });
  });
  
  describe('updatePerson', () => {
    it('should update person information', async () => {
      const personId = await savePersonAndLink(
        TEST_JOB_ID,
        { name: 'Original Name', title: 'Original Title' },
        'recruiter'
      );
      
      await updatePerson(personId, {
        name: 'Updated Name',
        title: 'Updated Title',
        linkedinUrl: 'https://linkedin.com/in/updated',
      });
      
      const person = await getPersonById(personId);
      expect(person?.name).toBe('Updated Name');
      expect(person?.title).toBe('Updated Title');
      expect(person?.linkedinUrl).toBe('https://linkedin.com/in/updated');
    });
  });
  
  describe('isPersonLinkedToJob', () => {
    it('should return true for linked person', async () => {
      const personId = await savePersonAndLink(
        TEST_JOB_ID,
        { name: 'Linked Person' },
        'recruiter'
      );
      
      const isLinked = await isPersonLinkedToJob(TEST_JOB_ID, personId);
      expect(isLinked).toBe(true);
    });
    
    it('should return false for unlinked person', async () => {
      const isLinked = await isPersonLinkedToJob(TEST_JOB_ID, 'non-existent-id');
      expect(isLinked).toBe(false);
    });
  });
});

