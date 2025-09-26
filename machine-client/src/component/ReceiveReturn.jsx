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

export default function ReceiveReturn() {
  const [machines, setMachines] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("authToken");

  // 🔹 Load return-initiated machines for this factory
  useEffect(() => {
    const fetchMachines = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(
          `${API_URL}/api/transfers/machine/pending-receive`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to load machines");
        const data = await res.json();
        setMachines(data.machines || []);
      } catch (err) {
        console.error("❌ Error loading machines:", err);
        setMessage("❌ Failed to load machines.");
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, [token]);

  // 🔹 Auto-clear messages
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // 🔹 Handle receive
  const handleReceive = async (e) => {
    e.preventDefault();
    if (!selectedMachines.length) {
      setMessage("❌ Please select machines to receive.");
      return;
    }

    try {
      setLoading(true);
      const responses = [];
      for (const machine of selectedMachines) {
        const res = await fetch(
          `${API_URL}/api/transfers/machine/return/receive`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ transferId: machine.transferId }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Receive failed");
        responses.push(data.machine);
      }

      setMessage(`✅ Received ${responses.length} machine(s) successfully.`);
      // Remove received machines from list
      setMachines((prev) =>
        prev.filter((m) => !responses.some((r) => r._id === m._id))
      );
      setSelectedMachines([]);
    } catch (err) {
      console.error("❌ Receive error:", err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Return Machine Receive
          </h2>
          <Message text={message} />

          <form onSubmit={handleReceive} className="grid grid-cols-1 gap-6">
            {/* Machines Select */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Select Machines to Return Receive
              </label>
              <Select
                options={machines.map((m) => ({
                  value: m._id,
                  label: `${m.machineCode} (${m.machineCategory})`,
                  transferId: m.transferId, // need for API
                }))}
                value={selectedMachines}
                onChange={setSelectedMachines}
                placeholder={
                  loading
                    ? "Loading..."
                    : machines.length === 0
                    ? "No machines to receive"
                    : "Select one or more machines..."
                }
                isClearable
                isMulti
                styles={customStyles}
                isDisabled={machines.length === 0 || loading}
                getOptionValue={(option) => option.value}
                getOptionLabel={(option) => option.label}
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
                {loading ? "Processing..." : "Receive"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
