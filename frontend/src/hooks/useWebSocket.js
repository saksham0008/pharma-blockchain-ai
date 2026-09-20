import { useEffect, useRef, useState } from "react";

function useWebSocket(drugID, options = {}) {
  const {
    enabled = false,
    url = "",
    onMessage,
  } = options;

  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !url || !drugID) {
      return;
    }

    let socket;

    try {
      socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        setError(null);

        socket.send(
          JSON.stringify({
            type: "subscribe",
            drugID,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          setLastMessage(data);

          if (onMessageRef.current) {
            onMessageRef.current(data);
          }
        } catch {
          setLastMessage(event.data);

          if (onMessageRef.current) {
            onMessageRef.current(event.data);
          }
        }
      };

      socket.onerror = () => {
        setError("WebSocket connection error.");
      };

      socket.onclose = () => {
        setConnected(false);
      };
    } catch (err) {
      console.error("WebSocket error:", err);
      setError(err.message || "Unable to connect to WebSocket.");
    }

    return () => {
      if (socket) {
        socket.close();
      }

      socketRef.current = null;
      setConnected(false);
    };
  }, [drugID, enabled, url]);

  return {
    connected,
    lastMessage,
    error,
  };
}

export default useWebSocket;

