import { create } from 'zustand';

interface Education {
  college: string;
  qualification: string;
  specialization: string;
  graduationYear: string;
}

interface Experience {
  company: string;
  designation: string;
  fromDate: string | null;
  toDate: string | null;
  jobDescription: string;
}

interface UserFormState {
  education: Education[];
  experience: Experience[];
  setEducation: (education: Education[]) => void;
  setExperience: (experience: Experience[]) => void;
  clearStore: () => void;
}

export const useUserFormStore = create<UserFormState>((set) => ({
  education: [],
  experience: [],
  setEducation: (education) => set({ education }),
  setExperience: (experience) => set({ experience }),
  clearStore: () => set({ education: [], experience: [] }),
}));
