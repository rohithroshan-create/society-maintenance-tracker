import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", flatNumber: "", adminCode: "" });
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === "admin" ? "/admin" : "/complaints");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Join the register"
      subtitle="Create your resident account."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="text-brand-dark font-semibold underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-body font-semibold uppercase tracking-wide text-inkfaint">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-sm border border-line bg-card px-3 py-2 text-sm font-body"
            placeholder="Asha Menon"
          />
        </div>
        <div className="grid grid-cols-[1fr,90px] gap-3">
          <div>
            <label className="text-xs font-body font-semibold uppercase tracking-wide text-inkfaint">Email</label>
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
            <label className="text-xs font-body font-semibold uppercase tracking-wide text-inkfaint">Flat</label>
            <input
              value={form.flatNumber}
              onChange={(e) => setForm({ ...form, flatNumber: e.target.value })}
              className="mt-1 w-full rounded-sm border border-line bg-card px-3 py-2 text-sm font-body"
              placeholder="B-402"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-body font-semibold uppercase tracking-wide text-inkfaint">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1 w-full rounded-sm border border-line bg-card px-3 py-2 text-sm font-body"
            placeholder="At least 6 characters"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAdminCode((s) => !s)}
          className="text-xs font-body text-inkfaint underline"
        >
          {showAdminCode ? "Registering as a resident" : "Society office staff? Register as admin"}
        </button>
        {showAdminCode && (
          <div>
            <label className="text-xs font-body font-semibold uppercase tracking-wide text-inkfaint">
              Admin code
            </label>
            <input
              value={form.adminCode}
              onChange={(e) => setForm({ ...form, adminCode: e.target.value })}
              className="mt-1 w-full rounded-sm border border-line bg-card px-3 py-2 text-sm font-body"
              placeholder="Provided by the society"
            />
          </div>
        )}

        {error && <p className="text-sm text-brick font-body">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-brand text-paper font-body font-semibold py-2.5 hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
