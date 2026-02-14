import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import { toast } from "react-toastify";
import { FileText, Trash2, ArrowLeft, Download, AlertTriangle } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

export default function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch plant detail
  useEffect(() => {
    if (!user) return;

    fetch(`/api/plants/${id}`, {
      headers: { Authorization: user.uid }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Plant not found");
        return res.json();
      })
      .then((data) => {
        setPlant(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error("Plant not found or API error");
      });
  }, [id, user]);

  // DELETE FUNCTION
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/plants/${id}`, {
        method: "DELETE",
        headers: { Authorization: user.uid }
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      toast.success("Plant deleted successfully");
      navigate("/dashboard");

    } catch (err) {
      toast.error("Failed to delete plant");
      setIsDeleteModalOpen(false);
    }
  };

  const handleExport = async () => {
    try {
      const toastId = toast.loading("Preparing download...");

      const res = await fetch(
        `/api/plants/${id}/export`,
        {
          headers: {
            Authorization: user.uid,
          },
        }
      );

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();

      // Create filename with date if available
      const dateStr = plant?.created_at
        ? new Date(plant.created_at).toISOString().split('T')[0]
        : 'report';
      const filename = `plant-analysis-${dateStr}-${id}.md`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.update(toastId, { render: "Export downloaded!", type: "success", isLoading: false, autoClose: 3000 });

    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to export markdown");
    }
  }

  // Format analysis text to handle "Demo Mode" nicely
  const isDemoError = plant?.analysis?.includes("Demo Mode");

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 font-sans text-gray-100">
      <Navbar />

      <main className="flex-grow pt-28 px-6 pb-12 w-full max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !plant || plant.detail ? (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="text-6xl mb-4">🥀</div>
            <h2 className="text-2xl font-bold text-white mb-2">Plant Not Found</h2>
            <p className="text-gray-400">The plant analysis you are looking for does not exist.</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 btn-secondary"
            >
              Return Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-slide-up">
            {/* Left Column: Image & Actions */}
            <div className="space-y-6">
              <div className="glass-card p-2 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                <img
                  src={plant.image}
                  alt="Plant"
                  className="w-full h-auto rounded-xl object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="glass-card p-6 flex flex-col gap-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  ⚡ Actions
                </h3>
                <div className="flex gap-4">
                  <button
                    onClick={handleExport}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 group"
                  >
                    <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                    Export Report
                  </button>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Analysis */}
            <div className="glass-card p-8 h-fit relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                    Analysis Result
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">AI-powered diagnosis</p>
                </div>

                {plant.created_at && (
                  <div className="text-right">
                    <span className="block text-xs text-gray-500 uppercase tracking-wider font-semibold">Analyzed on</span>
                    <span className="text-sm text-gray-300">
                      {new Date(plant.created_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className={`prose prose-invert max-w-none leading-relaxed whitespace-pre-wrap ${isDemoError ? "p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200" : "text-gray-300"
                }`}>
                {isDemoError && (
                  <div className="flex items-center gap-2 mb-2 text-yellow-400 font-bold">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Analysis Limit Reached</span>
                  </div>
                )}
                {plant.analysis}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Plant?"
        type="danger"
      >
        <p className="mb-6">
          Are you sure you want to delete this plant analysis? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
          >
            Yes, Delete it
          </button>
        </div>
      </Modal>
    </div>
  );
}
