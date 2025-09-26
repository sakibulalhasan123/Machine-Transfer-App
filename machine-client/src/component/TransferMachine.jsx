import { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import Select from "react-select";
import { AuthContext } from "../context/AuthContext";

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
  option: (provided) => ({
    ...provided,
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
  const { user } = useContext(AuthContext);
  const [factories, setFactories] = useState([]);
  const [fromFactory, setFromFactory] = useState(null); // Superadmin can choose
  const [toFactory, setToFactory] = useState(null);
  const [factoryMachines, setFactoryMachines] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const [refreshMachines, setRefreshMachines] = useState(false);
  const userFactory = user?.factoryId;

  useEffect(() => {
    const fetchFactories = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return console.error("No auth token found");

      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/factories`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch factories");
        const data = await res.json();
        setFactories(Array.isArray(data) ? data : data.factories || []);
      } catch (err) {
        console.error("❌ Error loading factories:", err);
      }
    };
    fetchFactories();
  }, []);

  // Load machines (only In-House)

  useEffect(() => {
    const fetchMachines = async () => {
      const factoryId =
        user.role === "superadmin" ? fromFactory?.value : userFactory;
      if (!factoryId) return;

      const token = localStorage.getItem("authToken");
      if (!token) return console.error("No auth token found");

      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/factories/${factoryId}/machines`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch machines");

        const data = await res.json();
        const machines = data.machines || [];

        // Only In-House machines
        const inHouseMachines = machines.filter((m) => m.status === "In-House");

        setFactoryMachines(
          inHouseMachines.length
            ? inHouseMachines
            : [
                {
                  _id: "none",
                  machineCode: "No machines available",
                },
              ]
        );
      } catch (err) {
        console.error("❌ Error fetching machines:", err);
        setFactoryMachines([
          {
            _id: "none",
            machineCode: "No machines available",
          },
        ]);
      }
    };

    fetchMachines();
  }, [fromFactory, userFactory, user.role, refreshMachines]);

  // ✅ Clear selections when source factory changes
  useEffect(() => {
    setSelectedMachines([]);
    setFactoryMachines([]);
    setToFactory(null);
  }, [fromFactory]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validMachines = selectedMachines.filter((m) => m.value !== "none");
    const sourceFactoryId =
      user.role === "superadmin" ? fromFactory?.value : userFactory;

    if (!sourceFactoryId || !toFactory || !validMachines.length) {
      setMessage(
        "❌ Please select source factory, machines, and target factory."
      );
      return;
    }
    // ✅ Prevent same factory transfer
    if (sourceFactoryId === toFactory.value) {
      setMessage("❌ Source and target factory cannot be the same.");
      return;
    }
    const token = localStorage.getItem("authToken");

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/transfers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fromFactory: sourceFactoryId,
            toFactory: toFactory.value,
            machineIds: validMachines.map((m) => m.value),
            remarks: remarks || "",
            status: "Transfer In-Progress",
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer Initiation failed");

      setMessage("✅ Machines Transfer Initiated successfully!");
      setSelectedMachines([]);
      setFromFactory(null);
      setToFactory(null);
      setRemarks("");
      // setFactoryMachines([]);

      // 🔹 Trigger machine refresh
      setRefreshMachines((prev) => !prev);
      setTimeout(() => setMessage(""), 2000);
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
          <h2 className="text-2xl font-bold mb-6 text-center">
            Machine Transfer Initiation
          </h2>

          <Message text={message} />

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
            {/* From Factory */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                From Factory :
              </label>
              <Select
                options={
                  user.role === "superadmin"
                    ? factories.map((f) => ({
                        value: f._id,
                        label: f.factoryName,
                      }))
                    : [
                        {
                          value: userFactory,
                          label:
                            factories.find((f) => f._id === userFactory)
                              ?.factoryName || "My Factory",
                        },
                      ]
                }
                value={
                  user.role === "superadmin"
                    ? fromFactory
                    : {
                        value: userFactory,
                        label:
                          factories.find((f) => f._id === userFactory)
                            ?.factoryName || "My Factory",
                      }
                }
                onChange={setFromFactory}
                isDisabled={user.role !== "superadmin"}
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
                isMulti
                isClearable
                styles={customStyles}
                isDisabled={!factoryMachines.length}
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Remarks (optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any remarks for this transfer"
              />
            </div>

            {/* To Factory */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Transfer To
              </label>
              <Select
                options={factories
                  .filter(
                    (f) =>
                      f._id !==
                      (user.role === "superadmin"
                        ? fromFactory?.value
                        : userFactory)
                  )
                  .map((f) => ({
                    value: f._id,
                    label: `${f.factoryName} (${f.factoryLocation})`,
                  }))}
                value={toFactory}
                onChange={setToFactory}
                isClearable
                isDisabled={!(user.role === "superadmin" ? fromFactory : true)} // 🔹 Enable only if fromFactory selected
                styles={customStyles}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white py-2 px-6 rounded-md shadow hover:bg-indigo-700 transition"
              >
                Transfer Initiation
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default TransferMachine;
