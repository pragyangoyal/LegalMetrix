'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, AlertTriangle, XCircle, ScanLine, Trash2, FileText, Clock,
  RefreshCw, Search, Layers, Eye, Sparkles
} from 'lucide-react';
import { InspectionRecord } from '@/lib/server/inspectionService';
import clsx from 'clsx';

function StatusBadge({ status }: { status?: string }) {
  if (status === 'COMPLIANT')
    return <span className="badge-compliant"><CheckCircle2 className="h-3 w-3" />Compliant</span>;
  if (status === 'WARNING')
    return <span className="badge-warning"><AlertTriangle className="h-3 w-3" />Warning</span>;
  return <span className="badge-violation"><XCircle className="h-3 w-3" />Non-Compliant</span>;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'COMPLIANT' | 'WARNING' | 'NON-COMPLIANT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/inspections?limit=100';
      if (filter !== 'ALL') url += `&status=${filter}`;
      if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.items || []);
      }
    } catch (e) {
      console.error('Failed to load inspections:', e);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this inspection record?')) return;

    try {
      const res = await fetch(`/api/inspections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete inspection:', e);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all inspection history from SQLite database? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/inspections', { method: 'DELETE' });
      if (res.ok) {
        setRecords([]);
      }
    } catch (e) {
      console.error('Failed to clear inspections:', e);
    }
  };

  const seedDemos = async () => {
    setSeeding(true);
    try {
      await fetch('/api/inspections/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoProductId: 'demo-rice' }),
      });
      await fetch('/api/inspections/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoProductId: 'demo-shampoo' }),
      });
      await fetch('/api/inspections/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoProductId: 'demo-namkeen' }),
      });
      await fetchRecords();
    } catch (e) {
      console.error('Failed to seed demos:', e);
    } finally {
      setSeeding(false);
    }
  };

  const counts = {
    total: records.length,
    compliant: records.filter((r) => r.overall_status === 'COMPLIANT').length,
    warning: records.filter((r) => r.overall_status === 'WARNING').length,
    violation: records.filter((r) => r.overall_status === 'NON-COMPLIANT').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspection History & Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1">
            Persisted in SQLite database — tracks statutory verifications under Legal Metrology Rules, 2011
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {records.length === 0 && (
            <button
              onClick={seedDemos}
              disabled={seeding}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              <Sparkles className="h-3.5 w-3.5" /> {seeding ? 'Seeding...' : 'Load Sample Inspections'}
            </button>
          )}
          <button onClick={fetchRecords} className="btn-secondary text-xs py-2">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <Link href="/scan" className="btn-primary text-xs py-2">
            <ScanLine className="h-3.5 w-3.5" /> New Scan
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        {/* Status pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {([
            { key: 'ALL', label: `All (${counts.total})`, color: 'slate' },
            { key: 'COMPLIANT', label: `Compliant (${counts.compliant})`, color: 'green' },
            { key: 'WARNING', label: `Warning (${counts.warning})`, color: 'amber' },
            { key: 'NON-COMPLIANT', label: `Non-Compliant (${counts.violation})`, color: 'red' },
          ] as const).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                filter === key
                  ? color === 'green' ? 'bg-green-600 text-white border-green-600'
                    : color === 'amber' ? 'bg-amber-600 text-white border-amber-600'
                    : color === 'red' ? 'bg-red-600 text-white border-red-600'
                    : 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by commodity name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-9 text-xs py-1.5"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <ScanLine className="h-8 w-8 mx-auto text-blue-500 animate-spin mb-3" />
            <p className="text-slate-500 text-sm">Querying SQLite records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center">
            <Clock className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">No inspections found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              Upload package images to inspect them or load sample demo scenarios.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={seedDemos}
                disabled={seeding}
                className="btn-secondary text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-600" /> Seed Sample Records
              </button>
              <Link href="/scan" className="btn-primary text-xs">
                Start First Scan
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Commodity / ID</th>
                  <th className="px-4 py-3.5">Mode & Panels</th>
                  <th className="px-4 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5 text-center">Compliance Score</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/result?id=${r.id}`} className="font-semibold text-slate-900 hover:text-blue-600 block">
                        {r.product_name || 'Packaged Commodity'}
                      </Link>
                      <span className="text-xs text-slate-400 font-mono">{r.id}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded capitalize">
                        {r.scan_mode}
                      </span>
                      {r.images_count > 0 && (
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Layers className="h-3 w-3" /> {r.images_count} panels
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={clsx(
                        'font-bold text-sm',
                        (r.compliance_score || 0) >= 90 ? 'text-green-600' :
                          (r.compliance_score || 0) >= 70 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {r.compliance_score ?? '—'}/100
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={r.overall_status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/result?id=${r.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                          title="View Assessment"
                        >
                          View
                        </Link>
                        <Link
                          href={`/report?id=${r.id}`}
                          className="text-xs text-slate-600 hover:text-slate-800 font-medium px-2 py-1 rounded hover:bg-slate-100 flex items-center gap-0.5"
                          title="View Official Report"
                        >
                          <FileText className="h-3 w-3" /> Report
                        </Link>
                        <button
                          onClick={(e) => handleDelete(r.id, e)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                          title="Delete Inspection"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {records.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-slate-400">
            Showing {records.length} records stored in local SQLite database.
          </p>
          <button
            onClick={handleClearAll}
            className="text-xs text-red-600 hover:underline flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" /> Clear all history
          </button>
        </div>
      )}
    </div>
  );
}
