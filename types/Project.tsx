type Note = {
  _id: string;
  text: string;
  createdBy?: { _id: string; username?: string; fullName?: string };
  createdAt: string; // ISO string
};

type Activity = {
  _id: string;
  fieldChanged: string;
  previousValue?: any; // since schema allows Mixed
  newValue?: any;
  action?: "added" | "removed" | "updated";
  performedBy?: { _id: string; username?: string; fullName?: string };
  createdAt: string; // ISO string
};

type Project = {
  _id: string;
  projectName: string;
  projectCode?: string;
  location?: string;
  area?: string;
  typology?: string;
  company?: string;
  scopes: string[];
  startDate?: string; // ISO string
  fileNumber?: string;
  createdBy: { _id: string; username?: string; fullName?: string };
  fileNumberNumeric?: any;
  webName?: string;
  assignedUsers?: { _id: string; username?: string; fullName?: string }[]; // legacy
  teamLeaders: { _id: string; username?: string; fullName?: string }[];
  teamMembers: { _id: string; username?: string; fullName?: string }[];
  description: string;
  clientName?: string;
  partnerInCharge?: string;
  siteArea?: string;
  designedArea?: string;
  status: "active" | "inactive" | "closed" | "BD";

  notes: Note[];
  activities: Activity[];

  createdAt: string; // from timestamps
  updatedAt: string;
};

export type { Activity, Note, Project };
