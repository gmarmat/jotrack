import { NextRequest, NextResponse } from 'next/server';
import { getRoleById, findRoleByTitle, listRoles } from '@/db/coachRepository';

export const dynamic = 'force-dynamic';

/**
 * GET /api/knowledge/role?id=role-123 or ?title=Software+Engineer&seniority=senior
 * Returns role information
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const title = searchParams.get('title');
    const seniority = searchParams.get('seniority');

    if (id) {
      const role = await getRoleById(id);
      return NextResponse.json({ role });
    }

    if (title) {
      const role = await findRoleByTitle(title, seniority || undefined);
      return NextResponse.json({ role });
    }

    // If no specific query, return all roles
    const roles = await listRoles();
    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

