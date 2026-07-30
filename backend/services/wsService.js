const WebSocket = require("ws");

// In-memory subscription map: drugID -> Set<WebSocket>
const subscriptions = new Map();
let wss = null;
let pendingSubscriptions = []; // queue for subscriptions before server starts

/**
 * Initialize the WebSocket server on an existing HTTP server instance.
 * Call this once after app.listen() returns the http.Server.
 */
function init(httpServer) {
  if (wss) return wss;

  wss = new WebSocket.Server({ server: httpServer });

  wss.on("connection", (ws) => {
    ws.on("message", (rawMsg) => {
      let msg;
      try {
        msg = JSON.parse(rawMsg.toString());
      } catch {
        // Malformed JSON — close with policy violation code
        ws.close(1008, "Invalid JSON");
        return;
      }

      if (msg.type === "subscribe" && msg.drugID) {
        _addSubscription(msg.drugID, ws);
      } else if (msg.type === "unsubscribe" && msg.drugID) {
        _removeSubscription(msg.drugID, ws);
      }
    });

    ws.on("close", () => {
      // Remove this socket from all subscription lists
      for (const [drugID, clients] of subscriptions.entries()) {
        clients.delete(ws);
        if (clients.size === 0) subscriptions.delete(drugID);
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket client error:", err.message);
    });
  });

  // Process any queued subscriptions (shouldn't happen in normal flow)
  for (const { drugID, ws: pendingWs } of pendingSubscriptions) {
    _addSubscription(drugID, pendingWs);
  }
  pendingSubscriptions = [];

  return wss;
}

function _addSubscription(drugID, ws) {
  if (!subscriptions.has(drugID)) subscriptions.set(drugID, new Set());
  subscriptions.get(drugID).add(ws);
}

function _removeSubscription(drugID, ws) {
  const clients = subscriptions.get(drugID);
  if (clients) {
    clients.delete(ws);
    if (clients.size === 0) subscriptions.delete(drugID);
  }
}

/**
 * Broadcast a JSON payload to all WebSocket subscribers of a drugID.
 * Silently removes closed sockets.
 */
function broadcast(drugID, payload) {
  const clients = subscriptions.get(drugID);
  if (!clients || clients.size === 0) return;

  const message = JSON.stringify(payload);
  const dead = [];

  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (err) {
        console.error("wsService.broadcast send error:", err.message);
        dead.push(ws);
      }
    } else {
      dead.push(ws);
    }
  }

  // Cleanup dead sockets
  for (const ws of dead) {
    clients.delete(ws);
  }
  if (clients.size === 0) subscriptions.delete(drugID);
}

/**
 * Get count of active subscribers for a drugID (useful for testing).
 */
function subscriberCount(drugID) {
  return subscriptions.get(drugID)?.size || 0;
}

module.exports = { init, broadcast, subscriberCount };
