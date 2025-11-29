import { useState, useEffect, useMemo } from "react";
import Navbar from "./Navbar";
import Select from "react-select";
import * as XLSX from "xlsx-js-style"; // ✅ add at top if missing

function AllIdles() {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [idles, setIdles] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
      console.log(data.idles);
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

  const formatDuration = (minutes, status) => {
    // If not resolved yet → show "—"
    if (status !== "Resolved") return "—";

    if (!minutes || minutes <= 0) return "0d 0h 0m";

    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;

    return `${days}d ${hours}h ${mins}m`;
  };
  const formatDurationForExcel = (minutes, status) => {
    if (status !== "Resolved") return "—"; // unresolved হলে dash

    if (!minutes || minutes <= 0) return "0d 0h 0m";

    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;

    return `${days}d ${hours}h ${mins}m`;
  };

  // ✅ Filtered rows based on search + filters
  const filteredRows = useMemo(() => {
    return idles.filter((i) => {
      const searchText = search.toLowerCase();
      return (
        i.idleId?.toLowerCase().includes(searchText) ||
        i.factoryName?.toLowerCase().includes(searchText) ||
        i.machineCode?.toLowerCase().includes(searchText) ||
        i.reason?.toLowerCase().includes(searchText) ||
        i.description?.toLowerCase().includes(searchText) ||
        i.status?.toLowerCase().includes(searchText) ||
        i.createdBy?.toLowerCase().includes(searchText) ||
        i.history?.[0]?.changedBy?.name?.toLowerCase().includes(searchText)
      );
    });
  }, [idles, search]);

  // ✅ Pagination logic
  const totalPages =
    rowsPerPage === "All"
      ? 1
      : Math.ceil(filteredRows.length / Number(rowsPerPage));

  const paginatedRows =
    rowsPerPage === "All"
      ? filteredRows
      : filteredRows.slice(
          (currentPage - 1) * Number(rowsPerPage),
          currentPage * Number(rowsPerPage)
        );
  // ✅ Summary cards calculation
  const totalIdle = idles.length;
  const resolvedIdle = idles.filter((i) => i.status === "Resolved").length;
  const inProgressIdle = idles.filter(
    (i) => i.status === "Machine Idle In-Progress"
  ).length;

  const handleExportExcel = () => {
    if (idles.length === 0) {
      setMessage({ type: "error", text: "❌ No data available to export" });
      return;
    }

    const rows = idles.map((i) => ({
      IdleID: i.idleId,
      FactoryName: i.factoryName,
      MachineCode: i.machineCode,
      Reason: i.reason,
      Description: i.description,
      Status: i.status,
      IdleStartTime: i.startTime
        ? { t: "d", v: new Date(i.startTime), z: "dd-mmm-yyyy hh:mm AM/PM" }
        : null,
      IdleResolvedTime: i.endTime
        ? { t: "d", v: new Date(i.endTime), z: "dd-mmm-yyyy hh:mm AM/PM" }
        : null,
      CreatedBy: i.createdBy || "—",
      ResolvedBy: i.history?.[0]?.changedBy?.name || "—",
      MachineIdleTime: formatDurationForExcel(i.durationMinutes, i.status),
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // Sheet title & export date
    XLSX.utils.sheet_add_aoa(worksheet, [["⚙️ Machine Idle Report"]], {
      origin: "A1",
    });

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          `Exported on: ${new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`,
        ],
      ],
      { origin: "A2" }
    );

    XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: "A3" }); // blank row
    XLSX.utils.sheet_add_json(worksheet, rows, {
      origin: "A4",
      skipHeader: false,
    });

    // Auto column width
    const keys = Object.keys(rows[0]);
    worksheet["!cols"] = keys.map((key) => {
      const length = Math.max(
        key.length,
        ...rows.map((row) => {
          const v = row[key];
          if (!v) return 1;
          if (typeof v === "object" && v.v instanceof Date) {
            return v.v.toLocaleDateString("en-GB").length + 8;
          }
          return v.toString().length;
        })
      );
      return { wch: length + 2 };
    });

    // Merge title rows
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: keys.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: keys.length - 1 } },
    ];

    // Style title
    worksheet["A1"].s = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "4472C4" } },
    };

    worksheet["A2"].s = {
      font: { italic: true, color: { rgb: "555555" } },
      alignment: { horizontal: "center" },
    };

    // Style header row
    const headerRow = 3; // zero-indexed row 4
    for (let c = 0; c < keys.length; c++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: headerRow, c })];
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "4F81BD" } },
        border: {
          top: { style: "thin", color: { rgb: "AAAAAA" } },
          bottom: { style: "thin", color: { rgb: "AAAAAA" } },
          left: { style: "thin", color: { rgb: "AAAAAA" } },
          right: { style: "thin", color: { rgb: "AAAAAA" } },
        },
      };
    }

    // Freeze header row
    worksheet["!freeze"] = { xSplit: 0, ySplit: 4 };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Idle Report");

    XLSX.writeFile(workbook, "AllIdleReport.xlsx", { cellStyles: true });
  };
  // ✅ Summary Card Component
  const StatCard = ({ title, value, color }) => (
    <div className="flex flex-col px-2 py-2 rounded-xl shadow-md border bg-white w-full">
      <p className="text-sm font-medium text-gray-500 px-2">{title}</p>
      <h2 className={`text-2xl px-2 font-bold mt-1 ${color}`}>{value}</h2>
    </div>
  );

  return (
    <>
      <Navbar />

      <div className="mt-10 w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">
            🏭 Machine Idles Records
          </h2>
          {/* ✅ Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <StatCard
              title="🔵 Total Idle Records"
              value={totalIdle}
              color="text-blue-600"
            />

            <StatCard
              title="🟡 Machine Idle In-Progress"
              value={inProgressIdle}
              color="text-yellow-600"
            />

            <StatCard
              title="🟢 Machine Idle Resolved"
              value={resolvedIdle}
              color="text-green-600"
            />
          </div>

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
          <div className="flex flex-wrap gap-3 mt-4  mb-6">
            <input
              type="text"
              placeholder="🔍 Search idle info..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1); // reset to page 1 when searching
              }}
              className="border rounded-lg px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-400 outline-none"
            />

            <div className="w-64 relative z-50">
              {" "}
              {/* Prevents overlap */}
              <Select
                options={factories.map((f) => ({
                  value: f._id,
                  label: f.factoryName,
                }))}
                isClearable
                value={selectedFactory}
                onChange={setSelectedFactory}
                placeholder="Filter by factory..."
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#f2f2f2", // ✅ grey background
                    borderRadius: "8px",
                    padding: "2px",
                    borderColor: "#d1d5db",
                    boxShadow: "none",
                    ":hover": {
                      borderColor: "#a3a3a3",
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999, // ✅ ensures dropdown appears above everything
                  }),
                }}
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
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-all"
            >
              📤 Export Excel
            </button>
            <button
              onClick={() => {
                setSearch("");
                setSelectedFactory(null); // reset dropdown
                setStatusFilter(""); // reset status filter
                setCurrentPage(1);
                setRowsPerPage(10);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-all"
            >
              🔄 Reset
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center text-gray-500 py-6 animate-pulse">
              Loading idle data...
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              No idles records found 🚫
            </div>
          ) : (
            <>
              {/* Table */}

              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold tracking-wide">
                    <tr>
                      <th className="px-2 py-2 border">SL</th>
                      <th className="px-2 py-2 border">Idle ID</th>
                      <th className="px-2 py-2 border">Factory Name</th>
                      <th className="px-2 py-2 border">Machine Code</th>
                      <th className="px-2 py-2 border">Reason</th>
                      <th className="px-2 py-2 border">Description</th>
                      <th className="px-2 py-2 border">Status</th>
                      <th className="px-2 py-2 border">Idle Creation Date</th>
                      <th className="px-2 py-2 border">Created By</th>
                      <th className="px-2 py-2 border">Idle Resolved Date</th>
                      <th className="px-2 py-2 border">Resolved By</th>
                      <th className="px-2 py-2 border">Machine Idle Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedRows.map((i, idx) => (
                      <tr
                        key={i._id}
                        className="hover:bg-blue-50 even:bg-gray-50 transition"
                      >
                        <td className="px-2 py-2">{idx + 1}</td>
                        <td className="px-2 py-2">{i.idleId}</td>

                        <td className="px-2 py-2">{i.factoryName}</td>
                        <td className="px-2 py-2">{i.machineCode}</td>
                        <td className="px-2 py-2">{i.reason}</td>
                        <td className="px-2 py-2">{i.description}</td>
                        <td className="px-2 py-2">
                          <span
                            className={`rounded-full text-xs font-semibold ${
                              i.status === "Resolved"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {i.status}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          {i.startTime
                            ? new Date(i.startTime).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "—"}
                        </td>
                        <td className="px-2 py-2">{i.createdBy}</td>
                        <td className="px-2 py-2">
                          {i.endTime
                            ? new Date(i.endTime).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "—"}
                        </td>
                        <td className="px-2 py-2">
                          {i.history?.[0]?.changedBy?.name || "—"}
                        </td>

                        <td className="px-2 py-2">
                          {formatDuration(i.durationMinutes, i.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(
                        e.target.value === "All"
                          ? "All"
                          : parseInt(e.target.value)
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
                <div className="flex items-center gap-2">
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
export default AllIdles;
