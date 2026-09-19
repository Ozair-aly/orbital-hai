import { useEffect } from 'react';
import {
  PieChart as PieChartIcon,
  BarChart2,
  Clock,
  Download,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useExperimentStore } from '../store/experimentStore';
import { getResults, exportCSVUrl } from '../services/api';
import type { ActivitySummary } from '../types';

const ACTIVITY_COLORS: Record<string, string> = {
  Walking: '#3978E8',
  Running: '#8B5CF6',
  Standing: '#10B981',
  Sitting: '#F59E0B',
  'Lying Down': '#6366F1',
  Unknown: '#94A3B8',
};

export function ResultsAnalysis() {
  const {
    experiment,
    predictions,
    results,
    setResults,
    nextStep,
  } = useExperimentStore();

  useEffect(() => {
    if (experiment && (!results || results.predictions.length !== predictions.length)) {
      getResults(experiment.id)
        .then((res) => setResults(res))
        .catch((err) => console.warn('Could not load experiment results:', err));
    }
  }, [experiment, predictions.length]);

  const summaries: ActivitySummary[] = results?.activity_summary || [];

  const pieData = summaries.map((s) => ({
    name: s.activity,
    value: s.percentage,
    count: s.count,
    seconds: s.total_seconds,
  }));

  const barData = summaries.map((s) => ({
    activity: s.activity,
    confidence: Number((s.avg_confidence * 100).toFixed(1)),
    duration: s.total_seconds,
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EFF4FD] text-[#3978E8] uppercase tracking-wider">
              Step 04 / Results & Telemetry Analysis
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
              Aggregation Verified
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#172B4D]">
            Activity Timeline & Kinematic Distribution
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Evaluated from {results?.total_windows || predictions.length} classified time windows | Total Duration: {results?.duration_seconds?.toFixed(1) || (predictions.length * 2).toFixed(1)}s
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {experiment && (
            <a
              href={exportCSVUrl(experiment.id)}
              download
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border border-[#E5EAF2] bg-white hover:bg-[#F7F9FC] text-[#172B4D] shadow-xs transition-all"
            >
              <Download size={14} className="text-[#3978E8]" />
              <span>Export CSV</span>
            </a>
          )}

          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-[#3978E8] text-white hover:bg-blue-600 shadow-sm transition-all"
          >
            <span>Proceed to Report</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Activity Timeline Ribbon */}
      <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#172B4D] mb-1 flex items-center gap-2">
          <Clock size={16} className="text-[#3978E8]" />
          Sequential Activity Timeline Ribbon
        </h3>
        <p className="text-xs text-[#718096] mb-4">
          Chronological progression across consecutive 2-second windows
        </p>

        {predictions.length === 0 ? (
          <p className="text-xs text-[#A0AEC0] italic py-3">No activity windows available to render timeline.</p>
        ) : (
          <div className="space-y-3">
            {/* Horizontal Timeline Bar */}
            <div className="w-full h-8 flex rounded-lg overflow-hidden border border-[#E5EAF2] bg-[#F7F9FC]">
              {predictions.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: ACTIVITY_COLORS[p.predicted] || '#94A3B8',
                    flex: 1,
                  }}
                  title={`Window ${idx + 1}: ${p.predicted} (${(p.confidence * 100).toFixed(0)}% conf)`}
                  className="hover:opacity-80 transition-opacity cursor-pointer border-r border-white/20 last:border-none"
                />
              ))}
            </div>

            {/* Timeline Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              {Object.entries(ACTIVITY_COLORS).map(([name, color]) => {
                const count = predictions.filter((p) => p.predicted === name).length;
                if (count === 0) return null;
                return (
                  <div key={name} className="flex items-center gap-1.5 font-medium text-[#172B4D]">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                    <span>{name}</span>
                    <span className="text-[11px] text-[#718096]">({count}w)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution Pie */}
        <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-[#172B4D] mb-1 flex items-center gap-2">
            <PieChartIcon size={16} className="text-[#3978E8]" />
            Activity Duration Distribution
          </h3>
          <p className="text-xs text-[#718096] mb-4">Percentage of total time allocated per state</p>

          {pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#A0AEC0]">
              Awaiting data to compute distribution
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ACTIVITY_COLORS[entry.name] || '#94A3B8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Time Share']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5EAF2',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Average Confidence by Class */}
        <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-[#172B4D] mb-1 flex items-center gap-2">
            <BarChart2 size={16} className="text-[#10B981]" />
            Average Model Confidence by Activity
          </h3>
          <p className="text-xs text-[#718096] mb-4">Mean softmax probability assigned during classification</p>

          {barData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#A0AEC0]">
              Awaiting data to compute metrics
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" vertical={false} />
                  <XAxis
                    dataKey="activity"
                    tick={{ fontSize: 11, fill: '#718096' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5EAF2' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#718096' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5EAF2' }}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Avg Confidence']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5EAF2',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="confidence"
                    name="Confidence (%)"
                    fill="#3978E8"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Tabular Analysis Summary */}
      <div className="bg-white border border-[#E5EAF2] rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#172B4D] mb-1">
          Detailed Activity Metrics Summary
        </h3>
        <p className="text-xs text-[#718096] mb-4">
          Calculated strictly from live session window records
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-[#E5EAF2] text-[#718096] bg-[#F7F9FC]">
                <th className="py-2.5 px-4">Activity</th>
                <th className="py-2.5 px-4">Total Windows</th>
                <th className="py-2.5 px-4">Duration (Seconds)</th>
                <th className="py-2.5 px-4">Proportion</th>
                <th className="py-2.5 px-4">Average Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F8]">
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#A0AEC0]">
                    No summary data available.
                  </td>
                </tr>
              ) : (
                summaries.map((s) => (
                  <tr key={s.activity} className="hover:bg-[#FAFBFD]">
                    <td className="py-2.5 px-4 font-semibold text-[#172B4D] flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: ACTIVITY_COLORS[s.activity] || '#94A3B8' }}
                      />
                      {s.activity}
                    </td>
                    <td className="py-2.5 px-4 font-mono">{s.count}</td>
                    <td className="py-2.5 px-4 font-mono">{s.total_seconds.toFixed(1)}s</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#3978E8]">
                      {s.percentage.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold">
                      {(s.avg_confidence * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
