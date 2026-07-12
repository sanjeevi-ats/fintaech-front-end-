'use client';
import React, { useRef } from 'react';
import { Download, Printer, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptData {
  receiptNumber: string;
  receiptDate: string;
  customerName: string;
  customerCode: string;
  loanCode: string;
  loanAmount: number;
  paidBefore: number;
  todaysPayment: number;
  totalPaid: number;
  outstanding: number;
  paymentMode: string;
  utrRef?: string;
  remarks?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyGST?: string;
  companyWebsite?: string;
  companyLicense?: string;
  companyLogo?: string;
  branchName?: string;
  branchCode?: string;
  branchAddress?: string;
  cashierName?: string;
  terminalId?: string;
}

interface Props {
  data: ReceiptData;
  onClose: () => void;
}

export default function ProfessionalReceipt({ data, onClose }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      // Capture the receipt as canvas with higher quality
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3, // Increased from 2 for better quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0
      });

      // Create PDF with better settings
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false // Better quality
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add metadata to PDF
      pdf.setProperties({
        title: `Receipt ${data.receiptNumber}`,
        subject: `Payment Receipt for ${data.customerName}`,
        author: data.companyName || 'Vettri Finance Pvt Ltd',
        keywords: 'receipt,payment,loan,microfinance',
        creator: 'Vettri Finance Receipt System'
      });

      // If image is taller than page, fit to page
      if (imgHeight > pageHeight) {
        const scaledHeight = pageHeight;
        const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
        pdf.addImage(imgData, 'PNG', (imgWidth - scaledWidth) / 2, 0, scaledWidth, scaledHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }

      // Generate filename with customer and date
      const date = new Date(data.receiptDate).toISOString().split('T')[0];
      const filename = `Receipt_${data.receiptNumber}_${data.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.pdf`;
      
      pdf.save(filename);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const downloadHTML = async () => {
    if (!receiptRef.current) return;
    
    try {
      const htmlContent = receiptRef.current.innerHTML;
      const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${data.receiptNumber}</title>
  <style>
    body { 
      margin: 0; 
      padding: 20px; 
      font-family: Arial, sans-serif; 
      background: white;
    }
    .no-print { display: none !important; }
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

      const blob = new Blob([fullHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date(data.receiptDate).toISOString().split('T')[0];
      
      a.href = url;
      a.download = `Receipt_${data.receiptNumber}_${data.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download HTML:', err);
      alert('Failed to download HTML. Please try again.');
    }
  };

  const emailReceipt = () => {
    const subject = `Payment Receipt ${data.receiptNumber} - ${data.customerName}`;
    const body = `Dear ${data.customerName},

Please find attached your payment receipt for loan ${data.loanCode}.

Receipt Details:
- Receipt Number: ${data.receiptNumber}
- Payment Amount: ₹${formatAmount(data.todaysPayment)}
- Payment Date: ${new Date(data.receiptDate).toLocaleDateString()}
- Payment Mode: ${data.paymentMode}
- Outstanding Amount: ₹${formatAmount(data.outstanding)}

Thank you for your payment.

Best regards,
${data.companyName || '[Company Name Not Configured]'}`;

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Action Buttons - Hide on print */}
      <div className="no-print" style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 20, 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button 
          className="btn btn-primary" 
          onClick={downloadPDF}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          <Download size={16} /> Download PDF
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={downloadHTML}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '12px 20px',
            fontSize: 14
          }}
        >
          📄 Download HTML
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={printReceipt}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '12px 20px',
            fontSize: 14
          }}
        >
          <Printer size={16} /> Print Receipt
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={emailReceipt}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '12px 20px',
            fontSize: 14
          }}
        >
          📧 Email Receipt
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={onClose}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '12px 20px',
            fontSize: 14
          }}
        >
          ← Back
        </button>
      </div>

      {/* Receipt Design */}
      <div 
        ref={receiptRef} 
        style={{
          backgroundColor: '#ffffff',
          padding: '40px 50px',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        {/* Header with Success Icon */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            marginBottom: 16
          }}>
            <CheckCircle2 size={32} color="#16a34a" />
          </div>
          <h1 style={{ 
            fontSize: 32, 
            fontWeight: 800, 
            color: '#111827', 
            margin: 0,
            letterSpacing: '-0.5px'
          }}>
            PAYMENT RECEIPT
          </h1>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 700, 
            color: '#6366f1', 
            marginTop: 8 
          }}>
            #{data.receiptNumber}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            {new Date(data.receiptDate).toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ 
          height: 3, 
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%)',
          marginBottom: 30,
          borderRadius: 2
        }} />

        {/* Company Details */}
        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: 24, 
          borderRadius: 12,
          marginBottom: 30,
          border: '2px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              fontSize: 24,
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              FV
            </div>
            <div>
              <h2 style={{ 
                fontSize: 22, 
                fontWeight: 800, 
                color: '#111827', 
                margin: 0,
                marginBottom: 4
              }}>
                {data.companyName || '[Company Name Not Configured]'}
              </h2>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
                Licensed NBFC - Microfinance Institution
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 20,
            fontSize: 13, 
            color: '#374151', 
            lineHeight: 1.6 
          }}>
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: '#1f2937' }}>Address:</strong><br />
                {data.companyAddress || '[Address Not Configured]'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: '#1f2937' }}>Phone:</strong> {data.companyPhone || '+91 22 1234 5678'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: '#1f2937' }}>Email:</strong> {data.companyEmail || 'info@finveda.com'}
              </div>
            </div>
            
            <div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: '#1f2937' }}>GST Number:</strong><br />
                {data.companyGST || '27AABCU9603R1ZM'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: '#1f2937' }}>License No:</strong> {data.companyLicense || 'NBFC-MFI-001/2024'}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: '#1f2937' }}>Website:</strong> {data.companyWebsite || 'www.finveda.com'}
              </div>
            </div>
          </div>
          
          {(data.branchName || data.branchCode) && (
            <div style={{ 
              borderTop: '1px solid #e5e7eb',
              paddingTop: 16,
              marginTop: 16
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
                Branch Details
              </div>
              <div style={{ fontSize: 13, color: '#374151' }}>
                <strong>Branch:</strong> {data.branchName || 'Main Branch'} ({data.branchCode || 'BR001'})<br />
                {data.branchAddress && (
                  <>
                    <strong>Address:</strong> {data.branchAddress}
                  </>
                )}
              </div>
            </div>
          )}
          
          {(data.cashierName || data.terminalId) && (
            <div style={{ 
              borderTop: '1px solid #e5e7eb',
              paddingTop: 12,
              marginTop: 12,
              fontSize: 12,
              color: '#6b7280'
            }}>
              {data.cashierName && <span><strong>Cashier:</strong> {data.cashierName} </span>}
              {data.terminalId && <span><strong>Terminal:</strong> {data.terminalId}</span>}
            </div>
          )}
        </div>

        {/* Customer & Loan Details in Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 20,
          marginBottom: 30 
        }}>
          {/* Customer Details */}
          <div>
            <h3 style={{ 
              fontSize: 12, 
              fontWeight: 700, 
              color: '#6b7280', 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 12 
            }}>
              Customer Details
            </h3>
            <DetailRow label="Customer Name" value={data.customerName} />
            <DetailRow label="Customer Code" value={data.customerCode} />
          </div>

          {/* Loan Details */}
          <div>
            <h3 style={{ 
              fontSize: 12, 
              fontWeight: 700, 
              color: '#6b7280', 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 12 
            }}>
              Loan Details
            </h3>
            <DetailRow label="Loan Code" value={data.loanCode} />
            <DetailRow label="Loan Amount" value={`₹${formatAmount(data.loanAmount)}`} />
          </div>
        </div>

        {/* Payment Summary Box */}
        <div style={{ 
          backgroundColor: '#f0f9ff', 
          border: '2px solid #3b82f6',
          borderRadius: 12,
          padding: 24,
          marginBottom: 30 
        }}>
          <h3 style={{ 
            fontSize: 16, 
            fontWeight: 700, 
            color: '#1e40af', 
            marginBottom: 16,
            textAlign: 'center'
          }}>
            Payment Summary
          </h3>
          
          <div style={{ marginBottom: 16 }}>
            <SummaryRow label="Paid Before" value={`₹${formatAmount(data.paidBefore)}`} />
            <SummaryRow 
              label="Today's Payment" 
              value={`₹${formatAmount(data.todaysPayment)}`} 
              highlight 
            />
            <div style={{ 
              height: 2, 
              backgroundColor: '#bfdbfe', 
              margin: '12px 0' 
            }} />
            <SummaryRow 
              label="Total Paid" 
              value={`₹${formatAmount(data.totalPaid)}`} 
              bold 
            />
            <SummaryRow 
              label="Outstanding" 
              value={`₹${formatAmount(data.outstanding)}`} 
              color="#dc2626"
            />
          </div>

          <div style={{ 
            backgroundColor: '#ffffff', 
            padding: 16,
            borderRadius: 8,
            marginTop: 16
          }}>
            <DetailRow label="Payment Mode" value={data.paymentMode.toUpperCase()} bold />
            {data.utrRef && <DetailRow label="UTR Reference" value={data.utrRef} />}
            {data.remarks && <DetailRow label="Remarks" value={data.remarks} />}
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          borderTop: '2px dashed #e5e7eb',
          paddingTop: 20,
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: 11, 
            color: '#9ca3af', 
            margin: 0,
            lineHeight: 1.6 
          }}>
            This is a computer-generated receipt and does not require a signature.<br />
            For any queries, please contact our customer support.
          </p>
          <p style={{ 
            fontSize: 10, 
            color: '#d1d5db', 
            marginTop: 12,
            margin: 0 
          }}>
            Generated on {new Date().toLocaleString('en-IN')} • {data.companyName || 'Finance Platform'}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Helper Components
function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      fontSize: 13,
      marginBottom: 8,
      alignItems: 'center'
    }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ 
        fontWeight: bold ? 700 : 600, 
        color: '#111827' 
      }}>
        {value}
      </span>
    </div>
  );
}

function SummaryRow({ 
  label, 
  value, 
  highlight, 
  bold, 
  color 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean; 
  bold?: boolean;
  color?: string;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      fontSize: highlight ? 18 : 14,
      marginBottom: 8,
      alignItems: 'center',
      padding: highlight ? '8px 12px' : 0,
      backgroundColor: highlight ? '#dbeafe' : 'transparent',
      borderRadius: highlight ? 6 : 0
    }}>
      <span style={{ 
        color: color || (highlight ? '#1e40af' : '#374151'),
        fontWeight: bold || highlight ? 700 : 400
      }}>
        {label}
      </span>
      <span style={{ 
        fontWeight: bold || highlight ? 900 : 600, 
        color: color || (highlight ? '#16a34a' : '#111827'),
        fontSize: highlight ? 24 : (bold ? 16 : 14)
      }}>
        {value}
      </span>
    </div>
  );
}

function formatAmount(amount: number): string {
  return (amount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}
