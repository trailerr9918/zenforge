import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Daytona Workspaces — Real Daytona integration */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, command } = body;

    if (action === 'list') {
      const result = await execAsync(
        `python3 -c "
import os
os.environ['DAYTONA_API_KEY'] = 'dtn_9c3eccca7e322ca3e1a2fd5df19fb701181d9ea636317361b6cf14925844a630'
from daytona_sdk import Daytona
daytona = Daytona()
sandboxes = list(daytona.list())
print('COUNT:', len(sandboxes))
for s in sandboxes:
    print('ID:', s.id, 'STATUS:', s.status)
"`,
        { timeout: 15000 }
      );
      return NextResponse.json({ success: true, output: result.stdout, provider: 'daytona' });
    }

    if (command) {
      const result = await execAsync(
        `python3 /home/z/my-project/scripts/sandbox-exec.py daytona "${command.replace(/"/g, '\\"')}"`,
        { timeout: 30000, maxBuffer: 1024 * 1024 }
      );
      const data = JSON.parse(result.stdout.trim());
      return NextResponse.json({ success: true, ...data, provider: 'daytona' });
    }

    return NextResponse.json({
      success: true,
      provider: 'daytona',
      real: true,
      message: 'Daytona workspace ready — send "command" or {"action":"list"}',
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : 'unknown',
      provider: 'daytona',
    });
  }
}

export async function GET() {
  return NextResponse.json({
    available: true,
    provider: 'daytona',
    real: true,
    apiKey: 'dtn_9c3eccca...5844a630',
    features: ['Linux sandboxes', 'Python/Node execution', 'File system', 'Process management'],
  });
}
