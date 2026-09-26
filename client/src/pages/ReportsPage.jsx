import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { FileText, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { PageLoader } from '../components/common/Loader';

const statusVariant = { 'in-transit': 'blue', pending: 'slate', delivered: 'green', alert: 'red' };

function ReportRow({ shipment }) {
  const [dlState, setDlState] = useState({ csv: false, pdf: false });

  const simulate = (type) => {
    setDlState((s) => ({ ...s, [type]: true }));
    setTimeout(() => setDlState((s) => ({ ...s, [type]: false })), 1800);
  };

  return (
    <tr className="hover:bg-white/3 transition-colors group">
      <td className="px-6 py-4">
        <p className="font-mono text-blue-400 text-xs font-semibold">{shipment.id}</p>
      </td>
      <td className="px-6 py-4 text-xs text-slate-300 max-w-52 truncate">{shipment.vaccineType}</td>
      <td className="px-6 py-4 text-xs text-slate-400">
        {shipment.origin} → {shipment.destination}
      </td>
      <td className="px-6 py-4 text-xs text-slate-400">{shipment.doses?.toLocaleString()}</td>
      <td className="px-6 py-4">
        <Badge variant={statusVariant[shipment.status] ?? 'slate'}>{shipment.status}</Badge>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            id={`download-csv-${shipment.id}`}
            onClick={() => simulate('csv')}
            disabled={dlState.csv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20
              disabled:opacity-60 transition-all"
          >
            {dlState.csv ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
            CSV
          </button>
          <button
            id={`download-pdf-${shipment.id}`}
            onClick={() => simulate('pdf')}
            disabled={dlState.pdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20
              disabled:opacity-60 transition-all"
          >
            {dlState.pdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
            PDF
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ReportsPage() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getShipments().then((data) => {
      setShipments(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate CSV or PDF reports for any shipment's sensor data and audit trail.
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/8 border border-blue-500/20">
        <Download className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-semibold">Download Shipment Reports</p>
          <p className="text-blue-400/70 text-xs mt-0.5">
            CSV includes all sensor readings. PDF includes shipment details, charts, alerts, and audit log.
            Backend integration coming in Phase 1.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Shipments', value: shipments.length, color: 'text-white' },
          { label: 'Total Doses',     value: shipments.reduce((a, s) => a + (s.doses || 0), 0).toLocaleString(), color: 'text-emerald-400' },
          { label: 'In Transit',      value: shipments.filter(s => s.status === 'in-transit').length, color: 'text-blue-400' },
          { label: 'Delivered',       value: shipments.filter(s => s.status === 'delivered').length, color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-5 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Reports Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8">
          <h2 className="text-sm font-semibold text-slate-200">Available Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Shipment ID', 'Vaccine', 'Route', 'Doses', 'Status', 'Download'].map((h) => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {shipments.map((s) => <ReportRow key={s.id} shipment={s} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
