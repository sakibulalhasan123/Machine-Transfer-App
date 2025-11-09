import { useState, useEffect } from "react";
import Select from "react-select";
import Navbar from "./Navbar";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
// adjust path if in different folder

const customStyles = {
  control: (provided) => ({
    ...provided,
    borderRadius: "0.5rem",
    borderColor: "#d1d5db",
    padding: "2px",
    boxShadow: "none",
    minHeight: "42px",
    "&:hover": { borderColor: "#6366f1" },
  }),

  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#eef2ff" : "white",
    color: state.isFocused ? "#4338ca" : "black",
    padding: "8px 12px",
  }),

  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
  }),

  // ✅ dropdown যেন body-এর উপর দেখায় (clipping fix)
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),

  menu: (base) => ({
    ...base,
    zIndex: 9999,
    maxHeight: "350px",
  }),

  menuList: (base) => ({
    ...base,
    maxHeight: "350px",
    overflowY: "auto",
  }),
};

function MachineHistoryPage() {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All Machines");
  const [machines, setMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columns = [
    { label: "Machine Code", key: "machineCode" },
    { label: "Category", key: "machineCategory" },
    { label: "Current Status", key: "currentStatus" },
    { label: "Purchase Date", key: "purchaseDate" },
    { label: "Creation/Transfer/Return Date", key: "lastDate" },
    { label: "Transfer ID", key: "transferId" },
    { label: "Remarks", key: "remarks" },
  ];
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    transferIn: 0,
    transferOut: 0,
    returnInProgress: 0,
  });

  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const token = localStorage.getItem("authToken"); // JWT token

        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/factories`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // send token
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch factories");

        const data = await res.json();
        // backend থেকে filtered factories আসবে based on user permissions
        setFactories(Array.isArray(data) ? data : data.factories || []);
      } catch (err) {
        console.error("❌ Error loading factories:", err);
      }
    };

    fetchFactories();
  }, []);

  useEffect(() => {
    const fetchMachineHistory = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken"); // JWT token
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/transfers/machine/history`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // send token
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch machine history");

        const data = await res.json();
        const machinesWithIds = (data.machines || []).map((machine) => ({
          ...machine,
          history: machine.history.map((h) => ({
            ...h,
            transferId: h.transferId || "-",
          })),
        }));
        setMachines(machinesWithIds);
      } catch (err) {
        console.error("❌ Error loading machine history:", err);
        setMessage(`❌ Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMachineHistory();
  }, []);

  // Filter machines by factory and status
  useEffect(() => {
    if (!selectedFactory) {
      setFilteredMachines([]);
      setStats({
        total: 0,
        inHouse: 0,
        transferInitiated: 0,
        transferInProgress: 0,
        transferIn: 0,
        transferOut: 0,
        returnInitiated: 0,
        returnDispatched: 0,
        returnInProgress: 0,
      });
      return;
    }
    const factoryName = selectedFactory.label.split(" (")[0];

    const filtered = machines
      .map((machine) => {
        const histories = machine.history.filter(
          (h) => h.factory === factoryName
        );
        if (!histories.length) return null;

        const lastHistory = histories.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )[0];

        // Status filter logic
        if (statusFilter === "All Machines") {
          if (
            ![
              "In-House",
              "Transfer Initiated",
              "Transferred",
              "Return In-Progress",
            ].includes(lastHistory.status)
          )
            return null;
        } else if (statusFilter === "Available Machines") {
          if (!["In-House", "Borrowed"].includes(lastHistory.status))
            return null;
        } else if (statusFilter === "Transfer Initiated") {
          if (lastHistory.status !== "Transfer Initiated") return null;
        } else if (statusFilter === "Transfer In-Progress") {
          if (lastHistory.status !== "Transfer In-Progress") return null;
        } else if (statusFilter === "Transfer In (Borrowed)") {
          if (lastHistory.status !== "Borrowed") return null;
        } else if (statusFilter === "Transfer Out (Transferred)") {
          if (lastHistory.status !== "Transferred") return null;
        } else if (statusFilter === "Return Initiated") {
          if (lastHistory.status !== "Return Initiated") return null;
        } else if (statusFilter === "Return In-Progress") {
          if (lastHistory.status !== "Return In-Progress") return null;
        } else if (statusFilter === "Returned Dispatched") {
          if (lastHistory.status !== "In Return Transit") return null;
        } else if (lastHistory.status !== statusFilter) return null;

        return {
          ...machine,
          currentStatus: lastHistory.status,
          lastHistory,
          transferId: lastHistory.transferId,
          lastDate: lastHistory.date,
          remarks: lastHistory.remarks || "-",
        };
      })
      .filter(Boolean);

    setFilteredMachines(filtered);

    setStats({
      total: filtered.length,
      inHouse: filtered.filter((m) => ["In-House"].includes(m.currentStatus))
        .length,
      transferInitiated: filtered.filter((m) =>
        ["Transfer Initiated"].includes(m.currentStatus)
      ).length,
      transferInProgress: filtered.filter(
        (m) => m.currentStatus === "Transfer In-Progress"
      ).length,
      transferIn: filtered.filter((m) => m.currentStatus === "Borrowed").length,
      transferOut: filtered.filter((m) =>
        ["Transferred"].includes(m.currentStatus)
      ).length,
      returnInProgress: filtered.filter(
        (m) => m.currentStatus === "Return In-Progress"
      ).length,
      returnInitiated: filtered.filter(
        (m) => m.currentStatus === "Return Initiated"
      ).length,
      returnDispatched: filtered.filter(
        (m) => m.currentStatus === "In Return Transit"
      ).length,
    });
  }, [selectedFactory, statusFilter, machines]);

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      // toggle between asc -> desc -> null
      const nextDirection =
        sortConfig.direction === "asc"
          ? "desc"
          : sortConfig.direction === "desc"
          ? null
          : "asc";
      setSortConfig({
        key: nextDirection ? key : null,
        direction: nextDirection,
      });
    } else {
      // new column clicked, start with ascending
      setSortConfig({ key, direction: "asc" });
    }
  };

  const displayedMachines = [...filteredMachines];
  if (sortConfig.key && sortConfig.direction) {
    displayedMachines.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "lastDate" || sortConfig.key === "purchaseDate") {
        valA = valA ? new Date(valA) : new Date(0);
        valB = valB ? new Date(valB) : new Date(0);
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }
  const totalPages =
    rowsPerPage === "All"
      ? 1
      : Math.ceil(displayedMachines.length / rowsPerPage);

  const paginatedRows =
    rowsPerPage === "All"
      ? displayedMachines
      : displayedMachines.slice(
          (currentPage - 1) * rowsPerPage,
          currentPage * rowsPerPage
        );

  // Transfer modal
  const handleTransferClick = (machine, factoryName, transferId) => {
    if (!transferId || transferId === "-") return;
    const entries = machine.history.filter((h) => h.transferId === transferId);
    const entryForFactory =
      entries.find((e) => e.factory === factoryName) || entries[0];
    setSelectedTransfer([entryForFactory, ...entries]);
    setIsModalOpen(true);
  };

  // Machine modal
  const handleMachineClick = (machine) => {
    setSelectedMachine(machine);
  };

  const closeModal = () => {
    setSelectedTransfer(null);
    setSelectedMachine(null);
    setIsModalOpen(false);
  };
  const resetFilters = () => {
    setSelectedFactory(null);
    setStatusFilter("All Machines");
    setSortConfig({ key: null, direction: null }); // ✅ sorting reset
  };
  const StatCard = ({ title, value, color }) => (
    <div className="flex flex-col px-2 py-2 rounded-xl shadow-md border bg-white w-full">
      <p className="text-sm font-medium text-gray-500 px-2">{title}</p>
      <h2 className={`text-2xl px-2 font-bold mt-1 ${color}`}>{value}</h2>
    </div>
  );
  const getRowColor = (status) => {
    switch (status) {
      case "In-House":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";

      case "Transfer Initiated":
        return "bg-indigo-300 text-indigo-700 hover:bg-indigo-400";

      case "Transfer In-Progress":
        return "bg-amber-300 text-amber-700 hover:bg-amber-400";

      case "Borrowed":
        return "bg-cyan-300 text-cyan-700 hover:bg-cyan-400";

      case "Transferred":
        return "bg-violet-300 text-violet-700 hover:bg-violet-400";

      case "Return Initiated":
        return "bg-rose-300 text-rose-700 hover:bg-rose-400";

      case "Return In-Progress":
        return "bg-red-300 text-red-700 hover:bg-red-400";

      case "In Return Transit":
        return "bg-orange-300 text-orange-700 hover:bg-orange-400";

      default:
        return "bg-slate-100 text-slate-600 hover:bg-slate-200";
    }
  };
  return (
    <>
      <Navbar />
      <div className="mt-10 w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            🧰 Machine History Report
          </h2>
          {/* ✅ Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <StatCard
              title="🔷 Total Machines"
              value={stats.total}
              color="text-slate-700"
            />

            <StatCard
              title="🟢 In-House"
              value={stats.inHouse}
              color="text-emerald-600"
            />

            <StatCard
              title="🔵 Transfer Initiated"
              value={stats.transferInitiated}
              color="text-indigo-600"
            />

            <StatCard
              title="🟡 Transfer In Progress"
              value={stats.transferInProgress}
              color="text-amber-600"
            />

            <StatCard
              title="🟣 Transfer In"
              value={stats.transferIn}
              color="text-cyan-600"
            />

            <StatCard
              title="🟤 Transfer Out"
              value={stats.transferOut}
              color="text-violet-600"
            />

            <StatCard
              title="📥 Return Initiated"
              value={stats.returnInitiated}
              color="text-rose-600"
            />

            <StatCard
              title="🔄 Return In-Progress"
              value={stats.returnInProgress}
              color="text-red-600"
            />

            <StatCard
              title="🚚 Return Dispatched"
              value={stats.returnDispatched}
              color="text-orange-600"
            />
          </div>

          {message && (
            <div className="mb-6 p-4 rounded-md text-sm bg-red-50 border border-red-300 text-red-700 shadow-sm">
              {message}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2 mt-3">
                Select Factory :
              </label>

              <Select
                options={factories.map((f) => ({
                  value: f._id,
                  label: `${f.factoryName} (${f.factoryLocation})`,
                }))}
                value={selectedFactory}
                onChange={setSelectedFactory}
                placeholder="Select a factory..."
                isClearable
                styles={customStyles}
                menuPortalTarget={document.body} // ✅ prevents clipping
                menuPosition="fixed"
                menuPlacement="top" // ✅ same here
                menuShouldScrollIntoView={true}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 mt-3">
                Status Filter :
              </label>
              <Select
                options={[
                  { value: "All Machines", label: "All Machines" },
                  { value: "Available Machines", label: "Available Machines" },
                  { value: "In-House", label: "In-House" },
                  {
                    value: "Transfer Initiated",
                    label: "Transfer Initiated (Machine Transfer Started)",
                  },
                  {
                    value: "Transfer In-Progress",
                    label: "Transfer In-Progress (Machine Waiting For Receive)",
                  },
                  {
                    value: "Transfer Out (Transferred)",
                    label: "Transfer Out (Transferred)",
                  },
                  {
                    value: "Transfer In (Borrowed)",
                    label: "Transfer In (Borrowed)",
                  },
                  {
                    value: "Return Initiated",
                    label: "Return Initiated",
                  },
                  {
                    value: "Return In-Progress",
                    label: "Return In-Progress",
                  },
                  {
                    value: "Returned Dispatched",
                    label: "Returned Dispatched",
                  },
                ]}
                value={{ value: statusFilter, label: statusFilter }}
                onChange={(option) => setStatusFilter(option.value)}
                placeholder="Select status..."
                styles={customStyles}
                menuPortalTarget={document.body} // ✅ prevents clipping
                menuPosition="fixed"
                menuShouldScrollIntoView={true}
              />
            </div>
            <div className="block text-gray-700 font-medium mt-12">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition"
                onClick={resetFilters}
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold tracking-wide">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="px-3 py-3 border text-center text-sm   uppercase tracking-wider cursor-pointer select-none"
                          onClick={() => handleSort(col.key)}
                        >
                          <div className="flex items-center justify-center">
                            {col.label}
                            <span className="ml-1 text-gray-600">
                              {sortConfig.key === col.key
                                ? sortConfig.direction === "asc"
                                  ? "▲"
                                  : sortConfig.direction === "desc"
                                  ? "▼"
                                  : "▲▼"
                                : "▲▼"}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedRows.map((m) => (
                      <tr
                        key={m._id}
                        className={`${getRowColor(
                          m.currentStatus
                        )} transition-colors duration-200`}
                      >
                        <td
                          className="px-6 py-4 text-sm text-blue-700 cursor-pointer hover:underline"
                          onClick={() => handleMachineClick(m)}
                        >
                          {m.machineCode}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-700">
                          {m.machineCategory}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-700">
                          {m.currentStatus}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-500">
                          {m.purchaseDate
                            ? new Date(m.purchaseDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short", // ✅ e.g. Oct, Nov, Dec
                                  year: "numeric",
                                }
                              )
                            : "-"}
                        </td>

                        <td className="px-2 py-2 text-sm text-gray-500">
                          {m.lastDate
                            ? new Date(m.lastDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short", // ✅ short month name like "Oct"
                                year: "numeric",
                              })
                            : "-"}
                        </td>

                        <td
                          className="px-2 py-2 text-sm font-medium text-indigo-600 cursor-pointer hover:underline"
                          onClick={() => {
                            if (!selectedFactory) return; // ✅ Prevent error when cleared
                            handleTransferClick(
                              m,
                              selectedFactory.label.split(" (")[0],
                              m.transferId
                            );
                          }}
                        >
                          {m.transferId || "-"}
                        </td>

                        <td className="px-2 py-2 text-sm text-gray-700">
                          {m.remarks}
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

        {/* Machine Modal */}
        {selectedMachine && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-slide-in">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-lg"
                onClick={() => setSelectedMachine(null)}
              >
                ✖
              </button>
              <h3 className="text-2xl font-bold mb-3 text-gray-800 text-center">
                Machine Details
              </h3>
              <div className="space-y-3 text-gray-700 text-sm">
                <p>
                  <strong>Machine Code: </strong>
                  {selectedMachine.machineCode}
                </p>
                <p>
                  <strong>Machine Category: </strong>
                  {selectedMachine.machineCategory}
                </p>
                <p>
                  <strong>Machine Group:</strong> {selectedMachine.machineGroup}
                </p>
                <p>
                  <strong>Origin Factory:</strong>{" "}
                  {selectedMachine.originFactory.factoryName} (
                  {selectedMachine.originFactory.factoryLocation})
                </p>
                <p>
                  <strong>Current Factory:</strong>{" "}
                  {selectedMachine.factoryId.factoryName} (
                  {selectedMachine.factoryId.factoryLocation})
                </p>
                <p>
                  <strong>Machine Number:</strong>{" "}
                  {selectedMachine.machineNumber}
                </p>
                <p>
                  <strong>Machine Created By:</strong>{" "}
                  {selectedMachine.createdBy?.name}
                </p>
                <p>
                  <strong>Machine Created Date:</strong>{" "}
                  {selectedMachine.createdAt
                    ? new Date(selectedMachine.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {isModalOpen && selectedTransfer?.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-slide-in">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-lg"
                onClick={closeModal}
              >
                ✖
              </button>

              <h3 className="text-2xl font-bold mb-3 text-gray-800 text-center">
                Transfer/Return Details
              </h3>

              <div className="space-y-3 text-gray-700 text-sm">
                <p>
                  <strong>Type:</strong> {selectedTransfer[0].type}
                </p>
                <p>
                  <strong>Transfer Id :</strong>{" "}
                  {selectedTransfer[0].transferId}
                </p>

                {selectedTransfer[0].type.includes("Transfer") && (
                  <>
                    <p>
                      <strong>From Factory:</strong>{" "}
                      {selectedTransfer.find((e) =>
                        ["Transfer Initiated", "Transfer Out"].includes(e.type)
                      )?.factory || "-"}
                    </p>
                    <p>
                      <strong>To Factory:</strong>{" "}
                      {selectedTransfer.find((e) =>
                        ["Transfer In-Progress", "Transfer In"].includes(e.type)
                      )?.factory || "-"}
                    </p>
                  </>
                )}

                {selectedTransfer[0].type.includes("Return") && (
                  <>
                    <p>
                      <strong>From Factory:</strong>{" "}
                      {selectedTransfer.find((e) =>
                        ["Return Initiated", "Return Dispatched"].includes(
                          e.type
                        )
                      )?.factory || "-"}
                    </p>
                    <p>
                      <strong>To Factory:</strong>{" "}
                      {selectedTransfer.find((e) =>
                        ["Return In-Progress", "Return Received"].includes(
                          e.type
                        )
                      )?.factory || "-"}
                    </p>
                  </>
                )}

                <p>
                  <strong>Status:</strong> {selectedTransfer[0].status}
                </p>
                <p>
                  <strong>Remarks:</strong> {selectedTransfer[0].remarks}
                </p>
                <p>
                  <strong>Transfer/Return Initiation Date:</strong>{" "}
                  {selectedTransfer[0].date
                    ? new Date(selectedTransfer[0].date).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short", // e.g. Oct
                          year: "numeric",
                        }
                      )
                    : "-"}
                </p>
                <p>
                  <strong>Transfer/Return Received Date:</strong>{" "}
                  {selectedTransfer[0].approvedDate
                    ? new Date(
                        selectedTransfer[0].approvedDate
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short", // e.g. Oct
                        year: "numeric",
                      })
                    : "-"}
                </p>

                <p>
                  <strong>Transferred/Returned By:</strong>{" "}
                  {selectedTransfer[0].transferedBy}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MachineHistoryPage;
