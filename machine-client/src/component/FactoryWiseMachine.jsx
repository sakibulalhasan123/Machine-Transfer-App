import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Navbar from "./Navbar";

function FactoryMachineList() {
  const [machinesByFactory, setMachinesByFactory] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ✅ Fetch machines grouped by factory
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/machines`
        );
        const data = await res.json();

        // data.machinesByFactory comes from backend
        setMachinesByFactory(data.machinesByFactory || {});
      } catch (err) {
        console.error("❌ Error fetching machines:", err);
        setMachinesByFactory({});
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  // ✅ Search filter
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);

    if (!value) return; // reset when search is empty

    const filtered = {};

    Object.entries(machinesByFactory).forEach(([factoryKey, machines]) => {
      const matched = machines.filter((m) => {
        const code = m.machineCode?.toLowerCase() || "";
        const category = m.machineCategory?.toLowerCase() || "";
        const group = m.machineGroup?.toLowerCase() || "";
        const factoryName =
          m.factoryId?.factoryName?.toLowerCase() ||
          m.factoryId?.name?.toLowerCase() ||
          "";
        const factoryLocation =
          m.factoryId?.factoryLocation?.toLowerCase() ||
          m.factoryId?.location?.toLowerCase() ||
          "";

        return (
          code.includes(value) ||
          category.includes(value) ||
          group.includes(value) ||
          factoryName.includes(value) ||
          factoryLocation.includes(value)
        );
      });

      if (matched.length > 0) filtered[factoryKey] = matched;
    });

    setMachinesByFactory(filtered);
  };

  // ✅ Export Excel
  const handleExportExcel = () => {
    const rows = [];
    Object.entries(machinesByFactory).forEach(
      ([factoryKey, factoryMachines]) => {
        const [factoryName, factoryLocation] = factoryKey.split(" | ");
        factoryMachines.forEach((machine) => {
          rows.push({
            FactoryName: factoryName,
            FactoryLocation: factoryLocation,
            MachineCode: machine.machineCode,
            Category: machine.machineCategory,
            Group: machine.machineGroup,
            CreatedDate: new Date(machine.createdAt).toLocaleString(),
            UpdatedDate: new Date(machine.updatedAt).toLocaleString(),
          });
        });
      }
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Factory Machines");
    XLSX.writeFile(workbook, "FactoryMachineList.xlsx");
  };

  return (
    <>
      <Navbar />

      <div className="mt-10 w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-2xl font-semibold text-gray-800">
              🏭 Factory-wise Machine List
            </h3>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search by factory or machine..."
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              />
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm rounded-lg shadow hover:from-green-700 hover:to-green-600 transition"
              >
                ⬇ Export Excel
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center text-gray-500 py-6 animate-pulse">
              Loading factory-wise machine list...
            </div>
          ) : Object.keys(machinesByFactory).length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              No machines found 🚫
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(machinesByFactory)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([factoryKey, factoryMachines]) => {
                  const [factoryName, factoryLocation] =
                    factoryKey.split(" | ");
                  return (
                    <div
                      key={factoryKey}
                      className="overflow-x-auto rounded-xl border border-gray-200"
                    >
                      <h4 className="bg-green-100 text-green-800 font-semibold px-4 py-2 border-b">
                        {factoryName}{" "}
                        <span className="text-gray-600 font-normal text-sm">
                          ({factoryLocation})
                        </span>
                      </h4>
                      <table className="w-full text-sm text-left">
                        <thead className="bg-green-50 text-green-800 uppercase text-xs font-semibold">
                          <tr>
                            <th className="px-4 py-3 border">Machine Code</th>
                            <th className="px-4 py-3 border">Category</th>
                            <th className="px-4 py-3 border">Group</th>
                            <th className="px-4 py-3 border">Created Date</th>
                            <th className="px-4 py-3 border">Updated Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {factoryMachines
                            .sort((a, b) =>
                              a.machineCode.localeCompare(b.machineCode)
                            )
                            .map((machine) => (
                              <tr
                                key={machine._id}
                                className="hover:bg-green-50/50 even:bg-gray-50 transition"
                              >
                                <td className="px-4 py-3 font-medium text-gray-800">
                                  {machine.machineCode}
                                </td>
                                <td className="px-4 py-3">
                                  {machine.machineCategory}
                                </td>
                                <td className="px-4 py-3">
                                  {machine.machineGroup}
                                </td>
                                <td className="px-4 py-3">
                                  {new Date(machine.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  {new Date(machine.updatedAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
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
