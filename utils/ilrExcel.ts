// excelExporter.ts
import ExcelJS from "exceljs";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Buffer } from "buffer";


// Types
type Responsibility = { individualName: string; designation: string };
type Activity = {
  fieldChanged: string;
  createdAt: string;
  note?: string;
  newValue?: string;
};

export type ILR = {
  ilrNumber: number;
  createdAt: string;
  createdBy?: { username: string };
  description: string;
  remarks?: string;
  responsibility: Responsibility[];
  targetDate: string;
  status: string;
  activities?: Activity[];
};

// Utility: Format date as DD.MM.YYYY
function formatDate(date: string | Date): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}.${String(
    d.getMonth() + 1
  ).padStart(2, "0")}.${d.getFullYear()}`;
}

export async function exportILRsToExcel(
  filteredILRs: ILR[],
  projectName: string,
  accountName: string
) {
  try {
    if (!filteredILRs || filteredILRs.length === 0) {
      alert("No ILRs available to download");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ILRs");

    // --- HEAD INFO ---
    const infoRows = [
      `Project Name: ${projectName}`,
      `Printed Date: ${formatDate(new Date())}`,
      `Downloaded By: ${accountName}`,
    ];

    infoRows.forEach((text, i) => {
      const row = worksheet.addRow([text]);
      worksheet.mergeCells(`A${i + 1}:J${i + 1}`); // merge across columns
      row.font = { bold: true };
    });
    worksheet.addRow([]); // empty row for spacing
    

    // --- HEADERS ---
    const maxActivities = Math.max(
      ...filteredILRs.map(
        (ilr) =>
          (ilr.activities ?? []).filter((a) => a.fieldChanged === "targetDate")
            .length
      ),
      0
    );

    const headers = [
      "S. NO",
      "ISSUE NUMBER",
      "DATE OF ISSUE",
      "RAISED BY",
      "ISSUE SUBJECT",
      "ISSUE DESCRIPTION",
      "RESPONSIBILITY",
      "TARGET DATE",
      "STATUS",
      ...Array.from({ length: maxActivities }, (_, i) => `Activity ${i + 1}`),
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "000000" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "E5E7EB" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });

    // --- DATA ROWS ---
    filteredILRs.forEach((ilr, index) => {
      const targetDateActivities = (ilr.activities ?? []).filter(
        (a) => a.fieldChanged === "targetDate"
      );

      const activityValues = Array.from({ length: maxActivities }, (_, i) => {
        const a = targetDateActivities[i];
        return a
          ? `Date - ${formatDate(a.createdAt)}\nNote - ${
              a.note || "N/A"
            }\nNew Target Date - ${formatDate(a.newValue)}`
          : "";
      });

      const row = worksheet.addRow([
        index + 1,
        ilr.ilrNumber,
        formatDate(ilr.createdAt),
        ilr.createdBy?.username || "N/A",
        ilr.description,
        ilr.remarks || "No remarks",
        ilr.responsibility
          .map((r) => `${r.individualName} (${r.designation})`)
          .join(", "),
        formatDate(ilr.targetDate),
        ilr.status,
        ...activityValues,
      ]);

      // style status cell
      const statusCell = row.getCell(9);
      if (ilr.status.toLowerCase() === "open") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F87171" } };
        statusCell.font = { color: { argb: "FFFFFF" }, bold: true };
      } else if (ilr.status.toLowerCase() === "closed") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4ADE80" } };
        statusCell.font = { color: { argb: "FFFFFF" }, bold: true };
      }

      // wrap activity text
      activityValues.forEach((_, i) => {
        row.getCell(10 + i).alignment = { wrapText: true, vertical: "top" };
      });
    });

    // --- COLUMN WIDTHS ---
    const colWidths: Record<number, number> = {
      1: 6, // S.NO
      2: 12, // Issue Number
      3: 14, // Date
      4: 15, // Raised By
      5: 30, // Subject
      6: 40, // Description
      7: 30, // Responsibility
      8: 14, // Target Date
      9: 12, // Status
    };

    worksheet.columns.forEach((col, idx) => {
      col.width = colWidths[idx + 1] ?? 25; // default for activities
    });

    // --- SAVE FILE ---
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const fileUri = FileSystem.documentDirectory + "ILRs.xlsx";
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(fileUri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Share ILRs Excel",
      UTI: "com.microsoft.excel.xlsx",
    });
  } catch (err) {
    console.error("❌ Error exporting Excel:", err);
    alert("Failed to export Excel");
  }
}
