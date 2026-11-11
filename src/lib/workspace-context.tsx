"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api, ApiError, setWorkspaceId, clearWorkspaceId } from "./api";
import type { Workspace } from "./types";
import { useAuth } from "./auth-context";

interface WorkspaceContextValue {
  workspace: Workspace | null;
  workspaceId: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateSettings: (settings: Workspace["settings"]) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const ws = await api.get<Workspace>("/workspace/my");
      setWorkspace(ws);
      setWorkspaceId(ws.id);
      setWorkspaceIdState(ws.id);
    } catch (err) {
      setWorkspace(null);
      setWorkspaceIdState(null);
      clearWorkspaceId();
      if (!(err instanceof ApiError && err.status === 404)) setError("Could not load your workspace. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      load();
    } else {
      setWorkspace(null);
      setWorkspaceIdState(null);
      clearWorkspaceId();
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateSettings = async (settings: Workspace["settings"]) => {
    const ws = await api.patch<Workspace>("/workspace", { settings }, { workspace: true });
    setWorkspace(ws);
  };

  return (
    <WorkspaceContext.Provider
      value={{ workspace, workspaceId, loading, error, refresh: load, updateSettings }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
