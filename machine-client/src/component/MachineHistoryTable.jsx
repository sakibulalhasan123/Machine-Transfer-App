import { useState, useEffect } from "react";
import Select from "react-select";
import Navbar from "./Navbar";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/solid";

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
  placeholder: (provided) => ({ ...provided, color: "#9ca3af" }),
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const columns = [
    { label: "Machine Code", key: "machineCode" },
    { label: "Category", key: "machineCategory" },
    { label: "Current Status", key: "currentStatus" },
    { label: "Purchase Date", key: "purchaseDate" },
    { label: "Creation/Transfer/Return Date", key: "lastDate" },
    { label: "Transfer ID", key: "transferId" },
    { label: "Remarks", key: "remarks" },
  ];

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
        } else if (statusFilter === "Transfer In-progress") {
          if (lastHistory.status !== "Transfer In-progress") return null;
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
  }, [selectedFactory, statusFilter, machines]);

  // Sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const sortedMachines = [...filteredMachines].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (sortConfig.key === "lastDate") {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

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

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-start min-h-screen bg-gray-50 px-6 py-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-6xl border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Machine History Report
          </h2>

          {message && (
            <div className="mb-6 p-4 rounded-md text-sm bg-red-50 border border-red-300 text-red-700 shadow-sm">
              {message}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Select Factory
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
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Status Filter
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
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-gray-500 text-center py-8">
              Loading machines...
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold tracking-wide">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-center text-sm font-bold text-blue-700 uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort(col.key)}
                      >
                        <div className="flex items-center">
                          {col.label}
                          {sortConfig.key === col.key &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUpIcon className="w-4 h-4 ml-1 text-gray-600" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4 ml-1 text-gray-600" />
                            ))}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-blue divide-y divide-gray-200 text-center">
                  {sortedMachines.map((m) => (
                    <tr
                      key={m._id}
                      className="hover:bg-indigo-50 transition-colors duration-150"
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
                                timeZone: "UTC", // ✅ prevents 6-hour shift issues
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
                              timeZone: "UTC", // ✅ timezone-safe
                            })
                          : "-"}
                      </td>

                      <td
                        className="px-2 py-2 text-sm font-medium text-indigo-600 cursor-pointer hover:underline"
                        onClick={() =>
                          handleTransferClick(
                            m,
                            selectedFactory.label.split(" (")[0],
                            m.transferId
                          )
                        }
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
                          timeZone: "UTC", // ✅ ensures consistent date
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
                          timeZone: "UTC", // ensures consistent date
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
                        timeZone: "UTC", // ensures consistent date
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
