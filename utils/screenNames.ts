export const SCREEN_NAME_MAP: Record<string, string> = {
  "/dprLaborForm": "DPR Labor Form",
  "/dashboard": "Dashboard",
  "/projectMain": "Project Main",
  "/svrs": "SVRs",
  "/userDirectory": "User Directory",
  "/usageSummary": "Usage Summary",
  "/svrForm": "SVR Form",
  "/dprs": "DPRs",
  "/centralEmployeeDirectory": "Central Employee Directory",
  "/projectStageLog": "Project Stage Log",
  "/usage": "Usage Ranking",
  "/svrPdfForm": "SVR PDF Form",
  "/reportForm": "DPR PDF Form",
  "/createUser": "Create User",
  "/projectDetails": "Project Details",
  "/addProjectUser": "Add Project User",
  "/projectStage": "Project Stage",
  "/masterProjectList": "Master Project List",
  "/login": "Login",
  "/": "Home",
  "/projects": "Projects",
  "/userDetail": "User Detail",
  "/manageProjectStages": "Manage Project Stages",
  "/createProject": "Create Project",
  "/annotateImage": "Annotate Image",
  "/centralUserDirectory": "Central User Directory",
  "/profile": "Profile",
  "/ilrActivities": "ILR Activities",
  "/minutes": "Minutes",
  "/ilrs": "ILRs",
};

export const getReadableScreenName = (path: string) => {
  if (!path) return "";
  if (SCREEN_NAME_MAP[path]) return SCREEN_NAME_MAP[path];

  // Fallback: clean up technical names for humans
  return path
    .replace(/^\//, "") // Remove leading slash
    .split("?")[0] // ignore query params
    .replace(/([-._])/g, " ") // replace separators with spaces
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
};
