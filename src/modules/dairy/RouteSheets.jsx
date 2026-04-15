import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getShipmentStatusLabel, getShipments, setActiveShipmentId, updateShipment } from "./state";

function statusTone(status) {
  if (status === "approved") return "bg-[#EAF7EE] text-[#1F7A3A]";
  if (status === "penalty") return "bg-[#FFF6E8] text-[#9A6200]";
  if (status === "rejected") return "bg-[#FFF1F1] text-[#B42318]";
  if (status === "in_verification") return "bg-[#EEF4FF] text-[#1E4B6B]";
  return "bg-[#F1F5F9] text-[#475569]";
}

export default function DairyRouteSheets() {
  const navigate = useNavigate();
  const shipments = useMemo(() => getShipments(), []);
  const routeSheetRows = useMemo(
    () =>
      shipments.flatMap((shipment) =>
        (shipment.stops || []).map((stop) => ({
          tankerId: shipment.tankerId,
          route: shipment.route,
          bmc: stop.bmc,
          societies: stop.societies,
          milkType: stop.milkType,
          expected: stop.expected,
          shipmentId: shipment.id,
          status: shipment.status,
        }))
      ),
    [shipments]
  );
  const totalExpected = useMemo(() => routeSheetRows.reduce((sum, row) => sum + row.expected, 0), [routeSheetRows]);

  const nextShipmentId = shipments.find((item) => item.status === "pending")?.id || shipments[0]?.id || "";

  const handleStartVerification = () => {
    if (nextShipmentId) {
      updateShipment(nextShipmentId, (current) => ({
        ...current,
        status: current.status === "pending" ? "in_verification" : current.status,
      }));
      setActiveShipmentId(nextShipmentId);
    }
    navigate("/dairy/tanker-verification");
  };

  return (
    <div className="p-6 text-[#1F2A44]">
      <h1 className="text-2xl font-semibold text-[#1E4B6B]">Tanker Route Sheet</h1>
      <p className="mt-1 text-sm text-[#5B6B7F]">Each tanker route and expected milk collection from BMC stops.</p>

      <div className="mt-5 overflow-hidden rounded-xl border border-[#D7E4FF] bg-white shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[#EEF4FF] text-[#1E4B6B]">
              <tr>
                <th className="px-4 py-3">Tanker ID</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">BMC</th>
                <th className="px-4 py-3">Societies</th>
                <th className="px-4 py-3">Milk Type</th>
                <th className="px-4 py-3">Expected Qty</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {routeSheetRows.map((row, index) => (
                <tr key={`${row.bmc}-${index}`} className="border-t border-[#E6EDF7]">
                  <td className="px-4 py-3">{row.tankerId}</td>
                  <td className="px-4 py-3">{row.route}</td>
                  <td className="px-4 py-3">{row.bmc}</td>
                  <td className="px-4 py-3">{row.societies}</td>
                  <td className="px-4 py-3">{row.milkType}</td>
                  <td className="px-4 py-3">{row.expected} L</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone(row.status)}`}>
                      {getShipmentStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#E6EDF7] bg-[#FAFCFF] px-4 py-3">
          <p className="text-sm font-semibold text-[#1E4B6B]">Total Expected: {totalExpected} Litres</p>
          <button
            type="button"
            onClick={handleStartVerification}
            className="rounded bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173A55]"
          >
            Start Verification
          </button>
        </div>
      </div>
    </div>
  );
}
