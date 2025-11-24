import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx-js-style";
import Navbar from "./Navbar";
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

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
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [editFactoryName, setEditFactoryName] = useState("");
  const [editFactoryLocation, setEditFactoryLocation] = useState("");
  // Fetch factories

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
  useEffect(() => {
    fetchFactories();
  }, []);
  /** 🔹 Soft Delete Factory */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this factory?"))
      return;
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/factories/factory/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchFactories(); // Refresh
      } else alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Failed to delete factory");
    }
  };

  /** 🔹 Open Edit Modal */
  const handleEdit = async (id) => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/factories/factory/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setSelectedFactory(data.data);
        setEditFactoryName(data.data.factoryName);
        setEditFactoryLocation(data.data.factoryLocation);
        setShowEditModal(true);
      } else alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch factory data");
    }
  };

  /** 🔹 Save Edit */
  const handleSaveEdit = async () => {
    if (!editFactoryName || !editFactoryLocation) {
      alert("Factory Name & Location required");
      return;
    }
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/factories/factory/${selectedFactory._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            factoryName: editFactoryName,
            factoryLocation: editFactoryLocation,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowEditModal(false);
        fetchFactories(); // Refresh list
      } else alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Failed to update factory");
    }
  };
  const handleStatusToggle = async (id, currentStatus) => {
    const token = localStorage.getItem("authToken");

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/factories/factory/${id}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      const data = await res.json();
      if (data.success) {
        alert("Factory status updated");
        fetchFactories(); // Refresh list
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

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
        f.factoryNumber?.toLowerCase().includes(searchText);
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

  const handleExportExcel = () => {
    if (!filteredRows || filteredRows.length === 0) {
      alert("No data available to export.");
      return;
    }
    // 🔥 Only export Active + Not Deleted factories
    const exportableRows = filteredRows.filter(
      (f) => f.isActive === true && f.isDeleted === false
    );

    if (exportableRows.length === 0) {
      alert("No active factories available to export!");
      return;
    }
    // ✅ Sort first by factoryName, then by factoryNumber
    const sortedRows = [...exportableRows].sort((a, b) => {
      const nameCompare = a.factoryName.localeCompare(b.factoryName);
      if (nameCompare !== 0) return nameCompare;
      // secondary sort by factoryNumber (numeric if possible)
      const numA = parseInt(a.factoryNumber) || 0;
      const numB = parseInt(b.factoryNumber) || 0;
      return numA - numB;
    });

    // Prepare rows
    const rows = sortedRows.map((f) => ({
      FactoryName: f.factoryName,
      FactoryLocation: f.factoryLocation,
      FactoryNumber: f.factoryNumber,
      CreatedBy: f.createdBy?.name || "—",
      Role: f.createdBy?.role || "—",
      CreatedDate: f.createdAt
        ? { t: "d", v: new Date(f.createdAt), z: "dd-mmm-yyyy" }
        : null,
      UpdatedDate: f.updatedAt
        ? { t: "d", v: new Date(f.updatedAt), z: "dd-mmm-yyyy" }
        : null,
    }));

    // Create blank worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // Add title & export date
    XLSX.utils.sheet_add_aoa(worksheet, [["🏭 Factory Master List Report"]], {
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
    XLSX.utils.sheet_add_aoa(worksheet, [[]], { origin: "A3" });

    // Add data + headers starting at A4
    XLSX.utils.sheet_add_json(worksheet, rows, {
      origin: "A4",
      skipHeader: false,
    });

    // Auto column width
    const keys = Object.keys(rows[0]);
    worksheet["!cols"] = keys.map((key) => {
      const maxLength = Math.max(
        key.length,
        ...rows.map((r) => {
          const cell = r[key];
          if (!cell) return 1;
          if (cell.t === "d" && cell.v instanceof Date) {
            return cell.v.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).length;
          }
          return cell.toString().length;
        })
      );
      return { wch: maxLength + 3 };
    });

    // Merge and style title
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: keys.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: keys.length - 1 } },
    ];

    worksheet["A1"].s = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    worksheet["A2"].s = {
      font: { italic: true, color: { rgb: "555555" } },
      alignment: { horizontal: "center" },
    };

    // Style header row
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

    // Freeze header
    worksheet["!freeze"] = { xSplit: 0, ySplit: 4 };

    // Export workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Factories");
    XLSX.writeFile(workbook, "FactoryMasterList.xlsx", { cellStyles: true });
  };
  // ⭐ Summary Calculations for FactoryList
  const totalFactories = factories.length;
  const activeFactories = factories.filter((f) => f.isActive).length;
  const inactiveFactories =
    factories?.filter((factory) => factory.isActive === false).length || 0;

  // ⭐ Reusable Stat Card
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
          {/* Header + Filters */}

          <h2 className="text-2xl font-bold text-gray-800">🏭 Factory List</h2>
          {/* ⭐ Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <StatCard
              title="🏭 Total Factories"
              value={totalFactories}
              color="text-blue-600"
            />

            <StatCard
              title="🟢 Active Factories"
              value={activeFactories}
              color="text-green-600"
            />

            <StatCard
              title="🔴 Inactive Factories"
              value={inactiveFactories}
              color="text-red-600"
            />
          </div>

          <div className="flex flex-wrap gap-3 mt-4 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="🔍 Search factories..."
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-48 md:w-64"
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
                      <th className="px-2 py-2 border">SL</th>
                      <th className="px-4 py-3 border">Factory Name</th>
                      <th className="px-4 py-3 border">Factory Location</th>
                      <th className="px-4 py-3 border">Created By (Name)</th>
                      <th className="px-4 py-3 border">Role</th>
                      <th className="px-4 py-3 border">Created Date</th>
                      <th className="px-4 py-3 border">Updated Date</th>
                      <th className="px-4 py-3 border">Factory Number</th>
                      <th className="px-4 py-3 border">Active Status</th>
                      <th className="px-4 py-3 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedRows.map((factory, idx) => (
                      <tr
                        key={factory._id}
                        className="hover:bg-indigo-50/50 transition"
                      >
                        <td className="border px-2 py-2">
                          {(currentPage - 1) *
                            (rowsPerPage === "All"
                              ? paginatedRows.length
                              : rowsPerPage) +
                            (idx + 1)}
                        </td>
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
                          {new Date(factory.createdAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(factory.updatedAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {factory.factoryNumber}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              handleStatusToggle(factory._id, factory.isActive)
                            }
                            className="text-2xl transition-transform hover:scale-110"
                            title={
                              factory.isActive
                                ? "Click to deactivate"
                                : "Click to activate"
                            }
                          >
                            {factory.isActive ? (
                              <FaToggleOn className="text-green-600" />
                            ) : (
                              <FaToggleOff className="text-gray-400" />
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3 flex gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEdit(factory._id)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(factory._id)}
                          >
                            <FaTrash />
                          </button>
                          {/* 🔹 Centered Edit Modal */}
                          {showEditModal && selectedFactory && (
                            <div className="fixed inset-0 flex items-center justify-center z-50">
                              <div className="bg-white border rounded-xl p-6 shadow-sm w-80">
                                <h3 className="text-lg font-bold mb-3">
                                  ✏️ Edit Factory
                                </h3>
                                <label className="block mb-1 text-sm font-medium">
                                  Factory Name
                                </label>
                                <input
                                  type="text"
                                  value={editFactoryName}
                                  onChange={(e) =>
                                    setEditFactoryName(e.target.value)
                                  }
                                  placeholder="Factory Name"
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm"
                                />
                                <label className="block mb-1 text-sm font-medium">
                                  Factory Location
                                </label>
                                <input
                                  type="text"
                                  value={editFactoryLocation}
                                  onChange={(e) =>
                                    setEditFactoryLocation(e.target.value)
                                  }
                                  placeholder="Factory Location"
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm"
                                />
                                <label className="block mb-1 text-sm font-medium">
                                  Factory Number
                                </label>
                                <input
                                  type="text"
                                  value={selectedFactory?.factoryNumber || ""}
                                  disabled
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm bg-gray-100 cursor-not-allowed"
                                  placeholder="Factory Number"
                                />

                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 bg-gray-300 rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSaveEdit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
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
