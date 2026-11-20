export class Room {
  constructor(ctx, env) { this.ctx = ctx; }
  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, message) {
    if (typeof message === 'string' && message.length > 200000) return;
    for (const other of this.ctx.getWebSockets()) {
      if (other !== ws) { try { other.send(message); } catch (e) {} }
    }
  }
  webSocketClose(ws, code, reason) { try { ws.close(code, reason); } catch (e) {} }
  webSocketError(ws) { try { ws.close(1011, 'erreur'); } catch (e) {} }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/room\/([a-z0-9-]{1,40})$/i);
    if (!m) {
      return new Response('Relais Rideau de fer : OK', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('WebSocket attendu', { status: 426 });
    }
    const id = env.ROOMS.idFromName(m[1].toLowerCase());
    return env.ROOMS.get(id).fetch(request);
  }
};
