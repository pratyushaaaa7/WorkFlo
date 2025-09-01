import ExcelJS from "exceljs";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Buffer } from "buffer";

// Types for clarity (optional, adjust based on your backend shape)
type Attendee = {
  attendeeName: string;
  designation: string;
  organization: string;
  phone: string;
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
  status: string;
  remarks?: string;
};

type Meeting = {
  meetingNumber: string;
  meetingDate: string;
  meetingTime: string;
  meetingVenue: string;
  attendees: Attendee[];
  minutes: Minute[];
};

export async function exportMinutesToExcel(meeting: Meeting) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Meeting Details");

    // --- Header ---
    worksheet.mergeCells("A1", "E1");
    worksheet.getCell("A1").value = `Meeting #${meeting.meetingNumber}`;
    worksheet.getCell("A1").font = { size: 16, bold: true };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.addRow([]);
    worksheet.addRow([
      "Date",
      new Date(meeting.meetingDate).toLocaleDateString(),
      "Time",
      meeting.meetingTime,
    ]);
    worksheet.addRow(["Venue", meeting.meetingVenue]);
    worksheet.addRow([]);

    // --- Attendees Section ---
    worksheet.addRow(["Attendees"]).font = { bold: true };
    worksheet.addRow([
      "Name",
      "Designation",
      "Organization",
      "Phone",
    ]).font = { bold: true };

    meeting.attendees.forEach((attendee) => {
      worksheet.addRow([
        attendee.attendeeName,
        attendee.designation,
        attendee.organization,
        attendee.phone,
      ]);
    });

    worksheet.addRow([]);
    worksheet.addRow(["Minutes of Meeting"]).font = { bold: true };
    worksheet.addRow([
      "S.No",
      "Subject",
      "Description",
      "Raised By",
      "Responsible",
      "Target Date",
      "Status",
      "Remarks",
    ]).font = { bold: true };

    meeting.minutes.forEach((minute) => {
      worksheet.addRow([
        minute.serialNo,
        minute.issueSubject,
        minute.issueDescription,
        minute.raisedBy.map((r) => r.individualName).join(", "),
        minute.responsibility.map((r) => r.individualName).join(", "),
        new Date(minute.targetDate).toLocaleDateString(),
        minute.status.toUpperCase(),
        minute.remarks || "",
      ]);
    });

    // Adjust column widths
    worksheet.columns.forEach((col) => {
      col.width = 20;
    });

    // Save to file
    const buffer = await workbook.xlsx.writeBuffer();
    const fileUri = FileSystem.documentDirectory + `Meeting_${meeting.meetingNumber}.xlsx`;
    await FileSystem.writeAsStringAsync(fileUri, Buffer.from(buffer).toString("base64"), {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
