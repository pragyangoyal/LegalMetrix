'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, LayoutDashboard, ScanLine, History, BookOpen, Zap, X } from 'lucide-react';
import { useDemoMode } from '@/context/DemoModeContext';
import { DEMO_PRODUCTS } from '@/data/demoProducts';
import { buildAnalysisResult } from '@/services/complianceService';
import { saveToHistory, saveCurrentResult } from '@/services/historyService';
import clsx from 'clsx';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scan', label: 'Scan Product', icon: ScanLine },
  { href: '/history', label: 'History', icon: History },
  { href: '/rules', label: 'Compliance Rules', icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { demoMode, setDemoMode } = useDemoMode();

  const runDemo = (demoId: string) => {
    const product = DEMO_PRODUCTS.find((p) => p.id === demoId);
    if (!product) return;
    const result = buildAnalysisResult(product.ocrResult, product.name, undefined, product.id);
    saveCurrentResult(result);
    saveToHistory(result);
    router.push('/result');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-lg bg-blue-800 group-hover:bg-blue-900 transition-colors">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 leading-none">LegalMetrix</span>
              <span className="block text-[10px] text-slate-500 leading-none tracking-wide">
                AI Compliance Checker
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Demo Mode */}
          <div className="flex items-center gap-2">
            {demoMode && (
              <div className="hidden sm:flex items-center gap-1">
                {DEMO_PRODUCTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => runDemo(p.id)}
                    className={clsx(
                      'px-2.5 py-1 rounded text-xs font-semibold transition-colors border',
                      p.expectedStatus === 'COMPLIANT'
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : p.expectedStatus === 'WARNING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    )}
                  >
                    {p.expectedStatus === 'COMPLIANT' ? '✓' : p.expectedStatus === 'WARNING' ? '⚠' : '✕'}{' '}
                    Demo
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                demoMode
                  ? 'bg-violet-600 text-white border-violet-600 hover:bg-violet-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {demoMode ? <X className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
              {demoMode ? 'Exit Demo' : 'Demo Mode'}
            </button>
          </div>
        </div>

        {/* Mobile demo buttons */}
        {demoMode && (
          <div className="md:hidden flex gap-1 pb-2">
            {DEMO_PRODUCTS.map((p) => (
              <button
                key={p.id}
                onClick={() => runDemo(p.id)}
                className={clsx(
                  'flex-1 py-1 rounded text-xs font-semibold transition-colors border',
                  p.expectedStatus === 'COMPLIANT'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : p.expectedStatus === 'WARNING'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                )}
              >
                Demo: {p.expectedStatus}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
