import { Link } from "react-router-dom";

export default function PlantCard({ plant }) {
  // Truncate analysis text if too long
  const truncateText = (text, length) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  return (
    <div className="glass-card overflow-hidden group hover:shadow-green-500/20 transition-all duration-300">
      <Link to={`/plants/${plant.id}`} className="block relative overflow-hidden">
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={plant.image}
            alt="Plant"
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/300x200?text=No+Image";
            }}
          />
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg border border-white/30 font-medium">
            View Details
          </span>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          {/* Attempt to parse title from analysis or use a default */}
          <h3 className="text-lg font-semibold text-white truncate w-full">
            {plant.analysis ? plant.analysis.split('\n')[0].substring(0, 30) : 'Plant Analysis'}...
          </h3>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {truncateText(plant.analysis, 100)}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-700">
          {plant.created_at && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              📅 {new Date(plant.created_at).toLocaleDateString()}
            </span>
          )}

          <Link
            to={`/plants/${plant.id}`}
            className="text-green-400 text-sm font-medium hover:text-green-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
          >
            Read More →
          </Link>
        </div>
      </div>
    </div>
  );
}
