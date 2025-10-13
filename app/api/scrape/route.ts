import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ScrapedData {
  name?: string;
  title?: string;
  company?: string;
  summary?: string;
  about?: string;
  industry?: string;
  size?: string;
}

/**
 * Simple metadata scraper for LinkedIn and company pages
 * Falls back to basic Open Graph tags since LinkedIn requires authentication
 */
async function scrapeUrl(url: string): Promise<ScrapedData | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const data: ScrapedData = {};

    // Extract Open Graph tags
    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
    const ogDescription = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
    const title = html.match(/<title>([^<]*)<\/title>/i);

    if (ogTitle) {
      // LinkedIn format: "Name - Title at Company | LinkedIn"
      const match = ogTitle[1].match(/^([^-|]+?)(?:\s*-\s*([^|]+?))?(?:\s*\|\s*LinkedIn)?$/);
      if (match) {
        data.name = match[1]?.trim();
        if (match[2]) {
          const titleCompany = match[2].trim();
          const atIndex = titleCompany.indexOf(' at ');
          if (atIndex > 0) {
            data.title = titleCompany.substring(0, atIndex).trim();
            data.company = titleCompany.substring(atIndex + 4).trim();
          } else {
            data.title = titleCompany;
          }
        }
      }
    } else if (title) {
      data.name = title[1].split('|')[0].trim();
    }

    if (ogDescription) {
      data.summary = ogDescription[1];
    }

    return Object.keys(data).length > 0 ? data : null;
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const data = await scrapeUrl(url);

    if (!data) {
      return NextResponse.json(
        { 
          error: 'Could not fetch content. Please enter manually.',
          fallback: true,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Scrape API error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape URL', fallback: true },
      { status: 500 }
    );
  }
}

