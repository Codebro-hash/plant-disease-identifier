import PlantCard from "./PlantCard";

export default function PlantList({ plants }) {
  if (!plants.length) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <div className="text-6xl mb-4">🌱</div>
        <h3 className="text-2xl font-bold text-white mb-2">No Plants Analyzed Yet</h3>
        <p className="text-gray-400">
          Upload your first plant photo to get started with disease detection.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
      {plants.map((plant) => (
        <PlantCard key={plant.id} plant={plant} />
      ))}
    </div>
  );
}
