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
  const { user } = useContext(AuthContext); // ✅ get current user
  const [factories, setFactories] = useState([]);
  // const [fromFactory, setFromFactory] = useState(null);
  const [toFactory, setToFactory] = useState(null);
  const [factoryMachines, setFactoryMachines] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");
  const userFactory = user?.factoryId; // ✅ user factory
  // Load all factories for "To Factory" dropdown
  // ✅ Load factories on mount
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/factories`)
      .then((res) => res.json())
      .then((data) =>
        setFactories(Array.isArray(data) ? data : data.factories || [])
      )
      .catch((err) => console.error("❌ Error loading factories:", err));
  }, []);

  // Load machines for user factory
  useEffect(() => {
    if (!userFactory) {
      setMessage("❌ No factory assigned to your user");
      return;
    }

    fetch(
      `${process.env.REACT_APP_API_URL}/api/factories/${userFactory}/machines`
    )
      .then((res) => res.json())
      .then((data) => {
        const machines = data.machines || [];
        // ✅ Show only "In-House" machines
        const availableMachines = machines.filter(
          (m) => m.status === "In-House"
        );
        setFactoryMachines(
          availableMachines.length
            ? availableMachines
            : [
                {
                  _id: "none",
                  machineCode: "No machines available",
                  machineCategory: "",
                },
              ]
        );
      })
      .catch((err) => {
        console.error("❌ Error fetching machines:", err);
        setMessage(`❌ Error fetching machines: ${err.message}`);
      });
  }, [userFactory]);
  // // ✅ Fetch machines by selected factory
  // const handleFactoryChange = async (selected) => {
  //   setFromFactory(selected);
  //   setSelectedMachines([]);
  //   setFactoryMachines([]);
  //   setToFactory(null);

  //   if (!selected) return;

  //   try {
  //     const res = await fetch(
  //       `${process.env.REACT_APP_API_URL}/api/factories/${selected.value}/machines`
  //     );
  //     const data = await res.json();
  //     const machines = data.machines || [];

  //     // Show only "In-House" machines
  //     const availableMachines = machines.filter(
  //       (m) => m.status === "In-House" && m.factoryId === selected.value
  //     );
  //     setFactoryMachines(
  //       availableMachines.length
  //         ? availableMachines
  //         : [
  //             {
  //               _id: "none",
  //               machineCode: "No machines available",
  //               machineCategory: "",
  //             },
  //           ]
  //     );
  //   } catch (err) {
  //     console.error("❌ Error fetching machines:", err);
  //     setMessage(`❌ Error fetching machines: ${err.message}`);
  //   }
  // };

  // ✅ Handle machine transfer
  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (
  //     !fromFactory ||
  //     !toFactory ||
  //     !selectedMachines.length ||
  //     selectedMachines[0].value === "none"
  //   ) {
  //     setMessage(
  //       "❌ Please select source factory, machines, and target factory."
  //     );
  //     return;
  //   }

  //   const token = localStorage.getItem("authToken");

  //   try {
  //     const res = await fetch(
  //       `${process.env.REACT_APP_API_URL}/api/transfers`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: JSON.stringify({
  //           fromFactory: userFactory, // ✅ always user's factory
  //           // fromFactory: fromFactory.value,
  //           toFactory: toFactory.value,
  //           machineIds: selectedMachines.map((m) => m.value),
  //           remarks: remarks || "",
  //         }),
  //       }
  //     );

  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data.error || "Transfer failed");

  //     setMessage("✅ Machines transferred successfully!");
  //     setFromFactory(null);
  //     setToFactory(null);
  //     setSelectedMachines([]);
  //     setFactoryMachines([]);
  //     setRemarks("");

  //     setTimeout(() => setMessage(""), 2000);
  //   } catch (err) {
  //     console.error("❌ Transfer error:", err);
  //     setMessage(`❌ Error: ${err.message}`);
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validMachines = selectedMachines.filter((m) => m.value !== "none");

    if (!userFactory || !toFactory || !validMachines.length) {
      setMessage(
        "❌ Please select source factory, machines, and target factory."
      );
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
            fromFactory: userFactory,
            toFactory: toFactory.value,
            machineIds: validMachines.map((m) => m.value),
            remarks: remarks || "",
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");

      setMessage("✅ Machines transferred successfully!");
      setSelectedMachines([]);
      setToFactory(null);
      setRemarks("");
      setFactoryMachines([]); // optionally reload machines
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
          <h2 className="text-xl font-semibold mb-6">Transfer Machines</h2>

          <Message text={message} />

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
            {/* From Factory (auto-selected & disabled) */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                From Factory
              </label>
              <Select
                options={
                  userFactory
                    ? [
                        {
                          value: userFactory,
                          label:
                            factories.find((f) => f._id === userFactory)
                              ?.factoryName || "My Factory",
                        },
                      ]
                    : []
                }
                value={
                  userFactory
                    ? {
                        value: userFactory,
                        label:
                          factories.find((f) => f._id === userFactory)
                            ?.factoryName || "My Factory",
                      }
                    : null
                }
                isDisabled
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
                  factoryMachines.length === 0 ||
                  factoryMachines[0]._id === "none"
                    ? "No machines available"
                    : "Select one or more machines..."
                }
                isClearable
                isMulti
                styles={customStyles}
                isDisabled={
                  factoryMachines.length === 0 ||
                  factoryMachines[0]._id === "none"
                }
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
                  .filter((f) => f._id !== userFactory)
                  .map((f) => ({
                    value: f._id,
                    label: `${f.factoryName} (${f.factoryLocation})`,
                  }))}
                value={toFactory}
                onChange={setToFactory}
                placeholder="Select target factory..."
                isClearable
                styles={customStyles}
                isDisabled={!factories.length || !userFactory}
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
