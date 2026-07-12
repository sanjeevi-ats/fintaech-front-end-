'use client';
import React from 'react';
import { redirect } from 'next/navigation';

/**
 * Loan Portfolio - Redirects to main loans portfolio page (alias)
 */
export default function LoanPortfolioPage() {
  redirect('/loans');
}
