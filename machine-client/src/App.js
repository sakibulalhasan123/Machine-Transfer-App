import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./component/ProtectedRoute";

import Login from "./component/Login";
import Register from "./component/Register";
import Dashboard from "./component/Dashboard";
import AddFactory from "./component/AddFactory";
import AddMachinePage from "./component/AddMachinePage";
import TransferMachine from "./component/TransferMachine";
import TransferHistoryTable from "./component/TransferHistoryTable";
import FactoryMachineList from "./component/FactoryWiseMachine";
import TransferMachineList from "./component/TransferMachineList";
import FactoryList from "./component/FactoryList";
import UserList from "./component/UserList";
import AllHistoryReport from "./component/AllHistoryReport";

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
                <TransferMachine />
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
            path="/transfer/machines"
            element={
              <ProtectedRoute roles={["admin", "user"]}>
                <TransferMachineList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-history"
            element={
              <ProtectedRoute roles={["superadmin", "admin", "user"]}>
                <AllHistoryReport />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
