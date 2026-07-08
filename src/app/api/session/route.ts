import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/session-manager';

export const maxDuration = 10;
export const dynamic = 'force-dynamic';

/**
 * Session Persistence API
 * GET  /api/session — get full session state
 * POST /api/session — save partial state ({ autoEvolve, activeTab, accentColor, chatMode, chatMessage })
 */

export async function GET() {
  try {
    const state = await sessionManager.get();
    // Flatten so the client hook can read directly
    return NextResponse.json({
      activeTab: state?.activeTab || 'generate',
      accentColor: state?.accentColor || '#ffffff',
      autoEvolve: state?.autoEvolve || false,
      chatHistory: state?.chatHistory || {},
      lastActive: state?.lastActive || null,
      success: true,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'getAutoEvolve') {
      return NextResponse.json({ autoEvolve: await sessionManager.getAutoEvolve() });
    }
    if (action === 'setAutoEvolve') {
      // Accept both `value` and `on` for compatibility
      const val = body.value !== undefined ? body.value : (body.on !== undefined ? body.on : false);
      await sessionManager.setAutoEvolve(!!val);
      return NextResponse.json({ success: true });
    }
    if (action === 'setActiveTab') {
      await sessionManager.setActiveTab(body.tab);
      return NextResponse.json({ success: true });
    }
    if (action === 'setAccentColor') {
      await sessionManager.setAccentColor(body.color);
      return NextResponse.json({ success: true });
    }
    if (action === 'getChatHistory') {
      return NextResponse.json({ messages: await sessionManager.getChatHistory(body.mode) });
    }
    if (action === 'saveChatMessage') {
      await sessionManager.saveChatMessage(body.mode, body.message);
      return NextResponse.json({ success: true });
    }
    if (action === 'clearChatHistory') {
      await sessionManager.clearChatHistory(body.mode);
      return NextResponse.json({ success: true });
    }

    // Default: save arbitrary state
    if (body.state) {
      await sessionManager.save(body.state);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
