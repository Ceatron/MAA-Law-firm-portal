import React, { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  BarChart,
} from 'recharts';
import {
  Clock,
  Trophy,
  TrendingUp,
  Briefcase,
  Sparkles,
} from 'lucide-react';

export interface MatterLifecycleData {
  matterType: string;
  shortType: string;
  avgDurationMonths: number;
  avgDurationDays: number;
  successRate: number; // percentage
  totalHistoricalCases: number;
  favorableRulingsCount: number;
  outOfCourtSettlementsCount: number;
  pleadingPhaseDays: number;
  hearingPhaseDays: number;
  judgmentPhaseDays: number;
  avgFeeNoteKES: number;
}

export const MOCK_LIFECYCLE_DATA: MatterLifecycleData[] = [
  {
    matterType: 'Commercial Litigation',
    shortType: 'Commercial',
    avgDurationMonths: 18.5,
    avgDurationDays: 555,
    successRate: 84,
    totalHistoricalCases: 48,
    favorableRulingsCount: 32,
    outOfCourtSettlementsCount: 8,
    pleadingPhaseDays: 90,
    hearingPhaseDays: 320,
    judgmentPhaseDays: 145,
    avgFeeNoteKES: 2450000,
  },
  {
    matterType: 'Conveyancing & Real Estate',
    shortType: 'Conveyancing',
    avgDurationMonths: 3.2,
    avgDurationDays: 96,
    successRate: 96,
    totalHistoricalCases: 82,
    favorableRulingsCount: 75,
    outOfCourtSettlementsCount: 4,
    pleadingPhaseDays: 20,
    hearingPhaseDays: 45,
    judgmentPhaseDays: 31,
    avgFeeNoteKES: 850000,
  },
  {
    matterType: 'Constitutional & Tax',
    shortType: 'Tax & Const',
    avgDurationMonths: 24.1,
    avgDurationDays: 723,
    successRate: 78,
    totalHistoricalCases: 29,
    favorableRulingsCount: 18,
    outOfCourtSettlementsCount: 5,
    pleadingPhaseDays: 120,
    hearingPhaseDays: 420,
    judgmentPhaseDays: 183,
    avgFeeNoteKES: 3800000,
  },
  {
    matterType: 'Employment & Labour',
    shortType: 'Labour',
    avgDurationMonths: 11.4,
    avgDurationDays: 342,
    successRate: 88,
    totalHistoricalCases: 36,
    favorableRulingsCount: 24,
    outOfCourtSettlementsCount: 8,
    pleadingPhaseDays: 60,
    hearingPhaseDays: 200,
    judgmentPhaseDays: 82,
    avgFeeNoteKES: 1400000,
  },
  {
    matterType: 'Intellectual Property',
    shortType: 'IP & Tech',
    avgDurationMonths: 6.8,
    avgDurationDays: 204,
    successRate: 91,
    totalHistoricalCases: 22,
    favorableRulingsCount: 17,
    outOfCourtSettlementsCount: 3,
    pleadingPhaseDays: 40,
    hearingPhaseDays: 110,
    judgmentPhaseDays: 54,
    avgFeeNoteKES: 1750000,
  },
  {
    matterType: 'Banking & Finance',
    shortType: 'Banking',
    avgDurationMonths: 8.5,
    avgDurationDays: 255,
    successRate: 94,
    totalHistoricalCases: 65,
    favorableRulingsCount: 58,
    outOfCourtSettlementsCount: 3,
    pleadingPhaseDays: 45,
    hearingPhaseDays: 140,
    judgmentPhaseDays: 70,
    avgFeeNoteKES: 2900000,
  },
];

interface CaseLifecycleChartProps {
  onSelectTypeFilter?: (type: string) => void;
  compact?: boolean;
}

export const CaseLifecycleChart: React.FC<CaseLifecycleChartProps> = ({
  onSelectTypeFilter,
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<'combined' | 'stages'>('combined');
  const [selectedTypeDetail, setSelectedTypeDetail] = useState<MatterLifecycleData | null>(
    MOCK_LIFECYCLE_DATA[0]
  );

  const filteredData = MOCK_LIFECYCLE_DATA;

  // Summary Metrics
  const totalCases = MOCK_LIFECYCLE_DATA.reduce((acc, item) => acc + item.totalHistoricalCases, 0);
  const avgChambersDurationMonths = (
    MOCK_LIFECYCLE_DATA.reduce((acc, item) => acc + item.avgDurationMonths, 0) /
    MOCK_LIFECYCLE_DATA.length
  ).toFixed(1);
  const avgChambersSuccessRate = Math.round(
    MOCK_LIFECYCLE_DATA.reduce((acc, item) => acc + item.successRate, 0) /
      MOCK_LIFECYCLE_DATA.length
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MatterLifecycleData;
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-xs text-white shadow-xl z-50 space-y-2.5 max-w-xs">
          <div className="border-b border-slate-700 pb-2">
            <span className="text-[10px] font-mono font-bold text-blue-400">
              Practice Group Analytics
            </span>
            <h4 className="font-serif-title font-bold text-sm text-slate-100">
              {data.matterType}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Avg Duration</span>
              <span className="font-mono font-bold text-blue-400 text-xs">
                {data.avgDurationMonths} mo ({data.avgDurationDays} days)
              </span>
            </div>

            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Success Rate</span>
              <span className="font-mono font-bold text-teal-400 text-xs">
                {data.successRate}%
              </span>
            </div>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span>Historical Cases:</span>
              <span className="font-bold font-mono text-white">{data.totalHistoricalCases}</span>
            </div>
            <div className="flex justify-between">
              <span>Favorable Judgments:</span>
              <span className="font-bold font-mono text-teal-400">
                {data.favorableRulingsCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Out-of-Court Settlement:</span>
              <span className="font-bold font-mono text-amber-400">
                {data.outOfCourtSettlementsCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Avg Fee Note Value:</span>
              <span className="font-bold font-mono text-slate-200">
                KES {(data.avgFeeNoteKES / 1000000).toFixed(2)}M
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-start space-x-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-serif-title text-base font-bold text-slate-900">
                Case Life-Cycle Duration & Success Rate Analytics
              </h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200/60">
                LSK Benchmarks
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Average resolution timeline (months) vs. historical favorable outcome rates across practice groups
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs self-start sm:self-auto shrink-0">
          <button
            onClick={() => setViewMode('combined')}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'combined'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Duration vs Success Rate
          </button>
          <button
            onClick={() => setViewMode('stages')}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'stages'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phase Breakdown (Days)
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block">
              Avg Life-Cycle
            </span>
            <span className="font-serif-title font-bold text-slate-900 text-base">
              {avgChambersDurationMonths} Months
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block">
              Firm Workspace Win Rate
            </span>
            <span className="font-serif-title font-bold text-teal-700 text-base">
              {avgChambersSuccessRate}%
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block">
              Analyzed Matters
            </span>
            <span className="font-serif-title font-bold text-slate-900 text-base">
              {totalCases} Cases
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block">
              Fastest Resolution
            </span>
            <span className="font-serif-title font-bold text-amber-800 text-base">
              Conveyancing (3.2 Mo)
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'combined' ? (
            <ComposedChart
              data={filteredData}
              margin={{ top: 15, right: 25, left: -10, bottom: 20 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  setSelectedTypeDetail(e.activePayload[0].payload);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortType"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                dy={8}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fill: '#2563eb', fontSize: 10, fontWeight: 600 }}
                axisLine={{ stroke: '#2563eb' }}
                tickLine={false}
                unit=" mo"
                domain={[0, 30]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#0d9488', fontSize: 10, fontWeight: 600 }}
                axisLine={{ stroke: '#0d9488' }}
                tickLine={false}
                unit="%"
                domain={[60, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 600 }}
              />

              <Bar
                yAxisId="left"
                dataKey="avgDurationMonths"
                name="Avg Duration (Months)"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                barSize={32}
              >
                {filteredData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.matterType === selectedTypeDetail?.matterType ? '#1d4ed8' : '#3b82f6'}
                    opacity={entry.matterType === selectedTypeDetail?.matterType ? 1 : 0.8}
                  />
                ))}
              </Bar>

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="successRate"
                name="Success Rate (%)"
                stroke="#0d9488"
                strokeWidth={3}
                dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, stroke: '#0d9488', strokeWidth: 2 }}
              />
            </ComposedChart>
          ) : (
            <BarChart
              data={filteredData}
              margin={{ top: 15, right: 25, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortType"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                unit=" days"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 600 }} />

              <Bar
                dataKey="pleadingPhaseDays"
                name="Pleadings & Motion (Days)"
                stackId="a"
                fill="#60a5fa"
              />
              <Bar
                dataKey="hearingPhaseDays"
                name="Hearing & Arguments (Days)"
                stackId="a"
                fill="#1e40af"
              />
              <Bar
                dataKey="judgmentPhaseDays"
                name="Rulings & Execution (Days)"
                stackId="a"
                fill="#0d9488"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Selected Practice Area Detail */}
      {selectedTypeDetail && (
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="font-serif-title font-bold text-slate-900 text-sm">
                Practice Group Breakdown: {selectedTypeDetail.matterType}
              </span>
            </div>

            <span className="text-[11px] font-mono font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded border border-blue-200 shadow-2xs">
              Avg {selectedTypeDetail.avgDurationMonths} Months • Win Rate {selectedTypeDetail.successRate}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-semibold block">Total Historical Cases</span>
              <span className="font-bold font-mono text-slate-900 text-sm">
                {selectedTypeDetail.totalHistoricalCases} Matters
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-semibold block">Favorable Decrees</span>
              <span className="font-bold font-mono text-teal-700 text-sm">
                {selectedTypeDetail.favorableRulingsCount} ({Math.round((selectedTypeDetail.favorableRulingsCount / selectedTypeDetail.totalHistoricalCases) * 100)}%)
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-semibold block">ADR Settlements</span>
              <span className="font-bold font-mono text-amber-700 text-sm">
                {selectedTypeDetail.outOfCourtSettlementsCount} ({Math.round((selectedTypeDetail.outOfCourtSettlementsCount / selectedTypeDetail.totalHistoricalCases) * 100)}%)
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-semibold block">Avg Fee Note Value</span>
              <span className="font-bold font-mono text-blue-700 text-sm">
                KES {(selectedTypeDetail.avgFeeNoteKES / 1000000).toFixed(2)}M
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

