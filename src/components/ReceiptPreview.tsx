'use client';
import React from 'react';
import { ReceiptData } from './ProfessionalReceipt';
import { formatAmount } from './ProfessionalReceipt';

interface Props {
  data: ReceiptData;
  template: 'standard' | 'detailed' | 'compact' | 'bilingual';
  scale?: number;
}

export default function ReceiptPreview({ data, template, scale = 0.7 }: Props) {
  const baseStyle = {
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif'
  };

  if (template === 'compact') {
    return (
      <div style={baseStyle}>
        <div style={{ padding: '20px 24px', maxWidth: '300px' }}>
          {/* Compact Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>
              RECEIPT
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#6366f1' }}>
              #{data.receiptNumber}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {new Date(data.receiptDate).toLocaleDateString()}
            </div>
          </div>

          {/* Company - Minimal */}
          <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 11 }}>
            <div style={{ fontWeight: 600 }}>{data.companyName}</div>
            <div style={{ color: '#6b7280' }}>{data.companyPhone}</div>
          </div>

          {/* Payment Info - Compact */}
          <div style={{ fontSize: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Customer:</span>
              <span style={{ fontWeight: 600 }}>{data.customerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Loan:</span>
              <span>{data.loanCode}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Amount:</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>₹{formatAmount(data.todaysPayment)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Mode:</span>
              <span>{data.paymentMode}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 8, textAlign: 'center', fontSize: 10, color: '#9ca3af' }}>
            Thank you for your payment
          </div>
        </div>
      </div>
    );
  }

  if (template === 'detailed') {
    return (
      <div style={baseStyle}>
        <div style={{ padding: '30px 40px', maxWidth: '500px' }}>
          {/* Detailed Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>
              PAYMENT RECEIPT
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>
              #{data.receiptNumber}
            </div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              {new Date(data.receiptDate).toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              })}
            </div>
          </div>

          {/* Company Details - Full */}
          <div style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 12, fontSize: 16, fontWeight: 800, color: '#ffffff'
              }}>FV</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{data.companyName}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>Licensed Microfinance Institution</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>
              <div><strong>Address:</strong> {data.companyAddress}</div>
              <div><strong>Phone:</strong> {data.companyPhone} <strong>Email:</strong> {data.companyEmail}</div>
              <div><strong>GST:</strong> {data.companyGST} <strong>License:</strong> {data.companyLicense}</div>
            </div>
          </div>

          {/* Customer & Loan Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>CUSTOMER</div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>Name:</strong> {data.customerName}
              </div>
              <div style={{ fontSize: 13 }}>
                <strong>Code:</strong> {data.customerCode}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>LOAN</div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>
                <strong>Code:</strong> {data.loanCode}
              </div>
              <div style={{ fontSize: 13 }}>
                <strong>Amount:</strong> ₹{formatAmount(data.loanAmount)}
              </div>
            </div>
          </div>

          {/* Payment Breakdown - Detailed */}
          <div style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 12, textAlign: 'center' }}>
              PAYMENT BREAKDOWN
            </div>
            <div style={{ fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Previous Payments:</span>
                <span>₹{formatAmount(data.paidBefore)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, padding: '6px 8px', backgroundColor: '#dbeafe', borderRadius: 4 }}>
                <span style={{ fontWeight: 600 }}>Today's Payment:</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>₹{formatAmount(data.todaysPayment)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Total Paid:</span>
                <span style={{ fontWeight: 600 }}>₹{formatAmount(data.totalPaid)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #bfdbfe', paddingTop: 6 }}>
                <span style={{ color: '#dc2626' }}>Outstanding:</span>
                <span style={{ fontWeight: 600, color: '#dc2626' }}>₹{formatAmount(data.outstanding)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ fontSize: 12, marginBottom: 16 }}>
            <strong>Payment Mode:</strong> {data.paymentMode.toUpperCase()}
            {data.utrRef && <> | <strong>UTR:</strong> {data.utrRef}</>}
          </div>

          <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 12, textAlign: 'center', fontSize: 10, color: '#9ca3af' }}>
            Computer generated receipt — No signature required<br />
            Thank you for choosing {data.companyName}
          </div>
        </div>
      </div>
    );
  }

  if (template === 'bilingual') {
    return (
      <div style={baseStyle}>
        <div style={{ padding: '30px 40px', maxWidth: '500px' }}>
          {/* Bilingual Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>
              PAYMENT RECEIPT / भुगतान रसीद
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>
              #{data.receiptNumber}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {new Date(data.receiptDate).toLocaleDateString()} / दिनांक
            </div>
          </div>

          {/* Company - Bilingual */}
          <div style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              {data.companyName}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              लाइसेंस प्राप्त माइक्रोफाइनेंस संस्थान
            </div>
          </div>

          {/* Payment Details - Bilingual */}
          <div style={{ fontSize: 13, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Customer / ग्राहक:</span>
              <span style={{ fontWeight: 600 }}>{data.customerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Loan Code / लोन कोड:</span>
              <span>{data.loanCode}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Amount / राशि:</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>₹{formatAmount(data.todaysPayment)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Outstanding / बकाया:</span>
              <span style={{ color: '#dc2626' }}>₹{formatAmount(data.outstanding)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Mode / तरीका:</span>
              <span>{data.paymentMode} / {data.paymentMode === 'CASH' ? 'नकद' : 'कार्ड'}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 12, textAlign: 'center', fontSize: 10, color: '#9ca3af' }}>
            Thank you / धन्यवाद<br />
            कंप्यूटर जनरेटेड रसीद - हस्ताक्षर की आवश्यकता नहीं
          </div>
        </div>
      </div>
    );
  }

  // Standard template (default)
  return (
    <div style={baseStyle}>
      <div style={{ padding: '30px 40px', maxWidth: '450px' }}>
        {/* Standard Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#111827' }}>
            PAYMENT RECEIPT
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>
            #{data.receiptNumber}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {new Date(data.receiptDate).toLocaleDateString()}
          </div>
        </div>

        {/* Company Info */}
        <div style={{ backgroundColor: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: 10, fontSize: 14, fontWeight: 800, color: '#ffffff'
            }}>FV</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{data.companyName}</div>
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            {data.companyAddress}<br />
            {data.companyPhone} | {data.companyEmail}
          </div>
        </div>

        {/* Payment Info */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span>Customer:</span>
            <span style={{ fontWeight: 600 }}>{data.customerName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span>Loan Code:</span>
            <span>{data.loanCode}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span>Paid Before:</span>
            <span>₹{formatAmount(data.paidBefore)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, marginBottom: 8, padding: '8px 0', backgroundColor: '#dcfce7', borderRadius: 4, paddingLeft: 8, paddingRight: 8 }}>
            <span style={{ fontWeight: 600 }}>Today's Payment:</span>
            <span style={{ fontWeight: 800, color: '#16a34a' }}>₹{formatAmount(data.todaysPayment)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span>Total Paid:</span>
            <span style={{ fontWeight: 600 }}>₹{formatAmount(data.totalPaid)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span>Outstanding:</span>
            <span style={{ color: '#dc2626', fontWeight: 600 }}>₹{formatAmount(data.outstanding)}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 12, textAlign: 'center', fontSize: 10, color: '#9ca3af' }}>
          Payment Mode: {data.paymentMode}<br />
          Computer generated receipt — Thank you
        </div>
      </div>
    </div>
  );
}