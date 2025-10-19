import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Select from "react-select";

const customStyles = {
  control: (provided) => ({
    ...provided,
    borderRadius: "0.5rem",
    minHeight: "42px",
  }),
};

export default function IdleEndForm() {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [idleMachines, setIdleMachines] = useState([]);
  const [selectedIdle, setSelectedIdle] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role;
  const userFactoryId = user?.factoryId;

  // Load factories
  useEffect(() => {
    const loadFactories = async () => {
      if (!token) return;
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/factories`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        let factoryList = Array.isArray(data) ? data : data.factories || [];

        // Normal user → only assigned factory
        if (userRole !== "superadmin") {
          factoryList = factoryList.filter((f) => f._id === userFactoryId);
        }

        setFactories(factoryList);

        // Auto-select factory for normal users
        if (userRole !== "superadmin" && factoryList.length > 0) {
          const selected = {
            value: factoryList[0]._id,
            label: `${factoryList[0].factoryName} (${factoryList[0].factoryLocation})`,
          };
          setSelectedFactory(selected);
          fetchIdleMachines(selected.value);
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: "❌ Error loading factories" });
      }
    };

    loadFactories();
  }, [token, userRole, userFactoryId]);

  // Fetch idle machines
  const fetchIdleMachines = async (factoryId) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/machineIdles/in-progress/${factoryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setIdleMachines(data.idles || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "❌ Error loading idle machines" });
    }
  };

  // Handle factory change (for superadmin)
  const handleFactoryChange = (selected) => {
    setSelectedFactory(selected);
    setSelectedIdle(null);
    setIdleMachines([]);
    if (selected) fetchIdleMachines(selected.value);
  };

  // End idle
  const handleEndIdle = async () => {
    if (!selectedIdle) {
      setMessage({ type: "error", text: "❌ Select an idle machine" });
      return;
    }
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/machineIdles/${selectedIdle.value}/end`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endTime: new Date() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to end idle");

      setMessage({ type: "success", text: "✅ Idle ended successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 2000);

      // Reset selections
      setSelectedIdle(null);
      setIdleMachines(idleMachines.filter((i) => i._id !== selectedIdle.value));
      if (userRole === "superadmin") setSelectedFactory(null);
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
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md grid gap-4">
          <h2 className="text-xl font-semibold mb-4">End Machine Idle</h2>

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

          {/* Factory */}
          <label>Factory</label>
          <Select
            options={factories.map((f) => ({
              value: f._id,
              label: `${f.factoryName} (${f.factoryLocation})`,
            }))}
            value={selectedFactory}
            onChange={handleFactoryChange}
            styles={customStyles}
            placeholder="Select factory..."
            isDisabled={userRole !== "superadmin"}
          />

          {/* Idle Machines */}
          <label>Idle Machines</label>
          <Select
            options={idleMachines.map((i) => ({
              value: i._id,
              label: i.machineCode,
            }))}
            value={selectedIdle}
            onChange={setSelectedIdle}
            styles={customStyles}
            placeholder={
              !selectedFactory
                ? "Select factory first"
                : "Select idle machine..."
            }
            isDisabled={!selectedFactory || idleMachines.length === 0}
          />

          <button
            onClick={handleEndIdle}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            End Idle
          </button>
        </div>
      </div>
    </>
  );
}
