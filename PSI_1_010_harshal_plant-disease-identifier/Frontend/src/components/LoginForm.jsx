import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-toastify";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Validation
    if (!email || !password) {
      toast.warning("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back! 👋");
      navigate("/dashboard");

    } catch (error) {
      console.error(error);
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        toast.error("Invalid email or password");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many failed attempts. Try again later.");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card p-8 w-full max-w-md animate-slide-up relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
          <LogIn className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
        <p className="text-gray-400 mt-2">Sign in to continue your plant care journey</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-gray-300 mb-2 text-sm font-medium ml-1">Email Address</label>
          <div className="relative group">
            <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-400 transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full bg-slate-900/50 border border-slate-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 placeholder-gray-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 mb-2 text-sm font-medium ml-1">Password</label>
          <div className="relative group">
            <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-green-400 transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-900/50 border border-slate-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 placeholder-gray-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end mt-2">
            <a href="#" className="text-xs text-green-400 hover:text-green-300 transition-colors">Forgot password?</a>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full btn-primary mt-8 flex justify-center items-center gap-2 ${loading ? "opacity-75 cursor-not-allowed" : ""
          }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Signing In...
          </>
        ) : (
          <>
            <span>Sign In</span>
            <LogIn className="w-5 h-5" />
          </>
        )}
      </button>

      <div className="mt-8 text-center pt-6 border-t border-white/5">
        <p className="text-gray-400 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-green-400 hover:text-green-300 font-semibold transition-colors hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </form>
  );
}
