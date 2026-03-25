const MOCK_DELAY_MS = 120;

const topStats = [
  { label: "No. Of DCS", value: 884, icon: "Building2" },
  { label: "No. Of BMC", value: 70, icon: "LandPlot" },
  { label: "No. Of EO", value: 31, icon: "BadgeCheck" },
  { label: "No. Of Dairy Units", value: 3, icon: "Factory" },
];

const milkProcured = [
  { name: "Cow Milk", value: 81.48 },
  { name: "Buffalo Milk", value: 18.51 },
];

const finance = [
  { name: "Billed", value: 92 },
  { name: "Unbilled", value: 8 },
];

const procurement = [
  { name: "Raichur", value: 28 },
  { name: "Ballari", value: 32 },
  { name: "Koppala", value: 22 },
  { name: "Vijayanagara", value: 18 },
];

const dairyUnits = [
  { name: "Ballari", value: 1.0 },
  { name: "Raichur", value: 0.8 },
  { name: "Badugumpa", value: 0.6 },
];

const districtRevenue = [
  { name: "Raichur", value: 28 },
  { name: "Ballari", value: 32 },
  { name: "Koppala", value: 22 },
  { name: "Vijayanagara", value: 18 },
];

const monthlyQuality = [
  { month: "Jan", good: 88, penalised: 22 },
  { month: "Feb", good: 102, penalised: 27 },
  { month: "Mar", good: 130, penalised: 38 },
  { month: "Apr", good: 108, penalised: 32 },
  { month: "May", good: 95, penalised: 28 },
  { month: "Jun", good: 172, penalised: 16 },
  { month: "Jul", good: 82, penalised: 18 },
  { month: "Aug", good: 68, penalised: 14 },
  { month: "Sep", good: 78, penalised: 15 },
  { month: "Oct", good: 90, penalised: 19 },
  { month: "Nov", good: 98, penalised: 21 },
  { month: "Dec", good: 112, penalised: 24 },
];

const revenue = [
  { month: "Mar", nov: 320, dec: 340 },
  { month: "Apr", nov: 260, dec: 380 },
  { month: "May", nov: 305, dec: 345 },
  { month: "Jun", nov: 260, dec: 400 },
  { month: "Jul", nov: 225, dec: 455 },
  { month: "Aug", nov: 190, dec: 510 },
  { month: "Sep", nov: 160, dec: 560 },
  { month: "Oct", nov: 200, dec: 525 },
  { month: "Nov", nov: 240, dec: 485 },
];

const notifications = [
  {
    id: "n1",
    title: "Milk quality report ready",
    message: "Month wise milk quality report for Dec is available.",
    time: "10m ago",
    read: false,
  },
  {
    id: "n2",
    title: "New society request",
    message: "A new registration request has been submitted by SOCIETY_014.",
    time: "45m ago",
    read: false,
  },
  {
    id: "n3",
    title: "Finance update",
    message: "Billed percentage has increased by 2% for this cycle.",
    time: "2h ago",
    read: true,
  },
];

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function withDelay(data) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(clone(data)), MOCK_DELAY_MS);
  });
}

export function fetchTopStatsMock() {
  return withDelay(topStats);
}

export function fetchMilkProcuredMock() {
  return withDelay(milkProcured);
}

export function fetchFinanceMock() {
  return withDelay(finance);
}

export function fetchProcurementMock() {
  return withDelay(procurement);
}

export function fetchDairyUnitsMock() {
  return withDelay(dairyUnits);
}

export function fetchDistrictRevenueMock() {
  return withDelay(districtRevenue);
}

export function fetchMonthlyQualityMock() {
  return withDelay(monthlyQuality);
}

export function fetchRevenueMock() {
  return withDelay(revenue);
}

export function fetchAdminNotificationsMock() {
  return withDelay(notifications);
}
