import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Advocate } from '../types';

interface WorkloadChartProps {
  advocates: Advocate[];
}

export const WorkloadChart: React.FC<WorkloadChartProps> = ({ advocates }) => {
  const chartData = advocates.map((adv) => ({
    name: adv.name.replace('Adv. ', ''),
    shortName: adv.name.split(' ').slice(-1)[0],
    cases: adv.activeCasesCount,
    practiceArea: adv.practiceArea || 'Commercial Law',
    title: adv.title,
  }));

  const brandColors = ['#2563eb', '#1d4ed8', '#0284c7', '#0d9488', '#4f46e5'];

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-serif-title text-base font-bold text-slate-900">
              Advocate Workload & Active Matter Allocation
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Active matter assignment and capacity across Chambers Counsel
          </p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-5 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="shortName"
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-white text-xs shadow-lg">
                      <p className="font-bold text-blue-400">{data.name}</p>
                      <p className="text-[10px] text-slate-400">{data.title}</p>
                      <div className="mt-2 space-y-1 text-slate-200">
                        <p>Department: <span className="font-bold text-white">{data.practiceArea}</span></p>
                        <p>Active Matters: <span className="font-bold text-teal-400">{data.cases} files</span></p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="cases"
              radius={[4, 4, 0, 0]}
              maxBarSize={44}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={brandColors[index % brandColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Advocates Roster Breakdown Footbar */}
      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-5 text-center">
        {chartData.map((adv, i) => (
          <div key={i} className="rounded-lg bg-slate-50 p-2 border border-slate-200/60">
            <p className="font-bold text-xs text-slate-900 truncate">{adv.name}</p>
            <p className="text-[10px] text-slate-500 font-medium">{adv.cases} matters assigned</p>
          </div>
        ))}
      </div>
    </div>
  );
};

