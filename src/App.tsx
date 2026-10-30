import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from './contexts/AppContext';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { MyDeliveries } from './pages/agent/MyDeliveries';
import { ReportDelay } from './pages/agent/ReportDelay';
import { Dashboard } from './pages/Dashboard';
import { Alerts } from './pages/Alerts';
import { ImpactTrace } from './pages/ImpactTrace';
import { OrderRisk } from './pages/OrderRisk';
import { RecoveryOptions } from './pages/RecoveryOptions';
import { Approvals } from './pages/Approvals';
import { ParentRequests } from './pages/parent/ParentRequests';
import { WarehouseMap } from './pages/WarehouseMap';
import { OrderTracking } from './pages/customer/OrderTracking';
import { CustomerCare } from './pages/customer/CustomerCare';
import { DataConsole } from './pages/DataConsole';
import { Admin } from './pages/Admin';

function ThemedToaster() {
  const { dark } = useApp();
  return <Toaster position="bottom-right" theme={dark ? 'dark' : 'light'} richColors closeButton />;
}

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ThemedToaster />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route element={<AppShell />}>
            <Route path="/agent/deliveries" element={<MyDeliveries />} />
            <Route path="/agent/report" element={<ReportDelay />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/impact" element={<ImpactTrace />} />
            <Route path="/orders" element={<OrderRisk />} />
            <Route path="/recovery" element={<RecoveryOptions />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/parent/requests" element={<ParentRequests />} />
            <Route path="/warehouses" element={<WarehouseMap />} />
            <Route path="/customer/track" element={<OrderTracking />} />
            <Route path="/customer/care" element={<CustomerCare />} />
            <Route path="/data" element={<DataConsole />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>);

}