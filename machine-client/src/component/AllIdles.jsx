import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Select from "react-select";

export default function AllIdles() {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [idles, setIdles] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  const token = localStorage.getItem("authToken");

  // Load factories
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/factories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFactories(data))
      .catch(() =>
        setMessage({ type: "error", text: "❌ Error loading factories" })
      );
  }, [token]);

  // Fetch MachineIdles based on selected filters
  const fetchIdles = async () => {
    try {
      let url = `${process.env.REACT_APP_API_URL}/api/machineIdles?`;
      if (selectedFactory) url += `factoryId=${selectedFactory.value}&`;
      if (statusFilter) url += `status=${statusFilter}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIdles(data.idles || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "❌ Error fetching idle records" });
    }
  };

  useEffect(() => {
    fetchIdles();
  }, [selectedFactory, statusFilter]);

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Machine Idles</h2>

        {message.text && (
          <div
            className={`mb-4 p-2 rounded ${
              message.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <Select
            options={factories.map((f) => ({
              value: f._id,
              label: f.factoryName,
            }))}
            value={selectedFactory}
            onChange={setSelectedFactory}
            placeholder="Filter by factory..."
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">All Status</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Idle ID</th>
              <th className="border p-2">Machine</th>
              <th className="border p-2">Factory</th>
              <th className="border p-2">Reason</th>
              <th className="border p-2">Start Time</th>
              <th className="border p-2">End Time</th>
              <th className="border p-2">Duration (min)</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {idles.map((i) => (
              <tr key={i._id}>
                <td className="border p-2">{i.idleId}</td>
                <td className="border p-2">{i.machineCode}</td>
                <td className="border p-2">{i.factoryName}</td>
                <td className="border p-2">{i.reason}</td>
                <td className="border p-2">
                  {new Date(i.startTime).toLocaleString()}
                </td>
                <td className="border p-2">
                  {i.endTime ? new Date(i.endTime).toLocaleString() : "-"}
                </td>
                <td className="border p-2">{i.durationMinutes}</td>
                <td className="border p-2">{i.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
