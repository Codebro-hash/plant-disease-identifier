import { useEffect, useState, useContext } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import UploadButton from "../components/UploadButton";
import PlantList from "../components/PlantList";
import ImageUploadModal from "../components/ImageUploadModal";
import { fetchPlants } from "../services/api";
import { AlertTriangle, Search } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadPlants = async () => {
      try {
        if (!user) return; // Wait for user
        const data = await fetchPlants(user.uid);
        setPlants(data || []);
      } catch (err) {
        console.error(err);
        setError("Unable to connect to the backend. Please ensure the server is running.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPlants();
    }
  }, [user]);

  const filteredPlants = plants.filter((plant) =>
    plant.analysis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 font-sans">
      <Navbar />

      <main className="flex-grow pt-28 px-6 pb-12 w-full max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 animate-slide-up">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Dashboard
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">
              Monitor your crops, analyze health, and get AI-powered treatment suggestions.
            </p>
          </div>

          <div className="shrink-0">
            <UploadButton onClick={() => setShowModal(true)} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative max-w-md animate-fade-in">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search your plants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
          />
        </div>

        {/* Upload modal */}
        {showModal && (
          <ImageUploadModal onClose={() => setShowModal(false)} />
        )}

        {/* Content Area */}
        <div className="min-h-[400px]">
          {loading ? (
            /* Skeleton Loader */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-slate-800/50 rounded-2xl h-[340px] border border-white/5">
                  <div className="h-48 bg-slate-700/50 rounded-t-2xl mb-4"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-slate-700/50 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="glass-card p-12 text-center border-red-500/20 bg-red-500/5 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Connection Error</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                Retry Connection
              </button>
            </div>
          ) : filteredPlants.length > 0 ? (
            /* Plants List */
            <PlantList plants={filteredPlants} />
          ) : (
            /* Empty or No Search Results State */
            <div className="glass-card p-12 text-center animate-fade-in">
              <div className="text-6xl mb-4">{searchQuery ? "🔍" : "🌱"}</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {searchQuery ? "No matching results" : "No Plants Analyzed Yet"}
              </h3>
              <p className="text-gray-400">
                {searchQuery
                  ? `We couldn't find any results for "${searchQuery}"`
                  : "Upload your first plant photo to get started with disease detection."}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
