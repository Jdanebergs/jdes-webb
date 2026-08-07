"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getStatusCssVar } from '@/lib/chartUtils';

const STACK_ORDER = ["Ur funktion", "Okänd", "Tillgänglig", "Blockerad", "Laddar"];

const CustomStationTick = ({ x, y, payload, index, data }) => {
  const evseCount = data[index]?.evse_count ?? 0;

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={4} textAnchor="end" fill="#4b5563" fontSize={11}>
        {`${payload.value} (${evseCount})`}
      </text>
    </g>
  );
};

export default function Worst50OutOfOrderChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center pt-20">Ingen data tillgänglig för topp 50 ur funktion.</div>;
  }

  const normalizedData = data.map((row) => {
    const total = STACK_ORDER.reduce((acc, status) => acc + (Number(row[status]) || 0), 0);
    if (!total) return row;
    const factor = 100 / total;
    const updated = { ...row };
    STACK_ORDER.forEach((status) => {
      updated[status] = (Number(row[status]) || 0) * factor;
    });
    return updated;
  });

  const legendPayload = STACK_ORDER.map((status) => ({
    id: status,
    value: status,
    color: getStatusCssVar(status),
  }));

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-xl font-semibold text-gray-800 text-center mt-2 mb-4">
        Topp 30 stationer: Högst andel ur funktion (senaste 3 månaderna)
      </h3>
      <p className="text-sm text-gray-500 text-center mb-3">
        Visar anonymiserade stationer. Antal laddpunkter för respektive laddstation visas i parantes.
      </p>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={normalizedData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value) => `${value}%`} />
            <YAxis
              type="category"
              dataKey="station"
              width={150}
              interval={0}
              tick={(props) => <CustomStationTick {...props} data={normalizedData} />}
            />
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />

            {STACK_ORDER.map((status) => (
              <Bar
                key={status}
                dataKey={status}
                stackId="a"
                fill={getStatusCssVar(status)}
                name={status}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
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
