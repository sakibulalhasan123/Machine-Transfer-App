import { useState, useEffect, useContext } from "react";
import Navbar from "./Navbar";
import "../../src/App.css";
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

    // let dateMatch = true;
    // if (fromDate || toDate) {
    //   const transferDate = new Date(t.transferDate);
    //   if (fromDate) fromDate.setHours(0, 0, 0, 0);
    //   if (toDate) toDate.setHours(23, 59, 59, 999);
    //   dateMatch =
    //     (!fromDate || transferDate >= fromDate) &&
    //     (!toDate || transferDate <= toDate);
    // }
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

  const totalPages = Math.ceil(filteredTransfers.length / ITEMS_PER_PAGE);
  const currentTransfers = filteredTransfers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-10">
        <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200">
          <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8">
            🏭 Machine Transfer Receipt
          </h2>

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
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <input
                type="text"
                placeholder="🔍 Search by Machine or Transfer ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />

              <div className="w-full lg:w-1/4">
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
                  placeholder="🏭 From Factory"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: "40px",
                      fontSize: "0.9rem",
                    }),
                  }}
                />
              </div>

              <div className="w-full lg:w-1/4">
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
                  placeholder="🏗️ To Factory"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: "40px",
                      fontSize: "0.9rem",
                    }),
                  }}
                />
              </div>

              <div className="flex w-full lg:w-1/2 gap-3">
                <DatePicker
                  selected={fromDate}
                  onChange={(date) => {
                    setFromDate(date);
                    setCurrentPage(1);
                  }}
                  selectsStart
                  startDate={fromDate}
                  endDate={toDate}
                  placeholderText="📅 From Date"
                  portalId="root" // popup will render above everything
                  className=" border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                  placeholderText="📅 To Date"
                  portalId="root" // popup will render above everything
                  className=" border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              {/* 🔁 Reset Filters Button */}
              <div className="w-full lg:w-1/5 ">
                <button
                  onClick={() => {
                    setSearch("");
                    setFromFactoryFilter(null);
                    setToFactoryFilter(null);
                    setFromDate(null);
                    setToDate(null);
                    setCurrentPage(1);
                  }}
                  className="text-sm px-4 py-2 bg-red-100 text-red-600 font-medium rounded-md hover:bg-red-200 transition-all"
                >
                  🔁 Reset
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-center py-6 text-gray-500 animate-pulse">
              Loading pending transfers...
            </p>
          ) : currentTransfers.length === 0 ? (
            <p className="text-center py-6 text-gray-600 italic">
              No pending transfers found.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-50 text-indigo-800 uppercase tracking-wide text-xs">
                    {[
                      "Machine Code",
                      "Machine Category",
                      "Machine Group",
                      "From Factory",
                      "To Factory",
                      "Transfer Initiation Date",
                      "Status",
                      "Remarks",
                      "Transfer ID",
                      "Transfer Initiated By",
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
                <tbody>
                  {currentTransfers.map((t) => (
                    <tr
                      key={t._id}
                      className="hover:bg-indigo-50 transition-colors duration-200 text-center"
                    >
                      <td className="border-t px-2 py-2">
                        {t.machineId?.machineCode || "-"}
                      </td>
                      <td className="border-t px-2 py-2">
                        {t.machineId?.machineCategory || "-"}
                      </td>
                      <td className="border-t px-2 py-2">
                        {t.machineId?.machineGroup || "-"}
                      </td>
                      <td className="border-t px-2 py-2">
                        {t.fromFactory?.factoryName || "-"}
                      </td>
                      <td className="border-t px-2 py-2">
                        {t.toFactory?.factoryName || "-"}
                      </td>
                      <td className="border-t px-2 py-2">
                        {t.transferDate
                          ? new Date(t.transferDate).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="border-t px-2 py-2">{t.status || "-"}</td>
                      <td className="border-t px-2 py-2">{t.remarks || "-"}</td>
                      <td className="border-t px-2 py-2 font-medium text-indigo-600">
                        {t.transferId || "-"}
                      </td>
                      <td className="border-t px-2 py-2">
                        {t.transferedBy?.name || "-"}
                      </td>
                      <td className="border-t px-2 py-2 text-center">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md text-sm hover:bg-indigo-50 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md text-sm hover:bg-indigo-50 disabled:opacity-40"
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
