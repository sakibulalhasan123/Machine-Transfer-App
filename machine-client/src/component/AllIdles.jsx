// import { useState, useEffect } from "react";
// import Navbar from "./Navbar";
// import Select from "react-select";

// export default function AllIdles() {
//   const [factories, setFactories] = useState([]);
//   const [selectedFactory, setSelectedFactory] = useState(null);
//   const [statusFilter, setStatusFilter] = useState("");
//   const [idles, setIdles] = useState([]);
//   const [message, setMessage] = useState({ type: "", text: "" });

//   const token = localStorage.getItem("authToken");

//   // Load factories
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

//   // Fetch MachineIdles based on selected filters
//   const fetchIdles = async () => {
//     try {
//       let url = `${process.env.REACT_APP_API_URL}/api/machineIdles?`;
//       if (selectedFactory) url += `factoryId=${selectedFactory.value}&`;
//       if (statusFilter) url += `status=${statusFilter}&`;

//       const res = await fetch(url, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       setIdles(data.idles || []);
//     } catch (err) {
//       console.error(err);
//       setMessage({ type: "error", text: "❌ Error fetching idle records" });
//     }
//   };

//   useEffect(() => {
//     fetchIdles();
//   }, [selectedFactory, statusFilter]);

//   return (
//     <>
//       <Navbar />
//       <div className="p-6">
//         <h2 className="text-xl font-semibold mb-4">All Machine Idles</h2>

//         {message.text && (
//           <div
//             className={`mb-4 p-2 rounded ${
//               message.type === "error"
//                 ? "bg-red-100 text-red-700"
//                 : "bg-green-100 text-green-700"
//             }`}
//           >
//             {message.text}
//           </div>
//         )}

//         <div className="flex gap-4 mb-4">
//           <Select
//             options={factories.map((f) => ({
//               value: f._id,
//               label: f.factoryName,
//             }))}
//             value={selectedFactory}
//             onChange={setSelectedFactory}
//             placeholder="Filter by factory..."
//           />

//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="border rounded p-2"
//           >
//             <option value="">All Status</option>
//             <option value="In-Progress">In-Progress</option>
//             <option value="Resolved">Resolved</option>
//           </select>
//         </div>

//         <table className="w-full border-collapse border">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="border p-2">Idle ID</th>
//               <th className="border p-2">Machine</th>
//               <th className="border p-2">Factory</th>
//               <th className="border p-2">Reason</th>
//               <th className="border p-2">Start Time</th>
//               <th className="border p-2">End Time</th>
//               <th className="border p-2">Duration (min)</th>
//               <th className="border p-2">Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {idles.map((i) => (
//               <tr key={i._id}>
//                 <td className="border p-2">{i.idleId}</td>
//                 <td className="border p-2">{i.machineCode}</td>
//                 <td className="border p-2">{i.factoryName}</td>
//                 <td className="border p-2">{i.reason}</td>
//                 <td className="border p-2">
//                   {new Date(i.startTime).toLocaleString()}
//                 </td>
//                 <td className="border p-2">
//                   {i.endTime ? new Date(i.endTime).toLocaleString() : "-"}
//                 </td>
//                 <td className="border p-2">{i.durationMinutes}</td>
//                 <td className="border p-2">{i.status}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </>
//   );
// }

import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Select from "react-select";

export default function AllIdles() {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [idles, setIdles] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("authToken");

  // Fetch factories
  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/factories`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setFactories(data);
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: "❌ Failed to load factories" });
      }
    };
    fetchFactories();
  }, [token]);

  // Fetch idles with filters
  const fetchIdles = async () => {
    try {
      setLoading(true);
      let url = `${process.env.REACT_APP_API_URL}/api/machineIdles?`;
      if (selectedFactory) url += `factoryId=${selectedFactory.value}&`;
      if (statusFilter) url += `status=${statusFilter}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIdles(data.idles || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "❌ Failed to fetch idle records" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdles();
  }, [selectedFactory, statusFilter]);

  return (
    <>
      <Navbar />
      <div className="p-6 bg-gray-50 min-h-screen">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          🏭 All Machine Idles
        </h2>

        {message.text && (
          <div
            className={`mb-4 p-3 rounded-md font-medium ${
              message.type === "error"
                ? "bg-red-100 text-red-700 border border-red-300"
                : "bg-green-100 text-green-700 border border-green-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <div className="w-64">
            <Select
              options={factories.map((f) => ({
                value: f._id,
                label: f.factoryName,
              }))}
              value={selectedFactory}
              onChange={setSelectedFactory}
              placeholder="Filter by factory..."
              className="text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="Machine Idle In-Progress">In-Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <button
            onClick={fetchIdles}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-all"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-10 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mr-3"></div>
            Loading idle data...
          </div>
        )}

        {/* Table */}
        {!loading && idles.length > 0 ? (
          <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
            <table className="w-full text-sm text-gray-700">
              <thead>
                <tr className="bg-gray-100 text-gray-800 text-left uppercase">
                  <th className="p-3 border-b">Idle ID</th>

                  <th className="p-3 border-b">Factory Name</th>
                  <th className="p-3 border-b">Machine Code</th>
                  <th className="p-3 border-b">Reason</th>
                  <th className="p-3 border-b">Description</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b">Machine Idle Creation Date</th>
                  <th className="p-3 border-b">Created By</th>
                  <th className="p-3 border-b">Machine Idle Resolved Date</th>
                  <th className="p-3 border-b">Resolved By</th>
                  <th className="p-3 border-b">Duration (min)</th>
                </tr>
              </thead>
              <tbody>
                {idles.map((i) => (
                  <tr
                    key={i._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3 border-b font-medium">{i.idleId}</td>

                    <td className="p-3 border-b">{i.factoryName}</td>
                    <td className="p-3 border-b">{i.machineCode}</td>
                    <td className="p-3 border-b">{i.reason}</td>
                    <td className="p-3 border-b">{i.description}</td>
                    <td className="p-3 border-b">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          i.status === "Resolved"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td className="p-3 border-b">
                      {i.startTime
                        ? new Date(i.startTime).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "-"}
                    </td>
                    <td className="p-3 border-b">{i.createdBy}</td>
                    <td className="p-3 border-b">
                      {i.endTime
                        ? new Date(i.endTime).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "-"}
                    </td>
                    <td className="p-3 border-b">
                      {i.history?.[0]?.changedBy?.name || "N/A"}
                    </td>

                    <td className="p-3 border-b text-center">
                      {"min:" + i.durationMinutes ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <div className="text-center text-gray-500 py-10">
              ⚙️ No idle records found for the selected filters.
            </div>
          )
        )}
      </div>
    </>
  );
}
