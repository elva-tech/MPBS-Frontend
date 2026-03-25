import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Factory,
  LandPlot,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchTopStatsMock,
  fetchMilkProcuredMock,
  fetchFinanceMock,
  fetchProcurementMock,
  fetchDairyUnitsMock,
  fetchDistrictRevenueMock,
  fetchMonthlyQualityMock,
  fetchRevenueMock,
} from "../../mock/adminDashboardData";

const COLOR_PANEL = "#FFFFFF";
const COLOR_RED = "#1E4B6B";
const COLOR_PINK = "#9DB5CC";
const COLOR_TEXT = "#1E4B6B";
const COLOR_TOP_CARD_BG = "#FFFFFF";
const COLOR_TOP_CARD_BORDER = "#D5DFEC";
const COLOR_TOP_CARD_ICON_BG = "#E4EBF5";
const COLOR_TOP_CARD_TITLE = "#617895";
const COLOR_TOP_CARD_VALUE = "#18476D";

const iconMap = {
  Building2,
  LandPlot,
  BadgeCheck,
  Factory,
};

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((part) => Math.max(0, Math.min(255, Math.round(part))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function blendHex(start, end, t) {
  const a = hexToRgb(start);
  const b = hexToRgb(end);
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  );
}

function withDataDrivenBlueScale(items) {
  const values = items.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return items.map((item) => {
    const ratio = max === min ? 1 : (item.value - min) / (max - min);
    return {
      ...item,
      fill: blendHex(COLOR_PINK, COLOR_RED, ratio),
    };
  });
}

function SmallDonut({ data, size = 75 }) {
  return (
    <ResponsiveContainer width={size} height={size}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          innerRadius={24}
          outerRadius={34}
          stroke="none"
          startAngle={90}
          endAngle={-270}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function BulletLegend({ items, suffix = "" }) {
  return (
    <div className="space-y-2 text-xs md:text-sm" style={{ color: COLOR_TEXT }}>
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.fill }} />
          <span>
            {item.name} - {item.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

function MiniPanel({ title, data, suffix = "" }) {
  return (
    <div
      className="rounded-xl p-3 shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
      style={{ background: COLOR_PANEL }}
    >
      <h3 className="text-[15px] font-medium" style={{ color: COLOR_TEXT }}>
        {title}
      </h3>
      <div className="mt-2 flex items-center justify-between gap-4">
        <SmallDonut data={data} />
        <BulletLegend items={data} suffix={suffix} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topStats, setTopStats] = useState([]);
  const [milkProcuredBase, setMilkProcuredBase] = useState([]);
  const [financeBase, setFinanceBase] = useState([]);
  const [procurementBase, setProcurementBase] = useState([]);
  const [dairyUnitsBase, setDairyUnitsBase] = useState([]);
  const [districtRevenueBase, setDistrictRevenueBase] = useState([]);
  const [monthlyQualityData, setMonthlyQualityData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [selectedQualityMonth, setSelectedQualityMonth] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMockData() {
      setLoading(true);
      setError("");
      try {
        const [
          stats,
          milkProcured,
          finance,
          procurement,
          dairyUnits,
          districtRevenue,
          monthlyQuality,
          revenue,
        ] = await Promise.all([
          fetchTopStatsMock(),
          fetchMilkProcuredMock(),
          fetchFinanceMock(),
          fetchProcurementMock(),
          fetchDairyUnitsMock(),
          fetchDistrictRevenueMock(),
          fetchMonthlyQualityMock(),
          fetchRevenueMock(),
        ]);

        if (!active) return;
        setTopStats(stats);
        setMilkProcuredBase(milkProcured);
        setFinanceBase(finance);
        setProcurementBase(procurement);
        setDairyUnitsBase(dairyUnits);
        setDistrictRevenueBase(districtRevenue);
        setMonthlyQualityData(monthlyQuality);
        setRevenueData(revenue);
        setSelectedQualityMonth(monthlyQuality[0]?.month || "");
      } catch {
        if (!active) return;
        setError("Failed to load mock dashboard data");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMockData();
    return () => {
      active = false;
    };
  }, []);

  const milkProcuredData = useMemo(
    () =>
      milkProcuredBase.map((item, index) => ({
        ...item,
        fill: index === 0 ? COLOR_RED : COLOR_PINK,
      })),
    [milkProcuredBase]
  );

  const financeData = useMemo(
    () =>
      financeBase.map((item, index) => ({
        ...item,
        fill: index === 0 ? COLOR_RED : COLOR_PINK,
      })),
    [financeBase]
  );

  const procurementData = useMemo(
    () => withDataDrivenBlueScale(procurementBase),
    [procurementBase]
  );

  const dairyUnitsData = useMemo(
    () => withDataDrivenBlueScale(dairyUnitsBase),
    [dairyUnitsBase]
  );

  const districtRevenueData = useMemo(
    () => withDataDrivenBlueScale(districtRevenueBase),
    [districtRevenueBase]
  );

  const qualityMonthOptions = useMemo(
    () => monthlyQualityData.map((item) => item.month),
    [monthlyQualityData]
  );

  const filteredMonthlyQualityData = useMemo(() => {
    if (!selectedQualityMonth) return monthlyQualityData;
    return monthlyQualityData.filter((item) => item.month === selectedQualityMonth);
  }, [monthlyQualityData, selectedQualityMonth]);

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-5" style={{ background: "#EFF5FF" }}>
        <div className="mx-auto max-w-[1180px]">
          <p className="text-sm text-[#1E4B6B]">Loading dashboard from mock data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-5" style={{ background: "#EFF5FF" }}>
        <div className="mx-auto max-w-[1180px]">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 md:p-4" style={{ background: "#EFF5FF" }}>
      <div className="mx-auto max-w-[1180px] space-y-3">
        <div className="rounded-md border border-[#a4b5c6] p-3" style={{ background: COLOR_PANEL }}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topStats.map((item) => {
              const Icon = iconMap[item.icon] || Building2;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-xl border px-3 py-3"
                  style={{
                    background: COLOR_TOP_CARD_BG,
                    borderColor: COLOR_TOP_CARD_BORDER,
                    boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset",
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: COLOR_TOP_CARD_ICON_BG,
                      border: `1px solid ${COLOR_TOP_CARD_BORDER}`,
                    }}
                  >
                    <Icon className="h-6 w-6" style={{ color: COLOR_TOP_CARD_VALUE }} strokeWidth={1.8} />
                  </div>
                  <div className="leading-tight">
                    <div className="font-semibold" style={{ color: COLOR_TOP_CARD_TITLE, fontSize: "14px" }}>
                      {item.label}
                    </div>
                    <div className="font-bold" style={{ color: COLOR_TOP_CARD_VALUE, fontSize: "32px" }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div
            className="rounded-xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
            style={{ background: COLOR_PANEL }}
          >
            <h2 className="text-[28px] font-semibold" style={{ color: COLOR_TEXT }}>
              Milk Procured
            </h2>
            <div className="mt-3 flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
              <div className="h-[190px] w-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={milkProcuredData}
                      dataKey="value"
                      innerRadius={50}
                      outerRadius={78}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <BulletLegend items={milkProcuredData} suffix="%" />
            </div>
          </div>

          <div className="space-y-3 lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <MiniPanel title="Finance" data={financeData} suffix="%" />
              <MiniPanel title="Procurement" data={procurementData} />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <MiniPanel title="Dairy Units - LLPD" data={dairyUnitsData} />
              <MiniPanel title="District Wise Revenue" data={districtRevenueData} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div
            className="rounded-xl p-3 shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
            style={{ background: COLOR_PANEL }}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[28px] font-semibold" style={{ color: COLOR_TEXT }}>
                Month Wise Milk Quality
              </h3>
              <select
                value={selectedQualityMonth}
                onChange={(e) => setSelectedQualityMonth(e.target.value)}
                className="rounded-md border border-[#c6d3df] bg-[#eceff2] px-3 py-1 text-sm text-[#313846]"
              >
                {qualityMonthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredMonthlyQualityData} margin={{ top: 15, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#b8cad9" />
                  <XAxis dataKey="month" tick={{ fill: "#5b6270", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 200]} />
                  <Legend
                    verticalAlign="top"
                    align="center"
                    formatter={(value) => <span style={{ color: COLOR_TEXT, fontSize: 14 }}>{value}</span>}
                    iconType="circle"
                  />
                  <Bar dataKey="good" name="Good Milk" fill={COLOR_RED} radius={[2, 2, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="penalised" name="Penalised" fill={COLOR_PINK} radius={[2, 2, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className="rounded-xl p-3 shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
            style={{ background: COLOR_PANEL }}
          >
            <h3 className="text-[28px] font-semibold" style={{ color: COLOR_TEXT }}>
              Revenue
            </h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#b8cad9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#5b6270", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#5b6270", fontSize: 12 }} axisLine={false} tickLine={false} domain={[150, 580]} />
                  <Tooltip />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ color: COLOR_TEXT, fontSize: 14 }}>
                        {value === "nov" ? "Nov 2025" : "Dec 2025"}
                      </span>
                    )}
                  />
                  <Line type="linear" dataKey="nov" name="nov" stroke={COLOR_PINK} strokeWidth={2.4} dot={false} />
                  <Line type="linear" dataKey="dec" name="dec" stroke={COLOR_RED} strokeWidth={2.4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}