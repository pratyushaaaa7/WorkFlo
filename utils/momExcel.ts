// import ExcelJS from "exceljs";
// import * as FileSystem from "expo-file-system";
// import * as Sharing from "expo-sharing";
// import { Buffer } from "buffer";
// import { Asset } from "expo-asset";

// // Types
// type Attendee = {
//   attendeeName: string;
//   designation: string;
//   organization: string;
//   role?: string;
//   email?: string;
//   phone?: string;
//   contactNumbers?: any;
// };

// // type Responsibility = { individualName: string; designation?: string };
// // type RaisedBy = { individualName: string; designation?: string };

// type Minute = {
//   serialNo: number;
//   issueSubject: string;
//   description: string;
//   raisedBy: {
//     _id: string;
//     name: string;
//   }[];
//   responsibility: {
//     _id: string;
//     name: string;
//   }[];
//   targetDate: string;
//   status: string; // "open" | "closed"
//   remarks?: string;
//   targetDateForInfo?: boolean;
//   responsibilityForInfo?: boolean;
// };

// type Meeting = {
//   projectName: string;
//   meetingNumber: string;
//   meetingDate: string;
//   meetingTime: string;
//   meetingVenue: string;
//   attendees: Attendee[];
//   minutes: Minute[];
// };

// export async function exportMinutesToExcel(
//   meeting: Meeting,
//   accountName: string,
//   projectName: string,
//   company: string
// ) {
//   try {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Meeting Details");

//     // --- ADD LOGO BASED ON COMPANY ---
//     let logoPath;
//     if (company.toLowerCase() === "wp") {
//       logoPath = require("../assets/images/logoWP.png");
//     } else if (company.toLowerCase() === "wal") {
//       logoPath = require("../assets/images/logoWAL.jpg");
//     } else {
//       logoPath = require("../assets/images/react-logo.png");
//     }

//     const asset = Asset.fromModule(logoPath);
//     await asset.downloadAsync();

//     const logoBase64 = await FileSystem.readAsStringAsync(asset.localUri!, {
//       encoding: FileSystem.EncodingType.Base64,
//     });

//     const logoId = workbook.addImage({
//       base64: logoBase64,
//       extension: "png",
//     });

//     // Place logo across A1:B4
//     worksheet.addImage(logoId, "A1:B6");

//     // --- Project Info beside logo (starting column C) ---
//     const info = [
//       ["Project Name", projectName],
//       ["Meeting Number", meeting.meetingNumber],
//       ["Meeting Date", new Date(meeting.meetingDate).toLocaleDateString()],
//       ["Time", meeting.meetingTime],
//       ["Venue", meeting.meetingVenue],
//       ["Minutes Prepared By", accountName],
//     ];

//     info.forEach((row, i) => {
//       worksheet.mergeCells(`C${i + 1}:E${i + 1}`);
//       const cell = worksheet.getCell(`C${i + 1}`);
//       cell.value = `${row[0]}: ${row[1]}`;
//       cell.font = { bold: true };
//       cell.alignment = { vertical: "middle", horizontal: "left" };
//     });

//     // --- Attendees Section ---
//     const attendeeTitle = worksheet.addRow(["Attendees"]);
//     attendeeTitle.font = { bold: true, size: 14 };
//     // attendeeTitle.alignment = { horizontal: "center" };

//     const attendeeHeader = worksheet.addRow([
//       "S.No",
//       "Name",
//       "Company",
//       "Designation",
//       "Email",
//       "Phone Number",
//     ]);

//     attendeeHeader.eachCell((cell) => {
//       cell.font = { bold: true };
//       cell.alignment = { horizontal: "center", vertical: "middle" };
//       cell.fill = {
//         type: "pattern",
//         pattern: "solid",
//         fgColor: { argb: "E0E0E0" }, // light gray
//       };
//     });

//     meeting.attendees.forEach((attendee, index) => {
//       worksheet.addRow([
//         index + 1,
//         attendee.attendeeName,
//         attendee.organization,
//         attendee.designation,
//         attendee.email || "",
//         attendee.contactNumbers?.join(", ") || "", // ✅ join array
//       ]);
//     });

//     worksheet.addRow([]);

//     // --- Minutes Section ---
//     const minutesTitle = worksheet.addRow(["Minutes of Meeting"]);
//     minutesTitle.font = { bold: true, size: 14 };
//     // minutesTitle.alignment = { horizontal: "center" };

//     const minutesHeader = worksheet.addRow([
//       "S.No",
//       "Raised By",
//       "Issue Subject",
//       "Issue Description",
//       "Responsibility",
//       "Target Date",
//       "Status",
//       "Meeting Discussions",
//     ]);

//     minutesHeader.eachCell((cell) => {
//       cell.font = { bold: true };
//       cell.alignment = { horizontal: "center", vertical: "middle" };
//       cell.fill = {
//         type: "pattern",
//         pattern: "solid",
//         fgColor: { argb: "E0E0E0" },
//       };
//     });

//     meeting.minutes.forEach((minute) => {
//       const row = worksheet.addRow([
//         minute.serialNo,
//         minute.raisedBy.map((r) => r.name).join(", "), // <-- use label
//         minute.issueSubject,
//         minute.description, // ✅ updated
//         minute.responsibilityForInfo
//           ? "For Information"
//           : minute.responsibility.map((r) => r.name).join(", "),

//         minute.targetDateForInfo
//           ? "For Information"
//           : new Date(minute.targetDate).toLocaleDateString(),
//         minute.status.toUpperCase(),
//         minute.remarks,
//       ]);

//       // Wrap text for Issue Description
//       row.getCell(4).alignment = { wrapText: true, vertical: "top" };

//       // Status coloring
//       const statusCell = row.getCell(7);
//       statusCell.alignment = { horizontal: "center" };
//       if (minute.status.toLowerCase() === "open") {
//         statusCell.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "FFCCCC" }, // red
//         };
//       } else {
//         statusCell.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "CCFFCC" }, // green
//         };
//       }

//       // Increase row height if description is long
//       if (minute.description.length > 80) {
//         row.height = 60;
//       }
//     });

//     // --- Notes Section ---
//     worksheet.addRow([]);
//     const notesRow = worksheet.addRow(["Notes:"]);
//     notesRow.getCell(1).font = { bold: true };
//     notesRow.getCell(1).alignment = { vertical: "top", horizontal: "left" };

//     // Note a.
//     const noteARow = worksheet.addRow([
//       "a.",
//       "Should there be no action date mentioned in the points listed above, then it should be assumed that the same is expected from the responsible agency/person for everyone's information.",
//     ]);
//     noteARow.getCell(1).alignment = { vertical: "top", horizontal: "left" };
//     noteARow.getCell(2).alignment = {
//       //   wrapText: true,
//       vertical: "top",
//       horizontal: "left",
//     };
//     // noteARow.height = 40;

//     // Note b.
//     const noteBRow = worksheet.addRow([
//       "b.",
//       "Kindly provide your respective observations/acknowledgements/suggested alterations on the above listed minutes within 24 hrs of the receival of this email or else the same will be deemed approved and accepted.",
//     ]);
//     noteBRow.getCell(1).alignment = { vertical: "top", horizontal: "left" };
//     noteBRow.getCell(2).alignment = {
//       //   wrapText: true,
//       vertical: "top",
//       horizontal: "left",
//     };
//     // noteBRow.height = 60;

//     // --- Optimized Column Widths ---
//     const widths = [5, 20, 25, 50, 34, 25, 12];
//     worksheet.columns.forEach((col, i) => {
//       col.width = widths[i] || 20;
//     });

//     // Save & Share
//     const buffer = await workbook.xlsx.writeBuffer();
//     const fileUri =
//       FileSystem.documentDirectory + `Meeting_${meeting.meetingNumber}.xlsx`;

//     await FileSystem.writeAsStringAsync(
//       fileUri,
//       Buffer.from(buffer).toString("base64"),
//       { encoding: FileSystem.EncodingType.Base64 }
//     );

//     if (await Sharing.isAvailableAsync()) {
//       await Sharing.shareAsync(fileUri, {
//         mimeType:
//           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//         dialogTitle: "Export Meeting Minutes",
//         UTI: "com.microsoft.excel.xlsx",
//       });
//     }
//   } catch (err) {
//     console.error("Error exporting Excel", err);
//   }
// }
