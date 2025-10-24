import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/db/client';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/jobs/[id]/interviewer-profiles
 * Fetch interviewer profiles for a job
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: jobId } = context.params;
    
    // Get interviewer profiles from people_profiles table via job_people_refs
    const profiles = sqlite.prepare(`
      SELECT 
        pp.id,
        pp.name,
        pp.title as role,
        c.name as company,
        pp.summary,
        pp.tech_depth,
        pp.tenure_months,
        jpr.rel_type,
        pp.updated_at as created_at
      FROM people_profiles pp
      JOIN job_people_refs jpr ON pp.id = jpr.person_id
      LEFT JOIN companies c ON pp.company_id = c.id
      WHERE jpr.job_id = ?
      ORDER BY pp.updated_at DESC
    `).all(jobId);
    
    // Transform the data
    const transformedProfiles = profiles.map((profile: any) => {
      // Parse summary JSON if available
      let summaryData = {};
      try {
        summaryData = profile.summary ? JSON.parse(profile.summary) : {};
      } catch (e) {
        console.warn('Failed to parse summary JSON:', e);
      }
      
      return {
        id: profile.id,
        name: profile.name,
        role: profile.role || 'Interviewer',
        company: profile.company || 'Unknown',
        values: summaryData.values || [],
        focusAreas: summaryData.focusAreas || [profile.tech_depth || 'Technical Skills'],
        communicationStyle: summaryData.communicationStyle || 'Professional',
        decisionFactors: summaryData.decisionFactors || ['Technical fit', 'Cultural fit'],
        experience: `${profile.tenure_months || 0} months experience`,
        createdAt: profile.created_at
      };
    });
    
    return NextResponse.json({
      success: true,
      profiles: transformedProfiles,
      version: 'v2'
    });
    
  } catch (error: any) {
    console.error('❌ Failed to fetch interviewer profiles:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch interviewer profiles',
        code: 'FETCH_ERROR',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
