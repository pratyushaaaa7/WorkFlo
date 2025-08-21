// src/types/index.ts

// Responsibility object
export type ResponsibilityType = {
  individualName: string;
  designation: string;
};

// Note object
export type NoteType = {
  _id?: string;
  text: string;
  createdBy?: {
    _id?: string;
    username: string;
  };
  createdAt?: string;
};

// Activity object
export type ActivityType = {
  _id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  oldValue?: string | number;
  newValue?: string | number;
};

// ILR object
export type ILRType = {
  _id: string;
  description: string;
  targetDate: string;
  remarks: string;
  responsibility: ResponsibilityType[];
  status: "Open" | "Closed";
  ilrCreatedBy: string;
  ilrCreatedAt: string;
  notes?: NoteType[];
  activities?: ActivityType[];
};

// Context type
export type ILRContextType = {
  ilr: ILRType;
  setIlr: React.Dispatch<React.SetStateAction<ILRType>>;
  notes: NoteType[];
  setNotes: React.Dispatch<React.SetStateAction<NoteType[]>>;
  newNote: string;
  setNewNote: React.Dispatch<React.SetStateAction<string>>;
  activities: ActivityType[];
  activitiesLoading: boolean;
  showDatePicker: boolean;
  openDatePicker: () => void;
  onDateChange: (event: any, selectedDate?: Date) => void;
  showRemarkInput: boolean;
  openRemarkModal: () => void;
  newRemark: string;
  setNewRemark: React.Dispatch<React.SetStateAction<string>>;
  saveRemark: () => void;
  toggleStatus: () => void;
  addNote: () => void;
  fetchILRDetails: () => Promise<void>;
};
