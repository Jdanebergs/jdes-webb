"use client"
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getChartColor, getStatusCssVar } from '@/lib/chartUtils';

function MonthTick({ x, y, payload, data, index, isMobile }) {
  const row = data.find(d => d.month === payload.value);
  const stationCount = row?.unique_stations;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={isMobile ? (index % 2 === 0 ? 12 : 28) : 16}
        textAnchor="middle"
        fill="#374151"
        fontSize={isMobile ? 11 : 13}
      >
        {payload.value}
      </text>
      {!isMobile && stationCount != null && (
        <text x={0} y={0} dy={32} textAnchor="middle" fill="#9ca3af" fontSize={11}>
          {stationCount} stationer
        </text>
      )}
    </g>
  );
}

export default function TrendChart({ data, statuses }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center pt-20">Ingen historisk data tillgänglig.</div>;
  }

  const threshold = 0.5;
  const filteredData = data.map((row) => {
    const updatedRow = { ...row };
    statuses.forEach((status) => {
      const value = Number(row[status]);
      updatedRow[status] = value >= threshold ? value : null;
    });
    return updatedRow;
  });

  const preferredStackOrder = ['Laddar', 'Tillgänglig', 'Ur funktion', 'Blockerad', 'Reserverad', 'Okänd'];
  const activeStatuses = preferredStackOrder.filter((status) =>
    statuses.includes(status) && filteredData.some((row) => Number(row[status]) >= threshold)
  );

  const legendPayload = activeStatuses.map((status) => ({
    id: status,
    value: status.charAt(0).toUpperCase() + status.slice(1),
    type: 'square',
    color: getStatusCssVar(status),
  }));

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-xl font-semibold text-gray-800 text-center mt-2 mb-4">
        Utveckling över tid (% per månad)
      </h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            interval={0}
            tick={(props) => <MonthTick {...props} data={filteredData} isMobile={isMobile} />}
            height={isMobile ? 58 : 50}
          />
          <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
          
          {activeStatuses.map((status) => (
            <Bar 
              key={status} 
              dataKey={status} 
              stackId="a" 
              fill={getStatusCssVar(status)} 
              name={status.charAt(0).toUpperCase() + status.slice(1)} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-slate-700">
        {legendPayload.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
