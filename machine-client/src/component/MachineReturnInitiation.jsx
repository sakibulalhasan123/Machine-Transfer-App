import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Select from "react-select";
import { Scanner } from "@yudiel/react-qr-scanner";
const API_URL = process.env.REACT_APP_API_URL;

const customStyles = {
  control: (provided) => ({
    ...provided,
    borderRadius: "0.5rem",
    borderColor: "#d1d5db",
    padding: "2px",
    boxShadow: "none",
    minHeight: "42px",
    "&:hover": { borderColor: "#6366f1" },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#eef2ff" : "white",
    color: state.isFocused ? "#4338ca" : "black",
    padding: "8px 12px",
  }),
  placeholder: (provided) => ({ ...provided, color: "#9ca3af" }),
};

function Message({ text }) {
  if (!text) return null;
  const success = text.startsWith("✅");
  return (
    <div
      className={`mb-4 p-3 rounded-md text-sm ${
        success
          ? "bg-green-50 border border-green-300 text-green-700"
          : "bg-red-50 border border-red-300 text-red-700"
      }`}
    >
      {text}
    </div>
  );
}

function ReturnMachine() {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [machines, setMachines] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const userFactory = user?.factoryId;

  const [scanMode, setScanMode] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const handleMachineByCode = async (code) => {
    if (!selectedFactory) {
      setMessage("❌ Please select factory first");
      return;
    }
    if (!code?.trim() || scanned) return;

    setScanned(true);

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/machines/code/${code.trim()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();
      const machine = await res.json();

      const allowedStatuses = ["Borrowed"];
      if (!allowedStatuses.includes(machine.status)) {
        setMessage("❌ This machine is not eligible for return");
        return;
      }

      if (
        machine.factoryId?._id?.toString() !== selectedFactory.value?.toString()
      ) {
        setMessage("❌ This machine does not belong to selected factory");
        return;
      }

      const exists = selectedMachines.some((m) => m.value === machine._id);
      if (exists) {
        setMessage("⚠️ Machine already added");
        return;
      }

      setSelectedMachines((prev) => [
        ...prev,
        { value: machine._id, label: machine.machineCode },
      ]);

      setMessage("✅ Machine added");
      setScanMode(false);
    } catch {
      setMessage("❌ Invalid or unavailable QR");
    } finally {
      setTimeout(() => setScanned(false), 1500);
    }
  };

  const handleManualAdd = () => {
    handleMachineByCode(manualCode);
    setManualCode("");
  };

  // Auto-clear messages
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // Load factories
  useEffect(() => {
    const fetchFactories = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage("❌ User not authenticated.");
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/factories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load factories");
        const data = await res.json();
        const loadedFactories = Array.isArray(data)
          ? data
          : data.factories || [];
        setFactories(loadedFactories);
      } catch (err) {
        console.error("❌ Error loading factories:", err);
        setMessage("❌ Failed to load factories.");
      } finally {
        setLoading(false);
      }
    };
    fetchFactories();
  }, []);

  // Auto-set factory for normal users
  useEffect(() => {
    if (user?.role !== "superadmin" && factories.length > 0) {
      const myFactory = factories.find((f) => f._id === userFactory);
      if (myFactory) {
        setSelectedFactory({
          value: myFactory._id,
          label: `${myFactory.factoryName} (${myFactory.factoryLocation})`,
        });
      }
    }
  }, [factories, userFactory, user?.role]);

  // Load borrowed machines when factory changes
  useEffect(() => {
    const fetchMachines = async () => {
      if (!selectedFactory) {
        setMachines([]);
        setSelectedMachines([]);
        return;
      }
      const token = localStorage.getItem("authToken");
      try {
        setLoading(true);
        const res = await fetch(
          `${API_URL}/api/transfers/machine/borrowed/${selectedFactory.value}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error("Failed to load machines");
        const data = await res.json();
        setMachines(data.machines || []);
        setSelectedMachines([]);
      } catch (err) {
        console.error("❌ Error fetching machines:", err);
        setMessage("❌ Failed to load machines.");
        setMachines([]);
        setSelectedMachines([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, [selectedFactory]);

  // Handle return
  const handleReturn = async (e) => {
    e.preventDefault();

    if (!selectedFactory) {
      setMessage("❌ Factory not loaded yet.");
      return;
    }
    if (!selectedMachines.length) {
      setMessage("❌ Please select machines to return.");
      return;
    }

    const token = localStorage.getItem("authToken");
    try {
      setLoading(true);

      // Debug log
      console.log("POST body:", {
        machineIds: selectedMachines.map((m) => m.value),
        fromFactory: selectedFactory.value,
      });

      const res = await fetch(
        `${API_URL}/api/transfers/machine/return/initiate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            machineIds: selectedMachines.map((m) => m.value),
            fromFactory: selectedFactory.value, // 🔹 important for factoryAuth
          }),
        },
      );

      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        const message =
          data?.error || data?.message || "Return initiation failed";
        throw new Error(message);
      }

      setMessage(
        `✅ Initiated return for ${data.initiated.length}, Skipped ${data.skipped}`,
      );

      setMachines((prev) =>
        prev.filter((m) => !data.initiated.some((r) => r._id === m._id)),
      );
      setSelectedMachines([]);
    } catch (err) {
      console.error("❌ Return Initiation error:", err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xl border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Machine Return Initiation
          </h2>
          <Message text={message} />
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter machine code"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              disabled={scanMode}
              className="border rounded-md px-3 py-2 text-sm flex-1"
            />

            <button
              type="button"
              onClick={handleManualAdd}
              disabled={scanMode}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Add
            </button>

            <button
              type="button"
              onClick={() => {
                setScanMode((p) => !p);
                setScanned(false);
                setMessage("");
              }}
              className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm"
            >
              {scanMode ? "❌ Close" : "📷 Scan"}
            </button>
          </div>
          {scanMode && (
            <div className="w-full max-w-sm border rounded-xl bg-gray-50 overflow-hidden">
              <Scanner
                constraints={{ facingMode: "environment" }}
                onScan={(codes) => {
                  if (!codes?.length || scanned) return;
                  handleMachineByCode(codes[0].rawValue);
                }}
                onError={(err) => console.warn("QR error:", err)}
              />
              <p className="text-xs text-center text-gray-500 py-2">
                Scan machine QR
              </p>
            </div>
          )}

          <form onSubmit={handleReturn} className="grid grid-cols-1 gap-6">
            {/* Factory Select */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Select Factory
              </label>
              <Select
                options={
                  user.role === "superadmin"
                    ? factories.map((f) => ({
                        value: f._id,
                        label: `${f.factoryName} (${f.factoryLocation})`,
                      }))
                    : selectedFactory
                      ? [selectedFactory]
                      : []
                }
                value={selectedFactory}
                onChange={setSelectedFactory}
                isDisabled={user.role !== "superadmin"}
                styles={customStyles}
              />
            </div>

            {/* Machines Select */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Select Machines to Return Initiation
              </label>
              <Select
                options={machines.map((m) => ({
                  value: m._id,
                  label: `${m.machineCode} (${m.machineCategory})`,
                }))}
                value={selectedMachines}
                onChange={setSelectedMachines}
                placeholder={
                  loading
                    ? "Loading..."
                    : machines.length === 0
                      ? "No machines available"
                      : "Select one or more machines..."
                }
                isClearable
                isMulti
                styles={customStyles}
                isDisabled={machines.length === 0 || loading}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`py-2 px-6 rounded-md shadow transition ${
                  loading
                    ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {loading ? "Processing..." : "Initiate Return"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ReturnMachine;
