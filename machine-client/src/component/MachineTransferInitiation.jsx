// import { useState, useEffect, useContext } from "react";
// import Navbar from "./Navbar";
// import Select from "react-select";
// import { AuthContext } from "../context/AuthContext";

// // ✅ Reusable select styles
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
//   option: (provided) => ({
//     ...provided,
//     padding: "8px 12px",
//   }),
//   placeholder: (provided) => ({ ...provided, color: "#9ca3af" }),
// };

// // ✅ Message component
// function Message({ text }) {
//   if (!text) return null;
//   const success = text.startsWith("✅");
//   return (
//     <div
//       className={`mb-4 p-3 rounded-md text-sm ${
//         success
//           ? "bg-green-50 border border-green-300 text-green-700"
//           : "bg-red-50 border border-red-300 text-red-700"
//       }`}
//     >
//       {text}
//     </div>
//   );
// }

// function TransferMachine() {
//   const { user } = useContext(AuthContext);
//   const [factories, setFactories] = useState([]);
//   const [fromFactory, setFromFactory] = useState(null); // Superadmin can choose
//   const [toFactory, setToFactory] = useState(null);
//   const [factoryMachines, setFactoryMachines] = useState([]);
//   const [selectedMachines, setSelectedMachines] = useState([]);
//   const [remarks, setRemarks] = useState("");
//   const [message, setMessage] = useState("");
//   const [refreshMachines, setRefreshMachines] = useState(false);
//   const userFactory = user?.factoryId;

//   useEffect(() => {
//     const fetchFactories = async () => {
//       const token = localStorage.getItem("authToken");
//       if (!token) return console.error("No auth token found");

//       try {
//         const res = await fetch(
//           `${process.env.REACT_APP_API_URL}/api/factories`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           },
//         );
//         if (!res.ok) throw new Error("Failed to fetch factories");
//         const data = await res.json();
//         console.log("Factories Data:", data); // 👈 here
//         setFactories(Array.isArray(data) ? data : data.factories || []);
//       } catch (err) {
//         console.error("❌ Error loading factories:", err);
//       }
//     };
//     fetchFactories();
//   }, []);

//   // Load machines (only In-House)

//   useEffect(() => {
//     const fetchMachines = async () => {
//       const factoryId =
//         user.role === "superadmin" ? fromFactory?.value : userFactory;
//       if (!factoryId) return;

//       const token = localStorage.getItem("authToken");
//       if (!token) return console.error("No auth token found");

//       try {
//         const res = await fetch(
//           `${process.env.REACT_APP_API_URL}/api/factories/${factoryId}/machines`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           },
//         );

//         if (!res.ok) throw new Error("Failed to fetch machines");

//         const data = await res.json();
//         const machines = data.machines || [];

//         // Only In-House machines
//         const inHouseMachines = machines.filter((m) => m.status === "In-House");

//         setFactoryMachines(
//           inHouseMachines.length
//             ? inHouseMachines
//             : [
//                 {
//                   _id: "none",
//                   machineCode: "No machines available",
//                 },
//               ],
//         );
//       } catch (err) {
//         console.error("❌ Error fetching machines:", err);
//         setFactoryMachines([
//           {
//             _id: "none",
//             machineCode: "No machines available",
//           },
//         ]);
//       }
//     };

//     fetchMachines();
//   }, [fromFactory, userFactory, user.role, refreshMachines]);

//   // ✅ Clear selections when source factory changes
//   useEffect(() => {
//     setSelectedMachines([]);
//     setFactoryMachines([]);
//     setToFactory(null);
//   }, [fromFactory]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const validMachines = selectedMachines.filter((m) => m.value !== "none");
//     const sourceFactoryId =
//       user.role === "superadmin" ? fromFactory?.value : userFactory;
//     if (!sourceFactoryId || !toFactory || !validMachines.length) {
//       setMessage("❌ Please Select From Factory, Machines, and To Factory.");
//       return;
//     }
//     // ✅ Prevent same factory transfer
//     if (sourceFactoryId === toFactory.value) {
//       setMessage("❌ Source and target factory cannot be the same.");
//       return;
//     }
//     const token = localStorage.getItem("authToken");

//     try {
//       const res = await fetch(
//         `${process.env.REACT_APP_API_URL}/api/transfers`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             fromFactory: sourceFactoryId,
//             toFactory: toFactory.value,
//             machineIds: validMachines.map((m) => m.value),
//             remarks: remarks || "",
//             status: "Transfer In-Progress",
//           }),
//         },
//       );

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Transfer Initiation failed");

//       setMessage("✅ Machines Transfer Initiated successfully!");
//       setSelectedMachines([]);
//       setFromFactory(null);
//       setToFactory(null);
//       setRemarks("");
//       // setFactoryMachines([]);

//       // 🔹 Trigger machine refresh
//       setRefreshMachines((prev) => !prev);
//       setTimeout(() => setMessage(""), 2000);
//     } catch (err) {
//       console.error("❌ Transfer error:", err);
//       setMessage(`❌ Error: ${err.message}`);
//     }
//   };

//   return (
//     <>
//       <Navbar />
//       <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
//         <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xl border border-gray-200">
//           <h2 className="text-2xl font-bold mb-6 text-center">
//             Machine Transfer Initiation
//           </h2>

//           <Message text={message} />

//           <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
//             {/* From Factory */}
//             <div>
//               <label className="block text-gray-600 font-medium mb-1">
//                 From Factory :
//               </label>
//               <Select
//                 options={
//                   user.role === "superadmin"
//                     ? factories.map((f) => ({
//                         value: f._id,
//                         label: f.factoryName,
//                       }))
//                     : [
//                         {
//                           value: userFactory,
//                           label:
//                             factories.find((f) => f._id === userFactory)
//                               ?.factoryName || "My Factory",
//                         },
//                       ]
//                 }
//                 value={
//                   user.role === "superadmin"
//                     ? fromFactory
//                     : {
//                         value: userFactory,
//                         label:
//                           factories.find((f) => f._id === userFactory)
//                             ?.factoryName || "My Factory",
//                       }
//                 }
//                 onChange={setFromFactory}
//                 isDisabled={user.role !== "superadmin"}
//                 styles={customStyles}
//               />
//             </div>

//             {/* Machines */}
//             <div>
//               <label className="block text-gray-600 font-medium mb-1">
//                 Select Machines :
//               </label>
//               <Select
//                 options={factoryMachines.map((m) => ({
//                   value: m._id,
//                   label:
//                     m.machineCode === "No machines available"
//                       ? "No machines available"
//                       : `${m.machineCode} (${m.machineCategory})`,
//                 }))}
//                 value={selectedMachines}
//                 onChange={setSelectedMachines}
//                 isMulti
//                 isClearable
//                 styles={customStyles}
//                 isDisabled={!factoryMachines.length}
//               />
//             </div>

//             {/* Remarks */}
//             <div>
//               <label className="block text-gray-600 font-medium mb-1">
//                 Remarks (optional) :
//               </label>
//               <input
//                 type="text"
//                 className="w-full border border-gray-300 rounded-md p-2"
//                 value={remarks}
//                 onChange={(e) => setRemarks(e.target.value)}
//                 placeholder="Add any remarks for this transfer"
//               />
//             </div>

//             {/* To Factory */}
//             <div>
//               <label className="block text-gray-600 font-medium mb-1">
//                 Transfer To :
//               </label>
//               <Select
//                 options={factories
//                   .filter(
//                     (f) =>
//                       f._id !==
//                       (user.role === "superadmin"
//                         ? fromFactory?.value
//                         : userFactory),
//                   )
//                   .map((f) => ({
//                     value: f._id,
//                     label: `${f.factoryName} (${f.factoryLocation})`,
//                   }))}
//                 value={toFactory}
//                 onChange={setToFactory}
//                 isClearable
//                 isDisabled={!(user.role === "superadmin" ? fromFactory : true)}
//                 styles={customStyles}
//               />
//             </div>

//             {/* Submit */}
//             <div className="flex justify-end">
//               <button
//                 type="submit"
//                 className="bg-indigo-600 text-white py-2 px-6 rounded-md shadow hover:bg-indigo-700 transition"
//               >
//                 Transfer Initiation
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </>
//   );
// }

// export default TransferMachine;

import { useState, useEffect, useContext, useRef } from "react";
import Navbar from "./Navbar";
import Select from "react-select";
import { QrReader } from "react-qr-reader";
import { AuthContext } from "../context/AuthContext";

/* ================== styles ================== */
const customStyles = {
  control: (provided) => ({
    ...provided,
    borderRadius: "0.5rem",
    minHeight: "42px",
    boxShadow: "none",
  }),
};

/* ================== Message ================== */
function Message({ text }) {
  if (!text) return null;
  const ok = text.startsWith("✅");
  return (
    <div
      className={`mb-4 p-3 rounded text-sm ${
        ok
          ? "bg-green-50 border border-green-300 text-green-700"
          : "bg-red-50 border border-red-300 text-red-700"
      }`}
    >
      {text}
    </div>
  );
}

export default function TransferMachine() {
  const { user } = useContext(AuthContext);
  const userFactory = user?.factoryId;

  const [factories, setFactories] = useState([]);
  const [fromFactory, setFromFactory] = useState(null);
  const [toFactory, setToFactory] = useState(null);

  const [factoryMachines, setFactoryMachines] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);

  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState("");

  const [showScanner, setShowScanner] = useState(false);
  const scannedRef = useRef(false);
  const [cameraId, setCameraId] = useState(null);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      if (videoDevices.length) setCameraId(videoDevices[0].deviceId);
    });
  }, []);
  /* ============ Fetch factories ============ */
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/factories`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      setFactories(data.factories || data || []);
    };
    load();
  }, []);

  /* ============ Fetch machines ============ */
  useEffect(() => {
    const factoryId =
      user.role === "superadmin" ? fromFactory?.value : userFactory;
    if (!factoryId) return;

    const load = async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/factories/${factoryId}/machines`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      setFactoryMachines(
        (data.machines || []).filter((m) => m.status === "In-House"),
      );
    };
    load();
  }, [fromFactory, userFactory, user.role]);

  /* ============ QR RESULT HANDLER ============ */
  // const handleQrResult = (result, error) => {
  //   if (!!result && !scannedRef.current) {
  //     scannedRef.current = true;
  //     try {
  //       const qr = JSON.parse(result.text);

  //       // Auto From Factory
  //       setFromFactory({
  //         value: qr.factoryId,
  //         label:
  //           factories.find((f) => f._id === qr.factoryId)?.factoryName ||
  //           "Factory",
  //       });

  //       // Auto Machine
  //       setSelectedMachines([
  //         {
  //           value: qr.machineId,
  //           label: `${qr.machineCode} (${qr.machineCategory})`,
  //         },
  //       ]);

  //       setMessage("✅ QR scanned & data auto-filled");
  //       setShowScanner(false);
  //       setTimeout(() => (scannedRef.current = false), 1500);
  //     } catch {
  //       setMessage("❌ Invalid QR format");
  //       scannedRef.current = false;
  //     }
  //   }
  //   if (!!error) console.warn(error);
  // };
  const handleQrResult = (result, error) => {
    try {
      if (error) {
        // ignore decode errors from bad frames
        return;
      }

      if (!result || scannedRef.current) return;
      scannedRef.current = true;

      const qrText = typeof result === "string" ? result : result?.text || "";
      if (!qrText) throw new Error("Empty QR data");

      let qr;
      try {
        qr = JSON.parse(qrText); // JSON QR
      } catch {
        qr = { machineId: qrText, machineCode: qrText }; // fallback for plain QR
      }

      setFromFactory({
        value: qr.factoryId || userFactory,
        label:
          factories.find((f) => f._id === (qr.factoryId || userFactory))
            ?.factoryName || "Factory",
      });

      setSelectedMachines([
        {
          value: qr.machineId || qrText,
          label: qr.machineCode
            ? `${qr.machineCode} (${qr.machineCategory})`
            : qrText,
        },
      ]);

      setMessage("✅ QR scanned & data auto-filled");
      setShowScanner(false);

      setTimeout(() => (scannedRef.current = false), 1500);
    } catch (err) {
      console.warn("QR decode frame error:", err);
      scannedRef.current = false;
    }
  };

  /* ============ Submit ============ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromFactory || !toFactory || !selectedMachines.length) {
      setMessage("❌ Missing required fields");
      return;
    }

    const token = localStorage.getItem("authToken");
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/transfers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fromFactory: fromFactory.value,
        toFactory: toFactory.value,
        machineIds: selectedMachines.map((m) => m.value),
        remarks,
        status: "Transfer In-Progress",
      }),
    });

    if (res.ok) {
      setMessage("✅ Transfer initiated successfully");
      setSelectedMachines([]);
      setFromFactory(null);
      setToFactory(null);
      setRemarks("");
    } else {
      setMessage("❌ Transfer failed");
    }
  };

  /* ================== UI ================== */
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white p-8 rounded shadow w-full max-w-xl">
          <h2 className="text-xl font-bold mb-4 text-center">
            Machine Transfer Initiation
          </h2>

          <Message text={message} />

          {/* QR SCANNER */}
          <button
            type="button"
            className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded"
            onClick={() => setShowScanner((p) => !p)}
          >
            {showScanner ? "Close Scanner" : "Scan QR Code"}
          </button>

          {/* {showScanner && (
            <div className="mb-4 border rounded overflow-hidden">
              <QrReader
                constraints={{ facingMode: "environment" }}
                onResult={handleQrResult}
                style={{ width: "100%" }}
              />
            </div>
          )} */}
          {showScanner && (
            <div className="mb-4 border rounded overflow-hidden">
              <div className="relative w-full h-64 bg-black">
                <QrReader
                  onResult={handleQrResult}
                  constraints={{
                    video: {
                      deviceId: cameraId ? { exact: cameraId } : undefined,
                    },
                  }}
                  videoStyle={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white">
                  Scanning...
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* From */}
            <Select
              placeholder="From Factory"
              value={fromFactory}
              onChange={setFromFactory}
              isDisabled={user.role !== "superadmin"}
              styles={customStyles}
              options={factories.map((f) => ({
                value: f._id,
                label: f.factoryName,
              }))}
            />

            {/* Machines */}
            <Select
              placeholder="Machines"
              isMulti
              value={selectedMachines}
              onChange={setSelectedMachines}
              styles={customStyles}
              options={factoryMachines.map((m) => ({
                value: m._id,
                label: `${m.machineCode} (${m.machineCategory})`,
              }))}
            />

            {/* To */}
            <Select
              placeholder="Transfer To"
              value={toFactory}
              onChange={setToFactory}
              styles={customStyles}
              options={factories
                .filter((f) => f._id !== fromFactory?.value)
                .map((f) => ({
                  value: f._id,
                  label: f.factoryName,
                }))}
            />

            {/* Remarks */}
            <input
              className="w-full border rounded p-2"
              placeholder="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <button className="w-full bg-green-600 text-white py-2 rounded">
              Transfer Initiation
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
