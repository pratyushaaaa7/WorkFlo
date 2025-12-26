export type Note = {
  id: string;
  text: string;
  status: "Open" | "In Progress" | "Closed";
  responsible: string | null;
  targetDate: Date | null;
  createdAt: Date;
};
