// excelExporter.ts
import ExcelJS from "exceljs";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// 👇 Define the types if you want strong typing
type Responsibility = { individualName: string; designation: string };
type Activity = {
  fieldChanged: string;
  createdAt: string;
  note?: string;
  newValue?: string;
};

export type ILR = {
  ilrNumber: number; // match your actual model
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
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
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

    // --- TOP INFO ROWS ---
    worksheet.addRow([`Project Name: ${projectName}`]);
    worksheet.addRow([`Printed Date: ${formatDate(new Date())}`]);
    worksheet.addRow([`Downloaded By: ${accountName}`]);
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
      cell.alignment = { vertical: "middle", horizontal: "center" };
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
        row.getCell(10 + i).alignment = {
          wrapText: true,
          vertical: "top",
        };
      });
    });

    // --- AUTO WIDTH ---
    worksheet.columns.forEach((col) => {
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, val.length);
      });
      col.width = maxLength + 2;
    });

    // --- SAVE FILE ---
    const buffer = await workbook.xlsx.writeBuffer();
    const bytes = new Uint8Array(buffer);

    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = global.btoa
      ? global.btoa(binary)
      : Buffer.from(binary).toString("base64");

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
    console.error("Error exporting Excel:", err);
    alert("Failed to export Excel");
  }
}


// const handleDownloadExcel = async () => {
//   try {
//     if (!ilrs || ilrs.length === 0) {
//       alert("No ILRs available to download");
//       return;
//     }

//     // Prepare data
//     //       const worksheetData = parsedILRs.map((ilr, index) => ({
//     //         "S. NO": index + 1,
//     //         "ISSUE NUMBER": ilr.ilrNumber,
//     //         "DATE OF ISSUE": new Date(ilr.createdAt).toLocaleDateString(),
//     //         "RAISED BY": ilr.createdBy?.username || "N/A",
//     //         "ISSUE SUBJECT": ilr.description,
//     //         "ISSUE DESCRIPTION": ilr.remarks || "No remarks",
//     //         RESPONSIBILITY: ilr.responsibility
//     //           .map((r) => `${r.individualName} (${r.designation})`)
//     //           .join(", "),
//     //         "TARGET DATE": new Date(ilr.targetDate).toLocaleDateString(),
//     //         STATUS: ilr.status,
//     //         NOTE: ilr.activities
//     //           .filter((a: any) => a.fieldChanged === "targetDate") // only target date changes
//     //           .map((a: any) => {
//     //             return `Date - ${new Date(a.createdAt).toLocaleDateString()}
//     // Note - ${a.note || "N/A"}
//     // New Target Date - ${a.newValue}`;
//     //           })
//     //           .join("\n\n"), // add extra line between activities for readability
//     //       }));

//     const maxActivities = Math.max(
//       ...filteredILRs.map(
//         (ilr) =>
//           (ilr.activities ?? []).filter(
//             (a) => a.fieldChanged === "targetDate"
//           ).length
//       )
//     );

//     const worksheetData = filteredILRs.map((ilr, index) => {
//       const targetDateActivities = (ilr.activities ?? []).filter(
//         (a: any) => a.fieldChanged === "targetDate"
//       );

//       const activityColumns: Record<string, string> = {};

//       for (let i = 0; i < maxActivities; i++) {
//         const activity = targetDateActivities[i];
//         activityColumns[`Activity ${i + 1}`] = activity
//           ? `Date - ${new Date(
//               activity.createdAt
//             ).toLocaleDateString()}\r\nNote - ${
//               activity.note || "N/A"
//             }\r\nNew Target Date - ${activity.newValue}`
//           : "";
//       }

//       return {
//         "S. NO": index + 1,
//         "ISSUE NUMBER": ilr.ilrNumber,
//         "DATE OF ISSUE": new Date(ilr.createdAt).toLocaleDateString(),
//         "RAISED BY": ilr.createdBy?.username || "N/A",
//         "ISSUE SUBJECT": ilr.description,
//         "ISSUE DESCRIPTION": ilr.remarks || "No remarks",
//         RESPONSIBILITY: ilr.responsibility
//           .map((r) => `${r.individualName} (${r.designation})`)
//           .join(", "),
//         "TARGET DATE": new Date(ilr.targetDate).toLocaleDateString(),
//         STATUS: ilr.status,
//         ...activityColumns, // spread each activity as its own column
//       };
//     });

//     // Create worksheet & workbook
//     const worksheet = XLSX.utils.json_to_sheet(worksheetData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "ILRs");

//     // Convert to binary
//     const excelBuffer = XLSX.write(workbook, {
//       type: "base64",
//       bookType: "xlsx",
//     });

//     // Save to device
//     const filename = FileSystem.documentDirectory + "ILRs.xlsx";
//     await FileSystem.writeAsStringAsync(filename, excelBuffer, {
//       encoding: FileSystem.EncodingType.Base64,
//     });

//     // Share
//     await Sharing.shareAsync(filename, {
//       mimeType:
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       dialogTitle: "Share ILRs Excel",
//       UTI: "com.microsoft.excel.xlsx",
//     });
//   } catch (err) {
//     console.error("Error exporting Excel:", err);
//     alert("Failed to export Excel");
//   }
// };
