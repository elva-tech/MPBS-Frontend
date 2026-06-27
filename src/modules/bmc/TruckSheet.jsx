import { useState } from "react";

export default function TruckSheet() {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <div className="min-h-full rounded-lg border border-slate-200 bg-slate-50 p-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-semibold text-slate-800">Truck Sheet</h1>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className="rounded-md bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_6px_rgba(30,75,107,0.25)] hover:bg-[#173A55]"
        >
          Generate Truck Sheet
        </button>
      </div>

      {showSheet ? (
        <>
          <div className="mt-8 rounded-md border border-slate-300 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="text-center text-sm font-semibold text-slate-700">
                DISPATCH MONITORING FORM
              </div>
              <table className="border border-slate-400 text-[11px] text-slate-700">
                <tbody>
                  <tr className="border-b border-slate-400">
                    <td className="w-40 border-r border-slate-400 px-2 py-1 font-semibold">
                      IDENTIFICATION NUMBER
                    </td>
                    <td className="w-32 px-2 py-1">&nbsp;</td>
                  </tr>
                  <tr className="border-b border-slate-400">
                    <td className="border-r border-slate-400 px-2 py-1 font-semibold">
                      EFFECTIVE DATE
                    </td>
                    <td className="px-2 py-1">&nbsp;</td>
                  </tr>
                  <tr>
                    <td className="border-r border-slate-400 px-2 py-1 font-semibold">
                      REVISION NUMBER
                    </td>
                    <td className="px-2 py-1">&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <table className="w-full border border-slate-400 text-[11px] text-slate-700">
                <tbody>
                  {[
                    "CUSTOMER NAME",
                    "DATE OF DISPATCH",
                    "TRUCK NUMBER",
                    "DRIVER'S NUMBER",
                    "TIME OF DISPATCH",
                  ].map((label) => (
                    <tr key={label} className="border-b border-slate-400 last:border-b-0">
                      <td className="w-1/2 border-r border-slate-400 px-2 py-1 font-semibold">
                        {label}
                      </td>
                      <td className="px-2 py-1">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table className="w-full border border-slate-400 text-[11px] text-slate-700">
                <tbody>
                  {[
                    "PRE-COOL TEMPERATURE",
                    "COOLING DOCK TEMPERATURE",
                    "PEST INFESTATION (YES/NO)",
                    "VEHICLE CLEANED (YES/NO)",
                  ].map((label) => (
                    <tr key={label} className="border-b border-slate-400 last:border-b-0">
                      <td className="w-2/3 border-r border-slate-400 px-2 py-1 font-semibold">
                        {label}
                      </td>
                      <td className="px-2 py-1">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border border-slate-500 text-[11px] text-slate-700">
                <thead>
                  <tr className="border-b border-slate-500 bg-slate-100 text-left">
                    {[
                      "PRODUCT",
                      "MANUFACTURE DATE",
                      "EXPIRY DATE",
                      "BATCH NO",
                      "QUANTITY",
                      "DISPATCH TEMPERATURE",
                      "TRUCK TEMPERATURE",
                      "COMMENT",
                      "SIGN",
                    ].map((header) => (
                      <th
                        key={header}
                        className="border-r border-slate-500 px-2 py-1 font-semibold last:border-r-0"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="border-b border-slate-400 last:border-b-0">
                      {Array.from({ length: 9 }).map((__, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="h-6 border-r border-slate-400 px-2 py-2 last:border-r-0"
                        >
                          &nbsp;
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        </div>

        {/* TODO: enable later when comments flow is ready */}
        {false && (
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                className="rounded-md bg-[#1E4B6B] px-6 py-2 text-sm font-semibold text-white shadow-[0_2px_6px_rgba(30,75,107,0.25)] hover:bg-[#173A55]"
              >
                Comments
              </button>
            </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="rounded-md bg-[#1E4B6B] px-6 py-2 text-sm font-semibold text-white shadow-[0_2px_6px_rgba(30,75,107,0.25)] hover:bg-[#173A55]"
          >
            Download
          </button>
        </div>

        </>
      ) : null}
    </div>
  );
}
