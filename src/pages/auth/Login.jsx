import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import StoreLogo from "../../components/common/StoreLogo";
import { toast } from "../../components/common/ToastNotification";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await login(email, password);
      toast.success(`Welcome back, ${session.name}.`);
      navigate("/");
    } catch (err) {
      setError(err?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-8">
          <StoreLogo size="lg" />
        </div>
        <h1 className="text-3xl font-black text-text tracking-tight">Store Management</h1>
        <p className="mt-2 text-sm text-muted font-medium">Inventory, supplies, and store requests</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          {error && (
            <div className="mb-4 bg-danger-muted border border-danger/20 p-3 rounded-md flex items-center gap-2">
              <AlertCircle size={16} className="text-danger" />
              <p className="text-sm text-danger">{String(error)}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-muted">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full border border-border rounded-lg py-2.5 px-3 placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1 block w-full border border-border rounded-lg py-2.5 px-3 placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand sm:text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <Link to="/forgot-password" className="text-sm font-medium text-brand hover:text-brand-hover">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
