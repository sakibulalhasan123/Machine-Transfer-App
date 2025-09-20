import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Select from "react-select";

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

  // 🔹 Auto-clear messages
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // 🔹 Load factories
  useEffect(() => {
    const fetchFactories = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/factories`);
        if (!res.ok) throw new Error("Failed to load factories");
        const data = await res.json();
        setFactories(Array.isArray(data) ? data : data.factories || []);
      } catch (err) {
        console.error("❌ Error loading factories:", err);
        setMessage("❌ Failed to load factories.");
      } finally {
        setLoading(false);
      }
    };
    fetchFactories();
  }, []);

  // 🔹 Load borrowed machines for factory
  useEffect(() => {
    if (!selectedFactory) {
      setMachines([]);
      setSelectedMachines([]);
      return;
    }

    const fetchMachines = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_URL}/api/transfers/machine/borrowed/${selectedFactory.value}`
        );
        if (!res.ok) throw new Error("Failed to load machines");
        const data = await res.json();
        setMachines(data.machines || []);
        setSelectedMachines([]);
      } catch (err) {
        console.error("❌ Error fetching machines:", err);
        setMessage("❌ Failed to load machines.");
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, [selectedFactory]);

  // 🔹 Handle return
  const handleReturn = async (e) => {
    e.preventDefault();
    if (!selectedMachines.length) {
      setMessage("❌ Please select machines to return.");
      return;
    }

    const token = localStorage.getItem("authToken");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/transfers/machine/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          machineIds: selectedMachines.map((m) => m.value),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Return failed");

      setMessage(
        `✅ Returned ${data.returned.length}, Skipped ${data.skipped.length}`
      );
      setTimeout(() => setMessage(""), 2000);
      setMachines((prev) =>
        prev.filter((m) => !data.returned.some((r) => r._id === m._id))
      );
      setSelectedMachines([]);
      setSelectedFactory(null);
    } catch (err) {
      console.error("❌ Return error:", err);
      setMessage(`❌ Error: ${err.message}`);
      setTimeout(() => setMessage(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl border border-gray-200">
          <h2 className="text-xl font-semibold mb-6">Return Machines</h2>
          <Message text={message} />

          <form onSubmit={handleReturn} className="grid grid-cols-1 gap-6">
            {/* Factory Select */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Select Factory
              </label>
              <Select
                options={factories.map((f) => ({
                  value: f._id,
                  label: `${f.factoryName} (${f.factoryLocation})`,
                }))}
                value={selectedFactory}
                onChange={setSelectedFactory}
                placeholder="Select a factory..."
                isClearable
                styles={customStyles}
              />
            </div>

            {/* Machines Select */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Select Machines to Return
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
                {loading ? "Processing..." : "Return"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ReturnMachine;
