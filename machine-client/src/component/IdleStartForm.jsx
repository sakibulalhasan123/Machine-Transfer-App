// import { useState, useEffect } from "react";
// import Navbar from "./Navbar";
// import Select from "react-select";

// const customStyles = {
//   control: (provided) => ({
//     ...provided,
//     borderRadius: "0.5rem",
//     borderColor: "#d1d5db",
//     padding: "2px",
//     boxShadow: "none",
//     minHeight: "42px",
//     "&:hover": { borderColor: "#6366f1" },
//   }),
//   option: (provided, state) => ({
//     ...provided,
//     backgroundColor: state.isFocused ? "#eef2ff" : "white",
//     color: state.isFocused ? "#4338ca" : "black",
//     padding: "8px 12px",
//   }),
// };

// export default function IdleStartForm() {
//   const [factories, setFactories] = useState([]);
//   const [selectedFactory, setSelectedFactory] = useState(null);
//   const [machines, setMachines] = useState([]);
//   const [selectedMachine, setSelectedMachine] = useState(null);
//   const [reason, setReason] = useState("");
//   const [description, setDescription] = useState("");
//   const [message, setMessage] = useState({ type: "", text: "" });
//   const token = localStorage.getItem("authToken");

//   useEffect(() => {
//     fetch(`${process.env.REACT_APP_API_URL}/api/factories`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then((data) => setFactories(data))
//       .catch(() =>
//         setMessage({ type: "error", text: "❌ Error loading factories" })
//       );
//   }, [token]);

//   // Fetch available machines for selected factory
//   const handleFactoryChange = async (selected) => {
//     setSelectedFactory(selected);
//     setSelectedMachine(null);
//     setMachines([]);

//     if (!selected) return;

//     try {
//       const res = await fetch(
//         `${process.env.REACT_APP_API_URL}/api/machineIdles/available/${selected.value}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       const data = await res.json();
//       setMachines(data.machines || []);
//     } catch (err) {
//       console.error(err);
//       setMessage({ type: "error", text: "❌ Error loading machines" });
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!selectedFactory || !selectedMachine || !reason.trim()) {
//       setMessage({ type: "error", text: "❌ Fill all required fields" });
//       return;
//     }

//     try {
//       const res = await fetch(
//         `${process.env.REACT_APP_API_URL}/api/machineIdles`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             factoryId: selectedFactory.value,
//             machineId: selectedMachine.value,
//             reason,
//             description,
//             startTime: new Date(),
//           }),
//         }
//       );
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Idle creation failed");
//       setSelectedFactory(null);
//       setSelectedMachine(null);
//       setMachines([]);
//       setReason("");
//       setDescription("");

//       // ✅ Show message for 2 seconds
//       setMessage({ type: "success", text: "✅ Machine marked idle!" });
//       setTimeout(() => setMessage({ type: "", text: "" }), 2000);
//     } catch (err) {
//       console.error(err);
//       setMessage({ type: "error", text: `❌ ${err.message}` });
//       setTimeout(() => setMessage({ type: "", text: "" }), 2000);
//     }
//   };

//   return (
//     <>
//       <Navbar />
//       <div className="flex justify-center mt-10">
//         <form
//           onSubmit={handleSubmit}
//           className="bg-white p-8 rounded shadow-md w-full max-w-md grid gap-4"
//         >
//           <h2 className="text-2xl font-bold mb-4 text-center">
//             Start Machine Idle
//           </h2>
//           {message.text && (
//             <div
//               className={`p-2 rounded ${
//                 message.type === "error"
//                   ? "bg-red-100 text-red-700"
//                   : "bg-green-100 text-green-700"
//               }`}
//             >
//               {message.text}
//             </div>
//           )}

//           <label>Factory Name :</label>
//           <Select
//             options={factories.map((f) => ({
//               value: f._id,
//               label: f.factoryName,
//             }))}
//             value={selectedFactory}
//             onChange={handleFactoryChange}
//             styles={customStyles}
//             placeholder="Select factory..."
//           />

//           <label>Machine Code</label>
//           <Select
//             options={machines.map((m) => ({
//               value: m._id,
//               label: m.machineCode,
//             }))}
//             value={selectedMachine}
//             onChange={setSelectedMachine}
//             styles={customStyles}
//             placeholder="Select machine..."
//             isDisabled={!selectedFactory || machines.length === 0}
//           />

//           <label>Reason :</label>
//           <input
//             type="text"
//             className="border rounded p-2"
//             value={reason}
//             onChange={(e) => setReason(e.target.value)}
//             placeholder="Enter reason"
//             required
//           />

//           <label>Description :</label>
//           <textarea
//             className="border rounded p-2"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             placeholder="Extra details"
//           />

//           <button
//             type="submit"
//             className="bg-indigo-600 text-white px-4 py-2 rounded"
//           >
//             Start Machine Idle
//           </button>
//         </form>
//       </div>
//     </>
//   );
// }

import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Select from "react-select";

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
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg grid gap-5 border border-gray-100"
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

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Factory Name
            </label>
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
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Machine Code
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

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">Reason</label>
            <input
              type="text"
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Extra details"
              rows={3}
            />
          </div>

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
