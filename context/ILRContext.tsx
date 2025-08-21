import React, { createContext, useContext, useState } from "react";
import { ILRType, NoteType, ActivityType } from "../types/ilr"; // define these based on your models

interface ILRContextType {
  ilr: ILRType;
  setIlr: React.Dispatch<React.SetStateAction<ILRType>>;
  notes: NoteType[];
  setNotes: React.Dispatch<React.SetStateAction<NoteType[]>>;
  activities: ActivityType[];
  activitiesLoading: boolean;
  setActivitiesLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Handlers
  openDatePicker: () => void;
  onDateChange: (event: any, selectedDate?: Date) => void;
  openRemarkModal: () => void;
  saveRemark: () => void;
  toggleStatus: () => void;
  addNote: () => void;

  // UI state
  showDatePicker: boolean;
  setShowDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
  showRemarkInput: boolean;
  setShowRemarkInput: React.Dispatch<React.SetStateAction<boolean>>;
  newRemark: string;
  setNewRemark: React.Dispatch<React.SetStateAction<string>>;
  newNote: string;
  setNewNote: React.Dispatch<React.SetStateAction<string>>;
}

const ILRContext = createContext<ILRContextType | undefined>(undefined);

export const useILR = () => {
  const context = useContext(ILRContext);
  if (!context) throw new Error("useILR must be used inside ILRProvider");
  return context;
};

export default ILRContext;
