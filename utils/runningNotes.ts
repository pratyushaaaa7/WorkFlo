export const formatDate = (date: Date) => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${d}-${m}-${y}`;
};


export const getNoteBgColor = (status: string) => {
  switch (status) {
    case "Open":
      return "#FEE2E2";
    case "In Progress":
      return "#FEF3C7";
    case "Closed":
      return "#D1FAE5";
    default:
      return "#FFFFFF";
  }
};


export const statusOptions = [
  { value: "Open", label: "Open", color: "#EF4444", bg: "bg-red-500", border: "border-red-500" },
  { value: "In Progress", label: "In Progress", color: "#F59E0B", bg: "bg-amber-500", border: "#F59E0B" },
  { value: "Closed", label: "Closed", color: "#22C55E", bg: "bg-green-500", border: "border-green-500" },
];
