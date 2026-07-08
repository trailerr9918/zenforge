import { NextRequest, NextResponse } from 'next/server';
import { zaiImageGenerate } from '@/lib/zai-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, size } = body;
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    const validSizes = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'];
    const finalSize = validSizes.includes(size) ? size : '1024x1024';
    try {
      const imageUrl = await zaiImageGenerate(prompt, finalSize);
      return NextResponse.json({ success: true, imageUrl, prompt, size: finalSize });
    } catch {
      const fallbackUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(prompt)}`;
      return NextResponse.json({ success: true, imageUrl: fallbackUrl, prompt, size: finalSize, fallback: true });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Image generation failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ name: 'ZenForge Image Generator', poweredBy: 'Z.AI SDK Proxy', sizes: ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'] });
}
