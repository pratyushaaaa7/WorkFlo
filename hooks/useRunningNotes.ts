import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Note } from "../types/runningNotes";

export const useRunningNotes = (projectId?: string, token?: string) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    if (!projectId || !token) return;

    const res = await api.get(`/running-notes/project/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setNotes(
      res.data.map((n: any) => ({
        id: n._id,
        text: n.text,
        status: n.status,
        responsible: n.responsible?._id || null,
        targetDate: n.targetDate ? new Date(n.targetDate) : null,
        createdAt: new Date(n.createdAt),
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [projectId, token]);

  return { notes, setNotes, loading, fetchNotes };
};
