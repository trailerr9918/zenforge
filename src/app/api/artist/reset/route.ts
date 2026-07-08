import { NextResponse } from 'next/server';
import { resetArtist } from '@/lib/virtual-artist';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await resetArtist();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
