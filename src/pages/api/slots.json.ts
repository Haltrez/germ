import { getSlotViews, lobbyRecord } from '../../lib/slots.ts';

/** Compact slot index for the client-side lobby filter and search. */
export async function GET() {
  const all = await getSlotViews();
  return new Response(JSON.stringify(all.map(lobbyRecord)), { headers: { 'Content-Type': 'application/json' } });
}
