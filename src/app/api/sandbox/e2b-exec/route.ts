import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** E2B Code Sandbox — Real E2B integration */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, language } = body;

    if (code) {
      // Execute Python code in E2B
      const result = await execAsync(
        `python3 -c "
import os
os.environ['E2B_API_KEY'] = 'e2b_ccd37e5d004d873d7b668f5ee0f2b675f28062c4'
from e2b_code_interpreter import Sandbox
sbx = Sandbox.create(timeout=30)
result = sbx.run_code('''${code.replace(/'/g, "\\'").replace(/"/g, '\\"')}''')
print('OUTPUT:', ''.join(result.logs.stdout) if result.logs else '')
sbx.kill()
"`,
        { timeout: 45000, maxBuffer: 1024 * 1024 }
      );
      return NextResponse.json({ success: true, output: result.stdout, sandbox: 'e2b' });
    }

    return NextResponse.json({
      success: true,
      action: 'e2b-exec',
      message: 'E2B sandbox ready — send code in the "code" field',
      provider: 'e2b',
      real: true,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : 'unknown',
      provider: 'e2b',
    });
  }
}

export async function GET() {
  return NextResponse.json({
    available: true,
    provider: 'e2b',
    real: true,
    apiKey: 'e2b_ccd37e5d...075f28062c4',
    features: ['Python code execution', 'Shell commands', 'File system', '30s timeout'],
  });
}
