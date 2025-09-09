import { useState, useEffect, useMemo } from "react";
import Navbar from "./Navbar";
import { FaIndustry, FaCogs, FaExchangeAlt } from "react-icons/fa";

// --- Normalize Transfers + Count ---
function parseTransfers(payload) {
  let flat = [];
  let total = 0;

  if (Array.isArray(payload)) {
    payload.forEach((m) => {
      const history = Array.isArray(m.transfers) ? m.transfers : [];

      // count raw transfers
      total += history.length;

      // flatten for table
      history.forEach((t, idx) => {
        flat.push({
          id: `${m._id}-${idx}`,
          machineCode: m.machineCode ?? "",
          fromFactory: t.fromFactory?.factoryName ?? "—",
          toFactory: t.toFactory?.factoryName ?? "—",
          date: t.transferDate ?? null,
        });
      });
    });
  } else if (Array.isArray(payload?.machines)) {
    return parseTransfers(payload.machines);
  } else if (Array.isArray(payload?.transfers)) {
    flat = payload.transfers.map((t, idx) => ({
      id: `t-${idx}`,
      machineCode: t.machineCode ?? "",
      fromFactory: t.fromFactory?.factoryName ?? "—",
      toFactory: t.toFactory?.factoryName ?? "—",
      date: t.transferDate ?? null,
    }));
    total = payload.transfers.length;
  }

  return { flat, total };
}

function Dashboard() {
  const [factories, setFactories] = useState([]);
  const [totalMachines, setTotalMachines] = useState(0);
  const [transfersFlat, setTransfersFlat] = useState([]);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        // Fetch factories
        const fRes = await fetch(`${process.env.REACT_APP_API_URL}/factories`);
        const fJson = await fRes.json();
        setFactories(Array.isArray(fJson) ? fJson : fJson?.factories ?? []);

        // Fetch machines grouped by factory
        const mRes = await fetch(`${process.env.REACT_APP_API_URL}/machines`);
        const mJson = await mRes.json();
        const machinesByFactory = mJson.machinesByFactory || {};

        // Total machines count
        const total = Object.values(machinesByFactory).reduce(
          (sum, arr) => sum + arr.length,
          0
        );
        setTotalMachines(total);

        // Fetch transfers
        const tRes = await fetch(
          `${process.env.REACT_APP_API_URL}/transfer/transfer-history`
        );
        const tJson = await tRes.json();
        const { flat, total: tCount } = parseTransfers(tJson);
        setTransfersFlat(flat);
        setTotalTransfers(tCount);
      } catch (e) {
        console.error("Error loading dashboard data:", e);
        setFactories([]);
        setTotalMachines(0);
        setTransfersFlat([]);
        setTotalTransfers(0);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const recentTransfers = useMemo(() => {
    return [...transfersFlat]
      .filter((t) => t?.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [transfersFlat]);

  return (
    <>
      <Navbar />
      <div className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Factory Dashboard
        </h1>

        {loading ? (
          <div className="bg-white border rounded-2xl p-6 shadow text-gray-500">
            Loading dashboard…
          </div>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <StatCard
                icon={<FaIndustry className="text-indigo-600 text-4xl" />}
                label="Total Factories"
                value={factories.length}
              />
              <StatCard
                icon={<FaCogs className="text-green-600 text-4xl" />}
                label="Total Machines"
                value={totalMachines}
              />
              <StatCard
                icon={<FaExchangeAlt className="text-pink-600 text-4xl" />}
                label="Total Transfers"
                value={totalTransfers}
              />
            </div>

            {/* Recent Transfers */}
            <ChartCard title="Recent Transfers">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-100 text-gray-700">
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
                          className="p-4 text-gray-500 text-center"
                        >
                          No recent transfers
                        </td>
                      </tr>
                    ) : (
                      recentTransfers.map((t) => (
                        <tr
                          key={t.id}
                          className="border-b hover:bg-gray-50 transition"
                        >
                          <td className="p-3">{t.machineCode || "—"}</td>
                          <td className="p-3">{t.fromFactory || "—"}</td>
                          <td className="p-3">{t.toFactory || "—"}</td>
                          <td className="p-3">
                            {t.date
                              ? new Date(t.date).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </>
        )}
      </div>
    </>
  );
}

// --- Small UI Components ---
function StatCard({ icon, label, value }) {
  return (
    <div className="shadow-md rounded-2xl p-6 bg-white border flex items-center space-x-5">
      {icon}
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <h2 className="text-3xl font-bold text-gray-900">{value}</h2>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="shadow-md rounded-2xl p-6 bg-white border">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">{title}</h2>
      {children}
    </div>
  );
}

export default Dashboard;
