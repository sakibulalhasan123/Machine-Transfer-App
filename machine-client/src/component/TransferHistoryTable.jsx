import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import Navbar from "./Navbar";

function TransferHistoryTable() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch machines + transfer history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/transfer/transfer-history`
        );
        const data = await res.json();
        setMachines(Array.isArray(data) ? data : data.machines || []);
      } catch (err) {
        console.error("❌ Error fetching transfer history:", err);
        setMachines([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  /** 🔹 Flatten machine + transfers into table rows */
  const flattenData = (machineList) => {
    return machineList.flatMap((m) => {
      const transfers = Array.isArray(m.transfers) ? m.transfers : [];

      if (transfers.length === 0) {
        return [
          {
            id: m._id,
            machineCode: m.machineCode,
            category: m.machineCategory,
            group: m.machineGroup,
            fromFactory: null,
            toFactory: m.factoryId,
            transferDate: null,
            transferedBy: null,
          },
        ];
      }

      return transfers.map((t, idx) => ({
        id: `${m._id}-${idx}`,
        machineCode: m.machineCode,
        category: m.machineCategory,
        group: m.machineGroup,
        fromFactory: t.fromFactory,
        toFactory: t.toFactory, // ✅ fixed
        transferDate: t.transferDate,
        transferedBy: t.transferedBy || null, // ✅ user info
      }));
    });
  };

  /** 🔹 Apply search & date filters */
  const filteredRows = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return flattenData(machines).filter((row) => {
      // text search
      const searchText = search.toLowerCase();
      const matchesSearch =
        row.machineCode?.toLowerCase().includes(searchText) ||
        row.category?.toLowerCase().includes(searchText) ||
        row.group?.toLowerCase().includes(searchText) ||
        row.fromFactory?.factoryName?.toLowerCase().includes(searchText) ||
        row.toFactory?.factoryName?.toLowerCase().includes(searchText) ||
        row.fromFactory?.factoryLocation?.toLowerCase().includes(searchText) ||
        row.toFactory?.factoryLocation?.toLowerCase().includes(searchText) ||
        row.transferedBy?.name?.toLowerCase().includes(searchText);

      // date filter
      let matchesDate = true;
      if (from || to) {
        if (!row.transferDate) {
          matchesDate = false;
        } else {
          const date = new Date(row.transferDate.split("T")[0]);
          matchesDate = (!from || date >= from) && (!to || date <= to);
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [machines, search, fromDate, toDate]);

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

  /** 🔹 Export Excel */
  const handleExportExcel = () => {
    const rows = filteredRows.map((r) => ({
      MachineCode: r.machineCode,
      Category: r.category,
      Group: r.group,
      FromFactory: r.fromFactory?.factoryName || "—",
      ToFactory: r.toFactory?.factoryName || "—",
      TransferDate: r.transferDate
        ? new Date(r.transferDate).toLocaleDateString()
        : "—",
      TransferredBy: r.transferedBy?.name || "—",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transfer History");
    XLSX.writeFile(workbook, "TransferHistory.xlsx");
  };

  /** 🔹 Reset filters */
  const handleResetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setRowsPerPage(10);
    setCurrentPage(1);
  };

  return (
    <>
      <Navbar />
      <div className="mt-10 w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          {/* Header + Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              📋 Transfer History
            </h3>

            <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="🔍 Search machines..."
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
              />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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

          {loading ? (
            <div className="text-center text-gray-500 py-6 animate-pulse">
              Loading transfer history...
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              No transfer history found 🚫
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold tracking-wide">
                    <tr>
                      <th className="px-4 py-3 border">Machine Code</th>
                      <th className="px-4 py-3 border">Category</th>
                      <th className="px-4 py-3 border">Group</th>
                      <th className="px-4 py-3 border">From Factory</th>
                      <th className="px-4 py-3 border">To Factory</th>
                      <th className="px-4 py-3 border">Transfer Date</th>
                      <th className="px-4 py-3 border">Transferred By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-blue-50/50 even:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {row.machineCode}
                        </td>
                        <td className="px-4 py-3">{row.category}</td>
                        <td className="px-4 py-3">{row.group}</td>
                        <td className="px-4 py-3">
                          {row.fromFactory ? (
                            <>
                              <span className="font-medium text-gray-700">
                                {row.fromFactory.factoryName}
                              </span>
                              <span className="text-gray-500 text-xs ml-1">
                                ({row.fromFactory.factoryLocation})
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.toFactory ? (
                            <>
                              <span className="font-medium text-gray-700">
                                {row.toFactory.factoryName}
                              </span>
                              <span className="text-gray-500 text-xs ml-1">
                                ({row.toFactory.factoryLocation})
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.transferDate
                            ? new Date(row.transferDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.transferedBy ? row.transferedBy.name : "—"}
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

export default TransferHistoryTable;
