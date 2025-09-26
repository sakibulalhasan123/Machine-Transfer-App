import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import Navbar from "./Navbar";

function FactoryList() {
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch factories
  useEffect(() => {
    const fetchFactories = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/factories`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        setFactories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error fetching factories:", err);
        setFactories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFactories();
  }, []);

  /** 🔹 Apply filters (search + date range) */
  const filteredRows = useMemo(() => {
    const from = fromDate ? new Date(fromDate + "T00:00:00") : null;
    const to = toDate ? new Date(toDate + "T23:59:59") : null;

    return factories.filter((f) => {
      const searchText = search.toLowerCase();
      const matchesSearch =
        f.factoryName?.toLowerCase().includes(searchText) ||
        f.factoryLocation?.toLowerCase().includes(searchText) ||
        f.createdBy?.name?.toLowerCase().includes(searchText) ||
        f.createdBy?.role?.toLowerCase().includes(searchText) ||
        f.factoryNumber?.toLowerCase().includes(searchText); // ✅ এখন কাজ করবে
      let matchesDate = true;
      if (from || to) {
        const createdAt = new Date(f.createdAt);
        matchesDate = (!from || createdAt >= from) && (!to || createdAt <= to);
      }

      return matchesSearch && matchesDate;
    });
  }, [factories, search, fromDate, toDate]);

  /** 🔹 Pagination */
  const totalPages =
    rowsPerPage === "All" ? 1 : Math.ceil(filteredRows.length / rowsPerPage);

  const paginatedRows =
    rowsPerPage === "All"
      ? filteredRows
      : filteredRows.slice(
          (currentPage - 1) * rowsPerPage,
          currentPage * rowsPerPage
        );

  /** 🔹 Reset filters */
  const handleResetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setRowsPerPage(10);
    setCurrentPage(1);
  };

  /** 🔹 Export Excel */
  const handleExportExcel = () => {
    const rows = filteredRows.map((f) => ({
      FactoryName: f.factoryName,
      Location: f.factoryLocation,
      CreatedBy: f.createdBy?.name || "—",
      Role: f.createdBy?.role || "—",
      CreatedDate: f.createdAt
        ? new Date(f.createdAt).toLocaleDateString()
        : "—",
      UpdatedDate: f.updatedAt
        ? new Date(f.updatedAt).toLocaleDateString()
        : "—",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Factories");
    XLSX.writeFile(workbook, "Factories.xlsx");
  };

  return (
    <>
      <Navbar />
      <div className="mt-10 w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          {/* Header + Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🏭 Factory List
            </h3>

            <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="🔍 Search factories..."
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-lg shadow hover:from-blue-700 hover:to-blue-600 transition"
              >
                ⬇ Export Excel
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-400 text-white text-sm font-medium rounded-lg shadow hover:from-gray-600 hover:to-gray-500 transition"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center text-gray-500 py-6 animate-pulse">
              Loading factories...
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              No factories found 🚫
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-indigo-50 text-indigo-800 uppercase text-xs font-semibold tracking-wide">
                    <tr>
                      <th className="px-4 py-3 border">Factory Name</th>
                      <th className="px-4 py-3 border">Factory Location</th>
                      <th className="px-4 py-3 border">Created By (Name)</th>
                      <th className="px-4 py-3 border">Role</th>
                      <th className="px-4 py-3 border">Created Date</th>
                      <th className="px-4 py-3 border">Updated Date</th>
                      <th className="px-4 py-3 border">Factory Number</th>
                      {/* ✅ New column */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedRows.map((factory) => (
                      <tr
                        key={factory._id}
                        className="hover:bg-indigo-50/50 transition"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {factory.factoryName}
                        </td>
                        <td className="px-4 py-3">{factory.factoryLocation}</td>
                        <td className="px-4 py-3">
                          {factory.createdBy?.name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {factory.createdBy?.role || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(factory.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(factory.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {factory.factoryNumber}
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
                    className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
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

export default FactoryList;
