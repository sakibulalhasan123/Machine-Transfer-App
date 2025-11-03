import { useState, useEffect } from "react";
import Navbar from "./Navbar";

function SummaryReport() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMachines, setModalMachines] = useState([]);
  const [modalStatus, setModalStatus] = useState("");
  const [modalFactory, setModalFactory] = useState(null);

  const statuses = [
    "In-House",
    "Transfer Initiated",
    "Transfer In-Progress",
    "Transferred",
    "Borrowed",
    "Return Initiated",
    "Return In-Progress",
    "In Return Transit",
  ];

  const statusColors = {
    "In-House": "text-green-600",
    Transferred: "text-blue-600",
    Borrowed: "text-yellow-600",
    "In Return Transit": "text-cyan-600",
    "Transfer Initiated": "text-blue-400",
    "Transfer In-Progress": "text-blue-700",
    "Return Initiated": "text-cyan-400",
    "Return In-Progress": "text-cyan-700",
  };

  useEffect(() => {
    const fetchSummary = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return setSummary([]);

      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/transfers/reports/origin-factory-summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch summary");
        const data = await res.json();
        setSummary(data.summary || []);
      } catch (err) {
        console.error(err);
        setSummary([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const getMachinesByStatus = (factory, status) => {
    if (!factory || !status) return [];
    return factory.machines.filter((m) => m.finalStatus === status);
  };

  const handleCountClick = (factory, status) => {
    setModalMachines(getMachinesByStatus(factory, status));
    setModalStatus(status);
    setModalFactory(factory);
    setModalOpen(true);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="bg-white p-4 rounded-2xl shadow-lg max-w-7xl mx-auto border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2 text-center justify-center">
            📊 Machine Transfer Summary Report
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-auto rounded-lg border border-gray-200 shadow-md max-h-[70vh]">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-indigo-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">
                      Factory Name
                    </th>
                    <th className="px-3 py-2 text-center font-semibold uppercase tracking-wider">
                      Total Machines
                    </th>
                    {statuses.map((status) => (
                      <th
                        key={status}
                        className="px-3 py-2 text-center font-semibold uppercase tracking-wider"
                      >
                        {status}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {summary.length > 0 ? (
                    summary.map((f, i) => (
                      <tr
                        key={f.factoryId}
                        className={`transition-colors ${
                          i % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-indigo-50`}
                      >
                        <td className="px-3 py-2 text-gray-800 font-medium">
                          {f.factoryName}
                          <div className="text-xs text-gray-500">
                            {f.factoryLocation}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-indigo-600 font-semibold">
                          {f.totalCreated || 0}
                        </td>
                        {statuses.map((status) => (
                          <td
                            key={status}
                            className={`px-3 py-2 text-center cursor-pointer font-semibold hover:text-indigo-600 ${
                              statusColors[status] || "text-gray-700"
                            }`}
                            onClick={() => handleCountClick(f, status)}
                          >
                            {f.counts[status] || 0}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={statuses.length + 2}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        No factories found 🚫
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
              <div className="bg-white rounded-2xl p-4 w-full max-w-5xl shadow-2xl relative animate-fadeIn">
                <div className="flex justify-between items-center mb-2 border-b pb-1">
                  <h3 className="text-xl font-bold text-indigo-700">
                    {modalStatus} Machines - {modalFactory?.factoryName}
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-600 transition"
                    onClick={() => setModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-auto max-h-[60vh] border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Machine Code
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Machine Category
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Machine Group
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Purchase Date
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Machine Number
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Origin Factory
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {modalMachines.length > 0 ? (
                        modalMachines.map((m) => (
                          <tr
                            key={m.machineId}
                            className="hover:bg-indigo-50 transition"
                          >
                            <td className="px-3 py-1 text-gray-800 font-medium">
                              {m.machineCode}
                            </td>
                            <td className="px-3 py-1 text-gray-600">
                              {m.machineCategory}
                            </td>
                            <td className="px-3 py-1 text-gray-600">
                              {m.machineGroup}
                            </td>
                            <td className="px-3 py-1 text-gray-600">
                              {m.finalStatus}
                            </td>
                            <td className="px-3 py-1 text-gray-600">
                              {m.purchaseDate
                                ? new Date(m.purchaseDate).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "-"}
                            </td>
                            <td className="px-3 py-1 text-gray-600">
                              {m.machineNumber || "-"}
                            </td>
                            <td className="px-3 py-1 text-gray-600">
                              {m.originFactory?.factoryName}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-3 py-4 text-center text-gray-500"
                          >
                            No machines found 🚫
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SummaryReport;
