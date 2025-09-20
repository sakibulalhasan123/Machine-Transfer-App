// component/Register.js
import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Navbar from "./Navbar";
import { User, Mail, Lock } from "lucide-react";

function Register() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [factories, setFactories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    factoryId: "",
  });
  const [status, setStatus] = useState({ error: "", success: "" });
  useEffect(() => {
    const loadFactories = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/factories`
        );
        const data = await res.json();
        setFactories(data.factories ?? data ?? []);
      } catch (err) {
        console.error("Error fetching factories:", err);
      }
    };
    loadFactories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: "", success: "" });

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Server returned invalid JSON");
      }

      if (!res.ok) throw new Error(data.message || "Registration failed");

      setStatus({ error: "", success: "✅ User registered successfully!" });
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setStatus({ error: err.message, success: "" });
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-center items-center min-h-screen bg-gray-50 px-6 py-10">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Create Account
          </h2>

          {status.error && (
            <div className="mb-4 p-3 text-red-600 bg-red-50 border border-red-200 rounded-md text-sm text-center">
              {status.error}
            </div>
          )}
          {status.success && (
            <div className="mb-4 p-3 text-green-700 bg-green-50 border border-green-200 rounded-md text-sm text-center">
              {status.success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full px-10 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="w-full px-10 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full px-10 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            {/* Factory select */}
            <select
              name="factoryId"
              value={form.factoryId || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">Select Factory</option>
              {factories.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.factoryName} | {f.factoryLocation}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2.5 rounded-md font-medium shadow hover:bg-indigo-700 transition"
            >
              Register
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-5">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default Register;
