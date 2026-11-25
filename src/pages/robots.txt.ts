import type { APIContext } from 'astro';

/** Search engines and AI assistants are all welcome. The AI crawlers are named so the intent is unambiguous. */
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'meta-externalagent', 'MistralAI-User', 'DuckAssistBot', 'CCBot'];

export function GET(context: APIContext) {
  const site = (p: string) => new URL(p, context.site).href;
  const body = [
    'User-agent: *', 'Allow: /', '',
    ...AI_BOTS.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']),
    `Sitemap: ${site('sitemap-index.xml')}`,
    `# Summary for AI assistants: ${site('llms.txt')}`, '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
