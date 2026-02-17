import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-screen flex items-center">

      {/* Background Blobs - utilizing custom animation */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Protect Your Crops <br />
            <span className="text-gradient">With AI Precision</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Instantly detect plant diseases by uploading a simple photo.
            Get accurate diagnosis and treatment recommendations in seconds.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link to="/dashboard" className="btn-primary w-full md:w-auto">
              Start Diagnosis
            </Link>
            <a href="#features" className="btn-secondary w-full md:w-auto">
              Learn More
            </a>
          </div>
        </div>

        {/* Hero Image / Illustration Placeholder */}
        <div className="mt-16 relative animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 bottom-0 h-20"></div>
          <div className="glass-card p-4 mx-auto max-w-4xl rotate-1 hover:rotate-0 transition-transform duration-500">
            <img
              src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="Healthy Plant Analysis"
              className="rounded-xl w-full object-cover shadow-2xl h-[400px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
