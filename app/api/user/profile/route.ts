import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { userProfile } from '@/db/schema';

/**
 * GET /api/user/profile
 * Fetch the singleton global user profile
 */
export async function GET(req: NextRequest) {
  try {
    const profiles = await db.select().from(userProfile).limit(1);
    
    if (profiles.length === 0) {
      return NextResponse.json({
        success: true,
        profile: null,
        message: 'No profile data yet. Run analysis on a job to start building your profile.',
      });
    }
    
    const profile = profiles[0];
    
    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        profileData: typeof profile.profileData === 'string' 
          ? JSON.parse(profile.profileData)
          : profile.profileData,
        version: profile.version,
        lastUpdated: profile.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

