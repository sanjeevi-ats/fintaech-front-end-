'use client';
import React, { useState } from 'react';
import { FileText, Check } from 'lucide-react';

export interface ReceiptTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
}

interface Props {
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
}

const templates: ReceiptTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Receipt',
    description: 'Clean and professional receipt with all essential information',
    preview: '/assets/receipt-standard-preview.png',
    features: ['Company logo', 'Payment summary', 'Customer details', 'Basic styling']
  },
  {
    id: 'detailed',
    name: 'Detailed Receipt',
    description: 'Comprehensive receipt with installment breakdown and enhanced details',
    preview: '/assets/receipt-detailed-preview.png',
    features: ['Full installment history', 'Payment schedule', 'Interest breakdown', 'Loan details']
  },
  {
    id: 'compact',
    name: 'Compact Receipt',
    description: 'Minimalist receipt perfect for quick transactions',
    preview: '/assets/receipt-compact-preview.png',
    features: ['Essential info only', 'Small footprint', 'Quick printing', 'Mobile friendly']
  },
  {
    id: 'bilingual',
    name: 'Bilingual Receipt',
    description: 'Receipt in English and local language',
    preview: '/assets/receipt-bilingual-preview.png',
    features: ['English + Hindi', 'Cultural compliance', 'Regional adaptation', 'Multi-language']
  }
];

export default function ReceiptTemplateSelector({ selectedTemplate, onTemplateChange }: Props) {
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  const handlePreview = (templateId: string) => {
    setPreviewTemplate(templateId);
    // In a real implementation, this would show a modal with the template preview
    alert(`Preview for ${templates.find(t => t.id === templateId)?.name} would open here`);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Receipt Template</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Choose how your receipts should look
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {templates.map((template) => (
          <div
            key={template.id}
            className={`card ${selectedTemplate === template.id ? 'selected' : ''}`}
            style={{
              padding: 12,
              cursor: 'pointer',
              border: selectedTemplate === template.id ? '2px solid #6366f1' : '1px solid var(--bg-border)',
              position: 'relative'
            }}
            onClick={() => onTemplateChange(template.id)}
          >
            {selectedTemplate === template.id && (
              <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Check size={12} color="white" />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FileText size={16} color={selectedTemplate === template.id ? '#6366f1' : '#6b7280'} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{template.name}</div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
              {template.description}
            </div>

            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              <strong>Features:</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {template.features.slice(0, 2).map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
                {template.features.length > 2 && (
                  <li>+{template.features.length - 2} more</li>
                )}
              </ul>
            </div>

            <button
              className="btn btn-sm btn-secondary"
              style={{ marginTop: 8, width: '100%', fontSize: 11 }}
              onClick={(e) => {
                e.stopPropagation();
                handlePreview(template.id);
              }}
            >
              Preview
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}