import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx-js-style";

import Navbar from "./Navbar";

function FactoryMachineList() {
  const [machinesByFactory, setMachinesByFactory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedFactory, setSelectedFactory] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [factoryPages, setFactoryPages] = useState({});
  const [itemsPerPageMap, setItemsPerPageMap] = useState({});
  const [statusFilter, setStatusFilter] = useState("");

  const defaultItemsPerPage = 10;
  const itemsPerPageOptions = [5, 10, 20, 50];

  // Fetch machines grouped by factory
  useEffect(() => {
    const fetchMachines = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        setMessage("❌ User not authenticated.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/machines`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch machines");
        const data = await res.json();
        setMachinesByFactory(data.machinesByFactory || {});
      } catch (err) {
        console.error("❌ Error fetching machines:", err);
        setMachinesByFactory({});
        setMessage("❌ Failed to load machines.");
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  // Dropdown options
  const factoryOptions = Object.keys(machinesByFactory).map((key) => {
    const [factoryName, factoryLocation] = key.split(" | ");
    return { key, name: factoryName, location: factoryLocation };
  });

  // Filtered machines with search
  const filteredMachinesByFactory = useMemo(() => {
    let filtered = {};
    if (!selectedFactory) return {};
    if (selectedFactory === "all") filtered = { ...machinesByFactory };
    else
      filtered = {
        [selectedFactory]: machinesByFactory[selectedFactory] || [],
      };

    //if (!search) return filtered;

    const searchValue = search.toLowerCase();
    const result = {};
    Object.entries(filtered).forEach(([factoryKey, machines]) => {
      const matched = machines.filter((m) => {
        const code = m.machineCode?.toLowerCase() || "";
        const category = m.machineCategory?.toLowerCase() || "";
        const group = m.machineGroup?.toLowerCase() || "";
        const status = m.status?.toLowerCase() || "";
        const machineNumber = m.machineNumber?.toLowerCase() || "";
        return (
          code.includes(searchValue) ||
          category.includes(searchValue) ||
          group.includes(searchValue) ||
          status.includes(searchValue) ||
          machineNumber.includes(searchValue)
        );
      });
      if (matched.length > 0) result[factoryKey] = matched;
    });
    if (statusFilter) {
      const filteredByStatus = {};
      Object.entries(result).forEach(([factoryKey, machines]) => {
        const matchedStatus = machines.filter((m) => m.status === statusFilter);
        if (matchedStatus.length > 0)
          filteredByStatus[factoryKey] = matchedStatus;
      });
      return filteredByStatus;
    }
    return result;
  }, [machinesByFactory, selectedFactory, search, statusFilter]);

  const handleExportExcel = () => {
    const rows = [];

    // Prepare data
    Object.entries(filteredMachinesByFactory)
      // ✅ First sort factories alphabetically
      .sort(([factoryA], [factoryB]) => factoryA.localeCompare(factoryB))
      .forEach(([factoryKey, factoryMachines]) => {
        const [factoryName, factoryLocation] = factoryKey.split(" | ");
        // ✅ Then sort each factory's machines by machineNumber
        const sortedMachines = [...factoryMachines].sort((a, b) =>
          a.machineNumber.localeCompare(b.machineNumber, undefined, {
            numeric: true,
          })
        );
        sortedMachines.forEach((machine) => {
          rows.push({
            FactoryName: factoryName,
            FactoryLocation: factoryLocation,
            MachineCode: machine.machineCode,
            MachineCategory: machine.machineCategory,
            MachineGroup: machine.machineGroup,
            MachineStatus: machine.status,
            MachineNumber: machine.machineNumber,
            PurchaseDate: machine.purchaseDate
              ? { t: "d", v: new Date(machine.purchaseDate), z: "dd-mmm-yyyy" }
              : null,
            CreatedBy: machine.createdBy?.name || "—",
            CreatedDate: machine.createdAt
              ? { t: "d", v: new Date(machine.createdAt), z: "dd-mmm-yyyy" }
              : null,
            UpdatedDate: machine.updatedAt
              ? { t: "d", v: new Date(machine.updatedAt), z: "dd-mmm-yyyy" }
              : null,
          });
        });
      });

    // Create blank worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // Add title and export date
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [["🏭 Factory Wise Machine List Report"]],
      {
        origin: "A1",
      }
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

    // Add data + headers starting at A4
    XLSX.utils.sheet_add_json(worksheet, rows, {
      origin: "A4",
      skipHeader: false,
    });

    // Auto column width including dates
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

    // Merge and style title rows
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: keys.length - 1 } }, // title
      { s: { r: 1, c: 0 }, e: { r: 1, c: keys.length - 1 } }, // export date
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

    // Style header row (row 4)
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

    // Freeze header row
    worksheet["!freeze"] = { xSplit: 0, ySplit: 4 };

    // Create workbook & export
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Factory Wise Machines");
    XLSX.writeFile(workbook, "FactoryWiseMachineList.xlsx", {
      cellStyles: true,
    });
  };

  const handleResetFilters = () => {
    setSelectedFactory("");
    setSearch("");
    setStatusFilter(""); // ✅ Add this
    setFactoryPages({});
    setItemsPerPageMap({});
  };

  // Pagination helpers
  const getPaginatedMachines = (factoryKey, machines) => {
    const itemsPerPage = itemsPerPageMap[factoryKey] || defaultItemsPerPage;
    const currentPage = factoryPages[factoryKey] || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return machines.slice(startIndex, endIndex);
  };

  const getTotalPages = (factoryKey, machines) => {
    const itemsPerPage = itemsPerPageMap[factoryKey] || defaultItemsPerPage;
    return Math.ceil(machines.length / itemsPerPage);
  };

  // Highlight matching search text
  const highlightMatch = (text) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <Navbar />
      <div className="mt-10 w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          {/* Header */}

          <h4 className="py-2 text-2xl font-bold text-gray-800">
            🏭 Factory-wise Machine
          </h4>

          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
            {/* <h4 className="text-2xl font-bold text-gray-800">
              🏭 Factory-wise Machine
            </h4> */}
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
              <select
                value={selectedFactory}
                onChange={(e) => setSelectedFactory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              >
                <option value="">Select Factory</option>
                <option value="all">All Factories</option>
                {factoryOptions.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.name} ({f.location})
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              >
                <option value="">Filter by Status</option>
                <option value="In-House">In-House</option>
                <option value="Transfer Initiated">Transfer Initiated</option>
                <option value="Borrowed">Borrowed</option>
                <option value="Return Initiated">Return Initiated</option>
                <option value="Maintenance In-Progress">
                  Maintenance In-Progress
                </option>
                <option value="Machine Idle In-Progress">
                  Machine Idle In-Progress
                </option>
              </select>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code, category, group, machine number "
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              />

              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm rounded-lg shadow hover:from-green-700 hover:to-green-600 transition"
              >
                ⬇ Export Excel
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg shadow hover:bg-gray-600 transition"
              >
                🔄 Reset Filters
              </button>
            </div>
          </div>
          {/* ✅ Global Summary Section */}
          {Object.keys(filteredMachinesByFactory).length > 0 && (
            <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg">
              <h3 className="text-xl font-bold">📊 Summary Overview</h3>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-3 text-center">
                <div className="p-4 bg-white text-gray-900 rounded-xl shadow-md">
                  <p className="text-sm font-medium">Total Factories</p>
                  <p className="text-2xl font-extrabold">
                    {Object.keys(filteredMachinesByFactory).length}
                  </p>
                </div>

                <div className="p-4 bg-white text-gray-900 rounded-xl shadow-md">
                  <p className="text-sm font-medium">Total Machines</p>
                  <p className="text-2xl font-extrabold">
                    {Object.values(filteredMachinesByFactory).reduce(
                      (acc, arr) => acc + arr.length,
                      0
                    )}
                  </p>
                </div>

                {[
                  "In-House",
                  "Transfer Initiated",
                  "Borrowed",
                  "Return Initiated",
                  "Maintenance In-Progress",
                  "Machine Idle In-Progress",
                ].map((status) => (
                  <div
                    key={status}
                    className="p-4 bg-white text-gray-900 rounded-xl shadow-md"
                  >
                    <p className="text-sm font-medium">{status}</p>
                    <p className="text-2xl font-extrabold text-green-600">
                      {
                        Object.values(filteredMachinesByFactory)
                          .flat()
                          .filter((m) => m.status === status).length
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="text-center text-gray-500 py-6 animate-pulse">
              Loading factory-wise machine list...
            </div>
          ) : Object.keys(filteredMachinesByFactory).length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              No machines found 🚫
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(filteredMachinesByFactory)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([factoryKey, factoryMachines]) => {
                  const [factoryName, factoryLocation] =
                    factoryKey.split(" | ");

                  // ✅ Sort by machineNumber BEFORE pagination
                  const sortedMachines = [...factoryMachines].sort((a, b) =>
                    a.machineNumber.localeCompare(b.machineNumber, undefined, {
                      numeric: true,
                    })
                  );

                  const paginatedMachines = getPaginatedMachines(
                    factoryKey,
                    sortedMachines
                  );
                  const totalPages = getTotalPages(factoryKey, sortedMachines);
                  const currentPage = factoryPages[factoryKey] || 1;
                  const itemsPerPage =
                    itemsPerPageMap[factoryKey] || defaultItemsPerPage;

                  return (
                    <div
                      key={factoryKey}
                      className="overflow-x-auto rounded-xl border border-gray-200"
                    >
                      <h4 className="bg-green-100 text-green-800 font-semibold px-4 py-2 border-b">
                        Factory Name :- {factoryName}{" "}
                        <span className="text-gray-800 font-normal text-lg">
                          ({factoryLocation}) -{" "}
                          <b>
                            {" "}
                            Total machines:-{factoryMachines.length} machines
                          </b>
                          <b>
                            {" "}
                            <br /> {" ("}
                            {
                              factoryMachines.filter(
                                (m) => m.status === "In-House"
                              ).length
                            }{" "}
                            In-House ,{" "}
                          </b>
                          <b>
                            {
                              factoryMachines.filter(
                                (m) => m.status === "Transfer Initiated"
                              ).length
                            }{" "}
                            Transfer Initiated ,
                          </b>
                          <b>
                            {" "}
                            {
                              factoryMachines.filter(
                                (m) => m.status === "Borrowed"
                              ).length
                            }{" "}
                            Borrowed ,{" "}
                          </b>
                          <b>
                            {
                              factoryMachines.filter(
                                (m) => m.status === "Return Initiated"
                              ).length
                            }{" "}
                            Return Initiated ,{" "}
                          </b>
                          <b>
                            {
                              factoryMachines.filter(
                                (m) => m.status === "Maintenance In-Progress"
                              ).length
                            }{" "}
                            Maintenance In-Progress ,{" "}
                          </b>
                          <b>
                            {
                              factoryMachines.filter(
                                (m) => m.status === "Machine Idle In-Progress"
                              ).length
                            }{" "}
                            Machine Idle In-Progress {")"}
                          </b>
                        </span>
                      </h4>

                      <table className="w-full text-sm text-left">
                        <thead className="bg-green-50 text-green-800 uppercase text-xs font-semibold">
                          <tr>
                            <th className="px-4 py-3 border">Machine Code</th>
                            <th className="px-4 py-3 border">
                              Machine Category
                            </th>
                            <th className="px-4 py-3 border">Machine Group</th>
                            <th className="px-4 py-3 border">Machine Status</th>
                            <th className="px-4 py-3 border">Machine Number</th>
                            <th className="px-4 py-3 border">Purchase Date</th>
                            <th className="px-4 py-3 border">Created By</th>
                            <th className="px-4 py-3 border">Created Date</th>
                            {/* <th className="px-4 py-3 border">Updated Date</th> */}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paginatedMachines.map((machine) => (
                            <tr
                              key={machine._id}
                              className="hover:bg-green-50/50 even:bg-gray-50 transition"
                            >
                              <td className="px-4 py-3 font-medium text-gray-800">
                                {highlightMatch(machine.machineCode)}
                              </td>
                              <td className="px-4 py-3">
                                {highlightMatch(machine.machineCategory)}
                              </td>
                              <td className="px-4 py-3">
                                {highlightMatch(machine.machineGroup)}
                              </td>
                              <td className="px-4 py-3">
                                {highlightMatch(machine.status)}
                              </td>
                              <td className="px-4 py-3">
                                {highlightMatch(machine.machineNumber)}
                              </td>
                              <td className="px-4 py-3">
                                {machine.purchaseDate
                                  ? new Date(
                                      machine.purchaseDate
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "—"}
                              </td>
                              <td className="px-4 py-3">
                                {highlightMatch(machine.createdBy?.name || "—")}
                              </td>
                              <td className="px-4 py-3">
                                {new Date(machine.createdAt).toLocaleString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      <div className="flex justify-between items-center mt-3 px-4 py-2 bg-gray-50 rounded-b">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 text-sm">Show:</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) =>
                              setItemsPerPageMap({
                                ...itemsPerPageMap,
                                [factoryKey]: Number(e.target.value),
                              })
                            }
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            {itemsPerPageOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        {totalPages > 1 && (
                          <div className="flex items-center gap-4">
                            <button
                              disabled={currentPage === 1}
                              onClick={() =>
                                setFactoryPages({
                                  ...factoryPages,
                                  [factoryKey]: currentPage - 1,
                                })
                              }
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            >
                              Prev
                            </button>
                            <span className="text-gray-700 text-sm">
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              disabled={currentPage === totalPages}
                              onClick={() =>
                                setFactoryPages({
                                  ...factoryPages,
                                  [factoryKey]: currentPage + 1,
                                })
                              }
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default FactoryMachineList;
