import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const customStyles = {
  control: (provided) => ({
    ...provided,
    borderRadius: "0.75rem",
    borderColor: "#e5e7eb",
    padding: "2px",
    boxShadow: "none",
    minHeight: "44px",
    "&:hover": { borderColor: "#6366f1" },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#eef2ff" : "white",
    color: state.isFocused ? "#4338ca" : "black",
    padding: "10px 14px",
  }),
};

export default function IdleStartForm() {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [message, setMessage] = useState({ type: "", text: "" });

  const token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("user"));
  const userRole = user?.role;
  const userFactoryId = user?.factoryId;

  // ✅ Load factories
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

        // 🔒 Normal user → show only assigned factory
        if (userRole !== "superadmin") {
          factoryList = factoryList.filter((f) => f._id === userFactoryId);
        }

        setFactories(factoryList);

        // 🎯 Auto select for user
        if (userRole !== "superadmin" && factoryList.length > 0) {
          const selected = {
            value: factoryList[0]._id,
            label: `${factoryList[0].factoryName} (${factoryList[0].factoryLocation})`,
          };
          setSelectedFactory(selected);
          // ✅ Auto-load machines for user's factory
          fetchMachines(selected.value);
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: "❌ Error loading factories" });
      }
    };

    loadFactories();
  }, [token, userRole, userFactoryId]);

  // ✅ Fetch available machines
  const fetchMachines = async (factoryId) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/machineIdles/available/${factoryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setMachines(data.machines || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "❌ Error loading machines" });
    }
  };

  // ✅ Handle factory selection (for admin)
  const handleFactoryChange = (selected) => {
    setSelectedFactory(selected);
    setSelectedMachine(null);
    setMachines([]);
    if (selected) fetchMachines(selected.value);
  };

  // ✅ Submit form
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
            startTime: startDate,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Idle creation failed");

      // ✅ Reset form for admin, but not for normal user
      if (userRole === "superadmin") setSelectedFactory(null);
      setSelectedMachine(null);
      setMachines([]);
      setReason("");
      setDescription("");
      setStartDate(new Date());

      setMessage({ type: "success", text: "✅ Machine marked idle!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 2500);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: `❌ ${err.message}` });
      setTimeout(() => setMessage({ type: "", text: "" }), 2500);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center mt-12 px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl grid gap-5 border border-gray-100"
        >
          <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
            Start Machine Idle
          </h2>

          {message.text && (
            <div
              className={`p-3 rounded-lg text-sm font-medium transition-all ${
                message.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* ✅ Factory */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Factory Name :
            </label>
            <Select
              options={factories.map((f) => ({
                value: f._id,
                label: `${f.factoryName} (${f.factoryLocation})`,
              }))}
              value={selectedFactory}
              onChange={handleFactoryChange}
              styles={customStyles}
              placeholder="Select factory..."
              isDisabled={userRole !== "superadmin"} // 🔒 disable for normal user
            />
          </div>

          {/* ✅ Machine */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Machine Code :
            </label>
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
          </div>

          {/* Reason */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Reason :
            </label>
            <input
              type="text"
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason"
              required
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Description :
            </label>
            <textarea
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Extra details"
              rows={3}
            />
          </div>

          {/* ✅ Start Date & Time */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Machine Idle Start Date & Time :
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholderText="Select start date & time"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            Start Machine Idle
          </button>
        </form>
      </div>
    </>
  );
}
