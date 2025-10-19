// import { useState, useEffect, useContext } from "react";
// import Navbar from "./Navbar";
// import { AuthContext } from "../context/AuthContext";

// function PendingTransfers() {
//   const { user } = useContext(AuthContext);
//   const [pendingTransfers, setPendingTransfers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   const API_URL = process.env.REACT_APP_API_URL;

//   // 🔹 Auto-clear messages
//   useEffect(() => {
//     if (!message) return;
//     const timer = setTimeout(() => setMessage(""), 3000);
//     return () => clearTimeout(timer);
//   }, [message]);

//   // 🔹 Fetch pending transfers
//   const fetchPendingTransfers = async () => {
//     if (!user) {
//       setPendingTransfers([]);
//       setLoading(false);
//       return;
//     }
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("authToken");
//       if (!token) throw new Error("Auth token not found");

//       const res = await fetch(`${API_URL}/api/transfers`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       let data;
//       try {
//         data = await res.json();
//       } catch {
//         data = null;
//       }

//       if (!res.ok) {
//         const errorMsg =
//           data?.error || `Server responded with status ${res.status}`;
//         throw new Error(errorMsg);
//       }

//       const filtered = (data?.transfers || []).filter((t) => {
//         if (t.status !== "Transfer In-Progress") return false;

//         // Superadmin sees all transfers
//         if (user.role === "superadmin") return true;

//         // Normal user sees only own factory
//         return t.toFactory?._id?.toString() === user.factoryId?.toString();
//       });

//       setPendingTransfers(filtered);
//     } catch (err) {
//       console.error("❌ Failed to fetch pending transfers:", err);
//       setMessage(`❌ ${err.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPendingTransfers();
//   }, [user]);

//   // 🔹 Handle receive transfer
//   const handleReceive = async (transferId) => {
//     if (!transferId) return setMessage("❌ Invalid transfer ID");

//     try {
//       const token = localStorage.getItem("authToken");
//       const res = await fetch(
//         `${API_URL}/api/transfers/${transferId}/receive`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       let data;
//       try {
//         data = await res.json();
//       } catch {
//         data = null;
//       }

//       if (!res.ok) {
//         const errorMsg =
//           data?.error || `Server responded with status ${res.status}`;
//         throw new Error(errorMsg);
//       }

//       // Remove received transfer from list
//       setPendingTransfers((prev) => prev.filter((t) => t._id !== transferId));
//       setMessage("✅ Transfer received successfully");
//     } catch (err) {
//       console.error("❌ Failed to receive transfer:", err);
//       setMessage(`❌ ${err.message}`);
//     }
//   };

//   return (
//     <>
//       <Navbar />
//       <div className="min-h-screen bg-gray-50 px-6 py-8">
//         <div className="max-w mx-auto bg-white p-6 rounded-lg shadow-md border border-gray-200">
//           <h2 className="text-xl font-semibold mb-6">Pending Transfers</h2>

//           {message && (
//             <div
//               className={`mb-4 p-3 rounded-md text-sm ${
//                 message.startsWith("✅")
//                   ? "bg-green-50 border border-green-300 text-green-700"
//                   : "bg-red-50 border border-red-300 text-red-700"
//               }`}
//             >
//               {message}
//             </div>
//           )}

//           {loading ? (
//             <p>Loading...</p>
//           ) : pendingTransfers.length === 0 ? (
//             <p>No pending transfers for your factory.</p>
//           ) : (
//             <table className="w-full table-auto border-collapse">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th className="border px-4 py-2 text-left">Machine Code</th>
//                   <th className="border px-4 py-2 text-left">
//                     Machine Category
//                   </th>
//                   <th className="border px-4 py-2 text-left">Machine Group</th>
//                   <th className="border px-4 py-2 text-left">From Factory</th>
//                   <th className="border px-4 py-2 text-left">To Factory</th>
//                   <th className="border px-4 py-2 text-left">Transfer Date</th>
//                   <th className="border px-4 py-2 text-left">Status</th>
//                   <th className="border px-4 py-2 text-left">Remarks</th>
//                   <th className="border px-4 py-2 text-left">Transfer-ID</th>
//                   <th className="border px-4 py-2">Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {pendingTransfers.map((t) => (
//                   <tr key={t._id} className="hover:bg-gray-50">
//                     <td className="border px-4 py-2">
//                       {t.machineId?.machineCode || "-"}
//                     </td>
//                     <td className="border px-4 py-2">
//                       {t.machineId?.machineCategory || "-"}
//                     </td>
//                     <td className="border px-4 py-2">
//                       {t.machineId?.machineGroup || "-"}
//                     </td>
//                     <td className="border px-4 py-2">
//                       {t.fromFactory?.factoryName || "-"}
//                     </td>
//                     <td className="border px-4 py-2">
//                       {t.toFactory?.factoryName || "-"}
//                     </td>
//                     <td className="border px-4 py-2">
//                       {t.transferDate
//                         ? new Date(t.transferDate).toLocaleDateString("en-GB", {
//                             day: "2-digit",
//                             month: "short",
//                             year: "numeric",
//                           })
//                         : "-"}
//                     </td>
//                     <td className="border px-4 py-2">{t.status || "-"}</td>
//                     <td className="border px-4 py-2">{t.remarks || "-"}</td>
//                     <td className="border px-4 py-2">{t.transferId || "-"}</td>
//                     <td className="border px-4 py-2 text-center">
//                       <button
//                         onClick={() => handleReceive(t._id)}
//                         className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition"
//                       >
//                         Receive
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// export default PendingTransfers;
import { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import Select from "react-select";
import { AuthContext } from "../context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ITEMS_PER_PAGE = 10;

function PendingTransfers() {
  const { user } = useContext(AuthContext);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [fromFactoryFilter, setFromFactoryFilter] = useState(null);
  const [toFactoryFilter, setToFactoryFilter] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [factories, setFactories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const API_URL = process.env.REACT_APP_API_URL;

  // Auto-clear messages
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // Fetch pending transfers
  const fetchPendingTransfers = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/api/transfers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch transfers");

      // Only in-progress transfers
      let filtered = (data.transfers || []).filter(
        (t) => t.status === "Transfer In-Progress"
      );

      // Role-based filter
      if (user.role !== "superadmin") {
        filtered = filtered.filter(
          (t) => t.toFactory?._id?.toString() === user.factoryId?.toString()
        );
      }

      setPendingTransfers(filtered);

      // Extract unique factories dynamically
      const uniqueFactories = [
        ...new Map(
          filtered
            .flatMap((t) => [t.fromFactory, t.toFactory])
            .filter(Boolean)
            .map((f) => [f._id, f])
        ).values(),
      ];
      setFactories(uniqueFactories);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTransfers();
  }, [user]);

  // Handle receive transfer
  const handleReceive = async (transferId) => {
    if (!transferId) return setMessage("❌ Invalid transfer ID");
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `${API_URL}/api/transfers/${transferId}/receive`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Receive failed");

      setPendingTransfers((prev) => prev.filter((t) => t._id !== transferId));
      setMessage("✅ Transfer received successfully!");
    } catch (err) {
      console.error("❌ Receive error:", err);
      setMessage(`❌ ${err.message}`);
    }
  };

  // Filter transfers
  const filteredTransfers = pendingTransfers.filter((t) => {
    const searchLower = search.toLowerCase();

    const fromFactoryMatch =
      !fromFactoryFilter || t.fromFactory?._id === fromFactoryFilter.value;
    const toFactoryMatch =
      !toFactoryFilter || t.toFactory?._id === toFactoryFilter.value;

    let dateMatch = true;
    if (fromDate || toDate) {
      const transferDate = new Date(t.transferDate);
      if (fromDate) fromDate.setHours(0, 0, 0, 0);
      if (toDate) toDate.setHours(23, 59, 59, 999);
      dateMatch =
        (!fromDate || transferDate >= fromDate) &&
        (!toDate || transferDate <= toDate);
    }

    const searchMatch =
      t.machineId?.machineCode?.toLowerCase().includes(searchLower) ||
      t.transferId?.toLowerCase().includes(searchLower);

    return fromFactoryMatch && toFactoryMatch && dateMatch && searchMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransfers.length / ITEMS_PER_PAGE);
  const currentTransfers = filteredTransfers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 px-6 py-8">
        <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Machine Transfer Receipt
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

          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by Machine or Transfer ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-1/3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <div className="w-full md:w-1/4">
              <Select
                options={factories.map((f) => ({
                  value: f._id,
                  label: f.factoryName,
                }))}
                value={fromFactoryFilter}
                onChange={(val) => {
                  setFromFactoryFilter(val);
                  setCurrentPage(1);
                }}
                isClearable
                placeholder="From Factory"
                styles={{
                  control: (provided) => ({ ...provided, minHeight: "40px" }),
                }}
              />
            </div>

            <div className="w-full md:w-1/4">
              <Select
                options={factories.map((f) => ({
                  value: f._id,
                  label: f.factoryName,
                }))}
                value={toFactoryFilter}
                onChange={(val) => {
                  setToFactoryFilter(val);
                  setCurrentPage(1);
                }}
                isClearable
                placeholder="To Factory"
                styles={{
                  control: (provided) => ({ ...provided, minHeight: "40px" }),
                }}
              />
            </div>

            <div className="flex gap-2 w-full md:w-1/3">
              <DatePicker
                selected={fromDate}
                onChange={(date) => {
                  setFromDate(date);
                  setCurrentPage(1);
                }}
                selectsStart
                startDate={fromDate}
                endDate={toDate}
                placeholderText="From Date"
                className="w-1/2 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <DatePicker
                selected={toDate}
                onChange={(date) => {
                  setToDate(date);
                  setCurrentPage(1);
                }}
                selectsEnd
                startDate={fromDate}
                endDate={toDate}
                minDate={fromDate}
                placeholderText="To Date"
                className="w-1/2 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-center py-6">Loading...</p>
          ) : currentTransfers.length === 0 ? (
            <p className="text-center py-6">No pending transfers found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-sm border">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border px-4 py-2">Machine Code</th>
                    <th className="border px-4 py-2">Category</th>
                    <th className="border px-4 py-2">Group</th>
                    <th className="border px-4 py-2">From Factory</th>
                    <th className="border px-4 py-2">To Factory</th>
                    <th className="border px-4 py-2">Transfer Date</th>
                    <th className="border px-4 py-2">Remarks</th>
                    <th className="border px-4 py-2">Transfer-ID</th>
                    <th className="border px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransfers.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">
                        {t.machineId?.machineCode || "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {t.machineId?.machineCategory || "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {t.machineId?.machineGroup || "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {t.fromFactory?.factoryName || "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {t.toFactory?.factoryName || "-"}
                      </td>
                      <td className="border px-4 py-2">
                        {t.transferDate
                          ? new Date(t.transferDate).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="border px-4 py-2">{t.remarks || "-"}</td>
                      <td className="border px-4 py-2">
                        {t.transferId || "-"}
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <button
                          onClick={() => handleReceive(t._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition"
                        >
                          Receive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-3 py-1 border rounded bg-gray-100">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default PendingTransfers;
