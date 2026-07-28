import { getChartColor, getStatusCssVar } from '@/lib/chartUtils';

export default function WorstStationsTable({ data, monthName }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <p>Inga driftstörningar (Out of order) registrerades under {monthName}.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <h3 className="text-xl font-semibold text-gray-800 text-center mt-2 mb-6">
        Högst andel nedtid ({monthName})
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-gray-600">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold">Station</th>
              <th scope="col" className="px-6 py-3 font-semibold text-right">Andel ur funktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.map((station, index) => (
              <tr key={station.nobil_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <span 
                    className="flex items-center justify-center min-w-[24px] h-6 mr-4 text-xs font-bold rounded-full"
                    style={{
                      backgroundColor: getStatusCssVar('outoforder'),
                      color: '#fff'
                    }}
                  >
                    {index + 1}
                  </span>
                  <div className="flex flex-col">
                    {/* Huvudnamnet: T.ex. "Circle K - Vädermotet" */}
                    <span className="font-medium text-gray-900">
                      {station.charger_station || "Okänd Operatör"} {station.location ? `- ${station.location}` : ""}
                    </span>
                    {/* Det underliggande system-ID:t i grått */}
                    <span className="text-xs text-gray-400 mt-0.5">
                      ID: {station.nobil_id}
                    </span>
                  </div>
                </td>
                <td 
                  className="px-6 py-4 text-right font-bold align-middle"
                  style={{ color: getStatusCssVar('outoforder') }}
                >
                  {Math.round(station.error_percentage)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}