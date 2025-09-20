// import { useState, useEffect } from "react";
// import Navbar from "./Navbar";

// function SummaryReport() {
//   const [summary, setSummary] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalMachines, setModalMachines] = useState([]);
//   const [modalStatus, setModalStatus] = useState("");
//   const [modalFactory, setModalFactory] = useState(null);

//   useEffect(() => {
//     setLoading(true);
//     fetch(
//       `${process.env.REACT_APP_API_URL}/api/transfers/reports/origin-factory-summary`
//     )
//       .then((res) => res.json())
//       .then((data) => {
//         setSummary(data.summary || []);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("❌ Error fetching summary:", err);
//         setLoading(false);
//       });
//   }, []);

//   // Filter machines based on status and factory
//   const getMachinesByStatus = (factory, status) => {
//     if (!factory || !status) return [];

//     return factory.machines.filter((m) => {
//       switch (status) {
//         case "In-House":
//         case "Transferred":
//           return m.finalStatus === status;
//         case "Borrowed":
//           // Machine has Borrowed entry where toFactory = current factory
//           return m.history.some(
//             (h) =>
//               h.status === "Borrowed" &&
//               h.factory._id.toString() === factory.factoryId.toString()
//           );
//         case "In Return Transit":
//           // Machine has Return Dispatched entry from current factory
//           return m.history.some(
//             (h) =>
//               h.status === "In Return Transit" &&
//               h.factory._id.toString() === factory.factoryId.toString()
//           );
//         default:
//           return false;
//       }
//     });
//   };

//   const handleCountClick = (factory, status) => {
//     const machines = getMachinesByStatus(factory, status);
//     setModalMachines(machines);
//     setModalStatus(status);
//     setModalFactory(factory);
//     setModalOpen(true);
//   };

//   return (
//     <>
//       <Navbar />
//       <div className="min-h-screen bg-gray-50 px-6 py-8">
//         <div className="bg-white p-6 rounded-xl shadow-xl max-w-6xl mx-auto border border-gray-200">
//           <h2 className="text-2xl font-bold mb-6 text-gray-800">
//             Factory Summary Report
//           </h2>

//           {loading ? (
//             <p className="text-gray-500 text-center py-8">Loading summary...</p>
//           ) : (
//             <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
//                       Factory
//                     </th>
//                     {[
//                       "In-House",
//                       "Transferred",
//                       "Borrowed",
//                       "In Return Transit",
//                     ].map((status) => (
//                       <th
//                         key={status}
//                         className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider cursor-pointer"
//                       >
//                         {status}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {summary.map((f) => (
//                     <tr
//                       key={f.factoryId}
//                       className="hover:bg-indigo-50 transition-colors duration-150"
//                     >
//                       <td className="px-6 py-4 text-gray-700 font-medium">
//                         {f.factoryName}
//                       </td>
//                       {[
//                         "In-House",
//                         "Transferred",
//                         "Borrowed",
//                         "In Return Transit",
//                       ].map((status) => (
//                         <td
//                           key={status}
//                           className="px-6 py-4 text-center text-gray-700 cursor-pointer"
//                           onClick={() => handleCountClick(f, status)}
//                         >
//                           {f.counts[status] || 0}
//                         </td>
//                       ))}
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {/* Modal */}
//           {modalOpen && (
//             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//               <div className="bg-white rounded-lg p-6 w-11/12 max-w-3xl">
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-xl font-semibold">
//                     {modalStatus} Machines - {modalFactory?.factoryName}
//                   </h3>
//                   <button
//                     className="text-gray-500 hover:text-gray-700"
//                     onClick={() => setModalOpen(false)}
//                   >
//                     Close
//                   </button>
//                 </div>
//                 <div className="overflow-y-auto max-h-96">
//                   <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-100">
//                       <tr>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
//                           Machine Code
//                         </th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
//                           Category
//                         </th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
//                           Group
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {modalMachines.length > 0 ? (
//                         modalMachines.map((m) => (
//                           <tr key={m.machineId}>
//                             <td className="px-4 py-2 text-gray-700">
//                               {m.machineCode}
//                             </td>
//                             <td className="px-4 py-2 text-gray-700">
//                               {m.machineCategory}
//                             </td>
//                             <td className="px-4 py-2 text-gray-700">
//                               {m.machineGroup}
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td
//                             colSpan={3}
//                             className="px-4 py-2 text-center text-gray-500"
//                           >
//                             No machines found
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// export default SummaryReport;

import { useState, useEffect } from "react";
import Navbar from "./Navbar";

function SummaryReport() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMachines, setModalMachines] = useState([]);
  const [modalStatus, setModalStatus] = useState("");
  const [modalFactory, setModalFactory] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(
      `${process.env.REACT_APP_API_URL}/api/transfers/reports/origin-factory-summary`
    )
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.summary || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching summary:", err);
        setLoading(false);
      });
  }, []);

  // Filter machines based on status and factory
  const getMachinesByStatus = (factory, status) => {
    if (!factory || !status) return [];

    return factory.machines.filter((m) => {
      switch (status) {
        case "In-House":
        case "Transferred":
          return m.finalStatus === status;
        // case "Borrowed":
        //   return m.history.some(
        //     (h) =>
        //       h.status === "Borrowed" &&
        //       h.factory._id.toString() === factory.factoryId.toString()
        //   );
        case "Borrowed":
          return (
            m.finalStatus === "Borrowed" && // ensure machine is still borrowed
            m.history.some(
              (h) =>
                h.status === "Borrowed" &&
                h.factory._id.toString() === factory.factoryId.toString()
            )
          );

        case "In Return Transit":
          return m.history.some(
            (h) =>
              h.status === "In Return Transit" &&
              h.factory._id.toString() === factory.factoryId.toString()
          );
        default:
          return false;
      }
    });
  };

  const handleCountClick = (factory, status) => {
    const machines = getMachinesByStatus(factory, status);
    setModalMachines(machines);
    setModalStatus(status);
    setModalFactory(factory);
    setModalOpen(true);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-10">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-7xl mx-auto border border-gray-200">
          <h2 className="text-3xl font-bold mb-8 text-gray-800 tracking-tight">
            📊 Machine Transfer Summary Report
          </h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-600 text-white sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      Factory
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                      Total Machines
                    </th>
                    {[
                      "In-House",
                      "Transferred",
                      "Borrowed",
                      "In Return Transit",
                    ].map((status) => (
                      <th
                        key={status}
                        className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider"
                      >
                        {status}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {summary.map((f, i) => (
                    <tr
                      key={f.factoryId}
                      className={`transition-colors duration-200 ${
                        i % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-indigo-50`}
                    >
                      <td className="px-6 py-4 text-gray-800 font-medium">
                        {f.factoryName}
                        <div className="text-sm text-gray-500">
                          {f.factoryLocation}
                        </div>
                      </td>
                      {/* Total Machines = In-House + Transferred */}
                      <td className="px-6 py-4 text-center text-indigo-600 font-semibold">
                        {(f.counts["In-House"] || 0) +
                          (f.counts["Transferred"] || 0)}
                      </td>
                      {[
                        "In-House",
                        "Transferred",
                        "Borrowed",
                        "In Return Transit",
                      ].map((status) => (
                        <td
                          key={status}
                          className="px-6 py-4 text-center text-gray-700 cursor-pointer font-semibold hover:text-indigo-600"
                          onClick={() => handleCountClick(f, status)}
                        >
                          {f.counts[status] || 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-11/12 max-w-4xl shadow-2xl relative animate-fadeIn">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                  <h3 className="text-2xl font-bold text-indigo-700">
                    {modalStatus} Machines - {modalFactory?.factoryName}
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-600 transition"
                    onClick={() => setModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[28rem]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                          Machine Code
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                          Category
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                          Group
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
                            <td className="px-4 py-2 text-gray-800 font-medium">
                              {m.machineCode}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {m.machineCategory}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {m.machineGroup}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-6 text-center text-gray-500"
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
