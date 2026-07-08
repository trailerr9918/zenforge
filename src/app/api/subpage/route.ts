import { NextRequest, NextResponse } from 'next/server';

function esc(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { parentSlug, pageSlug, pageName, contentType = 'custom' } = body;
    if (!parentSlug || !pageSlug || !pageName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { getWebsiteFromSupabase, saveWebsiteToSupabase } = await import('@/lib/supabase-client');
    const parent = await getWebsiteFromSupabase(parentSlug);
    if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

    // Extract design DNA from parent
    const styleMatch = parent.html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const styleBlock = styleMatch ? styleMatch[1] : '';
    const bgMatch = styleBlock.match(/body\s*\{[^}]*background(?:-color)?\s*:\s*([^;}]+)/i);
    const bg = bgMatch ? bgMatch[1].trim() : '#ffffff';
    const fontHrefMatch = parent.html.match(/<link[^>]*href="(https:\/\/fonts\.googleapis[^"]+)"[^>]*>/i);
    const fontHref = fontHrefMatch ? fontHrefMatch[1] : '';
    const titleMatch = parent.html.match(/<title>([^<]+)<\/title>/i);
    const businessName = titleMatch ? titleMatch[1].split('—')[0].trim() : parent.business_name;
    const navMatch = parent.html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
    const navHtml = navMatch ? navMatch[0] : '';
    const footerMatch = parent.html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
    const footerHtml = footerMatch ? footerMatch[0] : '';

    // Build content based on type
    const contentMap: Record<string, string> = {
      services: `<section style="padding:80px 24px;max-width:1200px;margin:0 auto"><h1 style="font-size:48px;margin-bottom:20px">${esc(pageName)}</h1><p style="font-size:18px;color:#666;margin-bottom:48px">What we offer at ${esc(businessName)}.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px">${[
        { t: 'Strategy & Consulting', d: 'We help you map goals, audience, and metrics before a single pixel is drawn.' },
        { t: 'Design & Branding', d: 'Visual identity, typography systems, color theory, and a complete brand book.' },
        { t: 'Development', d: 'Production-grade engineering with accessibility and SEO baked in from day one.' },
        { t: 'Launch & Optimization', d: 'Pre-launch QA, analytics instrumentation, and a 30-day optimization sprint.' },
        { t: 'Ongoing Support', d: 'A retained partnership with monthly reports, security patches, and feature releases.' },
        { t: 'Training & Handoff', d: 'We train your team to own the platform. Documentation, screencasts, support window.' },
      ].map((s, i) => `<article style="background:#fff;border:1px solid #eee;border-radius:16px;padding:32px"><div style="width:48px;height:48px;border-radius:12px;background:#007bff;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:20px">${i + 1}</div><h3 style="font-size:22px;margin-bottom:12px">${esc(s.t)}</h3><p style="font-size:15px;color:#555;line-height:1.65">${esc(s.d)}</p></article>`).join('\n')}</div></section>`,
      about: `<section style="padding:80px 24px;max-width:760px;margin:0 auto"><h1 style="font-size:48px;margin-bottom:20px">${esc(pageName)}</h1><p style="font-size:18px;color:#555;line-height:1.75;margin-bottom:24px">${esc(businessName)} was founded on a simple belief: that thoughtful craft and rigorous process produce work that endures. We started as a small studio with a big vision, and we have stayed true to that origin even as we have grown.</p><p style="font-size:18px;color:#555;line-height:1.75;margin-bottom:24px">Our team brings together strategists, designers, and engineers who have shipped work for Fortune 500 brands and scrappy startups alike. We believe the best work happens at the intersection of discipline and curiosity.</p><p style="font-size:18px;color:#555;line-height:1.75;margin-bottom:24px">Every engagement begins with listening. We invest time in understanding your audience, your constraints, and the outcomes that matter to your business. Only then do we move into design and build.</p></section>`,
      contact: `<section style="padding:80px 24px;max-width:960px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px"><div><h1 style="font-size:48px;margin-bottom:20px">${esc(pageName)}</h1><p style="font-size:17px;color:#555;margin-bottom:32px">We would love to hear from you. Reach out and we will respond within one business day.</p><div style="font-size:15px;color:#555;line-height:2"><div><strong>Email:</strong> hello@${businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</div><div><strong>Phone:</strong> +1 (555) 010-0200</div><div><strong>Studio:</strong> 221 Market Street, Suite 400</div><div><strong>Hours:</strong> Mon–Fri, 9am–6pm PT</div></div></div><form style="display:flex;flex-direction:column;gap:16px" onsubmit="event.preventDefault()"><input required type="text" placeholder="Your name" style="padding:14px 16px;border:1px solid #ddd;border-radius:10px;font-size:15px" /><input required type="email" placeholder="Email" style="padding:14px 16px;border:1px solid #ddd;border-radius:10px;font-size:15px" /><textarea required placeholder="Tell us about your project" rows="5" style="padding:14px 16px;border:1px solid #ddd;border-radius:10px;font-size:15px;resize:vertical"></textarea><button type="submit" style="padding:16px 32px;background:#007bff;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer">Send message</button></form></section>`,
      portfolio: `<section style="padding:80px 24px;max-width:1200px;margin:0 auto"><h1 style="font-size:48px;margin-bottom:20px">${esc(pageName)}</h1><p style="font-size:18px;color:#666;margin-bottom:48px">Selected work from ${esc(businessName)}.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px">${['Aurora Banking App','Helios Health Platform','Northwind Commerce','Lumen Analytics','Atlas Travel','Verdant Wellness'].map((t, i) => `<article style="background:#fff;border:1px solid #eee;border-radius:20px;overflow:hidden"><div style="aspect-ratio:16/10;background:url('https://images.unsplash.com/photo-${['1556761175-5973dc0f32e7','1551434678-e076c223a692','1521791136064-7986c2920216','1559136555-9303baea8ebd','1542744173-8e7e53415bb0','1556742049-0cfed4f6a45d'][i]}?w=600&h=380&fit=crop') center/cover"></div><div style="padding:24px"><h3 style="font-size:20px;margin-bottom:8px">${esc(t)}</h3><p style="font-size:14px;color:#666">A case study in craft and outcomes.</p></div></article>`).join('')}</div></section>`,
      blog: `<section style="padding:80px 24px;max-width:840px;margin:0 auto"><h1 style="font-size:48px;margin-bottom:20px">${esc(pageName)}</h1><p style="font-size:18px;color:#666;margin-bottom:48px">Essays, teardowns, and field notes from the ${esc(businessName)} team.</p>${['Why your landing page converts at 1.2%','The design system ROI nobody talks about','Accessibility is a feature, not a checklist','Performance budgets that actually stick'].map((t, i) => `<article style="display:flex;gap:24px;padding:32px 0;border-bottom:1px solid #eee"><div style="width:80px;height:80px;border-radius:12px;background:url('https://images.unsplash.com/photo-${['1486312338219-ce68d2c6f44d','1454165804606-c3d57bc86b40','1499750310107-5fef28a66643','1556761175-5973dc0f32e7'][i]}?w=160&h=160&fit=crop') center/cover;flex-shrink:0"></div><div><div style="font-size:12px;color:#007bff;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin-bottom:8px">Article · ${4 + i} min</div><h3 style="font-size:22px;margin-bottom:8px">${esc(t)}</h3><p style="font-size:15px;color:#666">A deep dive into the topic with concrete fixes.</p></div></article>`).join('')}</section>`,
      faq: `<section style="padding:80px 24px;max-width:760px;margin:0 auto"><h1 style="font-size:48px;margin-bottom:20px;text-align:center">${esc(pageName)}</h1><p style="font-size:17px;color:#666;text-align:center;margin-bottom:48px">Answers to the questions we hear most often.</p>${[{q:'How long does a typical project take?',a:'Most engagements run 6–12 weeks. Larger platforms can run 4–6 months.'},{q:'What does your pricing model look like?',a:'Fixed-fee for scoped work. Most projects $25k–$150k.'},{q:'Do you work with early-stage startups?',a:'Yes. We have a startup track with flexible terms.'},{q:'Can you work with our in-house team?',a:'Yes. Handoff is a first-class deliverable.'},{q:'What technologies do you specialize in?',a:'Next.js, React, TypeScript, Tailwind, Supabase.'}].map(f => `<details style="border:1px solid #eee;border-radius:12px;padding:0;margin-bottom:12px;background:#fff"><summary style="padding:20px 24px;cursor:pointer;font-size:17px;font-weight:600">${esc(f.q)}</summary><div style="padding:0 24px 20px;font-size:15px;color:#555;line-height:1.65">${esc(f.a)}</div></details>`).join('')}</section>`,
      team: `<section style="padding:80px 24px;max-width:1200px;margin:0 auto"><h1 style="font-size:48px;margin-bottom:20px;text-align:center">${esc(pageName)}</h1><p style="font-size:17px;color:#666;text-align:center;margin-bottom:48px">The people behind ${esc(businessName)}.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px">${[{n:'Maya Chen',r:'Founder & CD',d:'15 years shaping brands at the intersection of editorial and product.'},{n:'Daniel Okoro',r:'Principal Eng',d:'Ships resilient systems with a bias for boring, proven tech.'},{n:'Priya Raman',r:'Head of Strategy',d:'Former McKinsey. Turns business problems into design briefs.'},{n:'Jonas Weber',r:'Design Lead',d:'Editorial typography obsessive. Ex-Pentagram.'},{n:'Aisha Karim',r:'Dir. of Eng',d:'Scales teams and codebases without losing the plot.'},{n:'Marco Silva',r:'Sr. Designer',d:'Mobile-first thinker. Ships fast and learns faster.'}].map((m, i) => `<article style="text-align:center"><div style="width:140px;height:140px;border-radius:50%;background:url('https://images.unsplash.com/photo-${['1556761175-5973dc0f32e7','1551434678-e076c223a692','1521791136064-7986c2920216','1559136555-9303baea8ebd','1542744173-8e7e53415bb0','1556742049-0cfed4f6a45d'][i]}?w=280&h=280&fit=crop') center/cover;margin:0 auto 20px"></div><h3 style="font-size:18px;margin-bottom:6px">${esc(m.n)}</h3><div style="font-size:13px;color:#007bff;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin-bottom:8px">${esc(m.r)}</div><p style="font-size:14px;color:#666;line-height:1.5;max-width:240px;margin:0 auto">${esc(m.d)}</p></article>`).join('')}</div></section>`,
      pricing: `<section style="padding:80px 24px;max-width:1200px;margin:0 auto"><h1 style="font-size:48px;margin-bottom:20px;text-align:center">${esc(pageName)}</h1><p style="font-size:17px;color:#666;text-align:center;margin-bottom:48px">Simple, transparent pricing. No surprises.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1080px;margin:0 auto">${[{n:'Starter',d:'For founders validating an idea',p:'$4,900',f:['Discovery workshop','Up to 4 pages','Analytics setup','14-day support']},{n:'Growth',d:'For teams shipping their v2',p:'$18,500',f:['Design system','Up to 12 pages','CMS integration','30-day support','A/B testing'],feat:true},{n:'Scale',d:'For platforms with serious traffic',p:'Custom',f:['Multi-region deploy','Performance budgets','Security audit','Quarterly roadmap','Dedicated team']}].map(t => `<article style="background:${t.feat ? '#0a0a0a' : '#fff'};color:${t.feat ? '#fff' : '#0a0a0a'};border:1px solid #eee;border-radius:20px;padding:40px 32px;${t.feat ? 'transform:scale(1.04);box-shadow:0 20px 40px rgba(0,0,0,.12)' : ''}"><h3 style="font-size:22px;margin-bottom:8px">${esc(t.n)}</h3><p style="font-size:14px;opacity:.7;margin-bottom:24px">${esc(t.d)}</p><div style="font-size:48px;font-weight:700;margin-bottom:28px">${esc(t.p)}</div><ul style="list-style:none;padding:0;margin:0 0 32px;font-size:14px;line-height:2.2">${t.f.map(f => `<li>✓ ${esc(f)}</li>`).join('')}</ul><button style="width:100%;padding:14px;background:#007bff;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">Get started</button></article>`).join('')}</div></section>`,
      testimonials: `<section style="padding:80px 24px;max-width:1200px;margin:0 auto"><h1 style="font-size:48px;margin-bottom:20px;text-align:center">${esc(pageName)}</h1><p style="font-size:17px;color:#666;text-align:center;margin-bottom:48px">What our clients say.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px">${[{n:'Sarah Liu',r:'VP Product, Northwind',q:'Working with this team was the smoothest vendor engagement I have had in fifteen years.'},{n:'James Park',r:'CEO, Helios Health',q:'They treated our roadmap like their own. Flagged scope risks early.'},{n:'Elena Volkov',r:'Head of Brand, Aurora',q:'Never worked with a team that communicated this well.'}].map(q => `<figure style="background:#fff;border:1px solid #eee;border-radius:20px;padding:36px"><div style="color:#007bff;font-size:14px;letter-spacing:2px;margin-bottom:16px">★★★★★</div><blockquote style="font-size:17px;line-height:1.7;color:#333;margin-bottom:20px">${esc(q.q)}</blockquote><figcaption style="display:flex;align-items:center;gap:12px"><div style="width:44px;height:44px;border-radius:50%;background:#007bff;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600">${esc(q.n[0])}</div><div><div style="font-weight:600;color:#0a0a0a;font-size:15px">${esc(q.n)}</div><div style="font-size:13px;color:#888">${esc(q.r)}</div></div></figcaption></figure>`).join('')}</div></section>`,
      custom: `<section style="padding:80px 24px;max-width:760px;margin:0 auto"><h1 style="font-size:48px;margin-bottom:20px">${esc(pageName)}</h1><p style="font-size:18px;color:#555;line-height:1.75">This is a custom page on the ${esc(businessName)} site. Use the items field in the API request to provide structured content, or describe what should appear here in the description field.</p></section>`,
    };
    const content = contentMap[contentType] || contentMap.custom;

    const subSlug = `${parentSlug}-${pageSlug}`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(businessName)} — ${esc(pageName)}</title>
${fontHref ? `<link href="${fontHref}" rel="stylesheet">` : ''}
<style>
body{font-family:'Inter',system-ui,sans-serif;background:${bg};color:#0a0a0a;margin:0;line-height:1.5;-webkit-font-smoothing:antialiased}
img{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
.breadcrumb{max-width:1200px;margin:0 auto;padding:16px 24px;font-size:13px;color:#888}
.breadcrumb a{color:#007bff}
</style>
</head>
<body>
${navHtml.replace(/href="\/s\/[^"]+"/g, `href="/s/${parentSlug}"`).replace(/href="#/g, `href="/s/${parentSlug}#`)}
<nav class="breadcrumb"><a href="/s/${parentSlug}">${esc(businessName)}</a> <span style="margin:0 8px;opacity:.5">/</span> <span style="color:#555">${esc(pageName)}</span></nav>
${content}
${footerHtml.replace(/href="\/s\/[^"]+"/g, `href="/s/${parentSlug}"`)}
</body>
</html>`;

    await saveWebsiteToSupabase(subSlug, html, `${parent.business_name} - ${pageName}`, 'subpage');

    // Auto-link in parent footer
    let parentUpdated = false;
    if (!parent.html.includes(`/s/${subSlug}`)) {
      const updatedParent = parent.html.replace(/(<footer[^>]*>[\s\S]*?)(<\/footer>)/i, (m, before, close) => {
        const linkMatch = before.match(/<a\s+[^>]*href="[^"]*"[^>]*>[^<]*<\/a>/i);
        if (!linkMatch) return m;
        const sample = linkMatch[0];
        const styleMatch = sample.match(/style="([^"]*)"/i);
        const classMatch = sample.match(/class="([^"]*)"/i);
        const styleAttr = styleMatch ? ` style="${styleMatch[1]}"` : '';
        const classAttr = classMatch ? ` class="${classMatch[1]}"` : '';
        const newLink = `<a href="/s/${esc(subSlug)}"${styleAttr}${classAttr}>${esc(pageName)}</a>`;
        return before + newLink + '\n' + close;
      });
      if (updatedParent !== parent.html) {
        await saveWebsiteToSupabase(parentSlug, updatedParent, parent.business_name, parent.business_type);
        parentUpdated = true;
      }
    }

    const host = `https://${req.headers.get('host') || 'localhost:3000'}`;
    return NextResponse.json({
      success: true, html, slug: subSlug, parentSlug, parentUpdated,
      viewUrl: `${host}/s/${subSlug}`, contentType,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
