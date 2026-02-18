import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./component/ProtectedRoute";

import Login from "./component/Login";
import Register from "./component/Register";
import Dashboard from "./component/Dashboard";
import AddFactory from "./component/AddFactory";
import AddMachinePage from "./component/AddMachine";
import MachineTransferInitiation from "./component/MachineTransferInitiation";
import TransferHistoryTable from "./component/TransferHistoryTable";
import FactoryMachineList from "./component/FactoryWiseMachineList";
import FactoryList from "./component/FactoryList";
import UserList from "./component/UserList";
import MachineHistoryTable from "./component/MachineHistoryTable";
import MachineReturnInitiation from "./component/MachineReturnInitiation";
import SummaryReport from "./component/SummaryReport";
import Maintenance from "./component/AddMaintenance";
import MaintenanceList from "./component/MaintenanceList";
import IdleStartForm from "./component/AddIdleStart";
import IdleEndForm from "./component/AddIdleEnd";
import AllIdles from "./component/AllIdles";
import MachineTransferReceipt from "./component/MachineTransferReceipt";
import MachineReturnReceipt from "./component/MachineReturnReceipt";
import UpdatePassword from "./component/UpdatePassword";
import MachinePage from "./component/MachinePage";
import MachineScanner from "./component/MachineScanner";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}
          {/* Superadmin Only */}
          <Route
            path="/register"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <Register />
              </ProtectedRoute>
            }
          />
          {/* Protected (superadmin auto access all) */}
          <Route
            path="/"
            element={
              <ProtectedRoute roles={["admin", "user"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machines/add"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AddMachinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/factories/add"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AddFactory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/factories"
            element={
              <ProtectedRoute roles={["admin", "user"]}>
                <FactoryList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machines"
            element={
              <ProtectedRoute roles={["admin", "user"]}>
                <FactoryMachineList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machine/transfer"
            element={
              <ProtectedRoute roles={["admin", "user"]}>
                <MachineTransferInitiation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machine/transfer-receive"
            element={
              <ProtectedRoute roles={["admin", "user"]}>
                <MachineTransferReceipt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machine/return"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "user"]}>
                <MachineReturnInitiation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machine/return-receive"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "user"]}>
                <MachineReturnReceipt />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfer/history"
            element={
              <ProtectedRoute roles={["admin", "user"]}>
                <TransferHistoryTable />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "user"]}>
                <MachineHistoryTable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/summary"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "user"]}>
                <SummaryReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "user"]}>
                <Maintenance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenances"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "user"]}>
                <MaintenanceList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/idles-start"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "user"]}>
                <IdleStartForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/idles-end"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "user"]}>
                <IdleEndForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/idles"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "user"]}>
                <AllIdles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={["superadmin"]}>
                <UserList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machines-details"
            element={<div>Please select a machine</div>}
          />
          <Route
            path="/machines-details/:machineCode"
            element={
              <ProtectedRoute roles={["admin", "user", "superadmin"]}>
                <MachinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machine-scan"
            element={
              <ProtectedRoute roles={["admin", "user", "superadmin"]}>
                <MachineScanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-password"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "user"]}>
                <UpdatePassword />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
