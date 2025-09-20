import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import Navbar from "./Navbar";

function TransferHistoryTable() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  /** 🔹 Fetch transfers */
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/transfers`
        );
        const data = await res.json();
        setTransfers(Array.isArray(data.transfers) ? data.transfers : []);
      } catch (err) {
        console.error("❌ Error fetching transfers:", err);
        setTransfers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransfers();
  }, []);

  /** 🔹 Filtered rows */
  const filteredRows = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return transfers.filter((row) => {
      const searchText = search.toLowerCase();
      const matchesSearch =
        row.transferId?.toLowerCase().includes(searchText) ||
        row.machineId?.machineCode?.toLowerCase().includes(searchText) ||
        row.fromFactory?.factoryName?.toLowerCase().includes(searchText) ||
        row.toFactory?.factoryName?.toLowerCase().includes(searchText) ||
        row.fromFactory?.factoryLocation?.toLowerCase().includes(searchText) ||
        row.toFactory?.factoryLocation?.toLowerCase().includes(searchText) ||
        row.transferedBy?.name?.toLowerCase().includes(searchText) ||
        row.status?.toLowerCase().includes(searchText) ||
        row.remarks?.toLowerCase().includes(searchText);

      let matchesDate = true;
      if (from || to) {
        if (!row.transferDate) matchesDate = false;
        else {
          const date = new Date(row.transferDate.split("T")[0]);
          matchesDate = (!from || date >= from) && (!to || date <= to);
        }
      }
      return matchesSearch && matchesDate;
    });
  }, [transfers, search, fromDate, toDate]);

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
      TransferId: r.transferId || "—",
      MachineCode: r.machineId?.machineCode || "—",
      FromFactory: r.fromFactory?.factoryName || "—",
      ToFactory: r.toFactory?.factoryName || "—",
      TransferDate: r.transferDate
        ? new Date(r.transferDate).toLocaleDateString()
        : "—",
      Status: r.status || "—",
      Remarks: r.remarks || "—",
      TransferredBy: r.transferedBy?.name || "—",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transfers");
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

  /** 🔹 Open modal */
  const openModal = (machine) => {
    setSelectedMachine(machine);
    setModalOpen(true);
  };

  /** 🔹 Close modal */
  const closeModal = () => {
    setSelectedMachine(null);
    setModalOpen(false);
  };

  return (
    <>
      <Navbar />
      <div className="mt-10 w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            📋 Transfer History Report
          </h2>
          {/* Header + Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 mt-4">
            <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="🔍 Search transfers..."
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
                      <th className="px-4 py-3 border">Transfer ID</th>
                      <th className="px-4 py-3 border">Machine Code</th>
                      <th className="px-4 py-3 border">From Factory</th>
                      <th className="px-4 py-3 border">To Factory</th>
                      <th className="px-4 py-3 border">Transfer Date</th>
                      <th className="px-4 py-3 border">Status</th>
                      <th className="px-4 py-3 border">Remarks</th>
                      <th className="px-4 py-3 border">Transferred By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedRows.map((row) => (
                      <tr
                        key={row._id}
                        className="hover:bg-blue-50/50 even:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3 font-medium text-blue-600">
                          {row.transferId || "—"}
                        </td>
                        <td
                          className="px-4 py-3 font-medium text-blue-600 cursor-pointer hover:underline"
                          onClick={() => openModal(row.machineId)}
                        >
                          {row.machineId?.machineCode || "—"}
                        </td>
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
                          {row.status || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.remarks || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.transferedBy?.name || "—"}
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

      {/* 🔹 Modal */}
      {modalOpen && selectedMachine && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96 relative">
            <h3 className="text-xl font-bold mb-4">Machine Details</h3>
            <p>
              <strong>Machine Code:</strong> {selectedMachine.machineCode}
            </p>
            <p>
              <strong>Machine Category:</strong>{" "}
              {selectedMachine.machineCategory || "—"}
            </p>
            <p>
              <strong>Machine Group:</strong>{" "}
              {selectedMachine.machineGroup || "—"}
            </p>
            <p>
              <strong>Machine Origin Factory:</strong>{" "}
              {selectedMachine.originFactory?.factoryName || "—"}
            </p>
            <p>
              <strong>Factory Location:</strong>{" "}
              {selectedMachine.originFactory?.factoryLocation || "—"}
            </p>
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default TransferHistoryTable;
