import { NextRequest, NextResponse } from 'next/server';
import { runArtistCycle, runMultipleArtistCycles, startArtistAutoEvolve, stopArtistAutoEvolve } from '@/lib/virtual-artist';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 24/7 mode toggle
    if (body.action === 'auto-start') {
      await startArtistAutoEvolve(body.interval || 15000);
      return NextResponse.json({ success: true, autoEvolve: true });
    }
    if (body.action === 'auto-stop') {
      await stopArtistAutoEvolve();
      return NextResponse.json({ success: true, autoEvolve: false });
    }

    // Run N cycles
    const count = Math.min(body.count || 1, 10);
    if (count === 1) {
      const result = await runArtistCycle();
      return NextResponse.json({ success: true, result });
    } else {
      const results = await runMultipleArtistCycles(count);
      return NextResponse.json({ success: true, results });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
