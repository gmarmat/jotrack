/**
 * People Profiles Repository
 * 
 * Follows repository pattern from db/signalRepository.ts
 * Manages peopleProfiles and jobPeopleRefs tables
 * 
 * Architecture (per ARCHITECTURE.md):
 * - peopleProfiles: Global reusable person records
 * - jobPeopleRefs: Junction table (job ↔ person + relationship type)
 * - jobs.peopleProfilesData: Cached AI analysis results
 */

import { db } from './client';
import { peopleProfiles, jobPeopleRefs } from './schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all people linked to a specific job
 * Returns joined data from peopleProfiles + jobPeopleRefs
 */
export async function getPeopleForJob(jobId: string) {
  const results = await db
    .select({
      personId: jobPeopleRefs.personId,
      relType: jobPeopleRefs.relType,
      name: peopleProfiles.name,
      title: peopleProfiles.title,
      linkedinUrl: peopleProfiles.linkedinUrl,
      companyId: peopleProfiles.companyId,
      summary: peopleProfiles.summary,        // Extracted JSON data
      rawText: peopleProfiles.rawText,        // Original pasted text
      optimizedAt: peopleProfiles.optimizedAt, // Optimization timestamp
      isOptimized: peopleProfiles.isOptimized, // Optimization status
      recruiterType: peopleProfiles.recruiterType, // Headhunter support
      searchFirmName: peopleProfiles.searchFirmName, // Search firm
      searchFirmTier: peopleProfiles.searchFirmTier, // Firm tier
      practiceArea: peopleProfiles.practiceArea, // Recruiter specialty
      placementLevel: peopleProfiles.placementLevel, // Placement level
    })
    .from(jobPeopleRefs)
    .innerJoin(peopleProfiles, eq(peopleProfiles.id, jobPeopleRefs.personId))
    .where(eq(jobPeopleRefs.jobId, jobId));
  
  return results;
}

/**
 * Save a person and link to job in one transaction
 * Creates person record + job relationship
 */
export async function savePersonAndLink(
  jobId: string,
  personData: {
    name: string;
    title?: string;
    linkedinUrl?: string;
    companyId?: string;
    rawText?: string;      // Original pasted text
    isOptimized?: number;  // Optimization status
    recruiterType?: string; // 'company' or 'headhunter' (for recruiters only)
    searchFirmName?: string; // Search firm name (for headhunters only)
  },
  relType: string
) {
  const personId = uuidv4();
  
  // Insert person into global peopleProfiles table
  await db.insert(peopleProfiles).values({
    id: personId,
    name: personData.name,
    title: personData.title,
    linkedinUrl: personData.linkedinUrl,
    companyId: personData.companyId,
    rawText: personData.rawText,        // Store pasted text
    isOptimized: personData.isOptimized || 0, // Default to unoptimized
    recruiterType: personData.recruiterType || null, // Headhunter support
    searchFirmName: personData.searchFirmName || null, // Search firm
    updatedAt: Math.floor(Date.now() / 1000), // Required field
  });
  
  // Link person to job with relationship type
  await db.insert(jobPeopleRefs).values({
    jobId,
    personId,
    relType, // 'recruiter', 'hiring_manager', 'peer', 'other'
  });
  
  console.log(`✅ Saved person ${personData.name} and linked to job ${jobId} as ${relType}`);
  
  return personId;
}

/**
 * Unlink a person from a job (does NOT delete person record)
 * Person remains in peopleProfiles for reuse across jobs
 */
export async function unlinkPersonFromJob(jobId: string, personId: string) {
  await db.delete(jobPeopleRefs)
    .where(and(
      eq(jobPeopleRefs.jobId, jobId),
      eq(jobPeopleRefs.personId, personId)
    ));
  
  console.log(`✅ Unlinked person ${personId} from job ${jobId}`);
}

/**
 * Get a specific person by ID
 */
export async function getPersonById(personId: string) {
  const [person] = await db
    .select()
    .from(peopleProfiles)
    .where(eq(peopleProfiles.id, personId))
    .limit(1);
  
  return person;
}

/**
 * Update a person's information
 */
export async function updatePerson(
  personId: string,
  updates: {
    name?: string;
    title?: string;
    linkedinUrl?: string;
  }
) {
  await db.update(peopleProfiles)
    .set(updates)
    .where(eq(peopleProfiles.id, personId));
  
  console.log(`✅ Updated person ${personId}`);
}

/**
 * Check if a person is already linked to a job
 */
export async function isPersonLinkedToJob(jobId: string, personId: string): Promise<boolean> {
  const [link] = await db
    .select()
    .from(jobPeopleRefs)
    .where(and(
      eq(jobPeopleRefs.jobId, jobId),
      eq(jobPeopleRefs.personId, personId)
    ))
    .limit(1);
  
  return !!link;
}

