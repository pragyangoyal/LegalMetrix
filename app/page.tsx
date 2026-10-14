'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ScanLine, AlertTriangle, CheckCircle2, XCircle,
  ArrowRight, Clock, BarChart3, ShieldCheck, FileText, Info
} from 'lucide-react';
import { getHistory, seedDemoHistory } from '@/services/historyService';
import { ScanRecord } from '@/types';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import clsx from 'clsx';

function StatusBadge({ status }: { status: string }) {
  if (status === 'COMPLIANT')
    return <span className="badge-compliant"><CheckCircle2 className="h-3 w-3" />Compliant</span>;
  if (status === 'WARNING')
    return <span className="badge-warning"><AlertTriangle className="h-3 w-3" />Warning</span>;
  return <span className="badge-violation"><XCircle className="h-3 w-3" />Non-Compliant</span>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return `Today, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STAT_DEFINITIONS = [
  { label: 'Products Scanned', key: 'total', icon: ScanLine, color: 'blue' },
  { label: 'Compliant', key: 'compliant', icon: CheckCircle2, color: 'green' },
  { label: 'Warnings', key: 'warning', icon: AlertTriangle, color: 'amber' },
  { label: 'Potential Violations', key: 'violation', icon: XCircle, color: 'red' },
];

const HOUR = new Date().getHours();
const GREETING = HOUR < 12 ? 'Good Morning' : HOUR < 17 ? 'Good Afternoon' : 'Good Evening';

export default function DashboardPage() {
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    async function loadInspections() {
      try {
        const res = await fetch('/api/inspections?limit=50');
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const mapped: ScanRecord[] = data.items.map((it: any) => ({
              id: it.id,
              timestamp: it.created_at,
              productName: it.product_name || 'Packaged Commodity',
              complianceScore: it.compliance_score || 0,
              complianceStatus: it.overall_status || 'NON-COMPLIANT',
              issuesCount: 0,
              warningsCount: 0,
              scanMode: it.scan_mode,
              demoProductId: it.demo_product_id,
            }));
            setHistory(mapped);
            return;
          }
          setHistory([]);
          return;
        }
      } catch (e) {
        console.error('Failed to load inspections from API:', e);
      }
      setHistory([]);
    }
    loadInspections();
  }, []);

  const stats = {
    total: history.length,
    compliant: history.filter((h) => h.complianceStatus === 'COMPLIANT').length,
    warning: history.filter((h) => h.complianceStatus === 'WARNING').length,
    violation: history.filter((h) => h.complianceStatus === 'NON-COMPLIANT').length,
  };

  const pieData = [
    { name: 'Compliant', value: stats.compliant, color: '#16a34a' },
    { name: 'Warning', value: stats.warning, color: '#d97706' },
    { name: 'Non-Compliant', value: stats.violation, color: '#dc2626' },
  ].filter((d) => d.value > 0);

  const recent = history.slice(0, 5);

  // Score distribution for bar chart
  const scoreRanges = [
    { range: '90-100', count: history.filter((h) => h.complianceScore >= 90).length, fill: '#16a34a' },
    { range: '70-89', count: history.filter((h) => h.complianceScore >= 70 && h.complianceScore < 90).length, fill: '#d97706' },
    { range: '50-69', count: history.filter((h) => h.complianceScore >= 50 && h.complianceScore < 70).length, fill: '#f97316' },
    { range: '0-49', count: history.filter((h) => h.complianceScore < 50).length, fill: '#dc2626' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Hero */}
      <div className="mb-8 bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white translate-y-1/2" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">{GREETING}, Officer</p>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Monitor Packaged Commodity Compliance
            </h1>
            <p className="text-blue-200 text-sm max-w-lg">
              AI-powered inspection for packaged commodity compliance under the Legal Metrology
              (Packaged Commodities) Rules, 2011.
            </p>
            <p className="text-blue-100 text-xs mt-3 font-mono tracking-wide uppercase opacity-70">
              Scan · Extract · Verify · Report
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link href="/scan" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-900 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg text-sm">
              <ScanLine className="h-5 w-5" />
              Scan Product
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_DEFINITIONS.map(({ label, key, icon: Icon, color }) => {
          const value = stats[key as keyof typeof stats];
          return (
            <div key={key} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                <div className={clsx(
                  'p-1.5 rounded-lg',
                  color === 'blue' ? 'bg-blue-50' : color === 'green' ? 'bg-green-50' : color === 'amber' ? 'bg-amber-50' : 'bg-red-50'
                )}>
                  <Icon className={clsx(
                    'h-4 w-4',
                    color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : color === 'amber' ? 'text-amber-600' : 'text-red-600'
                  )} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              {stats.total > 0 && key !== 'total' && (
                <p className="text-xs text-slate-400 mt-1">
                  {Math.round((value / stats.total) * 100)}% of total
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-slate-900">Compliance Overview</h2>
              <p className="text-xs text-slate-500 mt-0.5">Score distribution across inspected products</p>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          {stats.total > 0 ? (
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-full sm:w-48 h-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={scoreRanges} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, 'Products']} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {scoreRanges.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              No data yet. Scan a product to get started.
            </div>
          )}
          <div className="flex gap-4 mt-4">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/scan" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors group">
              <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <ScanLine className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Scan Product</p>
                <p className="text-xs text-slate-500">Upload or capture image</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>
            <Link href="/history" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors group">
              <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-slate-100 transition-colors">
                <Clock className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">View History</p>
                <p className="text-xs text-slate-500">{stats.total} inspections</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>
            <Link href="/rules" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors group">
              <div className="p-2 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                <ShieldCheck className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Compliance Rules</p>
                <p className="text-xs text-slate-500">LM PC Rules, 2011</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                <strong>Prototype Disclaimer:</strong> Results are automated assessments and must be verified by an authorized officer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">Recent Inspections</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest scanned products</p>
          </div>
          <Link href="/history" className="text-sm text-blue-700 font-medium hover:text-blue-900 flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ScanLine className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No inspections yet. Start by scanning a product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recent.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{record.productName}</span>
                      {record.scanMode === 'demo' && (
                        <span className="ml-2 text-[10px] font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">DEMO</span>
                      )}
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={record.complianceStatus} /></td>
                    <td className="px-4 py-4">
                      <span className={clsx(
                        'font-bold text-sm',
                        record.complianceScore >= 90 ? 'text-green-600' :
                          record.complianceScore >= 70 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {record.complianceScore}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">{formatDate(record.timestamp)}</td>
                    <td className="px-4 py-4">
                      <Link href={`/result?id=${record.id}`} className="text-blue-700 hover:text-blue-900 text-xs font-medium flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
