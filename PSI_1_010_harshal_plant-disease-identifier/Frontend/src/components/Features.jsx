const features = [
  {
    icon: "🔬",
    title: "AI Detection",
    description: "State-of-the-art Gemini AI models analyze leaf patterns to identify diseases with high accuracy.",
    color: "from-green-400 to-green-600"
  },
  {
    icon: "📸",
    title: "Instant Upload",
    description: "Simply snap a photo or upload from your gallery. We handle the image processing instantly.",
    color: "from-blue-400 to-blue-600"
  },
  {
    icon: "⚡",
    title: "Real-time Results",
    description: "Get detailed diagnosis reports in seconds, enabling immediate action for your crops.",
    color: "from-purple-400 to-purple-600"
  },
  {
    icon: "🌾",
    title: "Farmer Focused",
    description: "Designed with simplicity in mind. No technical expertise required to protect your harvest.",
    color: "from-orange-400 to-orange-600"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Why Choose <span className="text-gradient">PlantDoctor?</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Our platform combines advanced technology with agricultural expertise to provide the best care for your plants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass p-8 rounded-2xl hover:transform hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
