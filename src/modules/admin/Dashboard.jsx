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
  getAdminDashboard,
} from "../../utils/api";

const COLOR_PANEL = "#FFFFFF";
const COLOR_RED = "#1E4B6B";
const COLOR_PINK = "#9DB5CC";
const COLOR_TEXT = "#1E4B6B";
const COLOR_PAGE_GRADIENT = "linear-gradient(180deg,#F7FAFF 0%,#EEF4FF 100%)";
const COLOR_CARD_BG_A = "#F7FAFF";
const COLOR_CARD_BG_B = "#F3F7FF";
const COLOR_CARD_BORDER = "#D7E4FF";
const COLOR_TOP_CARD_ICON_BG = "#EAF1FF";
const COLOR_TOP_CARD_TITLE = "#5B6B7F";
const COLOR_TOP_CARD_VALUE = "#1E4B6B";
const TOP_CARD_STYLES = [
  { bg: "#F4F0FB", border: "#D9CAE9", iconBg: "#F1ECF8", iconBorder: "#D9CAE9" },
  { bg: "#EEF4FF", border: "#CFE0FF", iconBg: "#EAF1FF", iconBorder: "#CFE0FF" },
  { bg: "#F8F3E8", border: "#EFD5B4", iconBg: "#F5EBDD", iconBorder: "#EFD5B4" },
  { bg: "#EEF2F7", border: "#D4E0EF", iconBg: "#EAF1FF", iconBorder: "#D4E0EF" },
];

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

function SmallDonut({ data, size = 92, suffix = "" }) {
  const center = size / 2;
  const outerRadius = Math.floor(size * 0.44);
  const innerRadius = Math.floor(size * 0.3);

  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx={center}
          cy={center}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          stroke="none"
          startAngle={90}
          endAngle={-270}
        />
        <Tooltip
          formatter={(value, name) => [`${value}${suffix}`, name]}
          contentStyle={{ borderRadius: 8, border: "1px solid #d5dfec" }}
        />
      </PieChart>
    </div>
  );
}

function BulletLegend({ items, suffix = "" }) {
  return (
    <div className="space-y-2 text-xs" style={{ color: "#6B7FA0" }}>
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.fill }} />
          <span className="font-semibold">
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
      className="rounded-xl border p-4 shadow-[0_8px_18px_rgba(15,41,74,0.08)]"
      style={{ background: COLOR_CARD_BG_A, borderColor: COLOR_CARD_BORDER }}
    >
      <h3 className="text-sm font-semibold" style={{ color: COLOR_TEXT }}>
        {title}
      </h3>
      <div className="mt-2 flex items-center justify-between gap-4">
        <SmallDonut data={data} suffix={suffix} />
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
  const [revenueLegend, setRevenueLegend] = useState({ nov: "Previous Year", dec: "Current Year" });
  const [selectedQualityMonth, setSelectedQualityMonth] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      setLoading(true);
      setError("");
      try {
        const payload = await getAdminDashboard();
        const dashboard = payload?.data || {};
        const stats = Array.isArray(dashboard.topStats) ? dashboard.topStats : [];
        const milkProcured = Array.isArray(dashboard.milkProcured) ? dashboard.milkProcured : [];
        const finance = Array.isArray(dashboard.finance) ? dashboard.finance : [];
        const procurement = Array.isArray(dashboard.procurement) ? dashboard.procurement : [];
        const dairyUnits = Array.isArray(dashboard.dairyUnits) ? dashboard.dairyUnits : [];
        const districtRevenue = Array.isArray(dashboard.districtRevenue) ? dashboard.districtRevenue : [];
        const monthlyQuality = Array.isArray(dashboard.monthlyQuality) ? dashboard.monthlyQuality : [];
        const revenue = Array.isArray(dashboard.revenue) ? dashboard.revenue : [];
        const legend = dashboard.revenueLegend || { nov: "Previous Year", dec: "Current Year" };

        if (!active) return;
        setTopStats(stats);
        setMilkProcuredBase(milkProcured);
        setFinanceBase(finance);
        setProcurementBase(procurement);
        setDairyUnitsBase(dairyUnits);
        setDistrictRevenueBase(districtRevenue);
        setMonthlyQualityData(monthlyQuality);
        setRevenueData(revenue);
        setRevenueLegend(legend);
        setSelectedQualityMonth(monthlyQuality[0]?.month || "");
      } catch {
        if (!active) return;
        setError("Failed to load dashboard data");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboardData();
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
      <div className="min-h-screen p-6" style={{ backgroundImage: COLOR_PAGE_GRADIENT }}>
        <div className="mx-auto max-w-[1180px]">
          <p className="text-sm text-[#1E4B6B]">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundImage: COLOR_PAGE_GRADIENT }}>
        <div className="mx-auto max-w-[1180px]">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundImage: COLOR_PAGE_GRADIENT }}>
      <div className="mx-auto max-w-[1180px] space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topStats.map((item, index) => {
              const Icon = iconMap[item.icon] || Building2;
              const cardStyle = TOP_CARD_STYLES[index % TOP_CARD_STYLES.length];
              return (
                <div
                  key={item.label}
                  className="flex h-20 items-center gap-2.5 rounded-lg border px-3 shadow-[0_6px_14px_rgba(15,41,74,0.12)]"
                  style={{
                    background: cardStyle.bg,
                    borderColor: cardStyle.border,
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                    style={{
                      background: cardStyle.iconBg,
                      border: `1px solid ${cardStyle.iconBorder}`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: COLOR_TOP_CARD_VALUE }} strokeWidth={2} />
                  </div>
                  <div className="leading-tight">
                    <div className="font-medium" style={{ color: COLOR_TOP_CARD_TITLE, fontSize: "12px" }}>
                      {item.label}
                    </div>
                    <div className="font-semibold" style={{ color: COLOR_TOP_CARD_VALUE, fontSize: "28px" }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div
            className="rounded-xl border p-5 shadow-[0_8px_18px_rgba(15,41,74,0.08)]"
            style={{ background: COLOR_CARD_BG_A, borderColor: COLOR_CARD_BORDER }}
          >
            <h2 className="text-sm font-semibold" style={{ color: COLOR_TEXT }}>
              Milk Procured
            </h2>
            <div className="mt-5 flex flex-col items-center gap-5 md:flex-row md:items-center md:justify-between">
              <div className="h-[220px] w-[220px] shrink-0">
                <PieChart width={220} height={220}>
                    <Pie
                      data={milkProcuredData}
                      dataKey="value"
                      nameKey="name"
                      cx={110}
                      cy={110}
                      innerRadius={58}
                      outerRadius={90}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    />
                    <Tooltip
                      formatter={(value, name) => [`${value}%`, name]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #d5dfec" }}
                    />
                </PieChart>
              </div>
              <BulletLegend items={milkProcuredData} suffix="%" />
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MiniPanel title="Finance" data={financeData} suffix="%" />
              <MiniPanel title="Procurement" data={procurementData} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MiniPanel title="Dairy Units - LLPD" data={dairyUnitsData} />
              <MiniPanel title="District Wise Revenue" data={districtRevenueData} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div
            className="rounded-xl border p-4 shadow-[0_8px_18px_rgba(15,41,74,0.08)]"
            style={{ background: COLOR_CARD_BG_A, borderColor: COLOR_CARD_BORDER }}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: COLOR_TEXT }}>
                Month Wise Milk Quality
              </h3>
              <select
                value={selectedQualityMonth}
                onChange={(e) => setSelectedQualityMonth(e.target.value)}
                className="rounded-md border border-[#c6d3df] bg-[#f1f6ff] px-3 py-1 text-xs font-semibold text-[#5B6B7F]"
              >
                {qualityMonthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-[220px]">
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
                  <Bar dataKey="good" name="Good Milk" fill={COLOR_RED} radius={[2, 2, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="penalised" name="Penalised" fill={COLOR_PINK} radius={[2, 2, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className="rounded-xl border p-4 shadow-[0_8px_18px_rgba(15,41,74,0.08)]"
            style={{ background: COLOR_CARD_BG_A, borderColor: COLOR_CARD_BORDER }}
          >
            <h3 className="text-sm font-semibold" style={{ color: COLOR_TEXT }}>
              Revenue
            </h3>
            <div className="h-[255px]">
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
                        {value === "nov" ? revenueLegend.nov : revenueLegend.dec}
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
