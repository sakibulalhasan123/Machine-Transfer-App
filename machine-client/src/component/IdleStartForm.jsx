import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Select from "react-select";

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
};

export default function IdleStartForm() {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/factories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFactories(data))
      .catch(() =>
        setMessage({ type: "error", text: "❌ Error loading factories" })
      );
  }, [token]);

  // Fetch available machines for selected factory
  const handleFactoryChange = async (selected) => {
    setSelectedFactory(selected);
    setSelectedMachine(null);
    setMachines([]);

    if (!selected) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/machineIdles/available/${selected.value}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setMachines(data.machines || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "❌ Error loading machines" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFactory || !selectedMachine || !reason.trim()) {
      setMessage({ type: "error", text: "❌ Fill all required fields" });
      return;
    }

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/machineIdles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            factoryId: selectedFactory.value,
            machineId: selectedMachine.value,
            reason,
            description,
            startTime: new Date(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Idle creation failed");
      setSelectedFactory(null);
      setSelectedMachine(null);
      setMachines([]);
      setReason("");
      setDescription("");

      // ✅ Show message for 2 seconds
      setMessage({ type: "success", text: "✅ Machine marked idle!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 2000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: `❌ ${err.message}` });
      setTimeout(() => setMessage({ type: "", text: "" }), 2000);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center mt-10">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded shadow-md w-full max-w-md grid gap-4"
        >
          <h2 className="text-xl font-semibold mb-4">Start Machine Idle</h2>
          {message.text && (
            <div
              className={`p-2 rounded ${
                message.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <label>Factory</label>
          <Select
            options={factories.map((f) => ({
              value: f._id,
              label: f.factoryName,
            }))}
            value={selectedFactory}
            onChange={handleFactoryChange}
            styles={customStyles}
            placeholder="Select factory..."
          />

          <label>Machine</label>
          <Select
            options={machines.map((m) => ({
              value: m._id,
              label: m.machineCode,
            }))}
            value={selectedMachine}
            onChange={setSelectedMachine}
            styles={customStyles}
            placeholder="Select machine..."
            isDisabled={!selectedFactory || machines.length === 0}
          />

          <label>Reason</label>
          <input
            type="text"
            className="border rounded p-2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason"
            required
          />

          <label>Description (optional)</label>
          <textarea
            className="border rounded p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Extra details"
          />

          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Start Idle
          </button>
        </form>
      </div>
    </>
  );
}
