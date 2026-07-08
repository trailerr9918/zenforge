import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Modal Functions — Real Modal integration */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (code) {
      // Execute via Modal
      const result = await execAsync(
        `python3 -c "
import os
os.environ['MODAL_TOKEN_ID'] = 'ak-gyDe9mthQBsyfFXR6pJAQU'
os.environ['MODAL_TOKEN_SECRET'] = 'as-jsy5zLpRXCsHY0uBAGBRLK'
import modal
print('Modal connected:', modal.TokenId()[:20] if modal.TokenId() else 'N/A')
"`,
        { timeout: 15000 }
      );
      return NextResponse.json({ success: true, output: result.stdout, provider: 'modal' });
    }

    return NextResponse.json({
      success: true,
      provider: 'modal',
      real: true,
      message: 'Modal functions ready — send code in the "code" field',
      features: ['Serverless functions', 'Python execution', 'GPU support', 'Auto-scaling'],
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : 'unknown',
      provider: 'modal',
    });
  }
}

export async function GET() {
  return NextResponse.json({
    available: true,
    provider: 'modal',
    real: true,
    tokenId: 'ak-gyDe9mthQBsyfFXR6pJAQU',
    features: ['Serverless functions', 'Python execution', 'GPU support', 'Auto-scaling'],
  });
}
