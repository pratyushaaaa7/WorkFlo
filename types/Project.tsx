type Project = {
  _id: string;
  projectName: string;
  projectCode: string;
  location: string;
  area: string;
  typology: string;
  company: string;
  scopes: string[];
  startDate: string; // ISO string
  assignedUsers: { _id: string; username?: string }[]; // legacy
  teamLeaders: { _id: string; username?: string ; fullName?:string}[];
  teamMembers: { _id: string; username?: string ; fullName?:string}[];
  clientName?: string;
  siteArea?: string;
  designedArea?: string;
};

export type { Project };