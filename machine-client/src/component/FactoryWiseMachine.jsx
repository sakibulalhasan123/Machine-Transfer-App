// // import { useState, useEffect, useMemo } from "react";
// // import * as XLSX from "xlsx";
// // import Navbar from "./Navbar";

// // function FactoryMachineList() {
// //   const [machinesByFactory, setMachinesByFactory] = useState({});
// //   const [loading, setLoading] = useState(true);
// //   const [selectedFactory, setSelectedFactory] = useState("");
// //   const [search, setSearch] = useState("");
// //   const [factoryPages, setFactoryPages] = useState({});
// //   const [itemsPerPageMap, setItemsPerPageMap] = useState({}); // per factory items per page

// //   const defaultItemsPerPage = 10;
// //   const itemsPerPageOptions = [5, 10, 20, 50];

// //   // Fetch machines grouped by factory
// //   useEffect(() => {
// //     const fetchMachines = async () => {
// //       try {
// //         const res = await fetch(
// //           `${process.env.REACT_APP_API_URL}/api/machines`
// //         );
// //         const data = await res.json();
// //         setMachinesByFactory(data.machinesByFactory || {});
// //       } catch (err) {
// //         console.error("❌ Error fetching machines:", err);
// //         setMachinesByFactory({});
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchMachines();
// //   }, []);

// //   const factoryOptions = Object.keys(machinesByFactory).map((key) => {
// //     const [factoryName, factoryLocation] = key.split(" | ");
// //     return { key, name: factoryName, location: factoryLocation };
// //   });

// //   // Filtered machines
// //   const filteredMachinesByFactory = useMemo(() => {
// //     let filtered = selectedFactory
// //       ? { [selectedFactory]: machinesByFactory[selectedFactory] || [] }
// //       : machinesByFactory;

// //     if (!search) return filtered;

// //     const searchValue = search.toLowerCase();
// //     const result = {};
// //     Object.entries(filtered).forEach(([factoryKey, machines]) => {
// //       const matched = machines.filter((m) => {
// //         const code = m.machineCode?.toLowerCase() || "";
// //         const category = m.machineCategory?.toLowerCase() || "";
// //         const group = m.machineGroup?.toLowerCase() || "";
// //         return (
// //           code.includes(searchValue) ||
// //           category.includes(searchValue) ||
// //           group.includes(searchValue)
// //         );
// //       });
// //       if (matched.length > 0) result[factoryKey] = matched;
// //     });

// //     return result;
// //   }, [machinesByFactory, selectedFactory, search]);

// //   const handleExportExcel = () => {
// //     const rows = [];
// //     Object.entries(filteredMachinesByFactory).forEach(
// //       ([factoryKey, factoryMachines]) => {
// //         const [factoryName, factoryLocation] = factoryKey.split(" | ");
// //         factoryMachines.forEach((machine) => {
// //           rows.push({
// //             FactoryName: factoryName,
// //             FactoryLocation: factoryLocation,
// //             MachineCode: machine.machineCode,
// //             Category: machine.machineCategory,
// //             Group: machine.machineGroup,
// //             CreatedDate: new Date(machine.createdAt).toLocaleString(),
// //             UpdatedDate: new Date(machine.updatedAt).toLocaleString(),
// //           });
// //         });
// //       }
// //     );

// //     const worksheet = XLSX.utils.json_to_sheet(rows);
// //     const workbook = XLSX.utils.book_new();
// //     XLSX.utils.book_append_sheet(workbook, worksheet, "Factory Machines");
// //     XLSX.writeFile(workbook, "FactoryMachineList.xlsx");
// //   };

// //   const handleResetFilters = () => {
// //     setSelectedFactory("");
// //     setSearch("");
// //     setFactoryPages({});
// //     setItemsPerPageMap({});
// //   };

// //   // Per-factory paginated machines
// //   const getPaginatedMachines = (factoryKey, machines) => {
// //     const itemsPerPage = itemsPerPageMap[factoryKey] || defaultItemsPerPage;
// //     const currentPage = factoryPages[factoryKey] || 1;
// //     const startIndex = (currentPage - 1) * itemsPerPage;
// //     const endIndex = startIndex + itemsPerPage;
// //     return machines.slice(startIndex, endIndex);
// //   };

// //   const getTotalPages = (factoryKey, machines) => {
// //     const itemsPerPage = itemsPerPageMap[factoryKey] || defaultItemsPerPage;
// //     return Math.ceil(machines.length / itemsPerPage);
// //   };

// //   return (
// //     <>
// //       <Navbar />
// //       <div className="mt-10 w-full max-w-7xl mx-auto px-4">
// //         <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
// //           {/* Header */}
// //           <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
// //             <h3 className="text-2xl font-semibold text-gray-800">
// //               🏭 Factory-wise Machine
// //             </h3>
// //             <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
// //               <select
// //                 value={selectedFactory}
// //                 onChange={(e) => setSelectedFactory(e.target.value)}
// //                 className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
// //               >
// //                 <option value="">All Factories</option>
// //                 {factoryOptions.map((f) => (
// //                   <option key={f.key} value={f.key}>
// //                     {f.name} ({f.location})
// //                   </option>
// //                 ))}
// //               </select>

// //               <input
// //                 type="text"
// //                 value={search}
// //                 onChange={(e) => setSearch(e.target.value)}
// //                 placeholder="Search by code, category, or group..."
// //                 className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
// //               />

// //               <button
// //                 onClick={handleExportExcel}
// //                 className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm rounded-lg shadow hover:from-green-700 hover:to-green-600 transition"
// //               >
// //                 ⬇ Export Excel
// //               </button>
// //               <button
// //                 onClick={handleResetFilters}
// //                 className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg shadow hover:bg-gray-600 transition"
// //               >
// //                 🔄 Reset Filters
// //               </button>
// //             </div>
// //           </div>

// //           {/* Content */}
// //           {loading ? (
// //             <div className="text-center text-gray-500 py-6 animate-pulse">
// //               Loading factory-wise machine list...
// //             </div>
// //           ) : Object.keys(filteredMachinesByFactory).length === 0 ? (
// //             <div className="text-center text-gray-500 py-6">
// //               No machines found 🚫
// //             </div>
// //           ) : (
// //             <div className="space-y-8">
// //               {Object.entries(filteredMachinesByFactory)
// //                 .sort(([a], [b]) => a.localeCompare(b))
// //                 .map(([factoryKey, factoryMachines]) => {
// //                   const [factoryName, factoryLocation] =
// //                     factoryKey.split(" | ");
// //                   const paginatedMachines = getPaginatedMachines(
// //                     factoryKey,
// //                     factoryMachines
// //                   );
// //                   const totalPages = getTotalPages(factoryKey, factoryMachines);
// //                   const currentPage = factoryPages[factoryKey] || 1;
// //                   const itemsPerPage =
// //                     itemsPerPageMap[factoryKey] || defaultItemsPerPage;

// //                   return (
// //                     <div
// //                       key={factoryKey}
// //                       className="overflow-x-auto rounded-xl border border-gray-200"
// //                     >
// //                       <h4 className="bg-green-100 text-green-800 font-semibold px-4 py-2 border-b">
// //                         {factoryName}{" "}
// //                         <span className="text-gray-600 font-normal text-sm">
// //                           ({factoryLocation}) -{" "}
// //                           <b>{factoryMachines.length} machines</b>
// //                         </span>
// //                       </h4>

// //                       {/* Items per page */}
// //                       <div className="flex justify-end items-center gap-2 px-4 py-2">
// //                         <span className="text-gray-700 text-sm">Show:</span>
// //                         <select
// //                           value={itemsPerPage}
// //                           onChange={(e) =>
// //                             setItemsPerPageMap({
// //                               ...itemsPerPageMap,
// //                               [factoryKey]: Number(e.target.value),
// //                             })
// //                           }
// //                           className="px-2 py-1 border border-gray-300 rounded"
// //                         >
// //                           {itemsPerPageOptions.map((opt) => (
// //                             <option key={opt} value={opt}>
// //                               {opt}
// //                             </option>
// //                           ))}
// //                         </select>
// //                       </div>

// //                       <table className="w-full text-sm text-left">
// //                         <thead className="bg-green-50 text-green-800 uppercase text-xs font-semibold">
// //                           <tr>
// //                             <th className="px-4 py-3 border">Machine Code</th>
// //                             <th className="px-4 py-3 border">Category</th>
// //                             <th className="px-4 py-3 border">Group</th>
// //                             <th className="px-4 py-3 border">Created Date</th>
// //                             <th className="px-4 py-3 border">Updated Date</th>
// //                           </tr>
// //                         </thead>
// //                         <tbody className="divide-y divide-gray-100">
// //                           {paginatedMachines
// //                             .sort((a, b) =>
// //                               a.machineCode.localeCompare(b.machineCode)
// //                             )
// //                             .map((machine) => (
// //                               <tr
// //                                 key={machine._id}
// //                                 className="hover:bg-green-50/50 even:bg-gray-50 transition"
// //                               >
// //                                 <td className="px-4 py-3 font-medium text-gray-800">
// //                                   {machine.machineCode}
// //                                 </td>
// //                                 <td className="px-4 py-3">
// //                                   {machine.machineCategory}
// //                                 </td>
// //                                 <td className="px-4 py-3">
// //                                   {machine.machineGroup}
// //                                 </td>
// //                                 <td className="px-4 py-3">
// //                                   {new Date(machine.createdAt).toLocaleString()}
// //                                 </td>
// //                                 <td className="px-4 py-3">
// //                                   {new Date(machine.updatedAt).toLocaleString()}
// //                                 </td>
// //                               </tr>
// //                             ))}
// //                         </tbody>
// //                       </table>

// //                       {/* Prev - Page X of Y - Next */}
// //                       {totalPages > 1 && (
// //                         <div className="flex justify-center items-center gap-4 mt-3 px-4 py-2 bg-gray-50 rounded-b">
// //                           <button
// //                             disabled={currentPage === 1}
// //                             onClick={() =>
// //                               setFactoryPages({
// //                                 ...factoryPages,
// //                                 [factoryKey]: currentPage - 1,
// //                               })
// //                             }
// //                             className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
// //                           >
// //                             Prev
// //                           </button>
// //                           <span className="text-gray-700 text-sm">
// //                             Page {currentPage} of {totalPages}
// //                           </span>
// //                           <button
// //                             disabled={currentPage === totalPages}
// //                             onClick={() =>
// //                               setFactoryPages({
// //                                 ...factoryPages,
// //                                 [factoryKey]: currentPage + 1,
// //                               })
// //                             }
// //                             className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
// //                           >
// //                             Next
// //                           </button>
// //                         </div>
// //                       )}
// //                     </div>
// //                   );
// //                 })}
// //             </div>
// //           )}
// //         </div>
// //       </div>
// //     </>
// //   );
// // }

// // export default FactoryMachineList;

// import { useState, useEffect, useMemo } from "react";
// import * as XLSX from "xlsx";
// import Navbar from "./Navbar";

// function FactoryMachineList() {
//   const [machinesByFactory, setMachinesByFactory] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [selectedFactory, setSelectedFactory] = useState(""); // "" = Select Factory
//   const [search, setSearch] = useState("");
//   const [factoryPages, setFactoryPages] = useState({});
//   const [itemsPerPageMap, setItemsPerPageMap] = useState({});

//   const defaultItemsPerPage = 10;
//   const itemsPerPageOptions = [5, 10, 20, 50];

//   // Fetch machines grouped by factory
//   useEffect(() => {
//     const fetchMachines = async () => {
//       try {
//         const res = await fetch(
//           `${process.env.REACT_APP_API_URL}/api/machines`
//         );
//         const data = await res.json();
//         setMachinesByFactory(data.machinesByFactory || {});
//       } catch (err) {
//         console.error("❌ Error fetching machines:", err);
//         setMachinesByFactory({});
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchMachines();
//   }, []);

//   // Dropdown options
//   const factoryOptions = Object.keys(machinesByFactory).map((key) => {
//     const [factoryName, factoryLocation] = key.split(" | ");
//     return { key, name: factoryName, location: factoryLocation };
//   });

//   // // Filtered machines
//   // const filteredMachinesByFactory = useMemo(() => {
//   //   // Handle "Select Factory" (""), "All Factories" ("all"), and specific factory
//   //   if (!selectedFactory || selectedFactory === "all") return machinesByFactory;

//   //   const filtered = {
//   //     [selectedFactory]: machinesByFactory[selectedFactory] || [],
//   //   };

//   //   if (!search) return filtered;

//   //   const searchValue = search.toLowerCase();
//   //   const result = {};
//   //   Object.entries(filtered).forEach(([factoryKey, machines]) => {
//   //     const matched = machines.filter((m) => {
//   //       const code = m.machineCode?.toLowerCase() || "";
//   //       const category = m.machineCategory?.toLowerCase() || "";
//   //       const group = m.machineGroup?.toLowerCase() || "";
//   //       return (
//   //         code.includes(searchValue) ||
//   //         category.includes(searchValue) ||
//   //         group.includes(searchValue)
//   //       );
//   //     });
//   //     if (matched.length > 0) result[factoryKey] = matched;
//   //   });
//   //   return result;
//   // }, [machinesByFactory, selectedFactory, search]);
//   const filteredMachinesByFactory = useMemo(() => {
//     // "Select Factory" => show nothing
//     if (!selectedFactory) return {};

//     // "All Factories" => show everything
//     if (selectedFactory === "all") return machinesByFactory;

//     // Specific factory
//     const filtered = {
//       [selectedFactory]: machinesByFactory[selectedFactory] || [],
//     };

//     // Apply search if any
//     if (!search) return filtered;

//     const searchValue = search.toLowerCase();
//     const result = {};
//     Object.entries(filtered).forEach(([factoryKey, machines]) => {
//       const matched = machines.filter((m) => {
//         const code = m.machineCode?.toLowerCase() || "";
//         const category = m.machineCategory?.toLowerCase() || "";
//         const group = m.machineGroup?.toLowerCase() || "";
//         return (
//           code.includes(searchValue) ||
//           category.includes(searchValue) ||
//           group.includes(searchValue)
//         );
//       });
//       if (matched.length > 0) result[factoryKey] = matched;
//     });
//     return result;
//   }, [machinesByFactory, selectedFactory, search]);

//   // Export to Excel
//   const handleExportExcel = () => {
//     const rows = [];
//     Object.entries(filteredMachinesByFactory).forEach(
//       ([factoryKey, factoryMachines]) => {
//         const [factoryName, factoryLocation] = factoryKey.split(" | ");
//         factoryMachines.forEach((machine) => {
//           rows.push({
//             FactoryName: factoryName,
//             FactoryLocation: factoryLocation,
//             MachineCode: machine.machineCode,
//             Category: machine.machineCategory,
//             Group: machine.machineGroup,
//             CreatedDate: new Date(machine.createdAt).toLocaleString(),
//             UpdatedDate: new Date(machine.updatedAt).toLocaleString(),
//           });
//         });
//       }
//     );
//     const worksheet = XLSX.utils.json_to_sheet(rows);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Factory Machines");
//     XLSX.writeFile(workbook, "FactoryMachineList.xlsx");
//   };

//   const handleResetFilters = () => {
//     setSelectedFactory(""); // Reset to "Select Factory"
//     setSearch("");
//     setFactoryPages({});
//     setItemsPerPageMap({});
//   };

//   // Pagination helpers
//   const getPaginatedMachines = (factoryKey, machines) => {
//     const itemsPerPage = itemsPerPageMap[factoryKey] || defaultItemsPerPage;
//     const currentPage = factoryPages[factoryKey] || 1;
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     const endIndex = startIndex + itemsPerPage;
//     return machines.slice(startIndex, endIndex);
//   };

//   const getTotalPages = (factoryKey, machines) => {
//     const itemsPerPage = itemsPerPageMap[factoryKey] || defaultItemsPerPage;
//     return Math.ceil(machines.length / itemsPerPage);
//   };

//   return (
//     <>
//       <Navbar />
//       <div className="mt-10 w-full max-w-7xl mx-auto px-4">
//         <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
//           {/* Header */}
//           <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
//             <h3 className="text-2xl font-semibold text-gray-800">
//               🏭 Factory-wise Machine
//             </h3>
//             <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
//               <select
//                 value={selectedFactory}
//                 onChange={(e) => setSelectedFactory(e.target.value)}
//                 className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
//               >
//                 <option value="">Select Factory</option>
//                 <option value="all">All Factories</option>
//                 {factoryOptions.map((f) => (
//                   <option key={f.key} value={f.key}>
//                     {f.name} ({f.location})
//                   </option>
//                 ))}
//               </select>

//               <input
//                 type="text"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search by code, category, or group..."
//                 className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
//               />

//               <button
//                 onClick={handleExportExcel}
//                 className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm rounded-lg shadow hover:from-green-700 hover:to-green-600 transition"
//               >
//                 ⬇ Export Excel
//               </button>
//               <button
//                 onClick={handleResetFilters}
//                 className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg shadow hover:bg-gray-600 transition"
//               >
//                 🔄 Reset Filters
//               </button>
//             </div>
//           </div>

//           {/* Content */}
//           {loading ? (
//             <div className="text-center text-gray-500 py-6 animate-pulse">
//               Loading factory-wise machine list...
//             </div>
//           ) : Object.keys(filteredMachinesByFactory).length === 0 ? (
//             <div className="text-center text-gray-500 py-6">
//               No machines found 🚫
//             </div>
//           ) : (
//             <div className="space-y-8">
//               {Object.entries(filteredMachinesByFactory)
//                 .sort(([a], [b]) => a.localeCompare(b))
//                 .map(([factoryKey, factoryMachines]) => {
//                   const [factoryName, factoryLocation] =
//                     factoryKey.split(" | ");
//                   const paginatedMachines = getPaginatedMachines(
//                     factoryKey,
//                     factoryMachines
//                   );
//                   const totalPages = getTotalPages(factoryKey, factoryMachines);
//                   const currentPage = factoryPages[factoryKey] || 1;
//                   const itemsPerPage =
//                     itemsPerPageMap[factoryKey] || defaultItemsPerPage;

//                   return (
//                     <div
//                       key={factoryKey}
//                       className="overflow-x-auto rounded-xl border border-gray-200"
//                     >
//                       <h4 className="bg-green-100 text-green-800 font-semibold px-4 py-2 border-b">
//                         {factoryName}{" "}
//                         <span className="text-gray-600 font-normal text-sm">
//                           ({factoryLocation}) -{" "}
//                           <b>{factoryMachines.length} machines</b>
//                         </span>
//                       </h4>

//                       <table className="w-full text-sm text-left">
//                         <thead className="bg-green-50 text-green-800 uppercase text-xs font-semibold">
//                           <tr>
//                             <th className="px-4 py-3 border">Machine Code</th>
//                             <th className="px-4 py-3 border">Category</th>
//                             <th className="px-4 py-3 border">Group</th>
//                             <th className="px-4 py-3 border">Created Date</th>
//                             <th className="px-4 py-3 border">Updated Date</th>
//                           </tr>
//                         </thead>
//                         <tbody className="divide-y divide-gray-100">
//                           {paginatedMachines
//                             .sort((a, b) =>
//                               a.machineCode.localeCompare(b.machineCode)
//                             )
//                             .map((machine) => (
//                               <tr
//                                 key={machine._id}
//                                 className="hover:bg-green-50/50 even:bg-gray-50 transition"
//                               >
//                                 <td className="px-4 py-3 font-medium text-gray-800">
//                                   {machine.machineCode}
//                                 </td>
//                                 <td className="px-4 py-3">
//                                   {machine.machineCategory}
//                                 </td>
//                                 <td className="px-4 py-3">
//                                   {machine.machineGroup}
//                                 </td>
//                                 <td className="px-4 py-3">
//                                   {new Date(machine.createdAt).toLocaleString()}
//                                 </td>
//                                 <td className="px-4 py-3">
//                                   {new Date(machine.updatedAt).toLocaleString()}
//                                 </td>
//                               </tr>
//                             ))}
//                         </tbody>
//                       </table>

//                       {/* Items per page + Pagination */}
//                       <div className="flex justify-between items-center mt-3 px-4 py-2 bg-gray-50 rounded-b">
//                         <div className="flex items-center gap-2">
//                           <span className="text-gray-700 text-sm">Show:</span>
//                           <select
//                             value={itemsPerPage}
//                             onChange={(e) =>
//                               setItemsPerPageMap({
//                                 ...itemsPerPageMap,
//                                 [factoryKey]: Number(e.target.value),
//                               })
//                             }
//                             className="px-2 py-1 border border-gray-300 rounded"
//                           >
//                             {itemsPerPageOptions.map((opt) => (
//                               <option key={opt} value={opt}>
//                                 {opt}
//                               </option>
//                             ))}
//                           </select>
//                         </div>

//                         {totalPages > 1 && (
//                           <div className="flex items-center gap-4">
//                             <button
//                               disabled={currentPage === 1}
//                               onClick={() =>
//                                 setFactoryPages({
//                                   ...factoryPages,
//                                   [factoryKey]: currentPage - 1,
//                                 })
//                               }
//                               className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
//                             >
//                               Prev
//                             </button>
//                             <span className="text-gray-700 text-sm">
//                               Page {currentPage} of {totalPages}
//                             </span>
//                             <button
//                               disabled={currentPage === totalPages}
//                               onClick={() =>
//                                 setFactoryPages({
//                                   ...factoryPages,
//                                   [factoryKey]: currentPage + 1,
//                                 })
//                               }
//                               className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
//                             >
//                               Next
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// export default FactoryMachineList;

import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import Navbar from "./Navbar";

function FactoryMachineList() {
  const [machinesByFactory, setMachinesByFactory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedFactory, setSelectedFactory] = useState(""); // "" = Select Factory
  const [search, setSearch] = useState("");
  const [factoryPages, setFactoryPages] = useState({});
  const [itemsPerPageMap, setItemsPerPageMap] = useState({});

  const defaultItemsPerPage = 10;
  const itemsPerPageOptions = [5, 10, 20, 50];

  // Fetch machines grouped by factory
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/machines`
        );
        const data = await res.json();
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

  // Dropdown options
  const factoryOptions = Object.keys(machinesByFactory).map((key) => {
    const [factoryName, factoryLocation] = key.split(" | ");
    return { key, name: factoryName, location: factoryLocation };
  });

  // Filtered machines with search
  const filteredMachinesByFactory = useMemo(() => {
    let filtered = {};

    if (!selectedFactory) return {}; // Select Factory → show nothing
    if (selectedFactory === "all") filtered = { ...machinesByFactory };
    else
      filtered = {
        [selectedFactory]: machinesByFactory[selectedFactory] || [],
      };

    if (!search) return filtered;

    const searchValue = search.toLowerCase();
    const result = {};
    Object.entries(filtered).forEach(([factoryKey, machines]) => {
      const matched = machines.filter((m) => {
        const code = m.machineCode?.toLowerCase() || "";
        const category = m.machineCategory?.toLowerCase() || "";
        const group = m.machineGroup?.toLowerCase() || "";
        return (
          code.includes(searchValue) ||
          category.includes(searchValue) ||
          group.includes(searchValue)
        );
      });
      if (matched.length > 0) result[factoryKey] = matched;
    });

    return result;
  }, [machinesByFactory, selectedFactory, search]);

  // Export to Excel
  const handleExportExcel = () => {
    const rows = [];
    Object.entries(filteredMachinesByFactory).forEach(
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

  const handleResetFilters = () => {
    setSelectedFactory("");
    setSearch("");
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
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-2xl font-semibold text-gray-800">
              🏭 Factory-wise Machine
            </h3>
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

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code, category, or group..."
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
                  const paginatedMachines = getPaginatedMachines(
                    factoryKey,
                    factoryMachines
                  );
                  const totalPages = getTotalPages(factoryKey, factoryMachines);
                  const currentPage = factoryPages[factoryKey] || 1;
                  const itemsPerPage =
                    itemsPerPageMap[factoryKey] || defaultItemsPerPage;

                  return (
                    <div
                      key={factoryKey}
                      className="overflow-x-auto rounded-xl border border-gray-200"
                    >
                      <h4 className="bg-green-100 text-green-800 font-semibold px-4 py-2 border-b">
                        {factoryName}{" "}
                        <span className="text-gray-600 font-normal text-sm">
                          ({factoryLocation}) -{" "}
                          <b>{factoryMachines.length} machines</b>
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
                          {paginatedMachines
                            .sort((a, b) =>
                              a.machineCode.localeCompare(b.machineCode)
                            )
                            .map((machine) => (
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
                                  {new Date(machine.createdAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  {new Date(machine.updatedAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>

                      {/* Items per page + Pagination */}
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
