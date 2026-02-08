import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";

const MachineScanner = () => {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState("");
  const [scanned, setScanned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef(null);

  // ✅ Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent || navigator.vendor;
      setIsMobile(/android|iphone|ipad|ipod/i.test(ua));
    };
    checkMobile();
  }, []);

  const handleScanSuccess = (id) => {
    if (!id || scanned) return;

    setScanned(true);
    audioRef.current?.play();

    if (navigator.vibrate) navigator.vibrate(150);

    setTimeout(() => {
      navigate(`/machines-details/${id}`);
    }, 300);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    navigate(`/machines-details/${manualId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <audio ref={audioRef} src="/beep.mp3" preload="auto" />

      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-center mb-4">Machine Scanner</h2>

        {/* ✅ MOBILE ONLY SCANNER */}
        {isMobile ? (
          <>
            <div className="rounded-lg overflow-hidden border mb-3">
              <Scanner
                onScan={(results) => {
                  if (results?.length) {
                    handleScanSuccess(results[0].rawValue);
                  }
                }}
                onError={(err) => console.warn("QR Scanner error:", err)}
              />
            </div>

            <p className="text-center text-gray-500 text-sm mb-4">
              Scan machine QR using your phone camera
            </p>

            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="px-2 text-sm text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>
          </>
        ) : (
          <p className="text-center text-sm text-yellow-600 mb-4">
            📱 QR scanning is available on mobile only.
            <br />
            Please use manual entry on laptop.
          </p>
        )}

        {/* ✅ MANUAL ENTRY (ALL DEVICES) */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Machine ID"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-300"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );
};

export default MachineScanner;
