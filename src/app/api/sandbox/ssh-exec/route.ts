import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Full-Scale Linux Terminal — REAL E2B sandbox with persistent working directory.
 *
 * Endpoints:
 *   GET  /api/sandbox/ssh-exec              → connection status
 *   POST /api/sandbox/ssh-exec              → execute a command, returns cwd
 *   POST /api/sandbox/ssh-exec?action=tab   → tab-completion suggestions
 *   POST /api/sandbox/ssh-exec?action=pwd   → just return current cwd
 *
 * Every POST response includes `cwd` so the client prompt can update live
 * (e.g. `user@e2b:~$` → `user@e2b:~/projects/foo$` after `cd projects/foo`).
 */

const E2B_API_KEY = process.env.E2B_API_KEY || 'e2b_ccd37e5d004d873d7b668f5ee0f2b675f28062c4';
const BLOCKED = ['rm -rf /', 'mkfs', 'dd if=', 'shutdown', 'reboot', 'halt', 'init 0'];

let cachedSandbox: any = null;
let cacheTime = 0;
let currentDir = '/home/user';
const CACHE_TTL = 240000;

async function getSandbox() {
  const now = Date.now();
  if (cachedSandbox && (now - cacheTime) < CACHE_TTL) {
    try {
      await cachedSandbox.commands.run('true', { timeout: 3000 });
      return cachedSandbox;
    } catch {
      cachedSandbox = null;
    }
  }
  const { Sandbox } = await import('@e2b/code-interpreter');
  process.env.E2B_API_KEY = E2B_API_KEY;
  cachedSandbox = await Sandbox.create({ timeoutMs: 300000 });
  cacheTime = now;
  currentDir = '/home/user';
  return cachedSandbox;
}

async function execE2B(command: string): Promise<{ stdout: string; stderr: string; exitCode: number; sandbox: string; cwd: string }> {
  const sbx = await getSandbox();
  const trimmed = command.trim();

  // Strip ANSI clear-screen sequences from output (we handle clear client-side)
  if (trimmed === 'clear') {
    return { stdout: '', stderr: '', exitCode: 0, sandbox: 'e2b', cwd: currentDir };
  }

  if (trimmed === 'help') {
    const txt = [
      'ZenForge Linux Terminal — Real E2B Sandbox',
      '',
      'Shell commands:  ls, cd, pwd, mkdir, rmdir, rm, cat, echo, touch, cp, mv, ln,',
      '                 find, grep, head, tail, wc, sort, uniq, chmod, chown, stat,',
      '                 tree, file, which, whereis, whoami, id, date, cal, uname,',
      '                 ps, top, kill, df, du, free, uptime, env, export, history,',
      '                 clear, help, exit',
      '',
      'Languages:       python3, pip3, node, npm, bun, gcc, g++, make, jq',
      '',
      'Networking:      curl, wget, ssh-keygen',
      '',
      'Tips:',
      '  • Tab         — autocomplete commands and file paths',
      '  • ↑ / ↓       — cycle through command history',
      '  • Ctrl+L      — clear screen',
      '  • Ctrl+C      — cancel current input',
      '  • Type `cd`   — go to home directory',
      '  • Working directory is preserved between commands',
      '',
      `Current directory: ${currentDir}`,
    ].join('\n');
    return { stdout: txt, stderr: '', exitCode: 0, sandbox: 'e2b', cwd: currentDir };
  }

  try {
    // Handle 'cd' specially — update tracked directory and return new cwd
    if (trimmed === 'cd' || trimmed.startsWith('cd ') || trimmed.startsWith('cd\t')) {
      const target = trimmed === 'cd' ? '/home/user' : trimmed.slice(3).trim().replace(/^['"]|['"]$/g, '');
      // Resolve ~ and relative paths
      const expanded = target.replace(/^~(\/|$)/, '/home/user$1');
      const fullCmd = `cd ${currentDir} && cd ${JSON.stringify(expanded)} && pwd`;
      const r = await sbx.commands.run(fullCmd, { timeout: 5000 });
      if (r.exitCode === 0 && r.stdout.trim()) {
        currentDir = r.stdout.trim();
        return { stdout: '', stderr: '', exitCode: 0, sandbox: 'e2b', cwd: currentDir };
      }
      return {
        stdout: '',
        stderr: r.stderr || `cd: ${target}: No such file or directory`,
        exitCode: r.exitCode || 1,
        sandbox: 'e2b',
        cwd: currentDir,
      };
    }

    // All other commands — prepend `cd <currentDir> &&` to maintain cwd
    const fullCmd = `cd ${currentDir} && ${command}`;
    const r = await sbx.commands.run(fullCmd, { timeout: 30000 });
    // After any command, fetch current dir in case the command itself did a cd
    // (some scripts/chained commands might change dirs)
    let newCwd = currentDir;
    if (/(\bcd\b|\bpushd\b|\bpopd\b)/.test(command)) {
      try {
        const pwdR = await sbx.commands.run(`cd ${currentDir} && cd ${command.match(/(?:^|&&|;)\s*(?:cd|pushd)\s+([^&;|]+)|/) ? '' : ''} pwd`, { timeout: 2000 });
        if (pwdR.exitCode === 0 && pwdR.stdout.trim()) newCwd = pwdR.stdout.trim();
      } catch {}
    }
    currentDir = newCwd;
    return {
      stdout: r.stdout || '',
      stderr: r.stderr || '',
      exitCode: r.exitCode ?? 0,
      sandbox: 'e2b',
      cwd: currentDir,
    };
  } catch (e: any) {
    cachedSandbox = null;
    return {
      stdout: '',
      stderr: `E2B error: ${e.message}`,
      exitCode: 1,
      sandbox: 'e2b',
      cwd: currentDir,
    };
  }
}

async function tabComplete(input: string): Promise<{ suggestions: string[]; matched: string }> {
  try {
    const sbx = await getSandbox();
    const trimmed = input;

    // If input contains a space, complete a file/directory path
    // Otherwise complete a command name
    const lastSpaceIdx = trimmed.lastIndexOf(' ');
    const isFirstToken = lastSpaceIdx === -1;

    if (isFirstToken) {
      // Complete command name
      const knownCommands = [
        'ls', 'cd', 'pwd', 'mkdir', 'rmdir', 'rm', 'cat', 'echo', 'touch',
        'cp', 'mv', 'ln', 'find', 'grep', 'head', 'tail', 'wc', 'sort',
        'uniq', 'chmod', 'chown', 'stat', 'tree', 'file', 'which', 'whereis',
        'whoami', 'id', 'date', 'cal', 'uname', 'ps', 'top', 'kill', 'df',
        'du', 'free', 'uptime', 'env', 'export', 'history', 'clear', 'help',
        'exit', 'python3', 'pip3', 'node', 'npm', 'bun', 'gcc', 'g++', 'make',
        'jq', 'curl', 'wget', 'ssh-keygen', 'man', 'less', 'more', 'vi', 'nano',
        'emacs', 'tar', 'zip', 'unzip', 'gzip', 'gunzip', 'diff', 'tee', 'xargs',
        'basename', 'dirname', 'realpath', 'readlink', 'true', 'false', 'test',
        'seq', 'yes', 'sleep', 'time', 'nohup', 'disown',
      ];
      const matches = knownCommands.filter(c => c.startsWith(trimmed.toLowerCase()));
      // Also check files in cwd that start with the prefix and are executable
      try {
        const r = await sbx.commands.run(
          `cd ${currentDir} && ls -1 2>/dev/null | grep '^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`,
          { timeout: 2000 }
        );
        const files = (r.stdout || '').split('\n').filter(Boolean);
        return { suggestions: [...new Set([...matches, ...files])].slice(0, 50), matched: trimmed };
      } catch {
        return { suggestions: matches.slice(0, 50), matched: trimmed };
      }
    } else {
      // Complete a file/directory path — last token after space
      const prefix = trimmed.slice(lastSpaceIdx + 1);
      const beforePrefix = trimmed.slice(0, lastSpaceIdx + 1);

      // Handle absolute and relative paths
      let dirToScan = currentDir;
      let filePrefix = prefix;

      if (prefix.startsWith('/')) {
        const lastSlash = prefix.lastIndexOf('/');
        dirToScan = prefix.slice(0, lastSlash) || '/';
        filePrefix = prefix.slice(lastSlash + 1);
      } else if (prefix.includes('/')) {
        const lastSlash = prefix.lastIndexOf('/');
        const relPart = prefix.slice(0, lastSlash);
        // Resolve relative to cwd
        const resolveR = await sbx.commands.run(
          `cd ${currentDir} && cd ${JSON.stringify(relPart.replace(/^~/, '/home/user'))} 2>/dev/null && pwd`,
          { timeout: 2000 }
        );
        if (resolveR.exitCode === 0 && resolveR.stdout.trim()) {
          dirToScan = resolveR.stdout.trim();
          filePrefix = prefix.slice(lastSlash + 1);
        } else {
          return { suggestions: [], matched: prefix };
        }
      }

      // Get all files/dirs in dirToScan matching filePrefix
      // Use printf to detect directories (append /)
      const escapedPrefix = filePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const r = await sbx.commands.run(
        `cd ${JSON.stringify(dirToScan)} 2>/dev/null && for f in *; do
           if [[ "$f" == ${escapedPrefix}* ]]; then
             if [[ -d "$f" ]]; then echo "$f/"; else echo "$f"; fi
           fi
         done`,
        { timeout: 3000 }
      );
      const matches = (r.stdout || '').split('\n').filter(Boolean);
      return { suggestions: matches.slice(0, 100), matched: prefix };
    }
  } catch (e) {
    return { suggestions: [], matched: input };
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const body = await req.json();

    // Tab completion endpoint
    if (action === 'tab') {
      const { input } = body;
      if (typeof input !== 'string') {
        return NextResponse.json({ error: 'Missing input' }, { status: 400 });
      }
      const result = await tabComplete(input);
      return NextResponse.json({ ...result, cwd: currentDir, real: true });
    }

    // Just get current cwd (used on initial load)
    if (action === 'pwd') {
      // Sync cwd from sandbox
      try {
        const sbx = await getSandbox();
        const r = await sbx.commands.run(`cd ${currentDir} && pwd`, { timeout: 2000 });
        if (r.exitCode === 0 && r.stdout.trim()) currentDir = r.stdout.trim();
      } catch {}
      return NextResponse.json({ cwd: currentDir, real: true });
    }

    const { command } = body;
    if (!command) return NextResponse.json({ error: 'Missing command' }, { status: 400 });

    for (const b of BLOCKED) {
      if (command.includes(b)) {
        return NextResponse.json({
          success: false,
          stdout: '',
          stderr: `Blocked: ${b}`,
          exitCode: 1,
          command,
          sandbox: 'blocked',
          real: true,
          cwd: currentDir,
        });
      }
    }

    const t0 = Date.now();
    const result = await execE2B(command);
    const duration = Date.now() - t0;

    try {
      const { logEvent } = await import('@/app/api/logs/route');
      logEvent(
        result.exitCode === 0 ? 'success' : 'error',
        'ssh',
        `$ ${command} → exit ${result.exitCode} (${duration}ms) [${result.sandbox}] cwd=${result.cwd}`,
        duration
      );
    } catch {}

    return NextResponse.json({
      ...result,
      success: result.exitCode === 0,
      duration,
      command,
      real: true,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'SSH failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'connected',
    host: 'e2b',
    user: 'user',
    shell: '/bin/bash',
    real: true,
    provider: 'e2b',
    cwd: currentDir,
    commands: [
      'ls', 'cd', 'pwd', 'mkdir', 'rm', 'cat', 'echo', 'touch', 'cp', 'mv',
      'find', 'grep', 'head', 'tail', 'wc', 'sort', 'chmod', 'whoami', 'date',
      'uname', 'ps', 'df', 'free', 'uptime', 'env', 'python3', 'node', 'clear', 'help',
    ],
  });
}
