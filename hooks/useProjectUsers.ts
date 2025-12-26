import { useEffect, useState } from "react";
import api from "@/lib/api";

export const useProjectUsers = (projectId?: string, token?: string) => {
  const [users, setUsers] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    if (!projectId || !token) return;

    api
      .get(`/projects/${projectId}/project-employees`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res =>
        setUsers(
          res.data.map((u: any) => ({
            label: `${u.name} (${u.company})`,
            value: u._id,
          }))
        )
      )
      .catch(console.log);
  }, [projectId, token]);

  return users;
};
