"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getChartColor, getStatusCssVar } from '@/lib/chartUtils';

// Radbrytning för stationsnamn: upp till 4 rader för att minska överlapp.
const CustomXAxisTick = ({ x, y, payload }) => {
  const text = String(payload.value || '');
  const words = text.split(/\s+/).filter(Boolean);
  const maxCharsPerLine = 12;
  const maxLines = 4;
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      return;
    }
    if (currentLine) lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);

  let visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    visibleLines[maxLines - 1] = `${visibleLines[maxLines - 1].slice(0, Math.max(0, maxCharsPerLine - 1))}…`;
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={11}>
        {visibleLines.map((line, index) => (
          <tspan key={`${line}-${index}`} textAnchor="middle" x="0" dy={index === 0 ? 0 : 14}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

export default function TopOccupiedChart({ data, statuses, monthName }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center pt-20">Ingen data tillgänglig för förra månaden.</div>;
  }

  // Compute total percentage per status across all stations so we can
  // build a legend payload sorted by largest total to smallest.
  const legendPayload = [...statuses]
    .map((s) => ({ status: s, total: data.reduce((acc, row) => acc + (Number(row[s]) || 0), 0) }))
    .sort((a, b) => b.total - a.total)
    .map((x) => ({ id: x.status, value: x.status, type: 'square', color: getStatusCssVar(x.status) }));

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-xl font-semibold text-gray-800 text-center mt-2 mb-4">
        Topp 10: Högst beläggning under {monthName}
      </h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 5, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          
          <XAxis 
            dataKey="station" 
            interval={0} 
            tick={<CustomXAxisTick />}
            height={78}
            tickMargin={12}
          />
          
          <YAxis 
            tickFormatter={(value) => `${value}%`} 
            domain={[0, 100]} 
            ticks={[0, 25, 50, 75, 100]} 
          />
          
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
          
          {statuses.map((status) => (
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
      <div className="mt-0.5 flex flex-wrap justify-center gap-4 text-sm text-slate-700">
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