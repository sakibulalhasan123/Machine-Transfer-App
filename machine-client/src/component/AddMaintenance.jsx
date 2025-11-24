import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Select from "react-select";
import jwt_decode from "jwt-decode";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

function Maintenance() {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [factoryMachines, setFactoryMachines] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [maintenanceType, setMaintenanceType] = useState("");
  const [description, setDescription] = useState("");
  const [sparePartsInput, setSparePartsInput] = useState("");
  const [spareParts, setSpareParts] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState(new Date());
  const [message, setMessage] = useState("");

  const [userRole, setUserRole] = useState("");
  const [userFactoryId, setUserFactoryId] = useState("");

  const token = localStorage.getItem("authToken");

  // Decode token
  useEffect(() => {
    if (!token) return;
    try {
      const decoded = jwt_decode(token);
      setUserRole(decoded.role);
      setUserFactoryId(decoded.factoryId || "");
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }, [token]);

  // Load factories
  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.REACT_APP_API_URL}/api/factories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        let factoryList = Array.isArray(data) ? data : data.factories || [];

        if (userRole !== "superadmin") {
          // Normal user → শুধু assigned factory
          factoryList = factoryList.filter((f) => f._id === userFactoryId);
        }

        setFactories(factoryList);

        // Normal user → auto select factory
        if (userRole !== "superadmin" && factoryList.length > 0) {
          setSelectedFactory({
            value: factoryList[0]._id,
            label: `${factoryList[0].factoryName} (${factoryList[0].factoryLocation})`,
          });
        }
      })
      .catch(console.error);
  }, [token, userRole, userFactoryId]);

  // Fetch machines whenever selectedFactory changes
  const fetchMachines = async (factoryId) => {
    if (!factoryId) return;
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/maintenances/machines/factory/${factoryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      const availableMachines = (data.machines || []).filter(
        (m) =>
          ["In-House", "Borrowed"].includes(m.status) &&
          (!m.maintenanceStatus || m.maintenanceStatus !== "In-Progress")
      );
      setFactoryMachines(availableMachines);
      setSelectedMachines([]);
    } catch (err) {
      console.error("Error fetching machines:", err);
      setMessage("❌ Error fetching machines");
      setFactoryMachines([]);
    }
  };

  useEffect(() => {
    if (selectedFactory) {
      fetchMachines(selectedFactory.value);
    }
  }, [selectedFactory]);

  const handleSparePartsChange = (e) => {
    const input = e.target.value;
    setSparePartsInput(input);
    setSpareParts(
      input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !selectedFactory ||
      selectedMachines.length === 0 ||
      !maintenanceType ||
      !description
    ) {
      setMessage("❌ Please fill all required fields");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/maintenances`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            factoryId: selectedFactory.value,
            machineIds: selectedMachines.map((m) => m.value),
            maintenanceType,
            description,
            spareParts,
            remarks,
            maintenanceDate: maintenanceDate || undefined, // ✅ send user-provided date
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Maintenance creation failed");

      setMessage("✅ Maintenance created successfully!");
      setMaintenanceType("");
      setDescription("");
      setSparePartsInput("");
      setSpareParts([]);
      setRemarks("");

      // Superadmin → clear factory selection
      if (userRole === "superadmin") setSelectedFactory(null);

      // Always refresh machines
      fetchMachines(selectedFactory?.value);

      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xl border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Create Maintenance
          </h2>
          {message && (
            <div
              className={`mb-4 p-3 rounded-md text-sm ${
                message.startsWith("✅")
                  ? "bg-green-50 border border-green-300 text-green-700"
                  : "bg-red-50 border border-red-300 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            {/* Factory */}
            <div>
              <label className="block mb-1">Factory :</label>
              <Select
                options={factories.map((f) => ({
                  value: f._id,
                  label: `${f.factoryName} (${f.factoryLocation})`,
                }))}
                value={selectedFactory}
                onChange={setSelectedFactory}
                placeholder="Select factory..."
                styles={customStyles}
                isDisabled={userRole !== "superadmin"} // Normal user disabled
              />
            </div>

            {/* Machines */}
            <div>
              <label className="block mb-1">Machines :</label>
              <Select
                options={factoryMachines.map((m) => ({
                  value: m._id,
                  label: `${m.machineCode} (${m.machineCategory}) [${m.status}]`,
                }))}
                value={selectedMachines}
                onChange={setSelectedMachines}
                placeholder="Select machines..."
                isMulti
                styles={customStyles}
                isDisabled={factoryMachines.length === 0}
              />
            </div>

            {/* Maintenance Type */}
            <div>
              <label className="block mb-1">Maintenance Type :</label>
              <select
                className="w-full border rounded p-2"
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
              >
                <option value="">Select type</option>
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
                <option value="Breakdown">Breakdown</option>
                <option value="Inspection">Inspection</option>
                <option value="Calibration">Calibration</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block mb-1">Description :</label>
              <textarea
                className="w-full border rounded p-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Spare Parts */}
            <div>
              <label className="block mb-1">
                Spare Parts : (comma separated)
              </label>
              <input
                className="w-full border rounded p-2"
                value={sparePartsInput}
                onChange={handleSparePartsChange}
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block mb-1">Remarks :</label>
              <input
                className="w-full border rounded p-2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1">
                Maintenance Start Date & Time :
              </label>
              <DatePicker
                selected={maintenanceDate}
                onChange={(date) => setMaintenanceDate(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full border rounded p-2"
                placeholderText="Select date and time"
              />
            </div>
            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded"
              >
                Create Maintenance
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default Maintenance;
