import { useState, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  FaBars,
  FaTimes,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";
import { socket } from "../socket";
import Swal from "sweetalert2";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dropdown, setDropdown] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // ----------------------------
  // Socket notifications
  // ----------------------------
  useEffect(() => {
    if (!user) return;

    // ✅ Load last notifications from server
    socket.emit("requestNotifications");

    socket.on("initialNotifications", (data) => {
      setNotifications(data);
      const unread = data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    });

    // ✅ Real-time events
    const handleFactoryAdded = (data) => addNotification(data);
    const handleMachineAdded = (data) => addNotification(data);
    const handleTransfer = (data) => addNotification(data);

    socket.on("factoryAdded", handleFactoryAdded);
    socket.on("machineAdded", handleMachineAdded);
    socket.on("transferEvent", handleTransfer);

    return () => {
      socket.off("initialNotifications");
      socket.off("factoryAdded", handleFactoryAdded);
      socket.off("machineAdded", handleMachineAdded);
      socket.off("transferEvent", handleTransfer);
    };
  }, [user]);

  const addNotification = (data) => {
    setNotifications((prev) => [
      { ...data, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
    setUnreadCount((count) => count + 1);

    Swal.fire({
      title: "📢 New Notification",
      text: data.message,
      icon: "info",
      toast: true,
      position: "top-end",
      timer: 3000,
      showConfirmButton: false,
    });
  };

  const handleBellClick = () => {
    setUnreadCount(0);
    setShowNotifDropdown(!showNotifDropdown);
  };

  // ----------------------------
  // Navigation menu
  // ----------------------------
  const groupedLinks = [
    {
      title: "Factory",
      roles: ["superadmin", "admin", "user"],
      children: [
        {
          to: "/factories/add",
          label: "Add Factory",
          roles: ["superadmin", "admin"],
        },
        {
          to: "/factories",
          label: "Factory List",
          roles: ["superadmin", "admin", "user"],
        },
      ],
    },
    {
      title: "Machine",
      roles: ["superadmin", "admin", "user"],
      children: [
        {
          to: "/machines/add",
          label: "Add Machine",
          roles: ["superadmin", "admin"],
        },
        {
          to: "/machines",
          label: "Factory Wise Machines",
          roles: ["superadmin", "admin", "user"],
        },
      ],
    },
    {
      title: "Transfer",
      roles: ["superadmin", "admin", "user"],
      children: [
        {
          to: "/machine/transfer",
          label: "Machine Transfer Initiation",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/machine/transfer-receive",
          label: "Machine Transfer Receipt",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/machine/return",
          label: "Machine Return Initiation",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/machine/return-receive",
          label: "Machine Return Receipt",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/history",
          label: "Machine History",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/transfer/history",
          label: "Transfer History",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/summary",
          label: "Machine Transfer Summary",
          roles: ["superadmin", "admin", "user"],
        },
      ],
    },
    {
      title: "Maintenance",
      roles: ["superadmin", "admin", "user"],
      children: [
        {
          to: "/maintenance",
          label: "Add Maintenance",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/maintenances",
          label: "Maintenance List",
          roles: ["superadmin", "admin", "user"],
        },
      ],
    },
    {
      title: "Machine Idle",
      roles: ["superadmin", "admin", "user"],
      children: [
        {
          to: "/idles-start",
          label: "Start Machine Idle",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/idles-end",
          label: "End Machine Idle",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/idles",
          label: "Machine Idle Report",
          roles: ["superadmin", "admin", "user"],
        },
      ],
    },
    {
      title: "Users",
      roles: ["superadmin"],
      children: [{ to: "/users", label: "Users List", roles: ["superadmin"] }],
    },
  ];

  const getRoleBadge = (role) => {
    const roleColors = {
      superadmin: "bg-red-100 text-red-800",
      admin: "bg-blue-100 text-blue-800",
      user: "bg-green-100 text-green-800",
    };
    return roleColors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <header className="sticky top-0 z-50 shadow-md bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900 text-white">
      {/* Topbar */}
      <div className="px-6 py-2 max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/images.jpg"
            alt="Company Logo"
            className="h-12 w-auto rounded-lg shadow-md"
          />
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {user && (
            <>
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={handleBellClick}
                  className="relative hover:text-indigo-300"
                >
                  <FaBell className="text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-3 w-72 bg-white text-gray-800 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                    {notifications.length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    )}
                    {notifications.map((note, i) => (
                      <div
                        key={i}
                        className="px-4 py-2 border-b border-gray-200 hover:bg-gray-50 text-sm"
                      >
                        <p>{note.message}</p>
                        <span className="text-xs text-gray-500">
                          {note.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 hover:text-indigo-300 transition duration-200"
                >
                  <FaUserCircle className="text-2xl" />
                  <span className="hidden md:inline text-sm font-medium font-semibold">
                    {user.name}
                  </span>
                  <span
                    className={`hidden md:inline text-xs font-semibold px-2 py-0.5 rounded ${getRoleBadge(
                      user.role
                    )}`}
                  >
                    {user.role?.toUpperCase()}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden animate-fadeIn">
                    {user.role === "superadmin" && (
                      <Link
                        to="/register"
                        className="block w-full text-center px-4 py-2 text-gray-800 no-underline rounded-md hover:bg-gray-100 transition"
                        onClick={() => setProfileOpen(false)}
                      >
                        Register User
                      </Link>
                    )}
                    {/* New: Update Password */}
                    <Link
                      to="/update-password"
                      className="block w-full text-center px-4 py-2 text-gray-800 no-underline rounded-md hover:bg-gray-100 transition"
                      onClick={() => setProfileOpen(false)}
                    >
                      Change Password
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="w-full text-center px-4 py-2 flex items-center justify-center gap-2 text-red-500 hover:bg-gray-100 transition rounded-md"
                    >
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {!user && (
            <Link
              to="/login"
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition duration-200"
            >
              Login
            </Link>
          )}

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-3xl text-gray-200 hover:text-white transition duration-200"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Desktop Navbar */}
      <nav className="hidden md:block">
        <ul className="flex justify-center gap-10 py-2 font-medium">
          {groupedLinks
            .filter((group) => user && group.roles.includes(user.role))
            .map((group) => (
              <li key={group.title} className="relative group">
                <button
                  onClick={() =>
                    setDropdown(dropdown === group.title ? null : group.title)
                  }
                  className={`flex items-center gap-1 transition duration-200 ${
                    dropdown === group.title ||
                    group.children.some((c) => location.pathname === c.to)
                      ? "text-indigo-300"
                      : "text-white hover:text-indigo-200"
                  }`}
                >
                  {group.title} <FaChevronDown className="text-xs" />
                </button>

                {dropdown === group.title && (
                  <ul className="absolute left-0 mt-2 w-max min-w-[12rem] bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden animate-fadeIn">
                    {group.children
                      .filter((link) => link.roles.includes(user.role))
                      .map((link) => (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            className={`block w-full text-center px-4 py-2 text-gray-800 no-underline rounded-md transition duration-200
                              hover:bg-indigo-50 hover:text-indigo-700
                              ${
                                location.pathname === link.to
                                  ? "font-semibold text-indigo-600"
                                  : ""
                              }`}
                            onClick={() => setDropdown(null)}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            ))}
        </ul>
      </nav>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-indigo-950/90 backdrop-blur-lg border-t border-indigo-700 shadow-lg animate-slideDown">
          <ul className="flex flex-col space-y-4 py-4 px-6 font-medium">
            {groupedLinks
              .filter((group) => user && group.roles.includes(user.role))
              .map((group) => (
                <li key={group.title}>
                  <span className="font-semibold">{group.title}</span>
                  <ul className="ml-4 mt-2 space-y-2">
                    {group.children
                      .filter((link) => link.roles.includes(user.role))
                      .map((link) => (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            className={`block w-full text-center px-4 py-2 rounded-md transition duration-200
                              ${
                                location.pathname === link.to
                                  ? "text-indigo-300 font-semibold"
                                  : "text-white hover:text-indigo-200"
                              }`}
                            onClick={() => setIsOpen(false)}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}

            <li className="border-t border-indigo-700 pt-4 flex flex-col gap-3">
              {!user ? (
                <Link
                  to="/login"
                  className="hover:text-indigo-300 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              ) : (
                <>
                  {user.role === "superadmin" && (
                    <Link
                      to="/register"
                      className="hover:text-indigo-300 text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Register User
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 text-red-400 hover:text-red-500 w-full transition duration-200"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

export default Navbar;
