// import { useState, useEffect } from "react";
// import Navbar from "./Navbar";

// function UserList() {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // Pagination
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);

//   // Get token from localStorage
//   const token = localStorage.getItem("authToken");

//   useEffect(() => {
//     if (!token) {
//       setError("Please login to view users");
//       setLoading(false);
//       return;
//     }

//     const fetchUsers = async () => {
//       try {
//         const res = await fetch(
//           `${process.env.REACT_APP_API_URL}/api/auth/users`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );

//         const data = await res.json();
//         if (!res.ok) throw new Error(data.message || "Failed to fetch users");

//         setUsers(Array.isArray(data) ? data : data.users || []);
//       } catch (err) {
//         console.error("❌ Error fetching users:", err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, [token]);

//   // Pagination logic
//   const totalPages = Math.ceil(users.length / rowsPerPage);
//   const paginatedUsers =
//     rowsPerPage === "All"
//       ? users
//       : users.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

//   if (loading) return <div className="text-center py-6">Loading users...</div>;
//   if (error)
//     return <div className="text-center py-6 text-red-500">{error}</div>;

//   return (
//     <>
//       <Navbar />
//       <div className="mt-10 w-full max-w-7xl mx-auto px-4">
//         <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
//           <h3 className="text-2xl font-bold text-gray-800 mb-6">
//             👥 Users List
//           </h3>

//           {users.length === 0 ? (
//             <div className="text-gray-500">No users found.</div>
//           ) : (
//             <>
//               <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
//                 <table className="w-full text-sm text-left border-collapse">
//                   <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold tracking-wide">
//                     <tr>
//                       <th className="px-4 py-3 border">S/N</th>
//                       <th className="px-4 py-3 border">Name</th>
//                       <th className="px-4 py-3 border">Email</th>
//                       <th className="px-4 py-3 border">Role</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100">
//                     {paginatedUsers.map((user, index) => (
//                       <tr
//                         key={user._id}
//                         className="hover:bg-blue-50/50 even:bg-gray-50 transition"
//                       >
//                         <td className="px-4 py-3">
//                           {(currentPage - 1) * rowsPerPage + index + 1}
//                         </td>
//                         <td className="px-4 py-3 font-medium text-gray-800">
//                           {user.name}
//                         </td>
//                         <td className="px-4 py-3">{user.email}</td>
//                         <td className="px-4 py-3">{user.role}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Pagination Controls */}
//               <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-3">
//                 <div className="flex items-center gap-2 text-sm text-gray-600">
//                   <span>Rows per page:</span>
//                   <select
//                     value={rowsPerPage}
//                     onChange={(e) => {
//                       setRowsPerPage(
//                         e.target.value === "All"
//                           ? "All"
//                           : parseInt(e.target.value)
//                       );
//                       setCurrentPage(1);
//                     }}
//                     className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value={10}>10</option>
//                     <option value={25}>25</option>
//                     <option value={50}>50</option>
//                     <option value="All">All</option>
//                   </select>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <button
//                     disabled={currentPage === 1}
//                     onClick={() => setCurrentPage((p) => p - 1)}
//                     className="px-3 py-1 border rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
//                   >
//                     ◀ Prev
//                   </button>
//                   <span className="text-sm text-gray-700">
//                     Page <span className="font-semibold">{currentPage}</span> of{" "}
//                     <span className="font-semibold">{totalPages}</span>
//                   </span>
//                   <button
//                     disabled={currentPage === totalPages}
//                     onClick={() => setCurrentPage((p) => p + 1)}
//                     className="px-3 py-1 border rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
//                   >
//                     Next ▶
//                   </button>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// export default UserList;

import { useState, useEffect } from "react";
import Navbar from "./Navbar";

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!token) {
      setError("Please login to view users");
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/auth/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch users");
        setUsers(Array.isArray(data) ? data : data.users || []);
      } catch (err) {
        console.error("❌ Error fetching users:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const totalPages =
    rowsPerPage === "All" ? 1 : Math.ceil(users.length / rowsPerPage);
  const paginatedUsers =
    rowsPerPage === "All"
      ? users
      : users.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mt-10 w-full max-w-7xl mx-auto px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            👥 Users List
          </h3>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-gray-200"></div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-6 text-red-500">{error}</div>
          )}

          {/* Users Table */}
          {!loading && !error && users.length === 0 && (
            <div className="text-gray-500 text-center py-6">
              No users found.
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-blue-50 text-blue-800 uppercase text-xs font-semibold tracking-wide">
                    <tr>
                      <th className="px-4 py-3 border">S/N</th>
                      <th className="px-4 py-3 border">Name</th>
                      <th className="px-4 py-3 border">Email</th>
                      <th className="px-4 py-3 border">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedUsers.map((user, index) => (
                      <tr
                        key={user._id}
                        className="hover:bg-blue-50/50 even:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3">
                          {(currentPage - 1) * rowsPerPage + index + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {user.name}
                        </td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">{user.role}</td>
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
      </div>
    </div>
  );
}

export default UserList;
