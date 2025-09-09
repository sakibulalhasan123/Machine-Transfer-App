import { useState, useEffect } from "react";
import { FaIndustry, FaUpload, FaPlus, FaDownload } from "react-icons/fa";
import Navbar from "./Navbar";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

function AddMachine() {
  // ----------------- State -----------------
  const [formData, setFormData] = useState({
    factoryId: "",
    machineCategory: "",
    machineGroup: "",
    machineCode: "",
  });
  const [factories, setFactories] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("manual"); // "manual" | "bulk"

  // ----------------- Fetch factories -----------------
  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/factories`
        );
        if (!res.ok) throw new Error("Failed to fetch factories");
        const data = await res.json();
        setFactories(data);
      } catch (err) {
        console.error("❌ Error fetching factories:", err.message);
        Swal.fire("Error", "Failed to fetch factories", "error");
      }
    };
    fetchFactories();
  }, []);

  // ----------------- Form Handlers -----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "factoryId") {
      const factory = factories.find((f) => f._id === value);
      setSelectedLocation(factory?.factoryLocation || "");
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.factoryId) newErrors.factoryId = "Factory is required";
    if (!formData.machineCategory)
      newErrors.machineCategory = "Category is required";
    if (!formData.machineGroup) newErrors.machineGroup = "Group is required";
    if (!formData.machineCode) newErrors.machineCode = "Code is required";
    return newErrors;
  };

  // ----------------- Manual Add -----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length)
      return setErrors(validationErrors);
    const token = localStorage.getItem("authToken");

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/machines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        Swal.fire("Error", data.message || "Something went wrong", "error");
        return;
      }

      Swal.fire(
        "Success",
        `Machine added successfully!\nCode: ${data.machine?.machineCode}`,
        "success"
      );

      setFormData({
        factoryId: "",
        machineCategory: "",
        machineGroup: "",
        machineCode: "",
      });
      setSelectedLocation("");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error while adding machine", "error");
    }
  };

  // ----------------- Bulk Upload -----------------
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        factoryName: factories[0]?.factoryName || "Factory A",
        machineCategory: "CNC",
        machineGroup: "Lathe",
        machineCode: "M001",
      },
      {
        factoryName: factories[1]?.factoryName || "Factory B",
        machineCategory: "Press",
        machineGroup: "Hydraulic",
        machineCode: "M002",
      },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(sampleData),
      "Machines"
    );
    XLSX.writeFile(wb, "Machines_Template.xlsx");
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        const mappedData = jsonData.map((row) => {
          const factory = factories.find(
            (f) =>
              f.factoryName.toLowerCase().trim() ===
              String(row.factoryName).toLowerCase().trim()
          );
          return {
            factoryId: factory?._id || null,
            machineCategory: row.machineCategory || "",
            machineGroup: row.machineGroup || "",
            machineCode: row.machineCode || "",
          };
        });

        if (mappedData.some((m) => !m.factoryId)) {
          Swal.fire(
            "Error",
            "Some factories in the file do not exist.",
            "error"
          );
          return;
        }
        // ➤ JWT token localStorage থেকে নেওয়া
        const token = localStorage.getItem("authToken"); // same key as manual add
        // console.log("Bulk upload token:", token); // debug
        if (!token) {
          Swal.fire("Error", "User not logged in.", "error");
          return;
        }
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/machines/bulk`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // এখানে token attach করা হলো
            },
            body: JSON.stringify(mappedData),
          }
        );

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Bulk upload failed");

        Swal.fire(
          "Success",
          `${data.count} machines uploaded successfully!`,
          "success"
        );
      } catch (err) {
        console.error(err);
        Swal.fire("Error", err.message, "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  // ----------------- JSX -----------------
  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl border border-gray-200">
          <div className="flex items-center border-b pb-4 mb-6">
            <FaIndustry className="text-gray-700 text-2xl mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">
              Add Machines
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === "manual"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              <FaPlus className="mr-2" /> Manual Add
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === "bulk"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              <FaUpload className="mr-2" /> Bulk Upload
            </button>
          </div>

          {/* Manual Form */}
          {activeTab === "manual" && (
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Factory */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Factory
                </label>
                <select
                  name="factoryId"
                  value={formData.factoryId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                    errors.factoryId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a factory</option>
                  {factories.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.factoryName}
                    </option>
                  ))}
                </select>
                {errors.factoryId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.factoryId}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={selectedLocation}
                  readOnly
                  className="w-full px-3 py-2 border rounded-md bg-gray-100 border-gray-300"
                />
              </div>

              {/* Machine Category */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="machineCategory"
                  value={formData.machineCategory}
                  onChange={handleChange}
                  placeholder="Enter category"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                    errors.machineCategory
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.machineCategory && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.machineCategory}
                  </p>
                )}
              </div>

              {/* Machine Group */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Group
                </label>
                <input
                  type="text"
                  name="machineGroup"
                  value={formData.machineGroup}
                  onChange={handleChange}
                  placeholder="Enter group"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                    errors.machineGroup ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.machineGroup && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.machineGroup}
                  </p>
                )}
              </div>

              {/* Machine Code */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Code
                </label>
                <input
                  type="text"
                  name="machineCode"
                  value={formData.machineCode}
                  onChange={handleChange}
                  placeholder="Enter code"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                    errors.machineCode ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.machineCode && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.machineCode}
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white font-medium py-2 px-6 rounded-md shadow hover:bg-indigo-700 transition"
                >
                  Save Machine
                </button>
              </div>
            </form>
          )}

          {/* Bulk Upload */}
          {activeTab === "bulk" && (
            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-600 mb-4">
                Upload an Excel file (.xlsx) with machines
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 transition"
                >
                  <FaDownload /> Download Template
                </button>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleBulkUpload}
                  className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AddMachine;
