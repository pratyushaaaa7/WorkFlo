import { Buffer } from "buffer";
import ExcelJS from "exceljs";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import moment from "moment";

/**
 * Utility to export App Support tickets to Excel
 */
export async function exportSupportToExcel(tickets: any[]) {
  try {
    if (!tickets || tickets.length === 0) {
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("App Support Tickets");

    // --- HEADERS ---
    const headers = [
      "Ticket Number",
      "Title",
      "Description",
      "Status (Open/Closed)",
      "Publish Status",
      "Raised By",
      "Created Date",
      "Remark by Dev",
    ];

    const headerRow = worksheet.addRow(headers);

    // Style Header Row
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "5B4CCC" }, // Premium Purple from your UI
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // --- DATA ROWS ---
    tickets.forEach((item) => {
      const row = worksheet.addRow([
        item.ticketId || "N/A",
        item.relatedPage || "N/A",
        item.description || "N/A",
        item.fixed ? "Closed" : "Open",
        item.published ? "Published" : "Unpublished",
        item.raisedBy?.fullName || "Unknown",
        item.createdAt ? moment(item.createdAt).format("DD MMM YYYY") : "N/A",
        item.remark || "N/A",
      ]);

      // Center alignment for some columns
      [1, 4, 5, 7].forEach((colIdx) => {
        row.getCell(colIdx).alignment = { horizontal: "center" };
      });

      // Wrap text for description and remark
      row.getCell(3).alignment = { wrapText: true, vertical: "middle" };
      row.getCell(8).alignment = { wrapText: true, vertical: "middle" };
    });

    // --- COLUMN WIDTHS ---
    worksheet.columns = [
      { width: 15 }, // Ticket ID
      { width: 25 }, // Title
      { width: 50 }, // Description
      { width: 15 }, // Status
      { width: 15 }, // Publish
      { width: 20 }, // Raised By
      { width: 15 }, // Date
      { width: 40 }, // Remark by Dev
    ];

    // --- SAVE & SHARE ---
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `AppSupport_Tickets_${moment().format("DDMMYYYY_HHmm")}.xlsx`;
    const fileUri = FileSystem.cacheDirectory + fileName;

    await FileSystem.writeAsStringAsync(
      fileUri,
      Buffer.from(buffer).toString("base64"),
      { encoding: FileSystem.EncodingType.Base64 },
    );

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Download Support Tickets Excel",
        UTI: "com.microsoft.excel.xlsx",
      });
    }
  } catch (err) {
    console.error("❌ Error exporting Support Excel:", err);
  }
}
