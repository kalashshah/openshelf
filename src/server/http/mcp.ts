import type { Env } from '../env';
import { INSTRUCTIONS, registerTools } from '../mcp';
import type { Shop } from '../store';

/** One stateless MCP exchange: the directory (scope null) or one store's own endpoint. */
export async function serveMcp(env: Env, request: Request, scope: Shop | null): Promise<Response> {
  // Loaded here, not at the top: bundled next to better-auth, the SDK's zod schemas evaluate before zod's classes exist.
  const [{ McpServer }, { WebStandardStreamableHTTPServerTransport }] = await Promise.all([
    import('@modelcontextprotocol/sdk/server/mcp.js'),
    import('@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'),
  ]);
  const server = new McpServer(
    { name: scope ? `openshelf-${scope.slug}` : 'openshelf', version: '0.2.0' },
    { instructions: scope ? `${INSTRUCTIONS}\nThis endpoint is ${scope.name}'s store only.` : INSTRUCTIONS },
  );
  registerTools(server, env, scope, (what) => overLimit(env, request, what));
  // Stateless: a Worker request may land on any isolate, so no session ids.
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(request);
}

/** Store-agent questions and AI imports cost model tokens, so each caller gets a budget. */
export async function overLimit(env: Env, request: Request | Headers, what: string): Promise<boolean> {
  if (!env.ASK_LIMIT) return false;
  const h = request instanceof Headers ? request : request.headers;
  const key = `${what}:${h.get('cf-connecting-ip') ?? 'local'}`;
  return !(await env.ASK_LIMIT.limit({ key })).success;
}
