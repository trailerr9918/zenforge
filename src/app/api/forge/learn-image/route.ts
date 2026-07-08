import { NextRequest, NextResponse } from 'next/server';
import { extractTechniquesFromImage, addTechniques } from '@/lib/forge/technique-library';
import fs from 'fs';
import path from 'path';

export const maxDuration = 90;
export const dynamic = 'force-dynamic';

const UPLOAD_DIR = '/home/z/my-project/upload/forge-inspiration';

/**
 * POST /api/forge/learn-image
 * Body (multipart/form-data):
 *   - file: image file (png/jpg/webp)
 *   - note: optional user note about the screenshot
 *
 * OR Body (JSON):
 *   { "imageUrl": "https://...", "name": "optional", "note": "optional" }
 *
 * Extracts techniques from a single image via VLM and adds them to the library.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let imageUrl: string;
    let name: string | undefined;
    let note: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      note = (formData.get('note') as string) || undefined;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      // Save to /upload/forge-inspiration/
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      const ext = path.extname(file.name) || '.png';
      const basename = path.basename(file.name, ext).replace(/[^a-z0-9-]/gi, '-').toLowerCase();
      const filename = `${basename}-${Date.now()}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filepath, buffer);
      // Return as a URL the VLM can read — assume same host
      const host = req.headers.get('host') || '';
      const proto = req.headers.get('x-forwarded-proto') || 'https';
      imageUrl = host ? `${proto}://${host}/upload/forge-inspiration/${filename}` : `file://${filepath}`;
      name = filename;

      // If file:// fallback (no host), we need a publicly-readable URL for the VLM.
      // For now, we'll attempt to read the file and base64-encode it.
      if (imageUrl.startsWith('file://')) {
        const b64 = buffer.toString('base64');
        const mime = file.type || 'image/png';
        imageUrl = `data:${mime};base64,${b64}`;
      }
    } else {
      const body = await req.json();
      imageUrl = body.imageUrl;
      name = body.name;
      note = body.note;
      if (!imageUrl) {
        return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
      }
    }

    const { techniques, overallStyle } = await extractTechniquesFromImage(imageUrl, {
      userNote: note,
      sourceName: name,
      timeoutMs: 60000,
    });

    if (techniques.length === 0) {
      return NextResponse.json({
        ok: false,
        message: 'VLM returned no techniques. Image may be unreadable or VLM unavailable.',
        overallStyle,
      });
    }

    await addTechniques(techniques);

    return NextResponse.json({
      ok: true,
      extracted: techniques.length,
      techniques,
      overallStyle,
    });
  } catch (e) {
    console.error('[forge/learn-image] error:', e);
    return NextResponse.json(
      { error: 'Image extraction failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
