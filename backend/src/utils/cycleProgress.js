const CYCLE_BANDS = [
  { cycle: "Cycle 1", range: "1-10", startDay: 1, endDay: 10 },
  { cycle: "Cycle 2", range: "11-20", startDay: 11, endDay: 20 },
  { cycle: "Cycle 3", range: "21-End", startDay: 21, endDay: null },
];

function toValidDate(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date provided for cycle progress calculation.");
  }
  return date;
}

export function getMonthEndDay(referenceDate = new Date()) {
  const date = toValidDate(referenceDate);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getCycleStatusForDay(currentDay, startDay, endDay) {
  if (currentDay < startDay) return "Pending";
  if (currentDay > endDay) return "Completed";
  return "In Progress";
}

export function buildCycleProgress(referenceDate = new Date()) {
  const date = toValidDate(referenceDate);
  const currentDay = date.getDate();
  const monthEndDay = getMonthEndDay(date);

  return CYCLE_BANDS.map((band) => {
    const endDay = band.endDay || monthEndDay;
    return {
      cycle: band.cycle,
      range: band.range,
      status: getCycleStatusForDay(currentDay, band.startDay, endDay),
    };
  });
}