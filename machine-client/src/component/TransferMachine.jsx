import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Select from "react-select";

// ✅ Reusable select styles
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

// ✅ Message component
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

function TransferMachine() {
  const [factories, setFactories] = useState([]);
  const [fromFactory, setFromFactory] = useState(null);
  const [toFactory, setToFactory] = useState(null);
  const [factoryMachines, setFactoryMachines] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [message, setMessage] = useState("");

  // ✅ Load factories on mount
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/factories`)
      .then((res) => res.json())
      .then((data) =>
        setFactories(Array.isArray(data) ? data : data.factories || [])
      )
      .catch((err) => console.error("❌ Error loading factories:", err));
  }, []);

  // ✅ Fetch machines by selected factory
  const handleFactoryChange = async (selected) => {
    setFromFactory(selected);
    setSelectedMachines([]);
    setFactoryMachines([]);
    setToFactory(null);

    if (!selected) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/factories/${selected.value}/machines`
      );
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(`Invalid JSON: ${text}`);
      }

      const machines = data.machines || [];
      // Add dummy option if no machines
      if (machines.length === 0) {
        setFactoryMachines([
          {
            _id: "none",
            machineCode: "No machines available",
            machineCategory: "",
          },
        ]);
      } else {
        setFactoryMachines(machines);
      }
    } catch (err) {
      console.error("❌ Error fetching machines:", err);
      setMessage(`❌ Error fetching machines: ${err.message}`);
    }
  };

  // ✅ Handle machine transfer
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !fromFactory ||
      !toFactory ||
      !selectedMachines.length ||
      selectedMachines[0].value === "none"
    ) {
      setMessage(
        "❌ Please select source factory, machines, and target factory."
      );
      return;
    }
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/transfer/transfers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fromFactory: fromFactory.value,
            toFactory: toFactory.value,
            machineIds: selectedMachines.map((m) => m.value),
          }),
        }
      );

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(`Invalid JSON response: ${text}`);
      }

      if (!res.ok) throw new Error(data.error || "Transfer failed");

      setMessage("✅ Machines transferred successfully!");
      setFromFactory(null);
      setToFactory(null);
      setSelectedMachines([]);
      setFactoryMachines([]);

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Transfer error:", err);
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl border border-gray-200">
          <h2 className="text-xl font-semibold mb-6">Transfer Machines</h2>

          <Message text={message} />

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
            {/* From Factory */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                From Factory
              </label>
              <Select
                options={factories.map((f) => ({
                  value: f._id,
                  label: `${f.factoryName} (${f.factoryLocation})`,
                }))}
                value={fromFactory}
                onChange={handleFactoryChange}
                placeholder="Select source factory..."
                isClearable
                styles={customStyles}
              />
            </div>

            {/* Machines */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Select Machines
              </label>
              <Select
                options={factoryMachines.map((m) => ({
                  value: m._id,
                  label:
                    m.machineCode === "No machines available"
                      ? "No machines available"
                      : `${m.machineCode} (${m.machineCategory})`,
                }))}
                value={selectedMachines}
                onChange={setSelectedMachines}
                placeholder={
                  fromFactory
                    ? factoryMachines.length === 0 ||
                      factoryMachines[0]._id === "none"
                      ? "No machines available"
                      : "Select one or more machines..."
                    : "Select a factory first"
                }
                isClearable
                isMulti
                styles={customStyles}
                isDisabled={
                  !fromFactory ||
                  factoryMachines.length === 0 ||
                  factoryMachines[0]._id === "none"
                }
              />
            </div>

            {/* To Factory */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Transfer To
              </label>
              <Select
                options={factories
                  .filter((f) => f._id !== fromFactory?.value)
                  .map((f) => ({
                    value: f._id,
                    label: `${f.factoryName} (${f.factoryLocation})`,
                  }))}
                value={toFactory}
                onChange={setToFactory}
                placeholder="Select target factory..."
                isClearable
                styles={customStyles}
                isDisabled={!fromFactory}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white py-2 px-6 rounded-md shadow hover:bg-indigo-700 transition"
              >
                Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default TransferMachine;
