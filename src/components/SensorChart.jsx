import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart2, Info, Loader2, Sparkles, Download, ChevronDown, Printer, FileCode, FileText } from 'lucide-react';
import { subscribeToSensorHistory } from '../services/firestoreService';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const timestamp = dataPoint.timestamp || label;
    const dateObj = timestamp ? new Date(timestamp) : new Date();
    const dateStr = dataPoint.dateStr || dateObj.toLocaleDateString([], { day: '2-digit', month: 'short' });
    const timeStr = dataPoint.time || dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
      <div className="clay-card p-3 border border-cyan-500/30 text-xs shadow-2xl backdrop-blur-xl">
        <p className="font-bold font-mono text-cyan-300 mb-1 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
          <span>{dateStr}</span>
          <span className="text-white">{timeStr}</span>
        </p>
        <div className="space-y-1 mt-1.5 font-mono">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white tabular-nums">
                {entry.value !== null && entry.value !== undefined ? `${entry.value} ${entry.dataKey === 'temp' ? '°C' : '%'}` : '--'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function SensorChart({
  history = [],
  metric = 'all', // 'all' | 'temp' | 'humidity'
  title = 'ENVIRONMENTAL TELEMETRY TIMELINE',
  onClearHistory,
  onNotify,
  isDeviceOffline = false,
}) {
  const [rangeFilter, setRangeFilter] = useState('1h'); // '1h' | '6h' | '24h' | '3d' | '7d' | 'custom'
  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Custom date range inputs (format: YYYY-MM-THH:mm)
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date(Date.now() - 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [customEnd, setCustomEnd] = useState('');

  const [firestoreData, setFirestoreData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveNow, setLiveNow] = useState(Date.now());

  // Preset range metadata options
  const presetOptions = useMemo(
    () => [
      { value: '1h', label: 'Last 1 Hour', shortLabel: '1h', ms: 60 * 60 * 1000 },
      { value: '2h', label: 'Last 2 Hours', shortLabel: '2h', ms: 2 * 60 * 60 * 1000 },
      { value: '6h', label: 'Last 6 Hours', shortLabel: '6h', ms: 6 * 60 * 60 * 1000 },
      { value: '24h', label: 'Last 24 Hours', shortLabel: '24h', ms: 24 * 60 * 60 * 1000 },
      { value: '3d', label: 'Last 3 Days', shortLabel: '3d', ms: 3 * 24 * 60 * 60 * 1000 },
      { value: '7d', label: 'Last 7 Days', shortLabel: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
      { value: 'custom', label: 'Custom Range...', shortLabel: 'Custom', ms: 0 },
    ],
    []
  );

  // Determine current active start Date and end (Date or 'now')
  const { start, end, isLive } = useMemo(() => {
    const now = Date.now();

    if (rangeFilter === 'custom') {
      const startDate = customStart ? new Date(customStart) : new Date(now - 3600 * 1000);
      const endDate = customEnd ? new Date(customEnd) : 'now';
      return {
        start: startDate,
        end: endDate,
        isLive: endDate === 'now',
      };
    }

    const preset = presetOptions.find((p) => p.value === rangeFilter) || presetOptions[0];
    return {
      start: new Date(now - preset.ms),
      end: 'now',
      isLive: true,
    };
  }, [rangeFilter, customStart, customEnd, presetOptions]);

  // Periodic ticker to advance live present right-edge anchor
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setLiveNow(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Firestore Query & Subscription Manager
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToSensorHistory({ start, end }, (records, isLoading, err) => {
      if (err) {
        setError(err);
        setLoading(false);
        return;
      }
      setFirestoreData(records || []);
      setLoading(isLoading);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [start, end]);

  // Select active data source strictly filtered within [startTime, endTime]
  const activeRecords = useMemo(() => {
    let records = firestoreData;
    if (!records || records.length === 0) {
      records = history || [];
    }

    const startTime = start.getTime();
    const endTime = end === 'now' ? liveNow : (end instanceof Date ? end.getTime() : liveNow);

    const filtered = records.filter((h) => {
      if (!h || !h.timestamp || typeof h.timestamp !== 'number' || isNaN(h.timestamp)) return false;
      return h.timestamp >= startTime && h.timestamp <= endTime;
    });

    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  }, [firestoreData, history, start, end, liveNow]);

  // Downsample data for smooth chart rendering
  const chartData = useMemo(() => {
    const raw = activeRecords;
    const maxPoints = rangeFilter === '7d' ? 180 : rangeFilter === '3d' ? 150 : rangeFilter === '24h' ? 140 : 120;
    let baseData = raw;
    if (raw.length > maxPoints) {
      const bucketSize = Math.ceil(raw.length / maxPoints);
      const downsampled = [];

      for (let i = 0; i < raw.length; i += bucketSize) {
        const bucket = raw.slice(i, i + bucketSize);
        const temps = bucket.map((b) => b.temp).filter((v) => typeof v === 'number' && !isNaN(v));
        const hums = bucket.map((b) => b.humidity).filter((v) => typeof v === 'number' && !isNaN(v));

        const avgTemp = temps.length ? Number((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)) : null;
        const avgHum = hums.length ? Number((hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1)) : null;

        const representative = bucket[Math.floor(bucket.length / 2)];
        downsampled.push({
          id: representative.id,
          time: representative.time,
          dateStr: representative.dateStr,
          timestamp: representative.timestamp,
          temp: avgTemp,
          humidity: avgHum,
        });
      }
      baseData = downsampled;
    }

    if (isDeviceOffline) {
      const now = liveNow || Date.now();
      const dateObj = new Date(now);
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

      const nowOfflinePoint = {
        id: `offline-now-${now}`,
        timestamp: now,
        time: timeStr,
        dateStr,
        temp: 0,
        humidity: 0,
        gas: 0,
      };

      if (baseData.length === 0) {
        return [nowOfflinePoint];
      }

      const lastPoint = baseData[baseData.length - 1];

      // If lastPoint in baseData is already an offline point (0 temp & 0 humidity)
      if (lastPoint && lastPoint.temp === 0 && lastPoint.humidity === 0) {
        const updated = [...baseData];
        if (now - lastPoint.timestamp > 1500) {
          updated.push(nowOfflinePoint);
        } else {
          updated[updated.length - 1] = {
            ...lastPoint,
            timestamp: now,
            time: timeStr,
            dateStr,
            temp: 0,
            humidity: 0,
            gas: 0,
          };
        }
        return updated;
      }

      // If lastPoint was a valid online reading, create a drop point to 0 right after lastPoint
      const dropTime = Math.min(now, (lastPoint.timestamp || now) + 2000);
      const dropDateObj = new Date(dropTime);
      const dropTimeStr = dropDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dropDateStr = dropDateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

      const dropPoint = {
        id: `offline-drop-${dropTime}`,
        timestamp: dropTime,
        time: dropTimeStr,
        dateStr: dropDateStr,
        temp: 0,
        humidity: 0,
        gas: 0,
      };

      if (now - dropTime > 2000) {
        return [...baseData, dropPoint, nowOfflinePoint];
      }

      return [...baseData, dropPoint];
    }

    return baseData;
  }, [activeRecords, rangeFilter, isDeviceOffline, liveNow]);

  // Dynamic X-Axis Domain Bound: automatically aligns to the earliest actual data timestamp
  // so the chart fills the X-axis starting directly from the initial left boundary without empty gaps.
  const xDomain = useMemo(() => {
    const startMs = start.getTime();
    const endMs = end === 'now' ? liveNow : (end instanceof Date ? end.getTime() : liveNow);

    let effectiveStartMs = startMs;
    if (chartData && chartData.length > 0) {
      const firstPointMs = chartData[0]?.timestamp;
      if (typeof firstPointMs === 'number' && !isNaN(firstPointMs)) {
        // Adjust start bound to earliest data point if data started after default start time
        effectiveStartMs = Math.max(startMs, firstPointMs);
      }
    }

    let finalEndMs = endMs;
    if (!effectiveStartMs || !finalEndMs || effectiveStartMs >= finalEndMs) {
      const now = Date.now();
      effectiveStartMs = now - 3600 * 1000;
      finalEndMs = now;
    }

    // Ensure at least 60 seconds span for smooth rendering
    if (finalEndMs - effectiveStartMs < 60000) {
      effectiveStartMs = finalEndMs - 60000;
    }

    return [effectiveStartMs, finalEndMs];
  }, [start, end, liveNow, chartData]);

  // Calculate clean, evenly-spaced time ticks across full X-Axis domain
  const xAxisTicks = useMemo(() => {
    const [startMs, endMs] = xDomain;
    const totalMs = endMs - startMs;
    if (!startMs || !endMs || totalMs <= 0) return [];

    const numTicks = 6;
    const intervalMs = totalMs / (numTicks - 1);
    const result = [];
    for (let i = 0; i < numTicks; i++) {
      result.push(Math.round(startMs + i * intervalMs));
    }
    return result;
  }, [xDomain]);

  // Comfort climate assessment
  const comfortStatus = useMemo(() => {
    if (activeRecords.length === 0) return 'No Data';

    const validTemps = activeRecords.map((d) => d.temp).filter((v) => typeof v === 'number' && !isNaN(v));
    const validHums = activeRecords.map((d) => d.humidity).filter((v) => typeof v === 'number' && !isNaN(v));

    const avgTempNum = validTemps.length ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : null;
    const avgHumNum = validHums.length ? validHums.reduce((a, b) => a + b, 0) / validHums.length : null;

    if (avgTempNum !== null && avgHumNum !== null) {
      if (avgTempNum > 28 || avgHumNum > 70) return 'Warm & Humid';
      if (avgTempNum < 18 || avgHumNum < 35) return 'Cool & Dry';
      if (avgHumNum > 60) return 'Moist Climate';
    }
    return 'Optimal Comfort';
  }, [activeRecords]);

  // Export telemetry records (CSV, XML, PDF)
  const getRecordsToExport = () => {
    if (activeRecords && activeRecords.length > 0) return activeRecords;
    return history || [];
  };

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
    const records = getRecordsToExport();
    if (!records || records.length === 0) {
      if (onNotify) onNotify('No session history available to export', 'error');
      return;
    }

    const headers = ['Date', 'Time', 'Timestamp', 'Temperature (°C)', 'Humidity (%)', 'Gas (Raw ADC)'];
    const rows = records.map((h) => {
      const { dateStr, timeStr } = getRecordDateTime(h);
      return [dateStr, timeStr, h.timestamp || '', h.temp ?? '', h.humidity ?? '', h.gas ?? ''];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onNotify) onNotify('Exported telemetry CSV', 'success');
  };

  const exportXML = () => {
    setIsExportOpen(false);
    const records = getRecordsToExport();
    if (!records || records.length === 0) {
      if (onNotify) onNotify('No session history available to export', 'error');
      return;
    }

    const xmlRecords = records
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
    link.download = `nexus_telemetry_${Date.now()}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onNotify) onNotify('Exported telemetry XML', 'success');
  };

  const exportPDF = () => {
    setIsExportOpen(false);
    const records = getRecordsToExport();
    if (!records || records.length === 0) {
      if (onNotify) onNotify('No session history available to export', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (onNotify) onNotify('Pop-up blocked. Please allow pop-ups to print/save PDF.', 'error');
      return;
    }

    const rowsHtml = records
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

    const validTemps = records.map((d) => d.temp).filter((v) => typeof v === 'number' && !isNaN(v));
    const validHums = records.map((d) => d.humidity).filter((v) => typeof v === 'number' && !isNaN(v));
    const validGas = records.map((d) => d.gas).filter((v) => typeof v === 'number' && !isNaN(v));

    const avgTemp = validTemps.length ? (validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(1) : '--';
    const avgHum = validHums.length ? (validHums.reduce((a, b) => a + b, 0) / validHums.length).toFixed(1) : '--';
    const avgGas = validGas.length ? (validGas.reduce((a, b) => a + b, 0) / validGas.length).toFixed(1) : '--';

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
              <div class="stat-val" style="color: #d97706;">${avgTemp} °C</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Avg Humidity</div>
              <div class="stat-val" style="color: #0284c7;">${avgHum} %</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Avg Gas ADC</div>
              <div class="stat-val" style="color: #e11d48;">${avgGas} ADC</div>
            </div>
          </div>

          <h3 style="font-size: 14px; margin-bottom: 10px; color: #334155;">Session Records (${records.length} Entries)</h3>
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
    if (onNotify) onNotify('Opening PDF print preview. Select "Save as PDF".', 'success');
  };

  // X-Axis Tick Label Formatter based on active range
  const formatXAxisTick = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) return '';
    const d = new Date(timestamp);
    if (rangeFilter === '7d' || rangeFilter === '3d') {
      return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    if (rangeFilter === '24h' || rangeFilter === '6h') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="clay-card p-3 sm:p-5">
      {/* Compact Integrated Header Bar */}
      <div className="flex flex-col gap-2.5 mb-3">
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 clay-badge shrink-0">
              <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-bold text-white text-xs sm:text-base leading-tight truncate sm:whitespace-normal">{title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Export Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] sm:text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
                <span className="hidden sm:inline">Data</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isExportOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 sm:w-52 export-dropdown-menu rounded-xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden py-1.5"
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
          </div>
        </div>

        {/* Time Range Pills Controls */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {presetOptions.map((opt) => {
              const isSelected = rangeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setRangeFilter(opt.value)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold font-mono transition-all shrink-0 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-cyan-500/40 hover:text-white'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>

          {rangeFilter === 'custom' && (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-mono shrink-0">
              <input
                type="datetime-local"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-[#090e18] text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 focus:outline-none"
              />
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                placeholder="Now"
                className="bg-[#090e18] text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Full-Width Chart Area with Full Range Bound X-Axis */}
      <div className="w-full h-56 sm:h-72">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center clay-inset-dark text-slate-400">
            <Loader2 className="w-7 h-7 mb-2 text-cyan-400 animate-spin" />
            <span className="text-xs font-mono text-cyan-300">Loading historical telemetry...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tempOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>

                <linearGradient id="humidityBlueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              {/* Bound X-Axis dynamically from selected past start time to present now with clean synchronized ticks */}
              <XAxis
                type="number"
                dataKey="timestamp"
                scale="time"
                domain={xDomain}
                ticks={xAxisTicks}
                tickFormatter={formatXAxisTick}
                padding={{ left: 0, right: 0 }}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              {/* Left Y-Axis for Temperature (°C) */}
              {(metric === 'all' || metric === 'temp') && (
                <YAxis
                  yAxisId="temp"
                  orientation="left"
                  width={32}
                  stroke="#f59e0b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 'auto']}
                />
              )}

              {/* Right Y-Axis for Humidity (%) */}
              {(metric === 'all' || metric === 'humidity') && (
                <YAxis
                  yAxisId="humidity"
                  orientation="right"
                  width={32}
                  stroke="#06b6d4"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
              )}

              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} />

              {(metric === 'all' || metric === 'temp') && (
                <Area
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temp"
                  name="Temperature (°C)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#tempOrangeGradient)"
                  isAnimationActive={true}
                  connectNulls={true}
                />
              )}

              {(metric === 'all' || metric === 'humidity') && (
                <Area
                  yAxisId="humidity"
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (%)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#humidityBlueGradient)"
                  isAnimationActive={true}
                  connectNulls={true}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
