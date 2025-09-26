// import { useState, useEffect } from "react";
// import Navbar from "./Navbar";

// const API_URL = process.env.REACT_APP_API_URL;

// function MaintenanceList() {
//   const [maintenances, setMaintenances] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [factories, setFactories] = useState([]);
//   const [filters, setFilters] = useState({ factoryId: "", status: "" });

//   const token = localStorage.getItem("authToken");

//   // 🔹 Load Factories
//   // useEffect(() => {
//   //   const fetchFactories = async () => {
//   //     try {
//   //       const res = await fetch(`${API_URL}/api/factories`);
//   //       const data = await res.json();
//   //       if (res.ok) setFactories(Array.isArray(data) ? data : []);
//   //     } catch (err) {
//   //       console.error("❌ Error loading factories:", err);
//   //       setMessage("❌ Failed to load factories");
//   //       setTimeout(() => setMessage(""), 2000);
//   //     }
//   //   };
//   //   fetchFactories();
//   // }, []);
//   useEffect(() => {
//     const fetchFactories = async () => {
//       const token = localStorage.getItem("authToken");
//       if (!token) {
//         console.error("No auth token found");
//         setMessage("❌ User not authenticated.");
//         setTimeout(() => setMessage(""), 2000);
//         return;
//       }

//       try {
//         setLoading(true);

//         const res = await fetch(`${API_URL}/api/factories`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         if (!res.ok) throw new Error("Failed to load factories");

//         const data = await res.json();
//         setFactories(Array.isArray(data) ? data : data.factories || []);
//       } catch (err) {
//         console.error("❌ Error loading factories:", err);
//         setMessage("❌ Failed to load factories");
//         setFactories([]);
//       } finally {
//         setLoading(false);
//         // Clear message after 2s
//         setTimeout(() => setMessage(""), 2000);
//       }
//     };

//     fetchFactories();
//   }, []);

//   // 🔹 Load Maintenances
//   const fetchMaintenances = async () => {
//     try {
//       setLoading(true);
//       let query = [];
//       if (filters.factoryId) query.push(`factoryId=${filters.factoryId}`);
//       if (filters.status) query.push(`status=${filters.status}`);
//       const queryString = query.length ? `?${query.join("&")}` : "";

//       const res = await fetch(`${API_URL}/api/maintenances${queryString}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();
//       if (!res.ok)
//         throw new Error(data.error || "Failed to fetch maintenances");
//       setMaintenances(data.maintenances || []);
//     } catch (err) {
//       console.error("❌ Error loading maintenances:", err);
//       setMessage("❌ Failed to load maintenances");
//       setTimeout(() => setMessage(""), 2000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchMaintenances();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [filters]);

//   // 🔹 Update Status
//   const handleStatusUpdate = async (maintenanceId, currentStatus) => {
//     if (currentStatus === "Completed") return;

//     try {
//       setLoading(true);
//       const res = await fetch(
//         `${API_URL}/api/maintenances/${maintenanceId}/status`,
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             newStatus: "Completed",
//             userId: localStorage.getItem("userId"),
//           }),
//         }
//       );

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to update status");

//       setMaintenances((prev) =>
//         prev.map((m) =>
//           m._id === maintenanceId ? { ...m, status: "Completed" } : m
//         )
//       );
//       setMessage("✅ Status updated to Completed");
//       setTimeout(() => setMessage(""), 2000);
//     } catch (err) {
//       console.error("❌ Error updating status:", err);
//       setMessage(`❌ ${err.message}`);
//       setTimeout(() => setMessage(""), 2000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <Navbar />
//       <div className="min-h-screen bg-gray-50 p-6">
//         <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
//           <h2 className="text-xl font-semibold mb-4">Maintenance Records</h2>

//           {/* 🔹 Filters */}
//           <div className="flex flex-wrap gap-4 mb-6">
//             <select
//               className="border p-2 rounded-md"
//               value={filters.factoryId}
//               onChange={(e) =>
//                 setFilters((prev) => ({ ...prev, factoryId: e.target.value }))
//               }
//             >
//               <option value="">All Factories</option>
//               {factories.map((f) => (
//                 <option key={f._id} value={f._id}>
//                   {f.factoryName}
//                 </option>
//               ))}
//             </select>

//             <select
//               className="border p-2 rounded-md"
//               value={filters.status}
//               onChange={(e) =>
//                 setFilters((prev) => ({ ...prev, status: e.target.value }))
//               }
//             >
//               <option value="">All Status</option>
//               <option value="In-Progress">In-Progress</option>
//               <option value="Completed">Completed</option>
//             </select>

//             <button
//               className="px-4 py-2 bg-gray-200 rounded-md"
//               onClick={() => setFilters({ factoryId: "", status: "" })}
//             >
//               Reset
//             </button>
//           </div>

//           {/* 🔹 Messages */}
//           {message && (
//             <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
//               {message}
//             </div>
//           )}

//           {/* 🔹 Table */}
//           {loading ? (
//             <div className="text-center text-gray-600">Loading...</div>
//           ) : maintenances.length === 0 ? (
//             <div className="text-center text-gray-600">
//               No maintenance records found.
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse border border-gray-200 text-sm">
//                 <thead>
//                   <tr className="bg-gray-100 text-left">
//                     <th className="border p-2">#</th>
//                     <th className="border p-2">Maintenance ID</th>
//                     <th className="border p-2">Factory</th>
//                     <th className="border p-2">Machine</th>
//                     <th className="border p-2">Type</th>
//                     <th className="border p-2">Description</th>
//                     <th className="border p-2">Spare Parts</th>
//                     <th className="border p-2">Status</th>
//                     <th className="border p-2">Created By</th>
//                     <th className="border p-2">Date</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {maintenances.map((m, idx) => (
//                     <tr key={m._id} className="hover:bg-gray-50">
//                       <td className="border p-2">{idx + 1}</td>
//                       <td className="border p-2 font-medium">
//                         {m.maintenanceId}
//                       </td>
//                       <td className="border p-2">
//                         {m.factoryId?.factoryName} <br />
//                         <span className="text-xs text-gray-500">
//                           {m.factoryId?.factoryLocation}
//                         </span>
//                       </td>
//                       <td className="border p-2">
//                         {m.machineId?.machineCode} <br />
//                         <span className="text-xs text-gray-500">
//                           {m.machineId?.machineCategory}
//                         </span>
//                       </td>
//                       <td className="border p-2">{m.maintenanceType}</td>
//                       <td className="border p-2">{m.description}</td>
//                       <td className="border p-2">
//                         {m.spareParts?.length > 0
//                           ? m.spareParts.join(", ")
//                           : "-"}
//                       </td>
//                       <td className="border p-2 font-medium">
//                         {m.status === "Completed" ? (
//                           <span className="text-green-600">{m.status}</span>
//                         ) : (
//                           <button
//                             className="text-yellow-600 underline"
//                             onClick={() => handleStatusUpdate(m._id, m.status)}
//                             disabled={loading}
//                           >
//                             {m.status}
//                           </button>
//                         )}
//                       </td>
//                       <td className="border p-2">
//                         {m.createdBy?.name} <br />
//                         <span className="text-xs text-gray-500">
//                           {m.createdBy?.email}
//                         </span>
//                       </td>
//                       <td className="border p-2">
//                         {new Date(m.createdAt).toLocaleDateString()}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// export default MaintenanceList;

import { useState, useEffect } from "react";
import Navbar from "./Navbar";

const API_URL = process.env.REACT_APP_API_URL;

function MaintenanceList() {
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [factories, setFactories] = useState([]);
  const [filters, setFilters] = useState({ factoryId: "", status: "" });

  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole"); // "superadmin" or normal
  const userFactoryId = localStorage.getItem("userFactoryId"); // Normal user factory

  // 🔹 Load factories
  useEffect(() => {
    const fetchFactories = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/factories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load factories");

        let data = await res.json();
        let allFactories = Array.isArray(data) ? data : data.factories || [];

        // Normal user only sees own factory
        if (role !== "superadmin") {
          allFactories = allFactories.filter((f) => f._id === userFactoryId);
          setFilters((prev) => ({ ...prev, factoryId: userFactoryId }));
        }

        setFactories(allFactories);
      } catch (err) {
        console.error("❌ Error loading factories:", err);
        setMessage("❌ Failed to load factories");
        setFactories([]);
      } finally {
        setLoading(false);
        setTimeout(() => setMessage(""), 2000);
      }
    };

    fetchFactories();
  }, [token, role, userFactoryId]);

  // 🔹 Load maintenances
  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      let query = [];
      if (filters.factoryId) query.push(`factoryId=${filters.factoryId}`);
      if (filters.status) query.push(`status=${filters.status}`);
      const queryString = query.length ? `?${query.join("&")}` : "";

      const res = await fetch(`${API_URL}/api/maintenances${queryString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to fetch maintenances");
      setMaintenances(data.maintenances || []);
    } catch (err) {
      console.error("❌ Error loading maintenances:", err);
      setMessage("❌ Failed to load maintenances");
      setTimeout(() => setMessage(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // 🔹 Update Status
  const handleStatusUpdate = async (maintenanceId, currentStatus) => {
    if (currentStatus === "Completed") return;

    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/api/maintenances/${maintenanceId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            newStatus: "Completed",
            userId: localStorage.getItem("userId"),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setMaintenances((prev) =>
        prev.map((m) =>
          m._id === maintenanceId ? { ...m, status: "Completed" } : m
        )
      );
      setMessage("✅ Status updated to Completed");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("❌ Error updating status:", err);
      setMessage(`❌ ${err.message}`);
      setTimeout(() => setMessage(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Maintenance Records</h2>

          {/* 🔹 Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            {role === "superadmin" && (
              <select
                className="border p-2 rounded-md"
                value={filters.factoryId}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, factoryId: e.target.value }))
                }
              >
                <option value="">All Factories</option>
                {factories.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.factoryName}
                  </option>
                ))}
              </select>
            )}

            <select
              className="border p-2 rounded-md"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="">All Status</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <button
              className="px-4 py-2 bg-gray-200 rounded-md"
              onClick={() =>
                setFilters({
                  factoryId: role === "superadmin" ? "" : userFactoryId,
                  status: "",
                })
              }
            >
              Reset
            </button>
          </div>

          {/* 🔹 Messages */}
          {message && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {message}
            </div>
          )}

          {/* 🔹 Table */}
          {loading ? (
            <div className="text-center text-gray-600">Loading...</div>
          ) : maintenances.length === 0 ? (
            <div className="text-center text-gray-600">
              No maintenance records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border p-2">#</th>
                    <th className="border p-2">Maintenance ID</th>
                    <th className="border p-2">Factory</th>
                    <th className="border p-2">Machine</th>
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Description</th>
                    <th className="border p-2">Spare Parts</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Created By</th>
                    <th className="border p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenances.map((m, idx) => (
                    <tr key={m._id} className="hover:bg-gray-50">
                      <td className="border p-2">{idx + 1}</td>
                      <td className="border p-2 font-medium">
                        {m.maintenanceId}
                      </td>
                      <td className="border p-2">
                        {m.factoryId?.factoryName} <br />
                        <span className="text-xs text-gray-500">
                          {m.factoryId?.factoryLocation}
                        </span>
                      </td>
                      <td className="border p-2">
                        {m.machineId?.machineCode} <br />
                        <span className="text-xs text-gray-500">
                          {m.machineId?.machineCategory}
                        </span>
                      </td>
                      <td className="border p-2">{m.maintenanceType}</td>
                      <td className="border p-2">{m.description}</td>
                      <td className="border p-2">
                        {m.spareParts?.length > 0
                          ? m.spareParts.join(", ")
                          : "-"}
                      </td>
                      <td className="border p-2 font-medium">
                        {m.status === "Completed" ? (
                          <span className="text-green-600">{m.status}</span>
                        ) : (
                          <button
                            className="text-yellow-600 underline"
                            onClick={() => handleStatusUpdate(m._id, m.status)}
                            disabled={loading}
                          >
                            {m.status}
                          </button>
                        )}
                      </td>
                      <td className="border p-2">
                        {m.createdBy?.name} <br />
                        <span className="text-xs text-gray-500">
                          {m.createdBy?.email}
                        </span>
                      </td>
                      <td className="border p-2">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default MaintenanceList;
