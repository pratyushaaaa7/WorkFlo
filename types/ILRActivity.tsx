type Activity = {
  _id: string;
  title: string;
  fieldChanged?: string; // 👈 add this
  createdBy: string;
  createdAt: string;
  oldValue?: any;
  newValue?: any;
  note?: string; // 👈 add this
  type: "note" | "date" | "remark" | "status" | "assignee" | "subject"; // <-- add this
};

export default Activity;
