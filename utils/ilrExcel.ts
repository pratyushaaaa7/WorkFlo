import ExcelJS from "exceljs";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Buffer } from "buffer";
import { Asset } from "expo-asset";

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
  delayDays?: number;
};

// Utility: Format date as DD.MM.YYYY
function formatDate(date: string | Date): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}.${String(
    d.getMonth() + 1
  ).padStart(2, "0")}.${d.getFullYear()}`;
}

async function getImageBase64(uri: string): Promise<string> {
  const fileInfo = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileInfo;
}

export async function exportILRsToExcel(
  filteredILRs: ILR[],
  projectName: string,
  accountName: string,
  company: string // 👈 new param
) {
  try {
    if (!filteredILRs || filteredILRs.length === 0) {
      alert("No ILRs available to download");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ILRs");

    // --- ADD LOGO BASED ON COMPANY ---
    let logoPath;
    if (company.toLowerCase() === "wp") {
      logoPath = require("../assets/images/logoWP.png");
    } else if (company.toLowerCase() === "wal") {
      logoPath = require("../assets/images/logoWPicon.png");
    } else {
      logoPath = require("../assets/images/react-logo.png"); // fallback logo
    }

    const asset = Asset.fromModule(logoPath);
    await asset.downloadAsync(); // ensures file is loaded
    const base64Logo = await getImageBase64(asset.localUri || asset.uri);

    const imageId = workbook.addImage({
      base64: base64Logo,
      extension: "png",
    });

    worksheet.addImage(imageId, "A1:B5");

    // --- HEAD INFO --- (shifted a few rows to make space for logo)
    const infoRows = [
      `Project Name: ${projectName}`,
      `Printed Date: ${formatDate(new Date())}`,
      `Downloaded By: ${accountName}`,
    ];

    infoRows.forEach((text, i) => {
      const rowIndex = 1 + i; // rows 1,2,3
      const row = worksheet.getRow(rowIndex);

      // place info starting from column C
      row.values = [null, null, text]; // skip A & B (reserved for logo)
      worksheet.mergeCells(`C${rowIndex}:J${rowIndex}`);
      row.font = { bold: true };
      row.alignment = { vertical: "middle", horizontal: "left" };
      row.commit();
    });

    // worksheet.addRow([]); // spacing before headers

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
      "DELAY DAYS",
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
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
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
            }\nNew Target Date - ${formatDate(a.newValue ?? "")}`
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
        ilr.delayDays ?? 0,
        ...activityValues,
      ]);

      // Style status cell
      const statusCell = row.getCell(9);
      if (ilr.status.toLowerCase() === "open") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F87171" },
        };
        statusCell.font = { color: { argb: "FFFFFF" }, bold: true };
      } else if (ilr.status.toLowerCase() === "closed") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "4ADE80" },
        };
        statusCell.font = { color: { argb: "FFFFFF" }, bold: true };
      }

      activityValues.forEach((_, i) => {
        row.getCell(11 + i).alignment = { wrapText: true, vertical: "top" };
      });
    });

    // --- COLUMN WIDTHS ---
    const colWidths: Record<number, number> = {
      1: 6,
      2: 12,
      3: 14,
      4: 15,
      5: 30,
      6: 40,
      7: 30,
      8: 14,
      9: 12,
      10: 14,
    };
    worksheet.columns.forEach((col, idx) => {
      col.width = colWidths[idx + 1] ?? 30;
    });

    // --- SAVE FILE ---
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const fileUri = FileSystem.documentDirectory + "ILRs.xlsx";
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(fileUri, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Share ILRs Excel",
      UTI: "com.microsoft.excel.xlsx",
    });
  } catch (err) {
    console.error("❌ Error exporting Excel:", err);
    alert("Failed to export Excel");
  }
}
