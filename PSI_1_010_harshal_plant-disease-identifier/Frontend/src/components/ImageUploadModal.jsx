import { useState, useContext } from "react";
import { toast } from "react-toastify";
import { UploadCloud, X, FileText, AlertCircle, Loader2 } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";

export default function ImageUploadModal({ onClose }) {
  const { user } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      // Only set to false if leaving the main container
      if (e.currentTarget.contains(e.relatedTarget)) return;
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return toast.warning("Please select an image first");
    if (!user) return toast.error("You must be logged in to upload");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    const toastId = toast.loading("Analyzing plant health...");

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: user.uid,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      toast.update(toastId, {
        render: "Analysis complete! 🌱",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });

      // Close modal and refresh (a bit of a hack, normally would use context/state)
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error(err);
      toast.update(toastId, {
        render: "Analysis failed. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`glass-card w-full max-w-lg p-0 overflow-hidden shadow-2xl transition-all ${dragActive ? "border-2 border-green-500 scale-[1.02]" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="text-green-400" />
            Upload Plant
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Hidden Inputs */}
          <input
            id="file-upload-camera"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleChange}
          />
          <input
            id="file-upload-browse"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />

          {file ? (
            <div className="text-white text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <p className="font-medium text-lg truncate max-w-[200px] mx-auto">{file.name}</p>
              <p className="text-sm text-gray-400 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-sm text-red-400 hover:text-red-300 hover:underline"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full mb-8">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-6">
                Upload Plant Photo
              </h3>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                <button
                  onClick={() => document.getElementById("file-upload-camera").click()}
                  className="flex-1 py-3 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20"
                >
                  <span className="text-xl">📷</span> Camera
                </button>
                <button
                  onClick={() => document.getElementById("file-upload-browse").click()}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="text-xl">📂</span> Browse
                </button>
              </div>

              <p className="text-slate-500 text-sm mt-6">
                Supports: JPG, PNG, WEBP (Max 10MB)
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className={`btn-primary px-8 py-2.5 flex items-center gap-2 ${loading || !file ? "opacity-50 cursor-not-allowed filter grayscale" : ""
                }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Start Analysis"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
