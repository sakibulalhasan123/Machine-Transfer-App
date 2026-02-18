// import { useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// export default function MachinePage() {
//   const { id } = useParams();
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [qrModalOpen, setQrModalOpen] = useState(false);
//   const [qrImage, setQrImage] = useState("");

//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchLiveStatus = async () => {
//       try {
//         setLoading(true);
//         const res = await fetch(
//           `${process.env.REACT_APP_API_URL}/api/machines/${id}/live-status`,
//         );
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const json = await res.json();
//         if (!json.machine) throw new Error("Machine not found");
//         setData(json);
//       } catch (err) {
//         console.error(err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLiveStatus();
//   }, [id]);

//   const handleViewQR = async () => {
//     if (!data?.machine) return;
//     try {
//       const token = localStorage.getItem("authToken");
//       const res = await fetch(
//         `${process.env.REACT_APP_API_URL}/api/machines/${data.machine._id}/qr`,
//         { headers: { Authorization: `Bearer ${token}` } },
//       );
//       if (!res.ok) throw new Error("Failed to fetch QR code");
//       const json = await res.json();
//       setQrImage(json.qrCode);
//       setQrModalOpen(true);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to load QR");
//     }
//   };

//   const handleTransferInitiationMachine = () => {
//     navigate("/machine/transfer");
//   };

//   if (loading) return <p>Loading machine data...</p>;
//   if (error) return <p className="text-red-600">Error: {error}</p>;
//   if (!data?.machine) return <p className="text-gray-600">Machine not found</p>;

//   const { machine, liveStatus, referenceId } = data;

//   return (
//     <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow">
//       <h2 className="text-2xl font-bold mb-2">
//         Machine: {machine.machineCode || "—"}
//       </h2>
//       <p className="mb-2">Factory: {machine.factoryId?.factoryName || "—"}</p>
//       <p className="mb-2">
//         Origin Factory: {machine.originFactory?.factoryName || "—"}
//       </p>
//       <p className="mb-2">Machine Category: {machine.machineCategory || "—"}</p>
//       <p className="mb-2">Machine Group: {machine.machineGroup || "—"}</p>
//       <p className="mb-2">Machine Code: {machine.machineCode || "—"}</p>
//       <p className="mb-2">Machine Number: {machine.machineNumber || "—"}</p>
//       <p className="mb-2">Active: {machine.isActive ? "Yes" : "No"}</p>
//       <p className="mb-4 font-semibold">Status: {liveStatus}</p>

//       {liveStatus === "In-House" && (
//         <div className="flex gap-2 mb-4">
//           <button
//             onClick={handleTransferInitiationMachine}
//             className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
//           >
//             Issue Machine
//           </button>
//           <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
//             Send to Maintenance
//           </button>
//         </div>
//       )}

//       {liveStatus === "Transfer" && <p>Transfer ID: {referenceId}</p>}
//       {liveStatus === "Maintenance" && <p>Maintenance ID: {referenceId}</p>}
//       {liveStatus === "Idle" && <p>Idle ID: {referenceId}</p>}

//       <div className="mt-4">
//         <button
//           onClick={handleViewQR}
//           className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
//         >
//           View QR
//         </button>
//       </div>

//       {/* QR Modal */}
//       {qrModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 w-80 text-center shadow-lg relative">
//             <button
//               onClick={() => setQrModalOpen(false)}
//               className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 font-bold"
//             >
//               ×
//             </button>

//             <h3 className="font-bold text-lg mb-2">{machine.machineCode}</h3>
//             <p className="text-sm text-gray-500 mb-4">
//               {machine.machineCategory} • {machine.machineGroup}
//             </p>
//             {qrImage ? (
//               <img src={qrImage} alt="QR" className="mx-auto w-48 mb-2" />
//             ) : (
//               <p>Loading QR...</p>
//             )}
//             <p className="text-xs text-gray-600">
//               Scan to view machine details
//             </p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MachinePage() {
  const { machineCode } = useParams(); // ✅ use machineCode instead of _id
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrImage, setQrImage] = useState("");

  const navigate = useNavigate();

  // ✅ Fetch machine details using machineCode
  useEffect(() => {
    const fetchLiveStatus = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/machines/code/${machineCode}/live-status`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.machine) throw new Error("Machine not found");
        setData(json);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveStatus();
  }, [machineCode]);

  // ✅ Fetch QR (machineCode only)
  const handleViewQR = async () => {
    if (!data?.machine) return;
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/machines/${data.machine.machineCode}/qr`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Failed to fetch QR code");
      const json = await res.json();
      setQrImage(json.qrCode);
      setQrModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load QR");
    }
  };

  const handleTransferInitiationMachine = () => {
    navigate("/machine/transfer");
  };

  if (loading) return <p>Loading machine data...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!data?.machine) return <p className="text-gray-600">Machine not found</p>;

  const { machine, liveStatuses, referenceIds } = data;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-2">
        Machine: {machine.machineCode || "—"}
      </h2>
      <p className="mb-2">Factory: {machine.factoryId?.factoryName || "—"}</p>
      <p className="mb-2">
        Origin Factory: {machine.originFactory?.factoryName || "—"}
      </p>
      <p className="mb-2">Machine Category: {machine.machineCategory || "—"}</p>
      <p className="mb-2">Machine Group: {machine.machineGroup || "—"}</p>
      <p className="mb-2">Machine Number: {machine.machineNumber || "—"}</p>
      <p className="mb-2">Active: {machine.isActive ? "Yes" : "No"}</p>
      <p className="mb-4 font-semibold">Status: {liveStatuses}</p>

      {liveStatuses.includes("In-House") && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleTransferInitiationMachine}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Transfer Machine
          </button>
          <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
            Send to Maintenance
          </button>
        </div>
      )}

      {liveStatuses.map((status, index) => {
        // In-House হলে row skip
        if (status === "In-House") return null;

        return (
          <p
            key={index}
            className={`mb-1 ${
              status.includes("Transfer")
                ? "text-blue-600"
                : status.includes("Maintenance")
                  ? "text-yellow-600"
                  : status.includes("Idle")
                    ? "text-gray-600"
                    : ""
            }`}
          >
            {status} ID: {referenceIds[index]?.id || "N/A"}
          </p>
        );
      })}

      <div className="mt-4">
        <button
          onClick={handleViewQR}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          View QR
        </button>
      </div>

      {/* QR Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 text-center shadow-lg relative">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 font-bold"
            >
              ×
            </button>

            <h3 className="font-bold text-lg mb-2">{machine.machineCode}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {machine.machineCategory} • {machine.machineGroup}
            </p>
            {qrImage ? (
              <img src={qrImage} alt="QR" className="mx-auto w-48 mb-2" />
            ) : (
              <p>Loading QR...</p>
            )}
            <p className="text-xs text-gray-600">
              Scan to view machine details
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
