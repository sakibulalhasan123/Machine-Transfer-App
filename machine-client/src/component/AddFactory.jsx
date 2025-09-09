import { useState } from "react";
import { FaBuilding } from "react-icons/fa";
import Navbar from "./Navbar";

function AddFactory() {
  const [formData, setFormData] = useState({
    factoryName: "",
    factoryLocation: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.factoryName.trim())
      newErrors.factoryName = "Factory name is required";
    if (!formData.factoryLocation.trim())
      newErrors.factoryLocation = "Location is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const token = localStorage.getItem("authToken");
    // console.log("Token sent:", token);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/factories/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      // console.log("✅ Factory Saved:", data);
      setSubmitted(true);
      setFormData({
        factoryName: "",
        factoryLocation: "",
      });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center border-b pb-4 mb-6">
            <FaBuilding className="text-gray-700 text-2xl mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">
              Add New Factory
            </h2>
          </div>

          {/* Success Alert */}
          {submitted && (
            <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-300 text-green-700 text-sm">
              ✅ Factory added successfully!
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Factory Name */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Factory Name :
              </label>
              <input
                type="text"
                name="factoryName"
                value={formData.factoryName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                  errors.factoryName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter factory name"
              />
              {errors.factoryName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.factoryName}
                </p>
              )}
            </div>

            {/* Factory Location */}
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Factory Location :
              </label>
              <input
                type="text"
                name="factoryLocation"
                value={formData.factoryLocation}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                  errors.factoryLocation ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter location"
              />
              {errors.factoryLocation && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.factoryLocation}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white font-medium py-2 px-6 rounded-md shadow hover:bg-indigo-700 transition"
              >
                Save Factory
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddFactory;
