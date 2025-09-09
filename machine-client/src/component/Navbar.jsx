import { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  FaBars,
  FaTimes,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
} from "react-icons/fa";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  const links = [
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
    {
      to: "/users",
      label: "Users List",
      roles: ["superadmin"],
    },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-md bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900 text-white">
      {/* 🔹 Topbar */}
      <div className="px-6 py-2 max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/images.jpg"
            alt="Company Logo"
            className="h-12 w-auto rounded-lg shadow-md"
          />
          {/* <span className="font-bold text-lg hidden sm:block">
            Factory Dashboard
          </span> */}
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
                  <span className="hidden md:inline text-sm font-medium">
                    Login By :
                  </span>
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
                        className="block px-4 py-2 hover:bg-gray-100"
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
                      className="w-full text-left px-4 py-2 flex items-center gap-2 text-red-500 hover:bg-gray-100"
                    >
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Auth Buttons */}
          {!user && (
            <Link
              to="/login"
              className="px-4 py-2 rounded-md bg-indigo-700 hover:bg-indigo-600 transition"
            >
              Login
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-3xl text-gray-200 hover:text-white transition"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* 🔹 Desktop Navbar */}
      <nav className="hidden md:block">
        <ul className="flex justify-center gap-10 py-2 font-medium">
          {links
            .filter((link) => user && link.roles.includes(user.role))
            .map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`relative transition no-underline ${
                    location.pathname === link.to
                      ? "text-indigo-300"
                      : "text-white hover:text-indigo-200"
                  } after:content-[''] after:block after:w-0 after:h-[2px] after:bg-indigo-300 after:transition-all after:duration-300 hover:after:w-full`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
        </ul>
      </nav>

      {/* 🔹 Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-indigo-950/90 backdrop-blur-lg border-t border-indigo-700 shadow-lg animate-slideDown">
          <ul className="flex flex-col space-y-4 py-4 px-6 font-medium">
            {links
              .filter((link) => user && link.roles.includes(user.role))
              .map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`block transition ${
                      location.pathname === link.to
                        ? "text-indigo-300"
                        : "text-white hover:text-indigo-200"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

            {/* Auth actions */}
            <li className="border-t border-indigo-700 pt-4 flex flex-col gap-3">
              {!user ? (
                <Link
                  to="/login"
                  className="hover:text-indigo-300"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              ) : (
                <>
                  {user.role === "superadmin" && (
                    <Link
                      to="/register"
                      className="hover:text-indigo-300"
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
                    className="flex items-center gap-2 text-red-400 hover:text-red-500"
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
