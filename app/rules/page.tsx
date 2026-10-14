'use client';

import {
  ShieldCheck, Package, Scale, Tag, CalendarDays, Phone, Globe,
  AlertCircle, Info, ChevronRight, Rocket
} from 'lucide-react';

const RULES = [
  {
    id: 'R01',
    icon: Package,
    color: 'blue',
    title: 'Product Identity',
    subtitle: 'Rule 6(1)(a)',
    description: 'Every packaged commodity shall bear a declaration of its generic or common name.',
    examples: ['Brand name', 'Common product name', 'Variety or grade'],
    severity: 'Critical',
  },
  {
    id: 'R02',
    icon: ShieldCheck,
    color: 'blue',
    title: 'Manufacturer / Packer / Importer',
    subtitle: 'Rule 6(1)(a)',
    description: 'Name and full registered address of the manufacturer, packer, or importer must be declared.',
    examples: ['Company name', 'Pvt. Ltd. / LLP designation', 'Complete postal address with PIN code'],
    severity: 'Critical',
  },
  {
    id: 'R03',
    icon: Scale,
    color: 'green',
    title: 'Net Quantity',
    subtitle: 'Rule 6(1)(b)',
    description: 'Net quantity in standard metric units (mass, volume, length, or count) must be declared. Approximate quantities should be indicated.',
    examples: ['500 g', '1 kg', '500 mL', '1 L', '6 pieces'],
    severity: 'Critical',
  },
  {
    id: 'R04',
    icon: Tag,
    color: 'red',
    title: 'Maximum Retail Price (MRP)',
    subtitle: 'Rule 6(1)(f)',
    description: 'MRP inclusive of all taxes must be declared. The declaration must include the rupee symbol (₹ or Rs.) and state "inclusive of all taxes."',
    examples: ['MRP ₹250.00 (Incl. of all taxes)', 'M.R.P. Rs. 100/-', 'Maximum Retail Price: ₹99'],
    severity: 'Critical',
  },
  {
    id: 'R05',
    icon: CalendarDays,
    color: 'amber',
    title: 'Date of Manufacture / Packing',
    subtitle: 'Rule 6(1)(d)',
    description: 'Month and year of manufacture or packing (or import, for imported commodities) must be declared.',
    examples: ['Mfg: 08/2026', 'Pkd: August 2026', 'MFD 08/2026', 'Manufactured: Aug 2026'],
    severity: 'Major',
  },
  {
    id: 'R06',
    icon: Phone,
    color: 'purple',
    title: 'Consumer Care Information',
    subtitle: 'Consumer Protection',
    description: 'Contact details for consumer grievances should be provided. Includes phone number (preferably a toll-free helpline) and/or email address.',
    examples: ['1800-XXX-XXXX (Toll Free)', 'care@company.com', 'Consumer Care helpline number'],
    severity: 'Major',
  },
  {
    id: 'R07',
    icon: Globe,
    color: 'teal',
    title: 'Country of Origin',
    subtitle: 'Import / Export Rules',
    description: 'Country of origin is mandatory for imported commodities. Recommended for all domestic products.',
    examples: ['Country of Origin: India', 'Made in India', 'Product of India'],
    severity: 'Minor (Major for imports)',
  },
];

const FUTURE_SCOPE = [
  'Real-time video inspection mode',
  'Mobile camera scanning with AR overlay',
  'Hindi and regional language OCR support',
  'E-commerce marketplace monitoring API',
  'Centralized enforcement dashboard',
  'Geo-tagged inspections with map view',
  'Cloud-based analytics and reporting',
  'Product / brand violation trend analysis',
  'Integration with government MCA portal',
  'Automated case / show-cause notice generation',
  'Batch processing for retail store audits',
  'Advanced computer vision (object detection)',
];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
};
const ICON_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  teal: 'bg-teal-100 text-teal-700',
};

export default function RulesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-4">
          <ShieldCheck className="h-3.5 w-3.5" />
          Reference Framework
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Compliance Rules & Checks</h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          LegalMetrix checks for the following mandatory declarations under the{' '}
          <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong>.
        </p>
        <div className="mt-4 inline-flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 max-w-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Prototype reference framework. Applicability may vary by commodity type, product category,
            and amendments. Always refer to the current official Rules for legal compliance.
          </span>
        </div>
      </div>

      {/* Score legend */}
      <div className="card p-5 mb-8">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          Prototype Compliance Score Thresholds
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { range: '90 – 100', label: 'Compliant', color: 'green', desc: 'All or near-all declarations detected' },
            { range: '70 – 89', label: 'Potential Warning', color: 'amber', desc: 'Minor missing or incomplete declarations' },
            { range: '0 – 69', label: 'Potential Non-Compliance', color: 'red', desc: 'Critical declarations missing' },
          ].map(({ range, label, color, desc }) => (
            <div key={range} className={`rounded-xl border p-4 ${color === 'green' ? 'bg-green-50 border-green-200' : color === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-lg font-bold mb-0.5 ${color === 'green' ? 'text-green-700' : color === 'amber' ? 'text-amber-700' : 'text-red-700'}`}>{range}</p>
              <p className="font-semibold text-slate-800 text-sm">{label}</p>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          These thresholds are for prototype assessment only and do not represent official government compliance standards.
        </p>
      </div>

      {/* Rules grid */}
      <h2 className="font-semibold text-slate-900 mb-4">Mandatory Declaration Checks</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {RULES.map((rule) => {
          const Icon = rule.icon;
          return (
            <div key={rule.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${ICON_COLOR_MAP[rule.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 text-sm">{rule.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 font-medium ${COLOR_MAP[rule.color]}`}>
                      {rule.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2 font-mono">{rule.subtitle}</p>
                  <p className="text-sm text-slate-600 mb-3">{rule.description}</p>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Examples</p>
                    <ul className="space-y-1">
                      {rule.examples.map((ex, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded">{ex}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scoring weights */}
      <div className="card p-6 mb-8">
        <h2 className="font-semibold text-slate-900 mb-4">Score Weighting</h2>
        <div className="space-y-3">
          {[
            { name: 'MRP', weight: 20, color: 'bg-red-500' },
            { name: 'Manufacturer / Packer', weight: 15, color: 'bg-blue-500' },
            { name: 'Net Quantity', weight: 15, color: 'bg-green-500' },
            { name: 'Manufacturing / Packing Date', weight: 15, color: 'bg-amber-500' },
            { name: 'Consumer Care Information', weight: 10, color: 'bg-purple-500' },
            { name: 'Registered Address', weight: 10, color: 'bg-blue-400' },
            { name: 'Product Identity', weight: 10, color: 'bg-teal-500' },
            { name: 'Country of Origin', weight: 5, color: 'bg-slate-400' },
          ].map(({ name, weight, color }) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-sm text-slate-700 w-52 flex-shrink-0">{name}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${weight}%` }} />
              </div>
              <span className="text-xs font-bold text-slate-600 w-8 text-right">{weight}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Future Scope */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Future Scope & Roadmap</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Planned enhancements for production-scale deployment:
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {FUTURE_SCOPE.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4 border-t border-slate-100 pt-3">
          These features are planned for future iterations and are not implemented in the current prototype.
        </p>
      </div>
    </div>
  );
}
