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

type RaisedBy = { individualName: string; designation?: string };

type MinuteItem = {
  serialNo: number;
  issueSubject: string;
  issueDescription?: string;
  raisedBy: RaisedBy[];
  responsibility: string[];
  targetDate: string;
  status: string;
};

type Meeting = {
  projectName: string;
  meetingNumber: string;
  meetingDate: string;
  meetingTime: string;
  meetingVenue: string;
  attendees: Attendee[];
  minutes?: MinuteItem[]; // ✅ add this
};

export async function exportAgendaWithAttendees(
  meeting: Meeting,
  accountName: string,
  projectName: string,
  company: string
) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Meeting Details");

    // --- Add Company Logo ---
    let logoPath;
    if (company.toLowerCase() === "wp") {
      logoPath = require("../assets/images/logoWP.png");
    } else if (company.toLowerCase() === "wal") {
      logoPath = require("../assets/images/logoWPicon.png");
    } else {
      logoPath = require("../assets/images/react-logo.png");
    }

    const asset = Asset.fromModule(logoPath);
    await asset.downloadAsync();
    const logoBase64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const logoId = workbook.addImage({
      base64: logoBase64,
      extension: "png",
    });

    worksheet.addImage(logoId, "A1:B6");

    // --- Project Info ---
    const info = [
      ["Project Name", projectName],
      ["Meeting Number", meeting.meetingNumber],
      ["Meeting Date", new Date(meeting.meetingDate).toLocaleDateString()],
      ["Time", meeting.meetingTime],
      ["Venue", meeting.meetingVenue],
      ["Minutes Prepared By", accountName],
    ];

    info.forEach((row, i) => {
      worksheet.mergeCells(`C${i + 1}:E${i + 1}`);
      const cell = worksheet.getCell(`C${i + 1}`);
      cell.value = `${row[0]}: ${row[1]}`;
      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });

    // --- Attendees Section ---
    worksheet.addRow([]);
    const attendeeTitle = worksheet.addRow(["Attendees"]);
    attendeeTitle.font = { bold: true, size: 14 };

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
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "E0E0E0" },
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

    // --- Agenda Section ---
    // --- Minutes / Agenda Section ---
    const minutesTitle = worksheet.addRow(["Agenda"]);
    minutesTitle.font = { bold: true, size: 14 };

    const minutesHeader = worksheet.addRow([
      "S.No",
      "Agenda / Issue Subject",
      "Raised By",
    ]);
    minutesHeader.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "E0E0E0" },
      };
    });

    meeting.minutes?.forEach((item) => {
      const row = worksheet.addRow([
        item.serialNo,
        item.issueSubject,
        item.raisedBy.map((r) => r.individualName || r).join(", "),
      ]);
      row.getCell(2).alignment = { wrapText: true, vertical: "top" };
      row.getCell(3).alignment = { wrapText: true, vertical: "top" };
    });
    // --- Column widths ---
    const widths = [5, 50, 30, 20, 25, 25, 15]; // attendee + agenda columns
    worksheet.columns.forEach((col, i) => {
      col.width = widths[i] || 20;
    });

    // --- Save & Share ---
    const buffer = await workbook.xlsx.writeBuffer();
    const fileUri =
      FileSystem.documentDirectory +
      `Meeting_${meeting.meetingNumber}_agenda.xlsx`;

    await FileSystem.writeAsStringAsync(
      fileUri,
      Buffer.from(buffer).toString("base64"),
      { encoding: FileSystem.EncodingType.Base64 }
    );

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Export Meeting Agenda",
        UTI: "com.microsoft.excel.xlsx",
      });
    }
  } catch (err) {
    console.error("Error exporting Excel", err);
  }
}
