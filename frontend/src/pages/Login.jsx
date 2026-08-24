import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : "/complaints");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in to the register"
      subtitle="For residents and the society office."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="text-brand-dark font-semibold underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-body font-semibold uppercase tracking-wide text-inkfaint">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-sm border border-line bg-card px-3 py-2 text-sm font-body"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-xs font-body font-semibold uppercase tracking-wide text-inkfaint">
            Password
          </label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1 w-full rounded-sm border border-line bg-card px-3 py-2 text-sm font-body"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-brick font-body">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-brand text-paper font-body font-semibold py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
