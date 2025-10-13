import { db } from './client';
import {
  companies,
  peopleProfiles,
  rolesCatalog,
  skillsTaxonomy,
  sourcesCache,
  salaryBenchmarks,
  learningCatalog,
  jobCompanyRefs,
  jobPeopleRefs,
  jobSkillSnapshots,
  aiSessions,
  aiRuns,
  knowledgeStaleness,
  type NewCompany,
  type Company,
  type NewPeopleProfile,
  type PeopleProfile,
  type RoleCatalog,
  type SkillTaxonomy,
  type NewSourceCache,
  type SourceCache,
  type SalaryBenchmark,
  type LearningCatalog,
  type NewJobCompanyRef,
  type NewJobPeopleRef,
  type NewJobSkillSnapshot,
  type NewAiSession,
  type AiSession,
  type NewAiRun,
  type AiRun,
} from './schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// ===== Companies =====
export async function upsertCompany(data: NewCompany): Promise<Company> {
  const existing = await db
    .select()
    .from(companies)
    .where(eq(companies.id, data.id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(companies)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(companies.id, data.id));
    return { ...existing[0], ...data, updatedAt: Date.now() };
  }

  await db.insert(companies).values(data);
  return data as Company;
}

export async function getCompanyByDomain(domain: string): Promise<Company | null> {
  const results = await db
    .select()
    .from(companies)
    .where(sql`${companies.website} LIKE ${'%' + domain + '%'}`)
    .limit(1);
  return results[0] || null;
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const results = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1);
  return results[0] || null;
}

// ===== People Profiles =====
export async function upsertPeopleProfile(data: NewPeopleProfile): Promise<PeopleProfile> {
  const existing = await db
    .select()
    .from(peopleProfiles)
    .where(eq(peopleProfiles.id, data.id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(peopleProfiles)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(peopleProfiles.id, data.id));
    return { ...existing[0], ...data, updatedAt: Date.now() };
  }

  await db.insert(peopleProfiles).values(data);
  return data as PeopleProfile;
}

export async function getPeopleByLinkedIn(linkedinUrl: string): Promise<PeopleProfile | null> {
  const results = await db
    .select()
    .from(peopleProfiles)
    .where(eq(peopleProfiles.linkedinUrl, linkedinUrl))
    .limit(1);
  return results[0] || null;
}

export async function batchUpsertPeople(profiles: NewPeopleProfile[]): Promise<PeopleProfile[]> {
  const results: PeopleProfile[] = [];
  for (const profile of profiles) {
    const upserted = await upsertPeopleProfile(profile);
    results.push(upserted);
  }
  return results;
}

// ===== Roles Catalog =====
export async function getRoleById(id: string): Promise<RoleCatalog | null> {
  const results = await db
    .select()
    .from(rolesCatalog)
    .where(eq(rolesCatalog.id, id))
    .limit(1);
  return results[0] || null;
}

export async function findRoleByTitle(title: string, seniority?: string): Promise<RoleCatalog | null> {
  if (seniority) {
    const results = await db
      .select()
      .from(rolesCatalog)
      .where(and(eq(rolesCatalog.title, title), eq(rolesCatalog.seniority, seniority)))
      .limit(1);
    return results[0] || null;
  }
  
  const results = await db
    .select()
    .from(rolesCatalog)
    .where(eq(rolesCatalog.title, title))
    .limit(1);
  return results[0] || null;
}

export async function listRoles(): Promise<RoleCatalog[]> {
  return db.select().from(rolesCatalog).orderBy(rolesCatalog.title);
}

// ===== Skills Taxonomy =====
export async function getSkillById(id: string): Promise<SkillTaxonomy | null> {
  const results = await db
    .select()
    .from(skillsTaxonomy)
    .where(eq(skillsTaxonomy.id, id))
    .limit(1);
  return results[0] || null;
}

export async function findSkillByLabel(label: string): Promise<SkillTaxonomy | null> {
  const results = await db
    .select()
    .from(skillsTaxonomy)
    .where(eq(skillsTaxonomy.label, label))
    .limit(1);
  return results[0] || null;
}

export async function normalizeSkills(skillLabels: string[]): Promise<SkillTaxonomy[]> {
  const normalized: SkillTaxonomy[] = [];
  
  for (const label of skillLabels) {
    // Try exact match
    let skill = await findSkillByLabel(label);
    
    // Try alias match
    if (!skill) {
      const allSkills = await db.select().from(skillsTaxonomy);
      skill = allSkills.find(s => {
        const aliases = JSON.parse(s.aliases) as string[];
        return aliases.some(a => a.toLowerCase() === label.toLowerCase());
      }) || null;
    }
    
    // Create if not found
    if (!skill) {
      const newSkill = {
        id: `skill-${label.toLowerCase().replace(/\s+/g, '-')}`,
        label,
        category: 'technical',
        aliases: '[]',
      };
      await db.insert(skillsTaxonomy).values(newSkill);
      skill = newSkill as SkillTaxonomy;
    }
    
    if (skill) {
      normalized.push(skill);
    }
  }
  
  return normalized;
}

// ===== Sources Cache =====
export async function upsertSource(data: NewSourceCache): Promise<SourceCache> {
  const existing = await db
    .select()
    .from(sourcesCache)
    .where(eq(sourcesCache.url, data.url))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(sourcesCache)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(sourcesCache.url, data.url));
    return { ...existing[0], ...data, updatedAt: Date.now() };
  }

  await db.insert(sourcesCache).values(data);
  return data as SourceCache;
}

export async function getSourceByUrl(url: string): Promise<SourceCache | null> {
  const results = await db
    .select()
    .from(sourcesCache)
    .where(eq(sourcesCache.url, url))
    .limit(1);
  return results[0] || null;
}

// ===== Salary Benchmarks =====
export async function getSalaryBenchmarks(
  roleId: string,
  geo?: string
): Promise<SalaryBenchmark[]> {
  if (geo) {
    return db
      .select()
      .from(salaryBenchmarks)
      .where(and(eq(salaryBenchmarks.roleId, roleId), eq(salaryBenchmarks.geo, geo)));
  }
  
  return db
    .select()
    .from(salaryBenchmarks)
    .where(eq(salaryBenchmarks.roleId, roleId));
}

// ===== Learning Catalog =====
export async function getLearningResourcesBySkills(skillIds: string[]): Promise<LearningCatalog[]> {
  if (skillIds.length === 0) return [];
  
  const allResources = await db.select().from(learningCatalog);
  
  return allResources.filter(resource => {
    const resourceSkills = JSON.parse(resource.skillIds) as string[];
    return skillIds.some(sid => resourceSkills.includes(sid));
  });
}

// ===== Job References =====
export async function linkJobToCompany(data: NewJobCompanyRef): Promise<void> {
  await db.insert(jobCompanyRefs).values(data);
}

export async function linkJobToPerson(data: NewJobPeopleRef): Promise<void> {
  await db.insert(jobPeopleRefs).values(data);
}

export async function getJobCompanies(jobId: string) {
  return db
    .select()
    .from(jobCompanyRefs)
    .leftJoin(companies, eq(jobCompanyRefs.companyId, companies.id))
    .where(eq(jobCompanyRefs.jobId, jobId));
}

export async function getJobPeople(jobId: string, relType?: string) {
  if (relType) {
    return db
      .select()
      .from(jobPeopleRefs)
      .leftJoin(peopleProfiles, eq(jobPeopleRefs.personId, peopleProfiles.id))
      .where(and(eq(jobPeopleRefs.jobId, jobId), eq(jobPeopleRefs.relType, relType)));
  }
  
  return db
    .select()
    .from(jobPeopleRefs)
    .leftJoin(peopleProfiles, eq(jobPeopleRefs.personId, peopleProfiles.id))
    .where(eq(jobPeopleRefs.jobId, jobId));
}

export async function addJobSkillSnapshot(data: NewJobSkillSnapshot): Promise<void> {
  await db.insert(jobSkillSnapshots).values(data);
}

export async function getJobSkills(jobId: string) {
  return db
    .select()
    .from(jobSkillSnapshots)
    .leftJoin(skillsTaxonomy, eq(jobSkillSnapshots.skillId, skillsTaxonomy.id))
    .where(eq(jobSkillSnapshots.jobId, jobId))
    .orderBy(desc(jobSkillSnapshots.weight));
}

// ===== AI Sessions & Runs =====
export async function createAiSession(data: Omit<NewAiSession, 'id'>): Promise<AiSession> {
  const session: NewAiSession = {
    id: uuidv4(),
    ...data,
  };
  await db.insert(aiSessions).values(session);
  return session as AiSession;
}

export async function updateAiSession(
  id: string,
  updates: Partial<AiSession>
): Promise<void> {
  await db.update(aiSessions).set(updates).where(eq(aiSessions.id, id));
}

export async function createAiRun(data: Omit<NewAiRun, 'id' | 'createdAt'>): Promise<AiRun> {
  const run: NewAiRun = {
    id: uuidv4(),
    createdAt: Date.now(),
    ...data,
  };
  await db.insert(aiRuns).values(run);
  return run as AiRun;
}

export async function getAiRuns(
  jobId: string,
  capability: string,
  limit = 3
): Promise<AiRun[]> {
  return db
    .select()
    .from(aiRuns)
    .where(and(eq(aiRuns.jobId, jobId), eq(aiRuns.capability, capability)))
    .orderBy(desc(aiRuns.createdAt))
    .limit(limit);
}

export async function getAiRunById(id: string): Promise<AiRun | null> {
  const results = await db
    .select()
    .from(aiRuns)
    .where(eq(aiRuns.id, id))
    .limit(1);
  return results[0] || null;
}

export async function pinAiRun(id: string, isPinned: boolean): Promise<void> {
  await db.update(aiRuns).set({ isPinned }).where(eq(aiRuns.id, id));
}

export async function setActiveAiRun(
  jobId: string,
  capability: string,
  runId: string
): Promise<void> {
  // Deactivate all runs for this job/capability
  await db
    .update(aiRuns)
    .set({ isActive: false })
    .where(and(eq(aiRuns.jobId, jobId), eq(aiRuns.capability, capability)));

  // Activate the specified run
  await db.update(aiRuns).set({ isActive: true }).where(eq(aiRuns.id, runId));
}

export async function labelAiRun(id: string, label: string): Promise<void> {
  await db.update(aiRuns).set({ label }).where(eq(aiRuns.id, id));
}

export async function deleteOldAiRuns(
  jobId: string,
  capability: string,
  keepCount = 3
): Promise<void> {
  const allRuns = await db
    .select()
    .from(aiRuns)
    .where(and(eq(aiRuns.jobId, jobId), eq(aiRuns.capability, capability)))
    .orderBy(desc(aiRuns.createdAt));

  // Keep pinned runs and the latest N runs
  const pinnedIds = allRuns.filter(r => r.isPinned).map(r => r.id);
  const latestIds = allRuns.slice(0, keepCount).map(r => r.id);
  const keepIds = new Set([...pinnedIds, ...latestIds]);

  const toDelete = allRuns.filter(r => !keepIds.has(r.id));
  
  for (const run of toDelete) {
    await db.delete(aiRuns).where(eq(aiRuns.id, run.id));
  }
}

// ===== Knowledge Staleness =====
export async function checkStaleness(key: string): Promise<{
  isStale: boolean;
  ttlDays?: number;
  lastUpdated?: number;
}> {
  const result = await db
    .select()
    .from(knowledgeStaleness)
    .where(eq(knowledgeStaleness.key, key))
    .limit(1);

  if (result.length === 0) {
    return { isStale: true };
  }

  const data = JSON.parse(result[0].value) as {
    ttlDays: number;
    lastUpdated: number;
    source?: string;
  };

  const age = Date.now() - data.lastUpdated;
  const ttlMs = data.ttlDays * 24 * 60 * 60 * 1000;

  return {
    isStale: age > ttlMs,
    ttlDays: data.ttlDays,
    lastUpdated: data.lastUpdated,
  };
}

export async function updateStaleness(
  key: string,
  ttlDays: number,
  source?: string
): Promise<void> {
  const value = JSON.stringify({
    ttlDays,
    lastUpdated: Date.now(),
    source,
  });

  const existing = await db
    .select()
    .from(knowledgeStaleness)
    .where(eq(knowledgeStaleness.key, key))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(knowledgeStaleness)
      .set({ value })
      .where(eq(knowledgeStaleness.key, key));
  } else {
    await db.insert(knowledgeStaleness).values({ key, value });
  }
}

