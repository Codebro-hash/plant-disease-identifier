import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-toastify";
import { UserPlus, Mail, Lock, Loader2, CheckCircle2 } from "lucide-react";

export default function SignupForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!email || !password) {
      toast.warning("All fields are required");
      return;
    }

    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);

      toast.success("Account created successfully! 🎉");
      // Short delay before redirect
      setTimeout(() => navigate("/login"), 1500);

    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        toast.error("Email is already registered");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password is too weak");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email format");
      } else {
        toast.error("Signup failed. Please try again.");
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
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
          <UserPlus className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">Create Account</h2>
        <p className="text-gray-400 mt-2">Join us and keep your plants healthy</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-gray-300 mb-2 text-sm font-medium ml-1">Email Address</label>
          <div className="relative group">
            <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-400 transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full bg-slate-900/50 border border-slate-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 mb-2 text-sm font-medium ml-1">Password</label>
          <div className="relative group">
            <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-400 transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-900/50 border border-slate-700/50 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 ml-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Must be at least 6 characters
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 mt-8 flex justify-center items-center gap-2 ${loading ? "opacity-75 cursor-not-allowed" : ""
          }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            <span>Sign Up</span>
            <UserPlus className="w-5 h-5" />
          </>
        )}
      </button>

      <div className="mt-8 text-center pt-6 border-t border-white/5">
        <p className="text-gray-400 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </form>
  );
}
