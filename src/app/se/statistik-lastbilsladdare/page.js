import { createClient } from '@supabase/supabase-js'
import StatusChart from '@/components/StatusChart'
import TrendChart from '@/components/TrendChart'
import WorstStationsTable from '@/components/WorstStationsTable'
import TopOccupiedChart from '@/components/TopOccupiedChart'

export const revalidate = 60; 

const MONTH_NAMES = {
  1: "Januari", 2: "Februari", 3: "Mars", 4: "April", 5: "Maj", 6: "Juni",
  7: "Juli", 8: "Augusti", 9: "September", 10: "Oktober", 11: "November", 12: "December"
};

// --- Vår nya översättningsordlista ---
const translateStatus = (status) => {
  if (!status) return "Okänd";
  const s = status.toUpperCase();
  if (s === 'AVAILABLE') return 'Tillgänglig';
  if (s === 'CHARGING') return 'Laddar';
  if (s === 'OUTOFORDER') return 'Ur funktion';
  if (s === 'BLOCKED') return 'Blockerad';
  if (s === 'RESERVED') return 'Reserverad';
  if (s === 'UNKNOWN') return 'Okänd';
  // Fallback: Gör första bokstaven stor om den saknas i listan
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export default async function Statistik() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )

  // --- Kör frågor sekventiellt för att undvika timeout ---
  const pieResponse = await supabase.from('last_month_charger_stats').select('status, total_count');
  if (pieResponse.error) console.error("Pie chart error:", pieResponse.error);

  const trendResponse = await supabase.from('monthly_charger_stats').select('year_month, status, percentage, unique_stations');
  if (trendResponse.error) console.error("Trend chart error:", trendResponse.error);

  const worstResponse = await supabase.from('worst_stations_last_3_months').select('nobil_id, error_percentage, charger_station, location');
  if (worstResponse.error) console.error("Worst stations error:", worstResponse.error);

  const worstLastMonthResponse = await supabase.from('worst_stations_last_month').select('nobil_id, error_percentage, charger_station, location');
  if (worstLastMonthResponse.error) console.error("Worst stations last month error:", worstLastMonthResponse.error);

  const occupiedResponse = await supabase.from('top_occupied_stations_last_month').select('nobil_id, charger_station, location, status, percentage');
  if (occupiedResponse.error) console.error("Occupied stations error:", occupiedResponse.error);

  // --- Hantera Pajdiagrammet ---
  const pieChartData = pieResponse.data?.map(item => ({
    name: translateStatus(item.status), // Översätts här!
    value: Number(item.total_count) 
  })) || [];

  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  const formattedMonth = MONTH_NAMES[date.getMonth() + 1];

  // --- Hantera Historisk Trend ---
  const trendDataMap = {};
  const uniqueStatuses = new Set();

  trendResponse.data?.forEach(item => {
    const swedishStatus = translateStatus(item.status); // Översätts här!
    uniqueStatuses.add(swedishStatus);
    
    const [year, monthStr] = item.year_month.split('-');
    const monthNum = parseInt(monthStr, 10);
    const displayLabel = `${MONTH_NAMES[monthNum]} ${year}`; 

    if (!trendDataMap[item.year_month]) {
      trendDataMap[item.year_month] = { month: displayLabel, sortKey: item.year_month, unique_stations: item.unique_stations };
    }
    trendDataMap[item.year_month][swedishStatus] = Number(item.percentage);
  });
  const trendChartData = Object.values(trendDataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const statusArray = Array.from(uniqueStatuses);

  // --- Hantera Topp 5 Beläggning ---
  const occupiedChartData = [];
  const occupiedStatuses = new Set();
  const stationIndices = {};

  occupiedResponse.data?.forEach(item => {
    const swedishStatus = translateStatus(item.status); // Översätts här!
    occupiedStatuses.add(swedishStatus);
    
    const stationLabel = item.charger_station 
      ? item.charger_station
      : `Station #${item.nobil_id}`;

    if (stationIndices[item.nobil_id] === undefined) {
      occupiedChartData.push({ station: stationLabel });
      stationIndices[item.nobil_id] = occupiedChartData.length - 1;
    }

    const index = stationIndices[item.nobil_id];
    occupiedChartData[index][swedishStatus] = Number(item.percentage);
  });
  const occupiedStatusArray = Array.from(occupiedStatuses);

  // --- Hantera Tabellen ---
  const worstStationsData = worstResponse.data || [];
  const worstStationsLastMonthData = worstLastMonthResponse.data || [];

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
          Dashboard: Lastbilsladdning Sverige
        </h1>
        <p className="text-gray-500 text-lg">
          Visar historisk tillgänglighet för Sveriges lastbilsladdare. Urvalet är baserat på data från{' '}
            <a 
              href="https://experience.arcgis.com/experience/3005518bcd6f45a184d028b4914143a9" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Lastbilsladdkartan
            </a>
            {' '}. Data inkluderar endast de laddstationer som kunde identifieras i NOBIL dataset och som 
            delar live data via NOBIL plattformen. En CSV fil med identifierade stationer finns tillgänglig{' '}
            <a
              href="/stationer_loggade_hemsidan.csv"
              download
              className="text-blue-600 hover:text-blue-800 underline"
            >
              här
            </a>
            . Senaste uppdateringen av laddstationer gjordes 27 juli 2026.
        </p>
        <p className="text-gray-500 text-lg mt-6">
          Data visar beläggning i form av andel av total tid som laddaren har använts och säger inget
          om hur snabbt fordonen har laddats under den tiden. Det går inte heller att distingera om
          det är personbil eller lastbil som har laddat. Långsamladdning av lastbilar (nattetid) kan vara 
          en förklaring för hög beläggningsgrad för vissa laddare.
        </p>
      </div>
      
      <div className="flex flex-col gap-10">
        
        <div className="w-full h-[24rem] bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl shadow-sm p-6 flex items-center justify-center">
          <StatusChart data={pieChartData} monthName={formattedMonth} />
        </div>

      
        <div className="w-full h-[32rem] bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl shadow-sm p-6 flex items-center justify-center">
          <TopOccupiedChart data={occupiedChartData} statuses={occupiedStatusArray} monthName={formattedMonth} />
        </div>

        <div className="w-full h-[30rem] bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl shadow-sm p-6 flex items-center justify-center">
          <TrendChart data={trendChartData} statuses={statusArray} />
        </div>

        <div className="w-full bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl shadow-sm p-6">
          <WorstStationsTable data={worstStationsData} monthName="Senaste 3 månaderna" />
        </div>

        <div className="w-full bg-[var(--color-surface)] border border-[var(--color-card-border)] rounded-2xl shadow-sm p-6">
          <WorstStationsTable data={worstStationsLastMonthData} monthName={formattedMonth} />
        </div>

      </div>

      <footer className="site-footer mt-10 text-center text-sm text-gray-600">
        <a href="https://www.linkedin.com/in/janisdanebergs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600">
          <span>Data insamlad och presenterad av Janis Daneberg</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="inline-block">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.806-1.75-1.799 0-.993.784-1.798 1.75-1.798s1.75.805 1.75 1.798c0 .993-.784 1.799-1.75 1.799zm13.5 11.268h-3v-5.604c0-1.337-.026-3.059-1.865-3.059-1.865 0-2.151 1.455-2.151 2.96v5.703h-3v-10h2.881v1.367h.041c.401-.76 1.379-1.562 2.839-1.562 3.036 0 3.598 1.998 3.598 4.596v5.599z"/>
          </svg>
        </a>
      </footer>

    </div>
  );
}