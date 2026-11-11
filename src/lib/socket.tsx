"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";
import { useWorkspace } from "./workspace-context";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const { workspaceId } = useWorkspace();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user?.id || !workspaceId) {
      setSocket(null);
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    s.on("connect", () => {
      s.emit("join_workspace", workspaceId);
    });
    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?.id, token, workspaceId]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
