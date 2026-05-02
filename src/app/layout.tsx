import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "AnnaiTech Solutions — Microfinance ERP",
  description: "Production-ready Multi-Tenant Microfinance Management System with Equity Engine, Loan Lifecycle, and Double-Entry Accounting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', margin: 0, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
