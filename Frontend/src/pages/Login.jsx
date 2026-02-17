import LoginForm from "../components/LoginForm";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="mb-8 text-center animate-fade-in">
        <Link to="/" className="inline-block">
          <h1 className="text-4xl font-bold text-white mb-2">🌱 PlantDoctor</h1>
        </Link>
        <p className="text-gray-300">Welcome back! Please login to your account.</p>
      </div>
      <LoginForm />
    </div>
  );
}
