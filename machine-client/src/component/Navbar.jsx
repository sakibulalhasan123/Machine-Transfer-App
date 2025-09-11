import { useState, useContext } from "react";
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

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dropdown, setDropdown] = useState(null);
  const location = useLocation();

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
          label: "Transfer Machine",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/transfer/history",
          label: "Transfer History",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/transfer/machines",
          label: "Transfer Machine List",
          roles: ["superadmin", "admin", "user"],
        },
        {
          to: "/all-history",
          label: "All History Report",
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
              <button className="relative hover:text-indigo-300 transition">
                <FaBell className="text-xl" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  3
                </span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 hover:text-indigo-300 transition"
                >
                  <FaUserCircle className="text-2xl" />
                  <span className="hidden md:inline text-sm font-medium">
                    {user.name || "User"}
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
              className="px-4 py-2 rounded-md bg-indigo-700 hover:bg-indigo-600 transition"
            >
              Login
            </Link>
          )}

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-3xl text-gray-200 hover:text-white transition"
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
                  className={`flex items-center gap-1 transition ${
                    dropdown === group.title ||
                    group.children.some((c) => location.pathname === c.to)
                      ? "text-indigo-300"
                      : "text-white hover:text-indigo-200"
                  }`}
                >
                  {group.title} <FaChevronDown className="text-xs" />
                </button>

                {/* Desktop Dropdown */}
                {dropdown === group.title && (
                  <ul className="absolute left-0 mt-2 w-max min-w-[12rem] bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden animate-fadeIn">
                    {group.children
                      .filter((link) => link.roles.includes(user.role))
                      .map((link) => (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            className={`block w-full text-center px-4 py-2 text-gray-800 no-underline rounded-md transition
                              hover:bg-indigo-100 hover:text-indigo-700
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
                            className={`block w-full text-center px-4 py-2 rounded-md transition
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
                    className="flex items-center justify-center gap-2 text-red-400 hover:text-red-500 w-full"
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
