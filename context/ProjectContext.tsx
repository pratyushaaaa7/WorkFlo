import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../lib/api";
import { Project } from "../types/Project";
import { AuthContext } from "./AuthContext";

type ProjectState = {
  projects: Project[];
  page: number;
  totalPages: number;
  totalProjects: number;
  loading: boolean;
  hasMore: boolean;
};

const initialProjectState: ProjectState = {
  projects: [],
  page: 1,
  totalPages: 1,
  totalProjects: 0,
  loading: false,
  hasMore: true,
};

type ProjectContextType = {
  projectsMap: { [key: string]: ProjectState };
  fetchProjects: (company: string, page?: number, isRefresh?: boolean) => Promise<void>;
  prefetchFirstPages: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [projectsMap, setProjectsMap] = useState<{ [key: string]: ProjectState }>({
    WAL: { ...initialProjectState },
    WP: { ...initialProjectState },
    WCorp: { ...initialProjectState },
  });

  const fetchProjects = useCallback(async (company: string, page: number = 1, isRefresh: boolean = false) => {
    if (!token) return;

    // Preventive check to avoid redundant loads if already loading or no more data
    const currentState = projectsMap[company];
    if (!isRefresh && (currentState.loading || (!currentState.hasMore && page > 1))) {
      return;
    }

    try {
      setProjectsMap(prev => ({
        ...prev,
        [company]: { ...prev[company], loading: true }
      }));

      const res = await api.get("/projects", {
        headers: { Authorization: `Bearer ${token}` },
        params: { company, page, limit: 10 },
      });

      const { projects, pagination } = res.data;

      setProjectsMap(prev => {
        const existingProjects = isRefresh || page === 1 ? [] : prev[company].projects;
        
        // Remove duplicates if any (just in case)
        const newProjects = [...existingProjects, ...projects];
        const uniqueProjects = Array.from(new Map(newProjects.map(item => [item._id, item])).values());

        return {
          ...prev,
          [company]: {
            projects: uniqueProjects,
            page: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalProjects: pagination.totalProjects,
            loading: false,
            hasMore: pagination.currentPage < pagination.totalPages,
          }
        };
      });
    } catch (error) {
      console.error(`Error fetching projects for ${company}:`, error);
      setProjectsMap(prev => ({
        ...prev,
        [company]: { ...prev[company], loading: false }
      }));
    }
  }, [token, projectsMap]);

  const prefetchFirstPages = useCallback(async () => {
    if (!token) return;
    
    // We only prefetch if we haven't loaded anything yet
    const companies = ["WAL", "WP", "WCorp"];
    
    // Parallel fetch for first pages
    await Promise.all(
        companies.map(company => {
            if (projectsMap[company].projects.length === 0) {
                return fetchProjects(company, 1);
            }
            return Promise.resolve();
        })
    );
  }, [token, fetchProjects, projectsMap]);

  return (
    <ProjectContext.Provider value={{ projectsMap, fetchProjects, prefetchFirstPages }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
