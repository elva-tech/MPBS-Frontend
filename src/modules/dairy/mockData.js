export const dairyUnits = ["Ballari Dairy", "Raichur Dairy", "Budugumpa Dairy"];

export const dashboardCards = [
  { label: "Milk Received Today", value: "82,450 L" },
  { label: "Tankers Received", value: "18" },
  { label: "Pending Verification", value: "3" },
  { label: "Total Shortage Today", value: "120 L" },
];

export const milkTypeDistribution = [
  { label: "Cow Milk", value: 78 },
  { label: "Buffalo Milk", value: 22 },
];

export const districtProcurement = [
  { district: "Ballari", liters: 28000 },
  { district: "Raichur", liters: 22000 },
  { district: "Koppal", liters: 18000 },
  { district: "Vijayanagara", liters: 14000 },
];

export const qualityStatus = [
  { label: "Approved Milk", value: 92 },
  { label: "Rejected / Penalised", value: 8 },
];

export const routeSheetRows = [
  { tankerId: "T102", route: "Route-01", bmc: "Ballari BMC", societies: 22, milkType: "Cow", expected: 2500 },
  { tankerId: "T102", route: "Route-01", bmc: "Hospet BMC", societies: 18, milkType: "Buffalo", expected: 1700 },
  { tankerId: "T102", route: "Route-01", bmc: "Siruguppa BMC", societies: 15, milkType: "Cow", expected: 800 },
];

export const tankerDetails = {
  tankerId: "T102",
  route: "Route-01",
  arrivalTime: "6:10 AM",
  transporter: "Ramesh Logistics",
};

export const receiptRows = [
  { bmc: "Ballari BMC", expected: 2500, received: 2480, shortage: 20 },
  { bmc: "Hospet BMC", expected: 1700, received: 1690, shortage: 10 },
  { bmc: "Siruguppa BMC", expected: 800, received: 800, shortage: 0 },
];

export const qualityTest = [
  { parameter: "Fat", routeSheet: "4.2", dairyTest: "4.1" },
  { parameter: "SNF", routeSheet: "8.7", dairyTest: "8.6" },
  { parameter: "Temperature", routeSheet: "5°C", dairyTest: "5°C" },
];
