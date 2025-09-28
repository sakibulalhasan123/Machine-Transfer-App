import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaLock } from "react-icons/fa";
import Navbar from "./Navbar";

function UpdatePassword() {
  const { logout } = useContext(AuthContext);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!oldPassword.trim() || !newPassword.trim()) {
      setMessage("⚠️ All fields are required");
      return;
    }

    if (newPassword.trim().length < 2) {
      setMessage("⚠️ New password must be at least 2 characters");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/update-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            oldPassword: oldPassword.trim(),
            newPassword: newPassword.trim(),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "❌ Something went wrong");

      // ✅ Success
      setSuccess(true);
      setMessage("✅ Password updated successfully! Please login again.");
      setOldPassword("");
      setNewPassword("");
      setTimeout(() => {
        logout();
        window.location.href = "/login";
      }, 1500);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center border-b pb-4 mb-6">
            <FaLock className="text-gray-700 text-2xl mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">
              Update Password
            </h2>
          </div>

          {/* ✅ Success Alert */}
          {success && (
            <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-300 text-green-700 text-sm">
              {message}
            </div>
          )}

          {/* ❌ Error Alert */}
          {!success && message && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm">
              {message}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            autoComplete="off"
          >
            {/* Hidden dummy input to prevent autofill */}
            <input type="text" style={{ display: "none" }} />

            {/* Old Password */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Old Password :
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none border-gray-300"
                placeholder="Enter old password"
                autoComplete="current-password"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                New Password :
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none border-gray-300"
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`bg-indigo-600 text-white font-medium py-2 px-6 rounded-md shadow transition ${
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-indigo-700"
                }`}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default UpdatePassword;
