import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Download, Thermometer, Droplets, Flame, FileCode, Printer, FileText, ChevronDown } from 'lucide-react';
import SensorChart from '../components/SensorChart';

export default function Analytics({ history, getStats, onClearHistory, onNotify, isDeviceOffline = false }) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef(null);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  const tempStats = getStats('temp');
  const humidityStats = getStats('humidity');
  const gasStats = getStats('gas');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRecordDateTime = (h) => {
    if (h.timestamp) {
      const d = new Date(h.timestamp);
      const dateStr = d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return { dateStr, timeStr };
    }
    return {
      dateStr: h.dateStr || new Date().toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }),
      timeStr: h.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  const exportCSV = () => {
    setIsExportOpen(false);
    if (!history || history.length === 0) {
      onNotify('No session history available to export', 'error');
      return;
    }

    const headers = ['Date', 'Time', 'Timestamp', 'Temperature (°C)', 'Humidity (%)', 'Gas (Raw ADC)'];
    const rows = history.map((h) => {
      const { dateStr, timeStr } = getRecordDateTime(h);
      return [dateStr, timeStr, h.timestamp || '', h.temp ?? '', h.humidity ?? '', h.gas ?? ''];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_session_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify('Exported session telemetry CSV', 'success');
  };

  const exportXML = () => {
    setIsExportOpen(false);
    if (!history || history.length === 0) {
      onNotify('No session history available to export', 'error');
      return;
    }

    const xmlRecords = history
      .map((h) => {
        const { dateStr, timeStr } = getRecordDateTime(h);
        return `    <record>
      <date>${dateStr}</date>
      <time>${timeStr}</time>
      <timestamp>${h.timestamp ?? ''}</timestamp>
      <temperature_C>${h.temp ?? ''}</temperature_C>
      <humidity_percent>${h.humidity ?? ''}</humidity_percent>
      <gas_adc>${h.gas ?? ''}</gas_adc>
    </record>`;
      })
      .join('\n');

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<telemetry_history export_date="${new Date().toISOString()}">\n${xmlRecords}\n</telemetry_history>`;

    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_session_telemetry_${Date.now()}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onNotify('Exported session telemetry XML', 'success');
  };

  const exportPDF = () => {
    setIsExportOpen(false);
    if (!history || history.length === 0) {
      onNotify('No session history available to export', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onNotify('Pop-up blocked. Please allow pop-ups to print/save PDF.', 'error');
      return;
    }

    const rowsHtml = history
      .map((h, index) => {
        const { dateStr, timeStr } = getRecordDateTime(h);
        return `
        <tr style="background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-family: monospace;">${dateStr}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-family: monospace;">${timeStr}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${h.temp !== null && h.temp !== undefined ? `${h.temp} °C` : '-'}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${h.humidity !== null && h.humidity !== undefined ? `${h.humidity} %` : '-'}</td>
          <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${h.gas !== null && h.gas !== undefined ? `${h.gas} ADC` : '-'}</td>
        </tr>
      `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nexus Telemetry Report - Save as PDF</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; color: #1e293b; font-family: system-ui, -apple-system, sans-serif; }
            }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #1e293b; max-width: 900px; margin: 0 auto; background: #fff; }
            .header { border-bottom: 2px solid #06b6d4; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 22px; font-weight: 800; color: #0891b2; margin: 0; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 25px; }
            .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
            .stat-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px; }
            .stat-val { font-size: 16px; font-weight: 700; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background-color: #0891b2; color: white; padding: 10px 12px; text-align: left; font-weight: 600; border: 1px solid #0891b2; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">ENVIRONMENTAL TELEMETRY REPORT</h1>
              <div class="subtitle">Report Date: ${new Date().toLocaleString()}</div>
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #0891b2; font-family: monospace;">NEXUS IOT SYSTEM</div>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-label">Avg Temperature</div>
              <div class="stat-val" style="color: #d97706;">${tempStats.avg} °C</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Avg Humidity</div>
              <div class="stat-val" style="color: #0284c7;">${humidityStats.avg} %</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Avg Gas ADC</div>
              <div class="stat-val" style="color: #e11d48;">${gasStats.avg} ADC</div>
            </div>
          </div>

          <h3 style="font-size: 14px; margin-bottom: 10px; color: #334155;">Session Records (${history.length} Entries)</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Temperature (°C)</th>
                <th>Humidity (%)</th>
                <th>Gas ADC</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            Nexus IoT System • Environmental Telemetry Data Export
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    onNotify('Opening PDF print preview. Select "Save as PDF".', 'success');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
            SESSION TELEMETRY ANALYTICS
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-cyan-400" /> HISTORICAL ANALYTICS
          </h1>
          <p className="text-sm text-slate-400">
            In-depth statistical analysis & rolling session data logging.
          </p>
        </div>

        {/* Export Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> <span>Export</span><span className="hidden sm:inline"> Data</span> <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isExportOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-52 export-dropdown-menu rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden py-1.5"
              >
                <button
                  onClick={exportPDF}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold export-dropdown-item export-item-pdf transition-colors text-left cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-cyan-400 shrink-0" /> Save as PDF (.pdf)
                </button>
                <button
                  onClick={exportXML}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold export-dropdown-item export-item-xml transition-colors text-left cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-amber-400 shrink-0" /> Export XML (.xml)
                </button>
                <button
                  onClick={exportCSV}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold export-dropdown-item export-item-csv transition-colors text-left cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" /> Export CSV (.csv)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Analytics Chart */}
      <motion.div variants={item}>
        <SensorChart history={history} metric="all" title="MULTI-SENSOR TELEMETRY TIMELINE" onClearHistory={onClearHistory} onNotify={onNotify} isDeviceOffline={isDeviceOffline} />
      </motion.div>

      {/* Statistical Summary Grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Temperature Stats */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Thermometer className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-white text-base">TEMPERATURE STATS</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Minimum Reading</span>
              <span className="font-bold text-slate-200 tabular-nums">{tempStats.min} °C</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Average Session Temp</span>
              <span className="font-bold text-amber-400 tabular-nums">{tempStats.avg} °C</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Maximum Reading</span>
              <span className="font-bold text-slate-200 tabular-nums">{tempStats.max} °C</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Current Trend</span>
              <span className="font-bold text-cyan-400 capitalize">{tempStats.trend}</span>
            </div>
          </div>
        </div>

        {/* Humidity Stats */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-white text-base">HUMIDITY STATS</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Minimum Reading</span>
              <span className="font-bold text-slate-200 tabular-nums">{humidityStats.min} %</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Average Session Humidity</span>
              <span className="font-bold text-cyan-400 tabular-nums">{humidityStats.avg} %</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Maximum Reading</span>
              <span className="font-bold text-slate-200 tabular-nums">{humidityStats.max} %</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Current Trend</span>
              <span className="font-bold text-cyan-400 capitalize">{humidityStats.trend}</span>
            </div>
          </div>
        </div>

        {/* Gas Stats */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-white text-base">GAS SENSOR STATS</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Minimum Reading</span>
              <span className="font-bold text-slate-200 tabular-nums">{gasStats.min} ADC</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Average Session Gas</span>
              <span className="font-bold text-rose-400 tabular-nums">{gasStats.avg} ADC</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Maximum Reading</span>
              <span className="font-bold text-slate-200 tabular-nums">{gasStats.max} ADC</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Current Trend</span>
              <span className="font-bold text-cyan-400 capitalize">{gasStats.trend}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
