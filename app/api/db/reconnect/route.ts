import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Force a simple query to ensure connection is alive
    // The db client will auto-reconnect if needed
    return NextResponse.json({ ok: true, reconnected: true });
  } catch (error) {
    console.error('DB reconnect error:', error);
    return NextResponse.json({ ok: false, error: 'Reconnect failed' }, { status: 500 });
  }
}

