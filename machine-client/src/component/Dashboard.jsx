import { useState, useEffect, useMemo } from "react";
import Navbar from "./Navbar";
import {
  FaIndustry,
  FaCogs,
  FaTools,
  FaClock,
  FaExchangeAlt,
} from "react-icons/fa";

function Dashboard() {
  const [factories, setFactories] = useState([]);
  const [machines, setMachines] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [idles, setIdles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState([]);

  // 🔹 Fetch all dashboard data in parallel
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.error("No auth token found");
        setMessage("❌ User not authenticated.");
        setFactories([]);
        setMachines([]);
        setTransfers([]);
        setMaintenances([]);
        setIdles([]);
        setLoading(false);
        return;
      }

      try {
        const paths = [
          "/api/factories",
          "/api/machines",
          "/api/transfers",
          "/api/maintenances",
          "/api/machineidles",
        ];

        // 🔹 Parallel fetch with token
        const responses = await Promise.all(
          paths.map((path) =>
            fetch(`${process.env.REACT_APP_API_URL}${path}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );

        // 🔹 Check for errors
        responses.forEach((res, i) => {
          if (!res.ok) throw new Error(`Failed to fetch ${paths[i]}`);
        });

        // 🔹 Parse all JSON
        const [fJson, mJson, tJson, mtJson, idleJson] = await Promise.all(
          responses.map((res) => res.json())
        );

        // 🔹 Factories
        setFactories(Array.isArray(fJson) ? fJson : fJson?.factories ?? []);

        // 🔹 Machines (flat list from either machines[] or machinesByFactory{})
        const machinesFlat = mJson.machines
          ? mJson.machines
          : mJson.machinesByFactory
          ? Object.values(mJson.machinesByFactory).flat()
          : [];
        setMachines(machinesFlat);

        // 🔹 Transfers, Maintenances, Idles
        setTransfers(tJson.transfers ?? []);
        setMaintenances(mtJson.maintenances ?? []);
        setIdles(idleJson.idles ?? []);
      } catch (err) {
        console.error("❌ Error loading dashboard:", err);
        setMessage("❌ Failed to load dashboard data.");
        setFactories([]);
        setMachines([]);
        setTransfers([]);
        setMaintenances([]);
        setIdles([]);
      } finally {
        setLoading(false);
        setTimeout(() => setMessage(""), 2000);
      }
    };

    fetchAll();
  }, []);

  // Total counts
  const totals = useMemo(
    () => ({
      factories: factories.length,
      machines: machines.length,
      transfers: transfers.length,
      maintenances: maintenances.length,
      idles: idles.length,
    }),
    [factories, machines, transfers, maintenances, idles]
  );

  // Recent transfers
  const recentTransfers = useMemo(
    () =>
      [...transfers]
        .filter((t) => t.transferDate)
        .sort((a, b) => new Date(b.transferDate) - new Date(a.transferDate))
        .slice(0, 5),
    [transfers]
  );

  // Modal control
  const openModal = (title, data) => {
    setModalTitle(title);
    setModalData(data);
    setModalOpen(true);
  };

  return (
    <>
      <Navbar />
      <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold mb-8">📊 Factory Dashboard</h1>

        {message && loading ? (
          <div className="p-6 bg-white shadow rounded">Loading…</div>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
              <StatCard
                icon={<FaIndustry />}
                label="Factories"
                value={totals.factories}
                color="bg-indigo-100 text-indigo-600"
                onClick={() => openModal("All Factories", factories)}
              />
              <StatCard
                icon={<FaCogs />}
                label="Machines"
                value={totals.machines}
                color="bg-green-100 text-green-600"
                onClick={() => openModal("All Machines", machines)}
              />
              <StatCard
                icon={<FaExchangeAlt />}
                label="Transfers"
                value={totals.transfers}
                color="bg-pink-100 text-pink-600"
                onClick={() => openModal("All Transfers", transfers)}
              />
              <StatCard
                icon={<FaTools />}
                label="Maintenances"
                value={totals.maintenances}
                color="bg-yellow-100 text-yellow-600"
                onClick={() => openModal("All Maintenances", maintenances)}
              />
              <StatCard
                icon={<FaClock />}
                label="Idles"
                value={totals.idles}
                color="bg-red-100 text-red-600"
                onClick={() => openModal("All Idles", idles)}
              />
            </div>

            {/* Recent Transfers */}
            <ChartCard title="Recent Transfers">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3">Machine</th>
                      <th className="p-3">From</th>
                      <th className="p-3">To</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransfers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-4 text-center text-gray-500"
                        >
                          No recent transfers
                        </td>
                      </tr>
                    ) : (
                      recentTransfers.map((t, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3">
                            {t.machineId?.machineCode || "—"}
                          </td>
                          <td className="p-3">
                            {t.fromFactory?.factoryName || "—"}
                          </td>
                          <td className="p-3">
                            {t.toFactory?.factoryName || "—"}
                          </td>
                          <td className="p-3">
                            {new Date(t.transferDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </ChartCard>

            {/* Modal */}
            {modalOpen && (
              <Modal
                title={modalTitle}
                data={modalData}
                onClose={() => setModalOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

// --- Components ---
function StatCard({ icon, label, value, color, onClick }) {
  return (
    <div
      className={`flex items-center p-6 rounded-2xl shadow cursor-pointer transform hover:scale-105 transition ${color}`}
      onClick={onClick}
    >
      <div className="text-3xl mr-4">{icon}</div>
      <div>
        <p className="text-gray-500">{label}</p>
        <h2 className="text-2xl font-bold">{value}</h2>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white shadow rounded-2xl p-6 mb-10">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Modal({ title, data, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-11/12 max-w-4xl shadow-2xl overflow-y-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-100">
              {data[0] &&
                Object.keys(data[0]).map((key) => (
                  <th
                    key={key}
                    className="p-2 text-left text-sm font-semibold text-gray-700"
                  >
                    {key}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-3 text-center text-gray-500">
                  No data
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {Object.values(item).map((val, i) => (
                    <td key={i} className="p-2 text-gray-700">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
