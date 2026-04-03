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
  vendors?: any[];
  totalLabor?: number;
  totalSkilled?: number;
  totalUnskilled?: number;
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
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; }
        .page { padding: 10px; width: 100%; min-height: 100%; position: relative; }
        
        /* Shared Header Styles */
        .page-header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .page-header-table td { border: none; vertical-align: middle; padding: 5px 0; }
        .header-left { font-size: 12px; line-height: 1.4; color: #555; }
        .header-left strong { color: #000; }
        .header-right { text-align: right; width: 150px; }
        .header-right img { width: 120px; max-height: 60px; object-fit: contain; display: block; margin: 0 0 0 auto; }
        
        /* Standard Tables */
        .content-table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; }
        .content-table th, .content-table td { border: 1px solid #ccc; padding: 8px 10px; font-size: 12px; text-align: left; }
        .content-table th { background-color: #f8f9fa; font-weight: bold; color: #000; }
        .content-table td { white-space: pre-wrap; word-wrap: break-word; }
        
        /* Photo Layout (60% height) */
        .image-container-60 { 
            width: 100%; 
            height: 55vh; /* Approximately 60% of viewport/page height in some contexts, but let's use fixed pt for PDF stability */
            height: 480pt; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background: #fff; 
            overflow: hidden; 
            margin-bottom: 20px; 
        }
        .image-container-60 img { max-width: 100%; max-height: 100%; object-fit: contain; }
        
        .point-details { margin-top: 10px; padding: 15px; background: #fefefe; border: 1px solid #eee; border-radius: 4px; }
        .point-details h4 { margin: 0 0 10px 0; color: #000; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .point-details p { margin: 5px 0; font-size: 14px; line-height: 1.5; }
        .point-details strong { width: 120px; display: inline-block; color: #666; }

        h2 { border-bottom: 2px solid #5B4CCC; padding-bottom: 8px; margin-top: 0; color: #000; }
        h3 { margin-top: 25px; color: #333; font-size: 16px; border-left: 4px solid #5B4CCC; padding-left: 10px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 5px; font-size: 14px; }
      </style>
    `;
  }

  private renderHeader() {
    const { projectName, createdBy, logoBase64 } = this.config;
    return `
      <table class="page-header-table">
        <tr>
          <td class="header-left">
            <div><strong>Project:</strong> ${projectName || "N/A"}</div>
            <div><strong>Created By:</strong> ${createdBy || "N/A"}</div>
          </td>
          <td class="header-right">
            <img src="${logoBase64}" />
          </td>
        </tr>
      </table>
    `;
  }

  addCoverPage(data: CoverPageData) {
    const { projectName, createdBy, company } = this.config;
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    // Page 1: Project Info
    this.pages.push(`
      <div class="page">
        ${this.renderHeader()}
        <h2>Project Information</h2>
        <div style="margin-top: 20px;">
            <p><strong>Project Name:</strong> ${projectName || ""}</p>
            <p><strong>Created By:</strong> ${createdBy}</p>
            <p><strong>Company:</strong> ${company || ""}</p>
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Time:</strong> ${timeStr}</p>
        </div>
        
        <h3>Team Leaders</h3>
        <ul>${data.leaders.length > 0 ? data.leaders.map((l: any) => `<li>${l.fullName}</li>`).join("") : "<li>None</li>"}</ul>
        
        <h3>Team Members</h3>
        <ul>${data.members.length > 0 ? data.members.map((m: any) => `<li>${m.fullName}</li>`).join("") : "<li>None</li>"}</ul>
      </div>
    `);

    // Page 2: Attendees & SVR (No images only)
    if (data.mode === "svr") {
      const attendeesHtml = `
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
      `;

      // Filter entries that DON'T have images
      const textOnlyEntries = (data.svrEntries || []).filter(v => !v.base64 && (!v.images || v.images.length === 0));
      
      const svrTableHtml = `
          <h2 style="margin-top: 30px;">Site Visit Report</h2>
          <table class="content-table">
            <tr><th>S.No</th><th>Agenda</th><th>Discussion</th><th>Responsibility</th></tr>
            ${textOnlyEntries.length > 0 
              ? textOnlyEntries.map((v: any, idx: number) => `
                <tr><td>${idx + 1}</td><td>${v.agenda || "-"}</td><td>${v.discussion || "-"}</td><td>${v.responsibility || "-"}</td></tr>
              `).join("")
              : "<tr><td colspan='4' style='text-align:center;'>No text-only entries</td></tr>"
            }
          </table>
      `;

      this.pages.push(`
        <div class="page">
          ${this.renderHeader()}
          ${attendeesHtml}
          ${svrTableHtml}
        </div>
      `);

      // Handle entries WITH images (Each gets its own page)
      const withImageEntries = (data.svrEntries || []).filter(v => v.base64 || (v.images && v.images.length > 0));
      for (const entry of withImageEntries) {
          const imgSource = entry.base64 || (entry.images && entry.images[0]);
          if (!imgSource) continue;

          this.pages.push(`
            <div class="page">
              ${this.renderHeader()}
              <h2>Discussion Point #${entry.serialNo || ""}</h2>
              <div class="image-container-60">
                <img src="${imgSource}" />
              </div>
              <div class="point-details">
                <p><strong>Agenda:</strong> ${entry.agenda || "-"}</p>
                <p><strong>Discussion:</strong> ${entry.discussion || "-"}</p>
                <p><strong>Responsibility:</strong> ${entry.responsibility || "-"}</p>
              </div>
            </div>
          `);
      }
    } else if (data.mode === "case-study") {
      this.pages.push(`
        <div class="page">
          ${this.renderHeader()}
          <h2 style="text-align:center; margin-top:20px;">Case Study Remarks</h2>
          <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 16px; line-height: 1.6; margin: 0; padding: 10px 0; font-family: Arial, sans-serif;">${data.caseStudyRemarks || ""}</pre>
        </div>
      `);
    } else if (data.mode === "dpr") {
      this.pages.push(`
        <div class="page">
          ${this.renderHeader()}
          <h2 style="margin-top:20px;">Labor Report</h2>
          <table class="content-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Vendor Name</th>
                <th>Expertise</th>
                <th>Skilled</th>
                <th>Unskilled</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                (data.vendors || []).length > 0
                  ? (data.vendors || [])
                      .map(
                        (v: any, idx: number) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${v.name || "-"}</td>
                  <td>${v.expertise || "-"}</td>
                  <td>${v.skillLabor || 0}</td>
                  <td>${v.unskillLabor || 0}</td>
                  <td>${(Number(v.skillLabor) || 0) + (Number(v.unskillLabor) || 0)}</td>
                </tr>
              `,
                      )
                      .join("")
                  : "<tr><td colspan='6' style='text-align:center;'>No labor recorded</td></tr>"
              }
              <tr style="font-weight:bold; background-color: #f0f0f0;">
                <td colspan="3" style="text-align:right;">Grand Totals</td>
                <td>${data.totalSkilled || 0}</td>
                <td>${data.totalUnskilled || 0}</td>
                <td>${data.totalLabor || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `);
    }
  }

  addPhotoPage(photo: PhotoData) {
    this.pages.push(`
      <div class="page">
        ${this.renderHeader()}
        <h2>Report Image</h2>
        <div class="image-container-60">
            <img src="${photo.base64}" />
        </div>
        <div class="point-details">
            <p><strong>Caption:</strong> ${photo.caption?.trim() || "-"}</p>
        </div>
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
