import { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import "../../src/App.css";
import { AuthContext } from "../context/AuthContext";
import "react-datepicker/dist/react-datepicker.css";

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
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

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

      let filtered = (data.transfers || []).filter(
        (t) => t.status === "Transfer In-Progress"
      );

      if (user.role !== "superadmin") {
        filtered = filtered.filter(
          (t) => t.toFactory?._id?.toString() === user.factoryId?.toString()
        );
      }

      setPendingTransfers(filtered);

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

  const filteredTransfers = pendingTransfers.filter((t) => {
    const searchLower = search.toLowerCase();

    const fromFactoryMatch =
      !fromFactoryFilter || t.fromFactory?._id === fromFactoryFilter.value;
    const toFactoryMatch =
      !toFactoryFilter || t.toFactory?._id === toFactoryFilter.value;

    let dateMatch = true;

    if (fromDate || toDate) {
      // Transfer date কে local timezone অনুযায়ী Date বানাও
      const transferDate = new Date(t.transferDate);

      // fromDate / toDate এরও local দিন বানাও (সময় বাদ দিয়ে)
      const localTransferDate = new Date(
        transferDate.getFullYear(),
        transferDate.getMonth(),
        transferDate.getDate()
      );

      const localFromDate = fromDate
        ? new Date(
            fromDate.getFullYear(),
            fromDate.getMonth(),
            fromDate.getDate()
          )
        : null;

      const localToDate = toDate
        ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
        : null;

      // এখন local timezone অনুযায়ী তুলনা
      dateMatch =
        (!localFromDate || localTransferDate >= localFromDate) &&
        (!localToDate || localTransferDate <= localToDate);
    }

    const searchMatch =
      t.machineId?.machineCode?.toLowerCase().includes(searchLower) ||
      t.machineId?.machineCategory?.toLowerCase().includes(searchLower) ||
      t.machineId?.machineGroup?.toLowerCase().includes(searchLower) ||
      t.transferId?.toLowerCase().includes(searchLower);

    return fromFactoryMatch && toFactoryMatch && dateMatch && searchMatch;
  });

  const totalPages =
    rowsPerPage === "All"
      ? 1
      : Math.ceil(filteredTransfers.length / rowsPerPage);

  const paginatedTransfers =
    rowsPerPage === "All"
      ? filteredTransfers
      : filteredTransfers.slice(
          (currentPage - 1) * rowsPerPage,
          currentPage * rowsPerPage
        );
  const totalPendingTransfers = filteredTransfers.length;

  const StatCard = ({ title, value, color }) => (
    <div className="flex flex-col px-2 py-2 rounded-xl shadow-md border bg-white w-full">
      <p className="text-sm font-medium text-gray-500 px-2">{title}</p>
      <h2 className={`text-2xl px-2 font-bold mt-1 ${color}`}>{value}</h2>
    </div>
  );
  const calculatePendingDays = (transferDate) => {
    if (!transferDate) return "-";
    const tDate = new Date(transferDate);
    const today = new Date();

    // সময় বাদ দিয়ে শুধুমাত্র date হিসাব
    const localTDate = new Date(
      tDate.getFullYear(),
      tDate.getMonth(),
      tDate.getDate()
    );
    const localToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const diffTime = localToday - localTDate; // milliseconds
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  return (
    <>
      <Navbar />
      <div className="mt-10 w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">
            🏭 Machine Transfer Receipt
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6 mb-6">
            <StatCard
              title="🔵 Total Pending Transfers"
              value={totalPendingTransfers}
              color="text-blue-600"
            />
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-md text-sm font-medium transition-all duration-300 ${
                message.startsWith("✅")
                  ? "bg-green-100 border border-green-400 text-green-800"
                  : "bg-red-100 border border-red-400 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-6 mb-8 items-end">
            {/* ✅ From Factory Filter */}
            <select
              value={fromFactoryFilter?.value || ""}
              onChange={(e) => {
                const selected = factories.find(
                  (f) => f._id === e.target.value
                );
                setFromFactoryFilter(
                  selected
                    ? { value: selected._id, label: selected.factoryName }
                    : null
                );
                setCurrentPage(1);
              }}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-48 md:w-56"
            >
              <option value="">🏭 From Factory</option>
              {factories.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.factoryName}
                </option>
              ))}
            </select>

            {/* ✅ To Factory Filter */}
            <select
              value={toFactoryFilter?.value || ""}
              onChange={(e) => {
                const selected = factories.find(
                  (f) => f._id === e.target.value
                );
                setToFactoryFilter(
                  selected
                    ? { value: selected._id, label: selected.factoryName }
                    : null
                );
                setCurrentPage(1);
              }}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-48 md:w-56"
            >
              <option value="">🏗️ To Factory</option>
              {factories.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.factoryName}
                </option>
              ))}
            </select>

            {/* ✅ Search by Machine / Transfer */}
            <input
              type="text"
              placeholder="🔍 Search by Machine or Transfer ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />

            {/* ✅ From & To Date */}
            <input
              type="date"
              value={fromDate ? fromDate.toISOString().split("T")[0] : ""}
              onChange={(e) => {
                setFromDate(e.target.value ? new Date(e.target.value) : null);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="date"
              value={toDate ? toDate.toISOString().split("T")[0] : ""}
              onChange={(e) => {
                setToDate(e.target.value ? new Date(e.target.value) : null);
                setCurrentPage(1);
              }}
              min={fromDate ? fromDate.toISOString().split("T")[0] : ""}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />

            {/* 🔁 Reset Filters */}
            <button
              onClick={() => {
                setSearch("");
                setFromFactoryFilter(null);
                setToFactoryFilter(null);
                setFromDate(null);
                setToDate(null);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition"
            >
              🔄 Reset
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-center py-6 text-gray-500 animate-pulse">
              Loading pending transfers...
            </p>
          ) : paginatedTransfers.length === 0 ? (
            <p className="text-center py-6 text-gray-600 italic">
              No pending transfers found.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl  border border-gray-200 shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold tracking-wide">
                  <tr>
                    {[
                      "SL",
                      "Machine Code",
                      "Machine Category",
                      "Machine Group",
                      "From Factory",
                      "To Factory",
                      "Status",
                      "Transfer Initiation Date",
                      "Transfer Initiated By",
                      "Remarks",
                      "Transfer ID",
                      "Pending Days",
                      "Action",
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-3 py-3 border border-indigo-200 text-center font-bold"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTransfers.map((t, idx) => (
                    <tr
                      key={t._id}
                      className="hover:bg-blue-50 even:bg-gray-50 transition"
                    >
                      <td className="border px-2 py-2 text-center">
                        {(currentPage - 1) *
                          (rowsPerPage === "All"
                            ? paginatedTransfers.length
                            : rowsPerPage) +
                          (idx + 1)}
                      </td>

                      <td className=" px-2 py-2 font-medium text-indigo-600">
                        {t.machineId?.machineCode || "-"}
                      </td>
                      <td className=" px-2 py-2">
                        {t.machineId?.machineCategory || "-"}
                      </td>
                      <td className=" px-2 py-2">
                        {t.machineId?.machineGroup || "-"}
                      </td>
                      <td className=" px-2 py-2">
                        {t.fromFactory?.factoryName || "-"}
                      </td>
                      <td className=" px-2 py-2">
                        {t.toFactory?.factoryName || "-"}
                      </td>
                      <td className=" px-2 py-2">{t.status || "-"}</td>
                      <td className="px-2 py-2">
                        {t.transferDate
                          ? new Date(t.transferDate).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className=" px-2 py-2">
                        {t.transferedBy?.name || "-"}
                      </td>
                      <td className=" px-2 py-2">{t.remarks || "-"}</td>
                      <td className="px-2 py-2 font-medium text-indigo-600">
                        {t.transferId || "-"}
                      </td>
                      <td
                        className={`px-2 py-2 text-center ${
                          calculatePendingDays(t.transferDate) > 7
                            ? "text-red-600 font-bold"
                            : ""
                        }`}
                      >
                        {calculatePendingDays(t.transferDate)}
                      </td>

                      <td className=" px-2 py-2 text-center">
                        <button
                          onClick={() => handleReceive(t._id)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-md transition-all shadow-sm hover:shadow-md"
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

          {/* Pagination Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-5 gap-4">
            {/* Rows Per Page */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(
                    e.target.value === "All" ? "All" : parseInt(e.target.value)
                  );
                  setCurrentPage(1);
                }}
                className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value="All">All</option>
              </select>
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 border rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
              >
                ◀ Prev
              </button>

              <span className="text-sm text-gray-700">
                Page <span className="font-semibold">{currentPage}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 border rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
              >
                Next ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PendingTransfers;
