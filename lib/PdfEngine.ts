import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
// Use the minified bundle to avoid Metro resolution issues with internal modules
// @ts-ignore
import { PDFDocument } from "pdf-lib/dist/pdf-lib.min.js";

export interface PdfEngineConfig {
  projectName: string;
  createdBy: string;
  company: string;
  logoBase64: string;
}

export interface CoverPageData {
  leaders: any[];
  members: any[];
  mode: string;
  attendees?: any[];
  svrEntries?: any[];
  caseStudyRemarks?: string;
}

export interface PhotoData {
  base64: string;
  caption: string;
}

export class PdfEngine {
  private pages: string[] = [];
  private config: PdfEngineConfig;

  constructor(config: PdfEngineConfig) {
    this.config = config;
  }

  private getStyles() {
    return `
      <style>
        @page { size: A4 portrait; margin: 20px; }
        * { -webkit-print-color-adjust: exact; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .page { padding: 10px; width: 100%; }
        
        /* Shared Header Styles */
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: none; }
        .header-table th, .header-table td { border: none; padding: 0; background: none; vertical-align: top; }
        .header-left { font-size: 14px; font-weight: bold; text-align: left; }
        .header-right { text-align: right; }
        .header-right img { width: 160px; object-fit: contain; }
        
        /* Standard Tables */
        .content-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .content-table th, .content-table td { border: 1px solid #999; padding: 4px 6px; font-size: 13px; text-align: left; background: none; }
        .content-table th { background-color: #f0f0f0; }
        .content-table td { white-space: pre-wrap; word-wrap: break-word; }
        
        /* Photo Layout (Repeating Headers) */
        table.photo-layout { width: 100%; border-collapse: collapse; border: none; }
        table.photo-layout th, table.photo-layout td { border: none; padding: 0; background: none; text-align: left; }
        thead.photo-header { display: table-header-group; }
        
        .image-container { width: 100%; height: 500pt; border: 2px solid #000; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #fff; overflow: hidden; margin-bottom: 15px; page-break-inside: avoid; }
        .image-container img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .caption { font-size: 16px; color: #333; word-wrap: break-word; white-space: pre-wrap; margin-top: 10px; line-height: 1.5; }
      </style>
    `;
  }

  addCoverPage(data: CoverPageData) {
    const { projectName, createdBy, company, logoBase64 } = this.config;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    // Page 1: Project Info
    this.pages.push(`
      <div class="page">
        <table class="header-table">
          <tr>
            <td class="header-left"></td>
            <td class="header-right">
              <img src="${logoBase64}" />
            </td>
          </tr>
        </table>
        <h2>Project Information</h2>
        <p><strong>Project Name:</strong> ${projectName || ""}</p>
        <p><strong>Created By:</strong> ${createdBy}</p>
        <p><strong>Company:</strong> ${company || ""}</p>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Time:</strong> ${timeStr}</p>
        <h3 style="margin-top: 30px;">Team Leaders</h3>
        <ul>${data.leaders.length > 0 ? data.leaders.map((l: any) => `<li>${l.fullName}</li>`).join("") : "<li>None</li>"}</ul>
        <h3 style="margin-top: 20px;">Team Members</h3>
        <ul>${data.members.length > 0 ? data.members.map((m: any) => `<li>${m.fullName}</li>`).join("") : "<li>None</li>"}</ul>
      </div>
    `);

    // Page 2: Details based on mode
    if (data.mode === "svr") {
      this.pages.push(`
        <div class="page">
          <table class="header-table">
            <tr>
              <td class="header-left">
                <div style="margin-bottom: 4px;"><strong>Project:</strong> ${projectName || ""}</div>
                <div><strong>Created By:</strong> ${createdBy || ""}</div>
              </td>
              <td class="header-right">
                <img src="${logoBase64}" />
              </td>
            </tr>
          </table>
          <h2 style="margin-top:20px;">Attendees</h2>
          <table class="content-table">
            <tr><th>S.No</th><th>Name</th><th>Designation</th><th>Company</th><th>Email</th></tr>
            ${
              (data.attendees || []).length > 0
                ? (data.attendees || [])
                    .map(
                      (a: any, idx: number) => `
              <tr><td>${idx + 1}</td><td>${a.attendeeName || "-"}</td><td>${a.designation || "-"}</td><td>${a.organization || "-"}</td><td>${a.email || "-"}</td></tr>
            `,
                    )
                    .join("")
                : "<tr><td colspan='5' style='text-align:center;'>No attendees recorded</td></tr>"
            }
          </table>
          <h2 style="margin-top: 30px;">Site Visit Report</h2>
          <table class="content-table">
            <tr><th>S.No</th><th>Agenda</th><th>Discussion</th><th>Responsibility</th><th>Remarks</th></tr>
            ${(data.svrEntries || [])
              .map(
                (v: any, idx: number) => `
              <tr><td>${idx + 1}</td><td>${v.agenda || "-"}</td><td>${v.discussion || "-"}</td><td>${v.responsibility || "-"}</td><td>${v.remarks || "-"}</td></tr>
            `,
              )
              .join("")}
          </table>
        </div>
      `);
    } else if (data.mode === "case-study") {
      this.pages.push(`
        <div class="page">
          <table class="header-table">
            <tr>
              <td class="header-left">
                <div style="margin-bottom: 4px;"><strong>Project:</strong> ${projectName || ""}</div>
                <div><strong>Created By:</strong> ${createdBy || ""}</div>
              </td>
              <td class="header-right">
                <img src="${logoBase64}" />
              </td>
            </tr>
          </table>
          <h2 style="text-align:center; margin-top:20px;">Case Study Remarks</h2>
          <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 16px; line-height: 1.6; margin: 0; padding: 10px 0; font-family: Arial, sans-serif;">${data.caseStudyRemarks || ""}</pre>
        </div>
      `);
    }
  }

  addPhotoPage(photo: PhotoData) {
    const { projectName, createdBy, logoBase64 } = this.config;
    this.pages.push(`
      <div class="page">
        <table class="photo-layout">
          <thead class="photo-header">
            <tr>
              <th>
                <table class="header-table">
                  <tr>
                    <td class="header-left">
                      <div style="margin-bottom: 4px;"><strong>Project:</strong> ${projectName || ""}</div>
                      <div><strong>Created By:</strong> ${createdBy || ""}</div>
                    </td>
                    <td class="header-right">
                      <img src="${logoBase64}" />
                    </td>
                  </tr>
                </table>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="image-container"><img src="${photo.base64}" /></div>
                <div class="caption"><p>${photo.caption?.trimStart() || ""}</p></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `);
  }

  async finalize(): Promise<string> {
    const mergedPdf = await PDFDocument.create();

    for (const pageHtml of this.pages) {
      const html = `
        <html>
          <head>${this.getStyles()}</head>
          <body>${pageHtml}</body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      const pdfBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const pdfDoc = await PDFDocument.load(pdfBase64);
      const copiedPages = await mergedPdf.copyPages(
        pdfDoc,
        pdfDoc.getPageIndices(),
      );
      copiedPages.forEach((page: any) => mergedPdf.addPage(page));

      // Cleanup individual page PDF
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }

    const finalBase64 = await mergedPdf.saveAsBase64();
    const finalUri = `${FileSystem.documentDirectory}merged_${Date.now()}.pdf`;

    await FileSystem.writeAsStringAsync(finalUri, finalBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return finalUri;
  }
}
