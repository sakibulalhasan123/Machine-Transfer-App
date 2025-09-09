import { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import Navbar from "./Navbar";

function AllHistoryReport() {
  const [allMachines, setAllMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);

  // Filters
  const [selectedFactories, setSelectedFactories] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [selectedFromFactories, setSelectedFromFactories] = useState([]);
  const [selectedToFactories, setSelectedToFactories] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [reportRows, setReportRows] = useState([]);

  // Fetch machines & transfers
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/transfer/transfer-history`
        );
        const data = await res.json();
        setAllMachines(Array.isArray(data) ? data : data.machines || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMachines();
  }, []);

  // Filter machines based on selectedFactories
  useEffect(() => {
    if (selectedFactories.length === 0) {
      setFilteredMachines([]);
      setSelectedMachines([]);
      return;
    }

    const filtered = allMachines.filter((m) =>
      selectedFactories.some((f) => f.value === m.factoryId?._id)
    );
    setFilteredMachines(filtered);

    // Reset selected machines not in new filtered list
    setSelectedMachines((prev) =>
      prev.filter((mId) => filtered.some((m) => m._id === mId.value))
    );
  }, [selectedFactories, allMachines]);

  // Flatten and filter transfers
  const getFilteredTransfers = () => {
    const rows = filteredMachines.flatMap((m) => {
      const transfers = Array.isArray(m.transfers) ? m.transfers : [];
      return transfers.map((t, idx) => ({
        id: `${m._id}-${idx}`,
        machineCode: m.machineCode,
        category: m.machineCategory,
        group: m.machineGroup,
        fromFactory: t.fromFactory,
        toFactory: t.toFactory,
        transferDate: t.transferDate,
        transferredBy: t.transferedBy || null,
      }));
    });

    return rows.filter((r) => {
      const matchMachine =
        selectedMachines.length === 0 ||
        selectedMachines.some((m) => m.value === r.id.split("-")[0]);
      const matchFrom =
        selectedFromFactories.length === 0 ||
        selectedFromFactories.some((f) => f.value === r.fromFactory?._id);
      const matchTo =
        selectedToFactories.length === 0 ||
        selectedToFactories.some((f) => f.value === r.toFactory?._id);
      const matchUser =
        selectedUsers.length === 0 ||
        (r.transferredBy &&
          selectedUsers.some((u) => u.value === r.transferredBy._id));
      return matchMachine && matchFrom && matchTo && matchUser;
    });
  };

  const handleSearch = () => {
    setReportRows(getFilteredTransfers());
    setShowReport(true);
  };

  const handleReset = () => {
    setSelectedFactories([]);
    setSelectedMachines([]);
    setSelectedFromFactories([]);
    setSelectedToFactories([]);
    setSelectedUsers([]);
    setReportRows([]);
    setShowReport(false);
  };

  // Derived options
  const factoryOptions = useMemo(
    () =>
      Array.from(
        new Map(
          allMachines
            .map((m) => m.factoryId)
            .filter((f) => f)
            .map((f) => [f._id, { value: f._id, label: f.factoryName }])
        ).values()
      ),
    [allMachines]
  );

  const machineOptions = useMemo(
    () => filteredMachines.map((m) => ({ value: m._id, label: m.machineCode })),
    [filteredMachines]
  );

  const fromFactoryOptions = useMemo(() => {
    const relevantMachines =
      selectedMachines.length > 0
        ? filteredMachines.filter((m) =>
            selectedMachines.some((sel) => sel.value === m._id)
          )
        : filteredMachines;

    const allFrom = relevantMachines.flatMap((m) =>
      m.transfers.map((t) => t.fromFactory).filter((f) => f)
    );

    return Array.from(
      new Map(
        allFrom.map((f) => [f._id, { value: f._id, label: f.factoryName }])
      ).values()
    );
  }, [filteredMachines, selectedMachines]);

  const toFactoryOptions = useMemo(() => {
    const relevantMachines =
      selectedMachines.length > 0
        ? filteredMachines.filter((m) =>
            selectedMachines.some((sel) => sel.value === m._id)
          )
        : filteredMachines;

    const allTo = relevantMachines.flatMap((m) =>
      m.transfers.map((t) => t.toFactory).filter((f) => f)
    );

    return Array.from(
      new Map(
        allTo.map((f) => [f._id, { value: f._id, label: f.factoryName }])
      ).values()
    );
  }, [filteredMachines, selectedMachines]);

  const userOptions = useMemo(() => {
    const relevantMachines =
      selectedMachines.length > 0
        ? filteredMachines.filter((m) =>
            selectedMachines.some((sel) => sel.value === m._id)
          )
        : filteredMachines;

    const allUsers = relevantMachines.flatMap((m) =>
      m.transfers.map((t) => t.transferedBy).filter((u) => u)
    );

    return Array.from(
      new Map(
        allUsers.map((u) => [u._id, { value: u._id, label: u.name }])
      ).values()
    ); // ✅ always array of {value,label}
  }, [filteredMachines, selectedMachines]);

  return (
    <>
      <Navbar />
      <div className="mt-10 w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            📋 All History Report
          </h3>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            <Select
              isMulti
              options={factoryOptions}
              value={selectedFactories}
              onChange={setSelectedFactories}
              placeholder="Select Factory"
            />
            <Select
              isMulti
              options={machineOptions}
              value={selectedMachines}
              onChange={setSelectedMachines}
              placeholder="Select Machine"
            />
            <Select
              isMulti
              options={fromFactoryOptions}
              value={selectedFromFactories}
              onChange={setSelectedFromFactories}
              placeholder="From Factory"
            />
            <Select
              isMulti
              options={toFactoryOptions}
              value={selectedToFactories}
              onChange={setSelectedToFactories}
              placeholder="To Factory"
            />
            <Select
              isMulti
              options={userOptions || []} // ✅ prevent crash options={userOptions}
              value={selectedUsers}
              onChange={setSelectedUsers}
              placeholder="Transferred By"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow hover:bg-gray-600 transition"
            >
              Reset
            </button>
          </div>

          {/* Report Table */}
          {showReport ? (
            reportRows.length === 0 ? (
              <div className="text-gray-500 py-6 text-center font-medium">
                No records found for selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold tracking-wide">
                    <tr>
                      <th className="px-4 py-3 border">Machine Code</th>
                      <th className="px-4 py-3 border">Category</th>
                      <th className="px-4 py-3 border">Group</th>
                      <th className="px-4 py-3 border">From Factory</th>
                      <th className="px-4 py-3 border">To Factory</th>
                      <th className="px-4 py-3 border">Transfer Date</th>
                      <th className="px-4 py-3 border">Transferred By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-blue-50/50 even:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {row.machineCode}
                        </td>
                        <td className="px-4 py-3">{row.category}</td>
                        <td className="px-4 py-3">{row.group}</td>
                        <td className="px-4 py-3">
                          {row.fromFactory?.factoryName || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {row.toFactory?.factoryName || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {row.transferDate
                            ? new Date(row.transferDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {row.transferredBy?.name || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-gray-500 py-6 text-center">
              Select filters and click Search to view report
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AllHistoryReport;
