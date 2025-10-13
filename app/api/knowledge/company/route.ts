import { NextRequest, NextResponse } from 'next/server';
import { getCompanyByDomain, upsertCompany } from '@/db/coachRepository';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/knowledge/company?domain=example.com
 * Returns company info if cached, otherwise null
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Missing domain parameter' },
        { status: 400 }
      );
    }

    const company = await getCompanyByDomain(domain);
    return NextResponse.json({ company });
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge/company
 * Upserts company information
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      website,
      industry,
      subindustry,
      hqCity,
      hqState,
      hqCountry,
      sizeBucket,
      revenueBucket,
      principles,
      linkedinUrl,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const company = await upsertCompany({
      id: id || uuidv4(),
      name,
      website: website || null,
      industry: industry || null,
      subindustry: subindustry || null,
      hqCity: hqCity || null,
      hqState: hqState || null,
      hqCountry: hqCountry || null,
      sizeBucket: sizeBucket || null,
      revenueBucket: revenueBucket || null,
      principles: JSON.stringify(principles || []),
      linkedinUrl: linkedinUrl || null,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Error upserting company:', error);
    return NextResponse.json(
      { error: 'Failed to upsert company' },
      { status: 500 }
    );
  }
}

