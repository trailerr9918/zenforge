import { NextRequest, NextResponse } from 'next/server';
import {
  createSubprocess, runSubprocess, chatWithSubprocess,
  reviewSubprocess, listSubprocesses, listSubprocessesAsync, killSubprocess, deleteSubprocess,
  getSubprocess, rateSubprocess, type SubprocessType,
} from '@/lib/subprocess-engine';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * /api/subprocess — Unified subprocess API
 *
 * GET  /api/subprocess              → list all subprocesses
 * POST /api/subprocess              → { action: 'create' | 'run' | 'chat' | 'review' | 'kill' | 'delete', ... }
 *
 * Actions:
 *   create: { action: 'create', type, task, name?, model?, parentId? } → { subprocess }
 *   run:    { action: 'run', id, input? } → { subprocess } (streams thinking via NDJSON)
 *   chat:   { action: 'chat', id, message } → { reply }
 *   review: { action: 'review', id, model? } → { review }
 *   kill:   { action: 'kill', id } → { success }
 *   delete: { action: 'delete', id } → { success }
 *   autoSpawn: { action: 'autoSpawn', partType, businessContext, model? } → { subprocesses }
 */

export async function GET() {
  const subs = await listSubprocessesAsync();
  return NextResponse.json({
    count: subs.length,
    subprocesses: subs.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      status: s.status,
      task: s.task.slice(0, 100),
      model: s.model,
      progress: s.progress,
      reviewScore: s.reviewScore,
      outputLength: s.output.length,
      outputPreview: s.output.slice(0, 500),
      outputType: s.outputType,
      chatCount: s.chat.length,
      chat: s.chat.slice(-10), // last 10 messages
      positiveReviews: s.positiveReviews || 0,
      promoted: s.promoted || false,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      parentId: s.parentId,
      error: s.error,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // === CREATE ===
    if (action === 'create') {
      const sp = createSubprocess({
        name: body.name,
        type: body.type as SubprocessType,
        task: body.task || '',
        model: body.model,
        parentId: body.parentId,
      });
      return NextResponse.json({ success: true, subprocess: sp });
    }

    // === RUN (with NDJSON streaming for progress) ===
    if (action === 'run') {
      const { id, input } = body;
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (obj: any) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
          try {
            send({ step: 'thinking', message: `Starting ${getSubprocess(id)?.type || 'subprocess'}...` });
            const result = await runSubprocess(id, {
              input,
              onProgress: (msg) => send({ step: 'thinking', message: msg }),
            });
            send({
              step: 'done',
              subprocess: {
                id: result.id,
                status: result.status,
                output: result.output.slice(0, 50000),
                outputType: result.outputType,
                progress: result.progress,
                reviewScore: result.reviewScore,
                error: result.error,
              },
            });
          } catch (e) {
            send({ step: 'error', message: e instanceof Error ? e.message : 'unknown' });
          }
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
      });
    }

    // === CHAT ===
    if (action === 'chat') {
      const { id, message } = body;
      if (!id || !message) return NextResponse.json({ error: 'id and message required' }, { status: 400 });
      const reply = await chatWithSubprocess(id, message);
      return NextResponse.json({ success: true, reply });
    }

    // === REVIEW ===
    if (action === 'review') {
      const { id, model } = body;
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const review = await reviewSubprocess(id, { model });
      return NextResponse.json({ success: true, review });
    }

    // === RATE (emoji review + promotion logic) ===
    if (action === 'rate') {
      const { id, rating, feedback } = body;
      if (!id || ![1, 2, 3, 4, 5].includes(rating)) {
        return NextResponse.json({ error: 'id and rating (1-5) required' }, { status: 400 });
      }
      const sp = rateSubprocess(id, rating, feedback);
      if (!sp) return NextResponse.json({ error: 'Subprocess not found' }, { status: 404 });
      return NextResponse.json({
        success: true,
        positiveReviews: sp.positiveReviews,
        promoted: sp.promoted,
        message: sp.promoted
          ? `🎉 Promoted to Pattern Explorer! (${sp.positiveReviews} positive reviews)`
          : rating >= 4
            ? `Approved! ${2 - sp.positiveReviews} more to promote.`
            : rating <= 2
              ? 'Trashed. Feedback saved for learning.'
              : 'Feedback saved.',
      });
    }

    // === KILL ===
    if (action === 'kill') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const success = killSubprocess(id);
      return NextResponse.json({ success });
    }

    // === DELETE ===
    if (action === 'delete') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const success = deleteSubprocess(id);
      return NextResponse.json({ success });
    }

    // === AUTO SPAWN (VA 24/7 chain) ===
    if (action === 'autoSpawn') {
      const { partType, businessContext, model } = body;
      if (!partType) return NextResponse.json({ error: 'partType required' }, { status: 400 });
      const { autoSpawnVAChain } = await import('@/lib/subprocess-engine');
      const subs = await autoSpawnVAChain(partType, businessContext || 'a premium brand', { model });
      return NextResponse.json({
        success: true,
        count: subs.length,
        subprocesses: subs.map(s => ({
          id: s.id, name: s.name, type: s.type, status: s.status,
          outputLength: s.output.length, reviewScore: s.reviewScore,
        })),
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
