/**
 * Universal Receipt PDF Generator
 * Can be used across all pages that display receipts
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface UniversalReceiptData {
  // Receipt Info
  receiptNumber: string;
  receiptDate: string;
  
  // Customer Info
  customerName: string;
  customerCode?: string;
  customerPhone?: string;
  
  // Loan Info
  loanCode?: string;
  loanAmount?: number;
  
  // Payment Breakdown
  paidBefore?: number;
  todaysPayment: number;
  totalPaid?: number;
  outstanding?: number;
  
  // Payment Details
  paymentMode: string;
  utrRef?: string;
  remarks?: string;
  collectionDate?: string;
  
  // Company Info (optional - uses defaults if not provided)
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyGST?: string;
  
  // Additional Info
  collectedBy?: string;
  branchName?: string;
  installmentNumbers?: string;
}

/**
 * Generate receipt HTML for PDF conversion
 * NOTE: All company data must be provided - no fallbacks!
 */
export function generateReceiptHTML(data: UniversalReceiptData): string {
  // HARDCODED company data for Vettri Finance
  const companyName = data.companyName || 'Vettri Finance Pvt Ltd';
  const companyAddress = data.companyAddress || 'Main Road, Financial District, Thiruvannamalai - 606601, Tamil Nadu, India';
  const companyPhone = data.companyPhone || '+91 4175 234567';
  const companyEmail = data.companyEmail || 'support@vettrifinance.com';
  const companyGST = data.companyGST || '33AABCV9603R1ZM';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          background: #ffffff;
          padding: 40px 50px;
          color: #111827;
        }
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .success-icon {
          width: 60px;
          height: 60px;
          background: #dcfce7;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .success-icon svg {
          color: #16a34a;
        }
        h1 {
          font-size: 32px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .receipt-number {
          font-size: 24px;
          font-weight: 700;
          color: #6366f1;
          margin-top: 8px;
        }
        .receipt-date {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }
        .divider {
          height: 3px;
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%);
          margin: 30px 0;
          border-radius: 2px;
        }
        .company-details {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border: 2px solid #e5e7eb;
        }
        .company-details h2 {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }
        .company-details p {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }
        .company-details strong {
          color: #374151;
          font-weight: 600;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .detail-section h3 {
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .detail-row .label {
          color: #6b7280;
        }
        .detail-row .value {
          font-weight: 600;
          color: #111827;
        }
        .payment-summary {
          background: #f0f9ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 30px;
        }
        .payment-summary h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 16px;
          text-align: center;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 8px;
          padding: 0;
        }
        .summary-row.highlight {
          background: #dbeafe;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 18px;
        }
        .summary-row.highlight .label {
          color: #1e40af;
          font-weight: 700;
        }
        .summary-row.highlight .value {
          color: #16a34a;
          font-weight: 900;
          font-size: 24px;
        }
        .summary-row.bold {
          font-weight: 700;
          font-size: 16px;
        }
        .summary-row .label {
          color: #374151;
        }
        .summary-row .value {
          font-weight: 600;
          color: #111827;
        }
        .summary-row .value.red {
          color: #dc2626;
        }
        .summary-divider {
          height: 2px;
          background: #bfdbfe;
          margin: 12px 0;
        }
        .payment-details-box {
          background: #ffffff;
          padding: 16px;
          border-radius: 8px;
          margin-top: 16px;
        }
        .footer {
          border-top: 2px dashed #e5e7eb;
          padding-top: 20px;
          text-align: center;
        }
        .footer p {
          font-size: 11px;
          color: #9ca3af;
          line-height: 1.6;
          margin: 0 0 12px 0;
        }
        .footer .timestamp {
          font-size: 10px;
          color: #d1d5db;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Header -->
        <div class="header">
          <div class="success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1>PAYMENT RECEIPT</h1>
          <div class="receipt-number">#${data.receiptNumber}</div>
          <div class="receipt-date">${new Date(data.receiptDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Company Details -->
        <div class="company-details">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 50px; height: 50px; border-radius: 8px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 20px; font-weight: 800; color: #ffffff;">
              FV
            </div>
            <h2 style="margin: 0;">${companyName}</h2>
          </div>
          <p>
            <strong>Address:</strong> ${companyAddress}<br>
            <strong>Phone:</strong> ${companyPhone}<br>
            <strong>Email:</strong> ${companyEmail}<br>
            <strong>GST:</strong> ${companyGST}
          </p>
        </div>

        <!-- Customer & Loan Details Grid -->
        <div class="details-grid">
          <div class="detail-section">
            <h3>Customer Details</h3>
            <div class="detail-row">
              <span class="label">Customer Name</span>
              <span class="value">${data.customerName}</span>
            </div>
            ${data.customerCode ? `
            <div class="detail-row">
              <span class="label">Customer Code</span>
              <span class="value">${data.customerCode}</span>
            </div>
            ` : ''}
            ${data.customerPhone ? `
            <div class="detail-row">
              <span class="label">Phone</span>
              <span class="value">${data.customerPhone}</span>
            </div>
            ` : ''}
          </div>

          <div class="detail-section">
            <h3>Loan Details</h3>
            ${data.loanCode ? `
            <div class="detail-row">
              <span class="label">Loan Code</span>
              <span class="value">${data.loanCode}</span>
            </div>
            ` : ''}
            ${data.loanAmount ? `
            <div class="detail-row">
              <span class="label">Loan Amount</span>
              <span class="value">₹${formatAmount(data.loanAmount)}</span>
            </div>
            ` : ''}
            ${data.installmentNumbers ? `
            <div class="detail-row">
              <span class="label">Installments</span>
              <span class="value">${data.installmentNumbers}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Payment Summary -->
        <div class="payment-summary">
          <h3>Payment Summary</h3>
          
          ${data.paidBefore !== undefined ? `
          <div class="summary-row">
            <span class="label">Paid Before</span>
            <span class="value">₹${formatAmount(data.paidBefore)}</span>
          </div>
          ` : ''}
          
          <div class="summary-row highlight">
            <span class="label">Today's Payment</span>
            <span class="value">₹${formatAmount(data.todaysPayment)}</span>
          </div>
          
          ${data.totalPaid !== undefined || data.outstanding !== undefined ? `
          <div class="summary-divider"></div>
          ` : ''}
          
          ${data.totalPaid !== undefined ? `
          <div class="summary-row bold">
            <span class="label">Total Paid</span>
            <span class="value">₹${formatAmount(data.totalPaid)}</span>
          </div>
          ` : ''}
          
          ${data.outstanding !== undefined ? `
          <div class="summary-row">
            <span class="label">Outstanding</span>
            <span class="value red">₹${formatAmount(data.outstanding)}</span>
          </div>
          ` : ''}
          
          <div class="payment-details-box">
            <div class="detail-row">
              <span class="label">Payment Mode</span>
              <span class="value">${data.paymentMode.toUpperCase()}</span>
            </div>
            ${data.collectionDate ? `
            <div class="detail-row">
              <span class="label">Collection Date</span>
              <span class="value">${new Date(data.collectionDate).toLocaleDateString('en-IN')}</span>
            </div>
            ` : ''}
            ${data.utrRef ? `
            <div class="detail-row">
              <span class="label">UTR Reference</span>
              <span class="value">${data.utrRef}</span>
            </div>
            ` : ''}
            ${data.collectedBy ? `
            <div class="detail-row">
              <span class="label">Collected By</span>
              <span class="value">${data.collectedBy}</span>
            </div>
            ` : ''}
            ${data.remarks ? `
            <div class="detail-row">
              <span class="label">Remarks</span>
              <span class="value">${data.remarks}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>
            This is a computer-generated receipt and does not require a signature.<br>
            For any queries, please contact our customer support.
          </p>
          <p class="timestamp">
            Generated on ${new Date().toLocaleString('en-IN')} • ${companyName}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format amount from paise to rupees with Indian formatting
 */
function formatAmount(amount: number): string {
  return (amount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Generate and download PDF from receipt data
 */
export async function downloadReceiptAsPDF(data: UniversalReceiptData): Promise<void> {
  try {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.innerHTML = generateReceiptHTML(data);
    document.body.appendChild(container);

    // Wait for fonts and styles to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture as canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Download with descriptive filename
    const timestamp = Date.now();
    pdf.save(`Receipt_${data.receiptNumber}_${timestamp}.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

/**
 * Print receipt (opens print dialog)
 */
export function printReceipt(data: UniversalReceiptData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the receipt.');
    return;
  }

  printWindow.document.write(generateReceiptHTML(data));
  printWindow.document.close();

  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
  };
}
