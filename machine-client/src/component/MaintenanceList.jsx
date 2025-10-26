import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx-js-style";
import Navbar from "./Navbar";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API_URL;

function MaintenanceList() {
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [factories, setFactories] = useState([]);
  const [filters, setFilters] = useState({ factoryId: "", status: "" });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);

  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("userRole");
  const userFactoryId = localStorage.getItem("userFactoryId");

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

        if (role !== "superadmin") {
          allFactories = allFactories.filter((f) => f._id === userFactoryId);
          setFilters((prev) => ({ ...prev, factoryId: userFactoryId }));
        }
        setFactories(allFactories);
      } catch (err) {
        console.error(err);
        setMessage("❌ Failed to load factories");
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
      console.error(err);
      setMessage("❌ Failed to load maintenances");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 2000);
    }
  };

  useEffect(() => {
    fetchMaintenances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // 🔹 Update Status
  const handleStatusUpdate = async (maintenanceId, currentStatus) => {
    if (currentStatus === "Maintenance Completed") return;
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
            newStatus: "Maintenance Completed",
            userId: localStorage.getItem("userId"),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setMaintenances((prev) =>
        prev.map((m) =>
          m._id === maintenanceId
            ? { ...m, status: "Maintenance Completed" }
            : m
        )
      );
      setMessage("✅ Status updated to Completed");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
      setTimeout(() => setMessage(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Filtered rows
  const filteredRows = useMemo(() => {
    const searchText = search.toLowerCase();
    return maintenances.filter(
      (m) =>
        m.maintenanceId?.toLowerCase().includes(searchText) ||
        m.factoryId?.factoryName?.toLowerCase().includes(searchText) ||
        m.machineId?.machineCode?.toLowerCase().includes(searchText) ||
        m.machineId?.machineCategory?.toLowerCase().includes(searchText) ||
        m.maintenanceType?.toLowerCase().includes(searchText) ||
        m.description?.toLowerCase().includes(searchText) ||
        m.status?.toLowerCase().includes(searchText) ||
        m.spareParts?.join(",").toLowerCase().includes(searchText) ||
        m.createdBy?.name?.toLowerCase().includes(searchText)
    );
  }, [maintenances, search]);

  // 🔹 Pagination
  const totalPages =
    rowsPerPage === "All" ? 1 : Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows =
    rowsPerPage === "All"
      ? filteredRows
      : filteredRows.slice(
          (currentPage - 1) * rowsPerPage,
          currentPage * rowsPerPage
        );

  // 🔹 Export Excel
  const handleExportExcel = () => {
    const rows = filteredRows.map((m) => ({
      MaintenanceID: m.maintenanceId || "—",
      Factory: m.factoryId?.factoryName || "—",
      MachineCode: m.machineId?.machineCode || "—",
      MachineCategory: m.machineId?.machineCategory || "—",
      Type: m.maintenanceType || "—",
      Description: m.description || "—",
      SpareParts:
        m.spareParts && m.spareParts.length > 0 ? m.spareParts.join(", ") : "—",
      Status: m.status || "—",
      CreatedBy: m.createdBy?.name || "—",
      Date: m.createdAt
        ? { t: "d", v: new Date(m.createdAt), z: "dd-mmm-yyyy" }
        : null,
    }));

    if (rows.length === 0) {
      Swal.fire("No Data", "No maintenance records to export.", "info");
      return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(worksheet, [["🏭 Machine Maintenance History"]], {
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
            timeZone: "UTC",
          })}`,
        ],
      ],
      { origin: "A2" }
    );
    XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: "A3" });
    XLSX.utils.sheet_add_json(worksheet, rows, {
      origin: "A4",
      skipHeader: false,
    });

    const keys = Object.keys(rows[0] || {});
    worksheet["!cols"] = keys.map((key) => {
      const maxLength = Math.max(
        key.length,
        ...rows.map((row) => {
          const cell = row[key];
          if (!cell) return 1;
          return cell?.v ? cell.v.toString().length : cell.toString().length;
        })
      );
      return { wch: maxLength + 3 };
    });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: keys.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: keys.length - 1 } },
    ];

    worksheet["A1"].s = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2E75B6" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    worksheet["A2"].s = {
      font: { italic: true, color: { rgb: "555555" } },
      alignment: { horizontal: "center" },
    };

    const headerRow = 3;
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

    worksheet["!freeze"] = { xSplit: 0, ySplit: 4 };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance History");
    XLSX.writeFile(workbook, "MaintenanceHistory.xlsx", { cellStyles: true });
  };

  // 🔹 Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setFilters({
      factoryId: role === "superadmin" ? "" : userFactoryId,
      status: "",
    });
    setCurrentPage(1);
    setRowsPerPage(10);
  };

  // 🔹 Modal handlers
  const openModal = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setModalOpen(true);
  };
  const closeModal = () => {
    setSelectedMaintenance(null);
    setModalOpen(false);
  };

  return (
    <>
      <Navbar />
      <div className="mt-10 w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800">
            🧰 Maintenance Records
          </h3>

          {message && (
            <div className="my-3 text-sm text-red-600 font-medium">
              {message}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-4 mb-6">
            {role === "superadmin" && (
              <select
                value={filters.factoryId}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, factoryId: e.target.value }))
                }
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Maintenance In-Progress">In-Progress</option>
              <option value="Maintenance Completed">Completed</option>
            </select>

            <input
              type="text"
              placeholder="🔍 Search maintenance..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-48 md:w-64"
            />
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
            >
              ⬇ Export Excel
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition"
            >
              🔄 Reset
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center text-gray-500 py-6 animate-pulse">
              Loading maintenance records...
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              No maintenance records found 🚫
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold tracking-wide">
                    <tr>
                      <th className="px-2 py-2 border">SL</th>
                      <th className="px-2 py-2 border">Maintenance ID</th>
                      <th className="px-2 py-2 border">Factory Name</th>
                      <th className="px-2 py-2 border">Machine Code</th>
                      <th className="px-2 py-2 border">Type</th>
                      <th className="px-2 py-2 border">Description</th>
                      <th className="px-2 py-2 border">Spare Parts</th>
                      <th className="px-2 py-2 border">Status</th>
                      <th className="px-2 py-2 border">Created By</th>
                      <th className="px-2 py-2 border">
                        Maintenance Creation Date
                      </th>
                      <th className="px-2 py-2 border">Completed By</th>
                      <th className="px-2 py-2 border">
                        Maintenance Completed Date
                      </th>
                      <th className="px-2 py-2 border">Maintenance Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedRows.map((m, idx) => (
                      <tr
                        key={m._id}
                        className="hover:bg-blue-50 even:bg-gray-50 transition"
                      >
                        <td className="px-2 py-2">{idx + 1}</td>
                        <td
                          className="px-3 py-3 font-medium text-blue-600 cursor-pointer hover:underline"
                          onClick={() => openModal(m)}
                        >
                          {m.maintenanceId || "—"}
                        </td>
                        <td className="px-2 py-2">
                          <span className="font-medium text-gray-700">
                            {m.factoryId?.factoryName || "—"}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <span className="font-medium text-gray-700">
                            {m.machineId?.machineCode || "—"}
                          </span>
                        </td>
                        <td className="px-2 py-2">{m.maintenanceType}</td>
                        <td className="px-2 py-2">{m.description}</td>
                        <td className="px-2 py-2">
                          {m.spareParts?.length > 0
                            ? m.spareParts.join(", ")
                            : "—"}
                        </td>
                        <td className="px-2 py-2">
                          {m.status === "Maintenance Completed" ? (
                            <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                              Completed
                            </span>
                          ) : (
                            <button
                              className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full hover:bg-yellow-200 transition"
                              onClick={() =>
                                handleStatusUpdate(m._id, m.status)
                              }
                              disabled={loading}
                            >
                              In-Progress
                            </button>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {m.createdBy?.name || "—"}
                        </td>
                        <td className="px-2 py-2">
                          {m.maintenanceDate
                            ? new Date(m.maintenanceDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )
                            : "—"}
                        </td>
                        <td className="px-2 py-2">
                          {m.history?.[m.history.length - 1]?.changedBy?.name ||
                            "—"}
                        </td>

                        <td className="px-2 py-2">
                          {m.history?.[0]?.changedAt
                            ? new Date(m.history[0].changedAt).toLocaleString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                  timeZone: "UTC",
                                }
                              )
                            : "—"}
                        </td>

                        <td className="px-2 py-2">
                          {m.maintenanceDate && m.history?.[0]?.changedAt
                            ? (() => {
                                const start = new Date(m.maintenanceDate);
                                const end = new Date(m.history[0].changedAt);
                                let diffMs = end - start; // difference in milliseconds

                                const days = Math.floor(
                                  diffMs / (1000 * 60 * 60 * 24)
                                );
                                diffMs -= days * 1000 * 60 * 60 * 24;

                                const hours = Math.floor(
                                  diffMs / (1000 * 60 * 60)
                                );
                                diffMs -= hours * 1000 * 60 * 60;

                                const minutes = Math.floor(
                                  diffMs / (1000 * 60)
                                );

                                return `${days}d ${hours}h ${minutes}m`;
                              })()
                            : "—"}
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

      {/* Modal */}
      {modalOpen && selectedMaintenance && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-96 relative">
            <h3 className="text-xl font-bold mb-4 text-center">
              Maintenance Details
            </h3>
            <p>
              <strong>Maintenance ID:</strong>{" "}
              {selectedMaintenance.maintenanceId}
            </p>
            <p>
              <strong>Machine Code:</strong>{" "}
              {selectedMaintenance.machineId?.machineCode || "—"}
            </p>
            <p>
              <strong>Type:</strong> {selectedMaintenance.maintenanceType}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {selectedMaintenance.description || "—"}
            </p>
            <p>
              <strong>Spare Parts:</strong>{" "}
              {selectedMaintenance.spareParts?.join(", ") || "—"}
            </p>
            <p>
              <strong>Status:</strong> {selectedMaintenance.status}
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

export default MaintenanceList;
