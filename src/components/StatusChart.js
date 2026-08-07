"use client"
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getStatusCssVar } from '@/lib/chartUtils';

// Vi lägger till "monthName" som en prop (variabel) vi kan ta emot
export default function StatusChart({ data, monthName }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center pt-20">Ingen data att visa ännu.</div>;
  }

  // Convert value strings to numbers, remove tiny slices, and sort biggest-first
  const filteredData = data
    .map((entry) => ({
      ...entry,
      value: Number(entry.value)
    }))
    .filter((entry) => entry.value >= 0.5)
    .sort((a, b) => b.value - a.value);

  const preferredOrder = ['Laddar', 'Tillgänglig', 'Ur funktion', 'Blockerad', 'Reserverad', 'Okänd'];

  // Build legend payload in preferred order (exclude slices filtered out above).
  const visibleNames = new Set(filteredData.map((e) => e.name));
  const legendPayload = preferredOrder
    .filter((s) => visibleNames.has(s))
    .concat([...visibleNames].filter((s) => !preferredOrder.includes(s)))
    .map((name) => ({ id: name, value: name, type: 'square', color: getStatusCssVar(name) }));

  

  if (filteredData.length === 0) {
    return <div className="text-gray-500 text-center pt-20">Ingen tillräckligt stor data att visa ännu.</div>;
  }

  const renderMobileLabel = ({ cx, cy, midAngle, outerRadius, value, payload }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const labelColor = getStatusCssVar(payload?.name);

    return (
      <text
        x={x}
        y={y}
        fill={labelColor}
        fontSize={13}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${Math.round(value)}%`}
      </text>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Vår nya dynamiska titel! */}
      <h3 className="text-xl font-semibold text-gray-800 text-center mt-0 mb-1">
        Tillgänglighet under {monthName}
      </h3>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
          <Pie 
            data={filteredData} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="52%" 
            outerRadius={isMobile ? "70%" : "92%"} 
            labelLine={!isMobile}
            // Lägger till % direkt på siffrorna i tårtbitarna
            label={isMobile ? renderMobileLabel : ({ value }) => `${Math.round(value)}%`} 
          >
            {filteredData.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={getStatusCssVar(entry.name)} />
            ))}
          </Pie>
          {/* Lägger till % i rutan som dyker upp när man hovrar med musen */}
          <Tooltip formatter={(value) => `${Math.round(value)}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Explicit legend rendered from sorted legendPayload to guarantee order
          and preserve the default horizontal, wrapped layout. */}
      <div className="mt-1 flex flex-wrap justify-center gap-3 text-sm text-slate-700">
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