import ExcelJS from "exceljs";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Buffer } from "buffer";
import { Asset } from "expo-asset";

// Types
type Attendee = {
  attendeeName: string;
  designation: string;
  organization: string;
  role?: string;
  email?: string;
  phone?: string;
};

type Responsibility = { individualName: string; designation?: string };
type RaisedBy = { individualName: string; designation?: string };

type Minute = {
  serialNo: number;
  issueSubject: string;
  issueDescription: string;
  raisedBy: RaisedBy[];
  responsibility: Responsibility[];
  targetDate: string;
  status: string; // "open" | "closed"
  remarks?: string;
};

type Meeting = {
  projectName: string;
  meetingNumber: string;
  meetingDate: string;
  meetingTime: string;
  meetingVenue: string;
  attendees: Attendee[];
  minutes: Minute[];
};

export async function exportMinutesToExcel(
  meeting: Meeting,
  accountName: string,
  projectName: string,
  company: string
) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Meeting Details");

    // --- ADD LOGO BASED ON COMPANY ---
    let logoPath;
    if (company.toLowerCase() === "wp") {
      logoPath = require("../assets/images/logoWP.png");
    } else if (company.toLowerCase() === "wal") {
      logoPath = require("../assets/images/logoWPicon.png");
    } else {
      logoPath = require("../assets/images/react-logo.png"); // fallback logo
    }

    // Resolve asset into a real local file

    const asset = Asset.fromModule(logoPath);
    await asset.downloadAsync(); // ensures file is loaded

    // Read it as base64
    const logoBase64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Add image to workbook
    const logoId = workbook.addImage({
      base64: logoBase64,
      extension: "png",
    });

    // Place image at top-left
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 120, height: 60 },
    });

    // --- Project Info beside logo (C column) ---
    const info = [
      ["Project Name", projectName],
      ["Meeting Number", meeting.meetingNumber],
      ["Meeting Date", new Date(meeting.meetingDate).toLocaleDateString()],
      ["Time", meeting.meetingTime],
      ["Venue", meeting.meetingVenue],
      ["Minutes Prepared By", accountName],
    ];

    info.forEach((row, i) => {
      // Place text in column C, starting at row 1 (beside logo)
      worksheet.mergeCells(`C${i + 1}:D${i + 1}`);
      const cell = worksheet.getCell(`C${i + 1}`);
      cell.value = `${row[0]}: ${row[1]}`;
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });

    // Add a couple of empty rows after header section
    worksheet.addRow([]);
    worksheet.addRow([]);

    // --- Attendees Section ---
    worksheet.addRow(["Attendees"]);
    const attendeeHeader = worksheet.addRow([
      "S.No",
      "Name",
      "Role",
      "Company",
      "Designation",
      "Email",
      "Phone Number",
    ]);

    attendeeHeader.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D3D3D3" }, // gray background
      };
    });

    meeting.attendees.forEach((attendee, index) => {
      worksheet.addRow([
        index + 1,
        attendee.attendeeName,
        attendee.role || "",
        attendee.organization,
        attendee.designation,
        attendee.email || "",
        attendee.phone || "",
      ]);
    });

    worksheet.addRow([]);

    // --- Minutes Section ---
    worksheet.addRow(["Minutes of Meeting"]);
    const minutesHeader = worksheet.addRow([
      "S.No",
      "Raised By",
      "Issue Subject",
      "Issue Description",
      "Responsibility",
      "Target Date",
      "Status",
    ]);

    minutesHeader.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D3D3D3" }, // gray background
      };
    });

    meeting.minutes.forEach((minute) => {
      const row = worksheet.addRow([
        minute.serialNo,
        minute.raisedBy.map((r) => r.individualName).join(", "),
        minute.issueSubject,
        minute.issueDescription,
        minute.responsibility.map((r) => r.individualName).join(", "),
        new Date(minute.targetDate).toLocaleDateString(),
        minute.status.toUpperCase(),
      ]);

      // Conditional row background for Status
      //   if (minute.status.toLowerCase() === "open") {
      //     row.eachCell((cell) => {
      //       cell.fill = {
      //         type: "pattern",
      //         pattern: "solid",
      //         fgColor: { argb: "FFCCCC" }, // light red
      //       };
      //     });
      //   } else if (minute.status.toLowerCase() === "closed") {
      //     row.eachCell((cell) => {
      //       cell.fill = {
      //         type: "pattern",
      //         pattern: "solid",
      //         fgColor: { argb: "CCFFCC" }, // light green
      //       };
      //     });
      //   }

      // Conditional background for Status cell only
      const statusCell = row.getCell(7); // 7th column is "Status"
      if (minute.status.toLowerCase() === "open") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFCCCC" }, // light red
        };
      } else if (minute.status.toLowerCase() === "closed") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "CCFFCC" }, // light green
        };
      }
    });

    // Auto column widths
    worksheet.columns.forEach((col) => {
      let maxLength = 20;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const len = cell.value ? cell.value.toString().length : 10;
        if (len > maxLength) maxLength = len;
      });
      col.width = maxLength + 2;
    });

    // Save to file
    const buffer = await workbook.xlsx.writeBuffer();
    const fileUri =
      FileSystem.documentDirectory + `Meeting_${meeting.meetingNumber}.xlsx`;

    await FileSystem.writeAsStringAsync(
      fileUri,
      Buffer.from(buffer).toString("base64"),
      { encoding: FileSystem.EncodingType.Base64 }
    );

    // Share
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Export Meeting Minutes",
        UTI: "com.microsoft.excel.xlsx",
      });
    } else {
      alert("Sharing not available on this device");
    }
  } catch (err) {
    console.error("Error exporting Excel", err);
  }
}
