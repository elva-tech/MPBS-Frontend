import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { getDashboardMetrics, getShipments } from "./state";

function Card({ label, value }) {
  const toneMap = {
    "Milk Received Today": "border-[#D6C8E7] bg-[#F4F0FB]",
    "Tankers Received": "border-[#CFE0FF] bg-[#EEF4FF]",
    "Pending Verification": "border-[#EFD5B4] bg-[#F8F3E8]",
    "Total Shortage Today": "border-[#CFE0FF] bg-[#EEF4FF]",
  };
  const tone = toneMap[label] || "border-[#D7E4FF] bg-white";

  return (
    <div className={`rounded-xl border p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)] ${tone}`}>
      <p className="text-[13px] font-medium text-[#5B6B7F]">{label}</p>
      <p className="mt-2 text-[30px] font-semibold leading-none text-[#1E4B6B]">{value}</p>
    </div>
  );
}

function Donut({ data, colors = ["#1E4B6B", "#9DB5CC"] }) {
  return (
    <div className="h-40 w-40">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip formatter={(value) => `${value}%`} />
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={45} outerRadius={70} stroke="none">
            {data.map((_, index) => (
              <Cell key={`slice-${index}`} fill={colors[index] || colors[0]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function safePercent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default function DairyDashboard() {
  const shipments = useMemo(() => getShipments(), []);
  const metrics = useMemo(() => getDashboardMetrics(), []);

  const dashboardCards = useMemo(
    () => [
      { label: "Milk Received Today", value: `${metrics.milkReceived.toLocaleString()} L` },
      { label: "Tankers Received", value: String(metrics.tankerCount) },
      { label: "Pending Verification", value: String(metrics.pendingCount) },
      { label: "Total Shortage Today", value: `${metrics.totalShortage.toLocaleString()} L` },
    ],
    [metrics]
  );

  const milkTypeDistribution = useMemo(() => {
    let cow = 0;
    let buffalo = 0;

    shipments.forEach((shipment) => {
      (shipment.stops || []).forEach((stop) => {
        const volume = Number(stop.received) || 0;
        if ((stop.milkType || "").toLowerCase().includes("buffalo")) {
          buffalo += volume;
        } else {
          cow += volume;
        }
      });
    });

    const total = cow + buffalo;
    return [
      { label: "Cow Milk", value: safePercent(cow, total) },
      { label: "Buffalo Milk", value: safePercent(buffalo, total) },
    ];
  }, [shipments]);

  const districtProcurement = useMemo(() => {
    const districtMap = new Map();

    shipments.forEach((shipment) => {
      (shipment.stops || []).forEach((stop) => {
        const district = (stop.bmc || "Unknown").split(" ")[0] || "Unknown";
        const current = districtMap.get(district) || 0;
        districtMap.set(district, current + (Number(stop.received) || 0));
      });
    });

    return Array.from(districtMap.entries())
      .map(([district, liters]) => ({ district, liters }))
      .sort((a, b) => b.liters - a.liters);
  }, [shipments]);

  const qualityStatus = useMemo(() => {
    const total = shipments.length;
    return [
      { label: "Good Milk", value: safePercent(metrics.goodCount, total) },
      { label: "Penalised Milk", value: safePercent(metrics.penalisedCount, total) },
    ];
  }, [metrics.goodCount, metrics.penalisedCount, shipments.length]);

  const maxDistrictValue = Math.max(...districtProcurement.map((item) => item.liters), 1);

  return (
    <div className="p-6 text-[#1F2A44]">
      <h1 className="text-2xl font-semibold text-[#1E4B6B]">Dairy Dashboard</h1>
      <p className="mt-1 text-sm text-[#5B6B7F]">Operational overview for the current shift.</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((item) => (
          <Card key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-xl border border-[#D7E4FF] bg-white p-5 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-lg font-semibold text-[#1E4B6B]">Milk Type Distribution</h2>
          <div className="mt-4 flex items-center gap-5">
            <Donut data={milkTypeDistribution} colors={["#1E4B6B", "#9DB5CC"]} />
            <div className="space-y-2 text-sm text-[#334155]">
              {milkTypeDistribution.map((item) => (
                <p key={item.label}>
                  {item.label} <span className="font-semibold">{item.value}%</span>
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#D7E4FF] bg-white p-5 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-lg font-semibold text-[#1E4B6B]">District Procurement</h2>
          <div className="mt-4 space-y-3">
            {districtProcurement.map((item) => {
              const width = (item.liters / maxDistrictValue) * 100;
              return (
                <div key={item.district}>
                  <div className="mb-1 flex items-center justify-between text-sm text-[#334155]">
                    <span>{item.district}</span>
                    <span>{item.liters.toLocaleString()} L</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E6EDF7]">
                    <div className="h-2 rounded-full bg-[#2F7FA4]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-[#D7E4FF] bg-white p-5 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-lg font-semibold text-[#1E4B6B]">Quality Status</h2>
          <div className="mt-4 flex items-center gap-5">
            <Donut data={qualityStatus} colors={["#1E4B6B", "#9DB5CC"]} />
            <div className="space-y-2 text-sm text-[#334155]">
              {qualityStatus.map((item) => (
                <p key={item.label}>
                  {item.label} <span className="font-semibold">{item.value}%</span>
                </p>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
