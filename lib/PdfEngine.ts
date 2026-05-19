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
  partnerInCharge?: any[];
  attendees?: any[];
  svrEntries?: any[];
  caseStudyRemarks?: string;
  vendors?: any[];
  totalLabor?: number;
  totalSkilled?: number;
  totalUnskilled?: number;
  totalStaff?: number;
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
        @page { size: A4 portrait; margin: 0; }
        * { -webkit-print-color-adjust: exact; box-sizing: border-box; }
        html, body { height: 100%; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; color: #333; }
        .page { 
          padding: 8px 8px 20px 8px; 
          width: 100%; 
          height: 100vh; 
          position: relative; 
          display: flex;
          flex-direction: column;
        }
        
        /* Shared Header Styles */
        .page-header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .page-header-table td { border: none; vertical-align: middle; padding: 5px 0; }
        .header-left { font-size: 12px; line-height: 1.4; color: #555; }
        .header-left strong { color: #000; }
        .header-right { text-align: right; width: 250px; }
        .header-right img { width: 240px; max-height: 120px; object-fit: contain; display: block; margin: 0 0 0 auto; }
        
        /* Footer Styles */
        .page-footer {
          position: absolute;
          bottom: 10px;
          left: 8px;
          right: 8px;
          text-align: right;
        }
        .page-footer hr {
          border: 0;
          border-top: 1px solid #ccc;
          margin-bottom: 5px;
        }
        .page-number {
          font-size: 10px;
          color: #777;
        }

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
            <div><strong>Project:</strong> ${this.escapeHtml(projectName)}</div>
            <div><strong>Created By:</strong> ${this.escapeHtml(createdBy)}</div>
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
            <p><strong>Project Name:</strong> ${this.escapeHtml(projectName)}</p>
            <p><strong>Created By:</strong> ${this.escapeHtml(createdBy)}</p>
            <p><strong>Company:</strong> ${this.escapeHtml(company)}</p>
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Time:</strong> ${timeStr}</p>
        </div>
        
        ${
          data.partnerInCharge && data.partnerInCharge.length > 0
            ? `<h3>Project Incharge</h3>
               <ul>${data.partnerInCharge.map((p: any) => `<li>${this.escapeHtml(p.fullName || p)}</li>`).join("")}</ul>`
            : ""
        }

        <h3>Team Leaders</h3>
        <ul>${data.leaders.length > 0 ? data.leaders.map((l: any) => `<li>${this.escapeHtml(l.fullName || l)}</li>`).join("") : "<li>None</li>"}</ul>
        
        <h3>Team Members</h3>
        <ul>${data.members.length > 0 ? data.members.map((m: any) => `<li>${this.escapeHtml(m.fullName || m)}</li>`).join("") : "<li>None</li>"}</ul>
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
              <tr><td>${idx + 1}</td><td>${this.escapeHtml(a.attendeeName)}</td><td>${this.escapeHtml(a.designation)}</td><td>${this.escapeHtml(a.organization)}</td><td>${this.escapeHtml(a.email)}</td></tr>
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
                <tr><td>${idx + 1}</td><td>${this.escapeHtml(v.agenda)}</td><td>${this.escapeHtml(v.discussion)}</td><td>${this.escapeHtml(v.responsibility)}</td></tr>
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
                <p><strong>Agenda:</strong> ${this.escapeHtml(entry.agenda)}</p>
                <p><strong>Discussion:</strong> ${this.escapeHtml(entry.discussion)}</p>
                <p><strong>Responsibility:</strong> ${this.escapeHtml(entry.responsibility)}</p>
              </div>
            </div>
          `);
      }
    } else if (data.mode === "case-study") {
      this.pages.push(`
        <div class="page">
          ${this.renderHeader()}
          <h2 style="text-align:center; margin-top:20px;">Case Study Remarks</h2>
          <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 16px; line-height: 1.6; margin: 0; padding: 10px 0; font-family: Arial, sans-serif;">${this.escapeHtml(data.caseStudyRemarks)}</pre>
        </div>
      `);
    } /* else if (data.mode === "dpr") {
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
                <th>Staff</th>
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
                  <td>${this.escapeHtml(v.name)}</td>
                  <td>${this.escapeHtml(v.expertise)}</td>
                  <td>${v.skillLabor || 0}</td>
                  <td>${v.unskillLabor || 0}</td>
                  <td>${v.staffLabor || 0}</td>
                  <td>${(Number(v.skillLabor) || 0) + (Number(v.unskillLabor) || 0) + (Number(v.staffLabor) || 0)}</td>
                </tr>
              `,
                      )
                      .join("")
                  : "<tr><td colspan='7' style='text-align:center;'>No labor recorded</td></tr>"
              }
              <tr style="font-weight:bold; background-color: #f0f0f0;">
                <td colspan="3" style="text-align:right;">Grand Totals</td>
                <td>${data.totalSkilled || 0}</td>
                <td>${data.totalUnskilled || 0}</td>
                <td>${data.totalStaff || 0}</td>
                <td>${data.totalLabor || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `);
    } */
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
            <p><strong>Caption:</strong> ${this.escapeHtml(photo.caption?.trim())}</p>
        </div>
      </div>
    `);
  }

  private escapeHtml(text?: string): string {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async finalize(): Promise<string> {
    if (this.pages.length === 0) {
      throw new Error("No pages to generate PDF");
    }

    console.log(`[PdfEngine] Starting single-shot generation for ${this.pages.length} pages...`);

    // Combine all pages into one HTML document with page breaks
    const totalPages = this.pages.length;
    const pagesWithFooters = this.pages.map((html, index) => {
      // Inject footer before the closing div of the .page
      const footerHtml = `
        <div class="page-footer">
          <hr />
          <div class="page-number">Page ${index + 1} of ${totalPages}</div>
        </div>
      `;
      
      // Find the last </div> and insert before it
      const lastIndex = html.lastIndexOf("</div>");
      if (lastIndex !== -1) {
        return html.slice(0, lastIndex) + footerHtml + html.slice(lastIndex);
      }
      return html + footerHtml;
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${this.getStyles()}
          <style>
            .page { 
              page-break-after: always; 
              break-after: page;
            }
            .page:last-child { 
              page-break-after: auto; 
              break-after: auto;
            }
            /* Ensure images don't break across pages */
            img { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          ${pagesWithFooters.join("")}
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html: fullHtml,
        base64: false,
      });

      console.log("[PdfEngine] PDF generated successfully.");

      const finalUri = `${FileSystem.documentDirectory}report_${Date.now()}.pdf`;
      await FileSystem.moveAsync({
        from: uri,
        to: finalUri,
      });

      return finalUri;
    } catch (error) {
      console.error("[PdfEngine] Single-shot generation failed:", error);
      throw error;
    }
  }
}
