import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { DemoModeProvider } from '@/context/DemoModeContext';

export const metadata: Metadata = {
  title: 'LegalMetrix – AI-Powered Packaged Commodity Compliance Checker',
  description:
    'Automated compliance checking for Legal Metrology (Packaged Commodities) Rules, 2011. Scan. Extract. Verify. Report.',
  keywords: 'legal metrology, packaged commodities, compliance, MRP, consumer affairs, India',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <DemoModeProvider>
          <Navbar />
          <main className="min-h-screen bg-slate-50">{children}</main>
          <footer className="bg-white border-t border-slate-200 py-4 mt-12 no-print">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
              <p className="text-xs text-slate-500">
                <strong>LegalMetrix</strong> — Prototype Compliance Assessment Tool &nbsp;|&nbsp; SIH 2026 &nbsp;|&nbsp;
                Problem ID: 26034 — Ministry of Consumer Affairs
              </p>
              <p className="text-xs text-slate-400 mt-1">
                This prototype does not constitute a legal determination. Final enforcement decisions must be made by competent authorities.
              </p>
            </div>
          </footer>
        </DemoModeProvider>
      </body>
    </html>
  );
}
