import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx-js-style";
import Navbar from "./Navbar";
import Swal from "sweetalert2";

function TransferHistoryTable() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        setMessage("❌ User not authenticated.");
        setTransfers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/transfers`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch transfers");

        const data = await res.json();
        setTransfers(Array.isArray(data.transfers) ? data.transfers : []);
      } catch (err) {
        console.error("❌ Error fetching transfers:", err);
        setTransfers([]);
        setMessage("❌ Failed to load transfers.");
      } finally {
        setLoading(false);
        // Clear message after 2s
        setTimeout(() => setMessage(""), 2000);
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

      // let matchesDate = true;
      // if (from || to) {
      //   if (!row.transferDate) matchesDate = false;
      //   else {
      //     const date = new Date(row.transferDate.split("T")[0]);
      //     matchesDate = (!from || date >= from) && (!to || date <= to);
      //   }
      // }
      let matchesDate = true;

      if (from || to) {
        const transferDate = row.transferDate
          ? new Date(row.transferDate.split("T")[0])
          : null;

        const approvedDate = row.approvedDate
          ? new Date(row.approvedDate.split("T")[0])
          : null;

        const inTransferRange =
          transferDate &&
          (!from || transferDate >= from) &&
          (!to || transferDate <= to);

        const inApprovedRange =
          approvedDate &&
          (!from || approvedDate >= from) &&
          (!to || approvedDate <= to);

        // ✅ এখন যে কোনো একটার তারিখ মিলে গেলেই true
        matchesDate = inTransferRange || inApprovedRange;
      }

      // return matchesSearch && matchesDate;
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

  const handleExportExcel = () => {
    const rows = filteredRows.map((r) => ({
      TransferId: r.transferId || "—",
      MachineCode: r.machineId?.machineCode || "—",
      FromFactory: r.fromFactory?.factoryName || "—",
      ToFactory: r.toFactory?.factoryName || "—",
      TransferInitiationDate: r.transferDate
        ? { t: "d", v: new Date(r.transferDate), z: "dd-mmm-yyyy" }
        : null,
      TransferReceivedDate: r.approvedDate
        ? { t: "d", v: new Date(r.approvedDate), z: "dd-mmm-yyyy" }
        : null,
      CurrentStatus: r.status || "—",
      Remarks: r.remarks || "—",
      TransferInitiatedBy: r.transferedBy?.name || "—",
      TransferReceivedBy: r.approvedBy?.name || "—",
    }));

    if (rows.length === 0) {
      Swal.fire("No Data", "No transfer history to export.", "info");
      return;
    }

    // ✅ Create blank worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // ✅ Add title & export date
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [["🔁 Machine Transfer History Report"]],
      { origin: "A1" }
    );

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

    // ✅ Add data starting at row 4
    XLSX.utils.sheet_add_json(worksheet, rows, {
      origin: "A4",
      skipHeader: false,
    });

    // ✅ Auto column width
    const keys = Object.keys(rows[0] || {});
    worksheet["!cols"] = keys.map((key) => {
      const maxLength = Math.max(
        key.length,
        ...rows.map((row) => {
          const cellValue = row[key];
          let text = "";
          if (!cellValue) return 1;
          if (cellValue?.t === "d" && cellValue.v instanceof Date) {
            text = cellValue.v.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
          } else {
            text = cellValue.toString();
          }
          return text.length;
        })
      );
      return { wch: maxLength + 3 };
    });

    // ✅ Merge and style title rows
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: keys.length - 1 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: keys.length - 1 } }, // Export date
    ];

    // ✅ Title style
    worksheet["A1"].s = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2E75B6" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    // ✅ Export date style
    worksheet["A2"].s = {
      font: { italic: true, color: { rgb: "555555" } },
      alignment: { horizontal: "center" },
    };

    // ✅ Header row style (row 4)
    const headerRow = 3; // zero-indexed
    for (let C = 0; C < keys.length; C++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: headerRow, c: C })];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F81BD" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "AAAAAA" } },
            bottom: { style: "thin", color: { rgb: "AAAAAA" } },
            left: { style: "thin", color: { rgb: "AAAAAA" } },
            right: { style: "thin", color: { rgb: "AAAAAA" } },
          },
        };
      }
    }

    // ✅ Freeze header row
    worksheet["!freeze"] = { xSplit: 0, ySplit: 4 };

    // ✅ Create workbook & export
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transfer History");
    XLSX.writeFile(workbook, "TransferHistory.xlsx", { cellStyles: true });
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
          <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8">
            📋 Transfer History Report
          </h2>
          <div>
            {message && <p className="text-sm text-red-500">{message}</p>}
          </div>
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
                      <th className="px-4 py-3 border">
                        Transfer Initiation Date
                      </th>
                      <th className="px-4 py-3 border">
                        Transfer Received Date
                      </th>

                      <th className="px-4 py-3 border">Current Status</th>
                      <th className="px-4 py-3 border">Remarks</th>
                      <th className="px-4 py-3 border">
                        Transfer Initiated By
                      </th>
                      <th className="px-4 py-3 border">Transfer Received By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedRows.map((row) => (
                      <tr
                        key={row._id}
                        className="hover:bg-blue-50/50 even:bg-gray-50 transition"
                      >
                        <td className="px-2 py-2 font-medium text-blue-600">
                          {row.transferId || "—"}
                        </td>
                        <td
                          className="px-2 py-2 font-medium text-blue-600 cursor-pointer hover:underline"
                          onClick={() => openModal(row.machineId)}
                        >
                          {row.machineId?.machineCode || "—"}
                        </td>
                        <td className="px-2 py-2">
                          {row.fromFactory ? (
                            <>
                              <span className="font-medium text-gray-700">
                                {row.fromFactory.factoryName}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {row.toFactory ? (
                            <>
                              <span className="font-medium text-gray-700">
                                {row.toFactory.factoryName}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-gray-700">
                          {row.transferDate
                            ? new Date(row.transferDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </td>
                        <td className="px-2 py-2 text-gray-700">
                          {row.approvedDate
                            ? new Date(row.approvedDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </td>
                        <td className="px-2 py-2 text-gray-700">
                          {row.status || "—"}
                        </td>
                        <td className="px-2 py-2 text-gray-700">
                          {row.remarks || "—"}
                        </td>
                        <td className="px-2 py-2 text-gray-700">
                          {row.transferedBy?.name || "—"}
                        </td>
                        <td className="px-2 py-2 text-gray-700">
                          {row.approvedBy?.name || "—"}
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
          <div className="bg-white rounded-2xl shadow-lg p-6 w-98 relative">
            <h3 className="text-xl font-bold mb-4 text-center">
              Machine Details
            </h3>
            <p>
              <strong>Machine Code :</strong> {selectedMachine.machineCode}
            </p>
            <p>
              <strong>Machine Number :</strong>{" "}
              {selectedMachine.machineNumber || "—"}
            </p>
            <p>
              <strong>Machine Category :</strong>{" "}
              {selectedMachine.machineCategory || "—"}
            </p>
            <p>
              <strong>Machine Group :</strong>{" "}
              {selectedMachine.machineGroup || "—"}
            </p>
            <p>
              <strong>Machine Purchase Date :</strong>{" "}
              {/* {selectedMachine.purchaseDate || "—"} */}
              {selectedMachine.purchaseDate
                ? new Date(selectedMachine.purchaseDate).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  )
                : "—"}
            </p>
            <p>
              <strong>Machine Origin Factory :</strong>{" "}
              {selectedMachine.originFactory?.factoryName || "—"}
            </p>
            <p>
              <strong>Machine Origin Factory Location :</strong>{" "}
              {selectedMachine.originFactory?.factoryLocation || "—"}
            </p>
            <p>
              <strong>Machine Current Factory :</strong>{" "}
              {selectedMachine.factoryId?.factoryName || "—"}
            </p>
            <p>
              <strong>Machine Current Factory Location :</strong>{" "}
              {selectedMachine.factoryId?.factoryLocation || "—"}
            </p>
            <p>
              <strong>Machine Status In Current Factory :</strong>{" "}
              {selectedMachine.status || "—"}
            </p>
            <p>
              <strong>Machine Created By :</strong>{" "}
              {selectedMachine.createdBy?.name || "—"}
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
