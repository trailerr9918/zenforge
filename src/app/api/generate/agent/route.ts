import { NextRequest, NextResponse } from 'next/server';
import { zaiChat, zaiChatStream, ZAI_MODELS, zaiAvailable } from '@/lib/zai-client';
import { callLLM } from '@/lib/llm-provider';

// Allow up to 60 seconds for AI responses
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * ZenForge AI — Intelligent AI Agent v3
 * ========================================
 *
 * Powered by Z.AI SDK DIRECTLY (no external proxy needed).
 * The SDK reads /etc/.z-ai-config automatically.
 *
 * Features:
 *   • Real streaming via SSE (token-by-token from Z.AI GLM-5.1)
 *   • Thinking/reasoning mode
 *   • Cerebrium brain search for design references
 *   • Intent detection — doesn't rush to generate on "hello"
 *   • Function calling for website generation, image gen, web search
 *   • Six modes: designer, coder, ssh, images, researcher, browser
 *
 * SSE Events:
 *   thinking    — agent's reasoning steps
 *   cerebrium   — brain file matches
 *   token       — streamed response tokens (word by word)
 *   tool_use    — function call initiated
 *   tool_result — function call result
 *   done        — final reply
 */

const SYSTEM_PROMPT = `You are ZenForge AI, an elite website design agent powered by Z.AI GLM-4-plus via VPS bridge.

You have access to:
1. A Cerebrium design brain with 159+ design analysis files from brands like Stripe, Apple, Linear, Raycast, Vercel, Figma, Notion, Pinterest, and more.
2. A MotionSites prompt database with 121+ premium website recreation prompts (cinematic heroes, glassmorphic cards, editorial layouts, etc.).
3. A V6 Ultra website generator that creates complete, production-quality websites with 16+ sections.
4. A Virtual Artist engine that 24/7 evolves new premium patterns (headers, CTAs, footers, menus, typography).
5. Image generation, web search, and page reader tools.

YOUR BEHAVIOR RULES:
- If the user says "hello", "hi", "hey", or asks a general question, CONVERSE with them first. Ask what kind of website they want to build. Do NOT immediately generate a website.
- Only generate a website when the user explicitly describes a business, product, or website they want. Look for keywords like "build", "create", "generate", "make", "design" combined with a description.
- If the user specifies details (name, colors, style, business type, fonts), EXTRACT them and pass as customConfig to the generator. Be intelligent — recognize color names ("blue", "warm earth tones"), font preferences ("serif", "modern sans"), style cues ("minimalist", "cinematic", "playful"), and business specifics.
- When generating, first search the Cerebrium brain for relevant design references, then call the generate_website function with customConfig.
- Be concise but warm. Use a professional, confident tone.

CUSTOM CONFIG EXTRACTION:
When the user mentions any of these, include them in the customConfig object:
- businessName: explicit business name
- colors: { bg, primary, accent, dark, cream } — hex codes or named colors converted to hex
- fonts: { display, body } — font family names
- style: 'minimal' | 'bold' | 'editorial' | 'cinematic' | 'glassmorphic' | 'playful'
- features: [{ title, description }] — custom feature list
- testimonials: [{ name, role, quote }] — custom testimonials
- pricing: [{ name, price, description, features, featured }] — custom pricing tiers
- faq: [{ question, answer }] — custom FAQ
- team: [{ name, role, bio }] — custom team members
- tagline, hero, sub, about, ctaText — custom copy

TOOL CALLING (include exact JSON in your response):
- Generate website: {"tool":"generate_website","args":{"prompt":"<detailed prompt>","customConfig":{"businessName":"...","colors":{"primary":"#...","accent":"#..."},"style":"minimal"}}}
- Search web: {"tool":"web_search","args":{"query":"<query>"}}
- Generate image: {"tool":"image_gen","args":{"prompt":"<prompt>"}}

When you include a tool call JSON, stop your text response there — the tool will execute and the result will be shown to the user.

Respond naturally. Think step by step before acting.`;

interface AgentRequest {
  message: string;
  mode?: string;
  history?: { role: string; content: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const body: AgentRequest = await req.json();
    const message = body.message || '';
    const mode = body.mode || 'designer';
    const history = body.history || [];

    // Set Groq key if provided
    if (body.groqKey) process.env.GROQ_API_KEY = body.groqKey;
    const agentModel = body.model || 'glm-4-flash';
    const useGroq = agentModel.includes('llama') || agentModel.includes('mixtral');

    // Build base URL for internal API calls (works on both sandbox + Vercel)
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : `http://localhost:${process.env.PORT || 3000}`;

    // Step 1: Search Cerebrium for design references
    let cerebriumHits: any[] = [];
    if (mode === 'designer') {
      try {
        const cr = await fetch(`${baseUrl}/api/cerebrium/search?q=${encodeURIComponent(message)}&limit=5`);
        if (cr.ok) {
          const cd = await cr.json();
          cerebriumHits = cd.results || [];
        }
      } catch {}
    }

    // Step 2: Build messages for Z.AI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    if (cerebriumHits.length > 0) {
      const brainContext = cerebriumHits.map((h) =>
        `- ${h.title} (${h.category}): ${h.excerpt?.slice(0, 150) || ''}`
      ).join('\n');
      messages.push({
        role: 'system',
        content: `Cerebrium brain references found for this query:\n${brainContext}\n\nUse these design insights to inform your response or generation.`,
      });
    }

    // Step 3: Stream the response via SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          send('thinking', { content: 'Analyzing your request and searching the design brain...', stepNum: 1 });

          if (cerebriumHits.length > 0) {
            send('cerebrium', { hits: cerebriumHits, count: cerebriumHits.length });
          }

          send('thinking', { content: 'Consulting Z.AI GLM-4-plus via VPS bridge...', stepNum: 2 });

          let replyText = '';

          // Try Z.AI via VPS bridge — first try streaming for real-time output
          try {
              send('thinking', { content: 'Streaming response from GLM-4-plus...', stepNum: 3 });

              let streamedText = '';
              let firstTokenReceived = false;

              // Use streaming for real-time token output
              for await (const chunk of zaiChatStream({
                model: useGroq ? agentModel : ZAI_MODELS.GLM_5_2,
                messages: messages as any,
                temperature: 0.7,
                maxTokens: 1500,
              })) {
                if (!firstTokenReceived) {
                  firstTokenReceived = true;
                  send('thinking', { content: 'Response incoming...', stepNum: 4, isReasoning: true });
                }
                streamedText += chunk;
                // Forward each token to the client as it arrives
                send('token', { content: chunk });
              }

              replyText = streamedText;
          } catch (zaiError) {
              console.error('[agent] Z.AI stream failed:', zaiError);
              send('thinking', { content: 'Streaming failed, trying non-streaming...', stepNum: 4, isReasoning: true });

              // Fallback: non-streaming
              try {
                const zaiResponse = await zaiChat({
                  model: useGroq ? agentModel : ZAI_MODELS.GLM_5_2,
                  messages: messages as any,
                  temperature: 0.7,
                  maxTokens: 1500,
                });
                replyText = zaiResponse.choices?.[0]?.message?.content || '';
              } catch (zaiError2) {
                console.error('[agent] Z.AI non-streaming also failed:', zaiError2);
                send('thinking', { content: 'Z.AI unavailable, using local intelligence...', stepNum: 5, isReasoning: true });
                replyText = localIntentResponse(message, mode);
              }
          }

          if (!replyText) replyText = localIntentResponse(message, mode);

          // Check if the AI wants to call a tool
          const toolCall = extractToolCall(replyText);

          if (toolCall) {
            send('thinking', { content: `Decided to use tool: ${toolCall.tool}`, stepNum: 6 });

            if (toolCall.tool === 'generate_website') {
              send('tool_use', { toolName: 'generate_website', args: toolCall.args });

              // Use the V6 Ultra PREMIUM renderer — GLM-4-plus generates full website HTML
              const renderBody: any = { prompt: toolCall.args.prompt, save: true };
              if (toolCall.args.customConfig) {
                renderBody.customConfig = toolCall.args.customConfig;
                send('thinking', { content: `Using custom config: ${JSON.stringify(Object.keys(toolCall.args.customConfig))}`, stepNum: 7 });
              }
              send('thinking', { content: 'Generating premium website via GLM-4-plus (V6 Ultra Premium Renderer)...', stepNum: 8 });

              const renderRes = await fetch(`${baseUrl}/api/render-premium`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(renderBody),
              });
              const renderData = await renderRes.json();

              if (renderData.html) {
                send('tool_result', {
                  toolName: 'generate_website',
                  success: true,
                  output: `Website "${renderData.businessName}" generated with ${Object.keys(renderData.designDNA?.variants || {}).length} design variants.`,
                  metadata: {
                    projectId: renderData.slug, slug: renderData.slug,
                    html: renderData.html, viewUrl: renderData.viewUrl,
                    designDNA: renderData.designDNA, businessName: renderData.businessName,
                  },
                });

                send('done', { reply: replyText });
              } else {
                send('tool_result', { toolName: 'generate_website', success: false, output: 'Generation failed' });
                send('done', { reply: 'Sorry, I could not generate the website. Please try again.' });
              }
            } else if (toolCall.tool === 'web_search') {
              send('tool_use', { toolName: 'web_search', args: toolCall.args });
              const { zaiWebSearch } = await import('@/lib/zai-client');
              const results = await zaiWebSearch(toolCall.args.query, 5);
              send('tool_result', { toolName: 'web_search', success: true, output: `Found ${results.length} results`, metadata: { results } });
              send('done', { reply: replyText });
            } else if (toolCall.tool === 'image_gen') {
              send('tool_use', { toolName: 'image_gen', args: toolCall.args });
              const { zaiImageGenerate } = await import('@/lib/zai-client');
              try {
                const imageData = await zaiImageGenerate(toolCall.args.prompt);
                send('tool_result', { toolName: 'image_gen', success: true, output: 'Image generated', metadata: { imageUrl: imageData } });
                send('done', { reply: replyText });
              } catch (imgErr) {
                send('tool_result', { toolName: 'image_gen', success: false, output: 'Image generation failed' });
                send('done', { reply: 'Sorry, image generation failed. Please try again.' });
              }
            } else {
              send('done', { reply: replyText });
            }
          } else {
            // No tool call — reply was already streamed token-by-token above
            send('done', { reply: replyText });
          }
        } catch (e) {
          console.error('[agent] Error:', e);
          send('error', { content: e instanceof Error ? e.message : 'Agent failed' });
          send('done', { reply: 'I encountered an error. Please try again.' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Agent failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}

function extractToolCall(text: string): { tool: string; args: any } | null {
  const jsonMatch = text.match(/\{[^{}]*"tool"[^{}]*\}/);
  if (jsonMatch) {
    try { const parsed = JSON.parse(jsonMatch[0]); if (parsed.tool && parsed.args) return parsed; } catch {}
  }
  const toolCallMatch = text.match(/```json\s*(\{[^}]+\})\s*```/);
  if (toolCallMatch) {
    try { const parsed = JSON.parse(toolCallMatch[1]); if (parsed.tool && parsed.args) return parsed; } catch {}
  }
  const lower = text.toLowerCase();
  if (lower.includes('generate_website') || lower.includes('"tool": "generate')) {
    const promptMatch = text.match(/prompt["\s:]+([^"]+)"/);
    if (promptMatch) return { tool: 'generate_website', args: { prompt: promptMatch[1] } };
  }
  return null;
}

function localIntentResponse(message: string, mode: string): string {
  const lower = message.toLowerCase().trim();

  // Math questions — try to evaluate
  const mathMatch = message.match(/(\d+(?:\.\d+)?)\s*([+\-*/x×÷^])\s*(\d+(?:\.\d+)?)/i);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]);
    const op = mathMatch[2].toLowerCase().replace('x', '*').replace('×', '*').replace('÷', '/').replace('^', '**');
    const b = parseFloat(mathMatch[3]);
    let result: number;
    switch (op) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b !== 0 ? a / b : NaN; break;
      case '**': result = Math.pow(a, b); break;
      default: result = NaN;
    }
    if (!isNaN(result)) {
      return `${a} ${mathMatch[2]} ${b} = ${result.toLocaleString()}\n\nIs there a website you'd like me to help you build today?`;
    }
  }

  // Greetings
  if (lower.match(/^(hi|hello|hey|yo|sup|greetings|howdy|good morning|good afternoon|good evening)\b/)) {
    return `Hello! I'm ZenForge AI, your elite website design agent. I can help you create stunning, production-quality websites from a simple description.

What kind of website would you like to build? For example:
- "A cozy coffee shop with an espresso bar"
- "A modern tech startup landing page"
- "A luxury hair salon and day spa"

Just describe the business or website you have in mind, and I'll search our design brain for references and generate it for you.`;
  }

  // How are you / general questions
  if (lower.match(/how are you|what can you do|who are you|help|what do you do/)) {
    return `I'm ZenForge AI, powered by the Z.AI GLM-5.1 model. I can:

1. **Generate complete websites** — Describe a business and I'll create a 16-section site.
2. **Search the Cerebrium design brain** — 159 design analysis files from Stripe, Apple, Linear, Raycast, and more.
3. **Generate images** — Custom images using Z.AI's image generation.
4. **Answer questions** — Math, general knowledge, web design advice.

What would you like to do?`;
  }

  // Website generation requests
  const generateKeywords = ['build', 'create', 'generate', 'make', 'design', 'website for', 'site for', 'landing page'];
  const businessKeywords = ['cafe', 'coffee', 'restaurant', 'gym', 'fitness', 'tech', 'startup', 'saas', 'law', 'legal', 'dental', 'dentist', 'salon', 'hair', 'beauty', 'plumb', 'electric', 'real estate', 'realtor', 'agency', 'studio', 'shop', 'store', 'hotel', 'spa', 'bar', 'bakery', 'clinic', 'school', 'portfolio', 'blog'];
  const wantsGenerate = generateKeywords.some(k => lower.includes(k));
  const hasBusiness = businessKeywords.some(k => lower.includes(k));

  if (wantsGenerate && hasBusiness) {
    return `I'll generate a website based on your description. Let me search the design brain and create it for you.

{"tool":"generate_website","args":{"prompt":"${message.replace(/"/g, '\\"')}"}}`;
  }
  if (message.split(/\s+/).length >= 8 && hasBusiness) {
    return `That sounds like a great project! Let me generate a website for you right away.

{"tool":"generate_website","args":{"prompt":"${message.replace(/"/g, '\\"')}"}}`;
  }

  // Default — be helpful
  return `I understand you're asking about: "${message}"

I'm currently running in local intelligence mode (the Z.AI GLM-5.1 model is warming up). I can help you:
- **Build a website** — Describe a business (e.g. "build a coffee shop website")
- **Answer math** — Try "what is 123 * 456"
- **Search design references** — Try "show me Stripe's design"

What would you like to do?`;
}

