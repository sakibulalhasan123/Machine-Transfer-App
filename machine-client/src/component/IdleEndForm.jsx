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

  // Fetch idle machines for factory
  const handleFactoryChange = async (selected) => {
    setSelectedFactory(selected);
    setSelectedIdle(null);
    setIdleMachines([]);

    if (!selected) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/machineIdles/in-progress/${selected.value}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setIdleMachines(data.idles || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "❌ Error loading idle machines" });
    }
  };

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
      setSelectedFactory(null);
      setMessage({ type: "success", text: "✅ Idle ended successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 2000);
      setSelectedIdle(null);
      setIdleMachines(idleMachines.filter((i) => i._id !== selectedIdle.value));
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
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            End Idle
          </button>
        </div>
      </div>
    </>
  );
}
