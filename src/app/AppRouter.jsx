import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ================= SOCIETY =================
import SocietyLogin from "../modules/society/Login";
import DairyLogin from "../modules/dairy/Login";
import ForgotPassword from "../modules/society/ForgotPassword";
import Dashboard from "../modules/society/Dashboard";
import MilkCollection from "../modules/society/MilkCollection";
import RateSheet from "../modules/society/RateSheet";
import SocietyComplaints from "../modules/society/Complaints";
import SocietyVerification from "../modules/society/Verification";
import Layout from "./layout/Layout";
import AuthGuard from "../shared/components/AuthGaurd";

// ================= ADMIN =================
import AdminLogin from "../modules/admin/Login";
import AdminDashboard from "../modules/admin/Dashboard";
import UserManagement from "../modules/admin/UserManagement";
import Requests from "../modules/admin/Requests";
import Notifications from "../modules/admin/Notifications";
import AdminLayout from "./layout/AdminLayout";
import AdminAuthGuard from "../shared/components/AdminAuthGaurd";

// ================= BMC =================
import MilkVerification from "../modules/bmc/SocietyMilkVerification";
import BmcDashboard from "../modules/bmc/Dashboard";
import TruckSheet from "../modules/bmc/TruckSheet";
import Reports from "../modules/bmc/Reports";
import BmcComplaints from "../modules/bmc/Complaints";
import BMCLogin from "../modules/bmc/Login";
import BMCLayout from "./layout/BmcLayout";
import BMCAuthGuard from "../shared/components/BmcAuthGaurd";
import DairyDashboard from "../modules/dairy/Dashboard";
import DairyAuthGuard from "../shared/components/DairyAuthGaurd";
import DairyLayout from "./layout/DairyLayout";
import DairyRouteSheets from "../modules/dairy/RouteSheets";
import DairyTankerVerification from "../modules/dairy/TankerVerification";
import DairyMilkReceipt from "../modules/dairy/MilkReceipt";
import DairyReports from "../modules/dairy/Reports";
import AccountLogin from "../modules/account/Login";
import AccountDashboard from "../modules/account/Dashboard";
import AccountLayout from "./layout/AccountLayout";
import AccountAuthGuard from "../shared/components/AccountAuthGaurd";
import BillingCycles from "../modules/account/BillingCycles";
import SocietyPayments from "../modules/account/SocietyPayments";
import Schemes from "../modules/account/Schemes";
import ClaimsRecoverables from "../modules/account/ClaimsRecoverables";
import Invoices from "../modules/account/Invoices";
import AccountReports from "../modules/account/Reports";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= SOCIETY ROUTES ================= */}
        <Route path="/login" element={<SocietyLogin />} />
        <Route path="/login/society" element={<SocietyLogin />} />
        <Route path="/login/soceity" element={<SocietyLogin />} />
        <Route path="/login/dairy" element={<DairyLogin />} />
        <Route path="/dairy/login" element={<DairyLogin />} />
        <Route path="/login/bmc" element={<BMCLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/society/verification" element={<SocietyVerification />} />
        <Route
          path="/socity/verification"
          element={<Navigate to="/society/verification" replace />}
        />

        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="collection" element={<MilkCollection />} />
          <Route path="ratesheet" element={<RateSheet />} />
          <Route path="complaints" element={<SocietyComplaints />} />
        </Route>

        {/* ================= ADMIN ROUTES ================= */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <AdminAuthGuard>
              <AdminLayout />
            </AdminAuthGuard>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="requests" element={<Requests />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ================= BMC ROUTES ================= */}
        <Route path="/bmc/login" element={<BMCLogin />} />
        <Route
          path="/dairy"
          element={
            <DairyAuthGuard>
              <DairyLayout />
            </DairyAuthGuard>
          }
        >
          <Route index element={<Navigate to="/dairy/dashboard" replace />} />
          <Route path="dashboard" element={<DairyDashboard />} />
          <Route path="route-sheets" element={<DairyRouteSheets />} />
          <Route path="tanker-verification" element={<DairyTankerVerification />} />
          <Route path="milk-receipt" element={<DairyMilkReceipt />} />
          <Route path="reports" element={<DairyReports />} />
        </Route>

        <Route
          path="/bmc"
          element={
            <BMCAuthGuard>
              <BMCLayout />
            </BMCAuthGuard>
          }
        >
          <Route index element={<Navigate to="/bmc/dashboard" replace />} />
          <Route path="dashboard" element={<BmcDashboard />} />
          <Route path="verification" element={<MilkVerification />} />
          <Route path="truck-sheet" element={<TruckSheet />} />
          <Route path="reports" element={<Reports />} />
          <Route path="complaints" element={<BmcComplaints />} />
        </Route>

        {/* ================= ACCOUNT ROUTES ================= */}
        <Route path="/account/login" element={<AccountLogin />} />
        <Route path="/login/account" element={<AccountLogin />} />

        <Route
          path="/account"
          element={
            <AccountAuthGuard>
              <AccountLayout />
            </AccountAuthGuard>
          }
        >
          <Route index element={<Navigate to="/account/dashboard" replace />} />
          <Route path="dashboard" element={<AccountDashboard />} />
          <Route path="billing-cycles" element={<BillingCycles />} />
          <Route path="society-payments" element={<SocietyPayments />} />
          <Route path="schemes" element={<Schemes />} />
          <Route path="claims-recoverables" element={<ClaimsRecoverables />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="reports" element={<AccountReports />} />
        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
