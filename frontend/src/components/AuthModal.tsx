import { FormEvent, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../api/supabase";
import { createProfile } from "../api/backend";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: Props) {
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshProfile } = useAuth();

  const ensureProfile = async (authUser: User, fallbackEmail: string, fallbackRole: UserRole, fallbackName?: string) => {
    const { data: existing, error: existingError } = await supabase.from("users").select("id").eq("id", authUser.id).maybeSingle();
    if (existingError) {
      throw existingError;
    }
    if (!existing) {
      await createProfile({
        user_id: authUser.id,
        email: authUser.email ?? fallbackEmail,
        role: fallbackRole,
        name: fallbackName
      });
    }
  };

  const onEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { role, full_name: name } }
        });
        if (authError) throw authError;
        if (data.user) {
          await ensureProfile(data.user, email, role, name);
        }
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        if (data.user) {
          const metaRole = data.user.user_metadata?.role;
          const safeRole: UserRole = metaRole === "FACULTY" ? "FACULTY" : "STUDENT";
          await ensureProfile(data.user, email, safeRole, data.user.user_metadata?.full_name);
        }
      }
      await refreshProfile();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError("");
      setLoading(true);
      const redirectTo = window.location.origin;
      localStorage.setItem("scholiq_pending_role", role);
      if (name.trim()) {
        localStorage.setItem("scholiq_pending_name", name.trim());
      } else {
        localStorage.removeItem("scholiq_pending_name");
      }
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, queryParams: { access_type: "offline", prompt: "consent" } }
      });
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Google sign in failed.");
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6">
            <h3 className="font-display text-2xl font-semibold text-fg">{isSignup ? "Create SCHOLIQ Account" : "Welcome Back"}</h3>
            <p className="mt-1 text-sm text-muted">Continue with Google or email/password.</p>
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="mt-4 w-full rounded-xl border border-white/15 bg-panel px-4 py-2 text-sm font-medium text-fg transition hover:border-accent disabled:opacity-70"
              type="button"
            >
              Continue with Google
            </button>
            <div className="mt-3">
              <p className="mb-2 text-xs text-muted">Google signup role:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("STUDENT")}
                  disabled={loading}
                  className={`rounded-lg px-3 py-2 text-sm ${role === "STUDENT" ? "bg-accent text-white" : "bg-panel text-fg"}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("FACULTY")}
                  disabled={loading}
                  className={`rounded-lg px-3 py-2 text-sm ${role === "FACULTY" ? "bg-accent text-white" : "bg-panel text-fg"}`}
                >
                  Faculty
                </button>
              </div>
            </div>
            <div className="my-4 text-center text-xs text-muted">or</div>
            <form className="space-y-3" onSubmit={onEmailSubmit}>
              {isSignup && (
                <>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/15 bg-panel px-3 py-2 text-fg outline-none focus:border-accent"
                    required
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    disabled={loading}
                    className="w-full rounded-xl border border-white/15 bg-panel px-3 py-2 text-fg outline-none focus:border-accent"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty</option>
                  </select>
                </>
              )}
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                disabled={loading}
                className="w-full rounded-xl border border-white/15 bg-panel px-3 py-2 text-fg outline-none focus:border-accent"
                required
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                disabled={loading}
                className="w-full rounded-xl border border-white/15 bg-panel px-3 py-2 text-fg outline-none focus:border-accent"
                required
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                disabled={loading}
                className="w-full rounded-xl bg-accent px-4 py-2 font-semibold text-white disabled:opacity-70"
                type="submit"
              >
                {loading ? "Please wait..." : isSignup ? "Sign up" : "Sign in"}
              </button>
            </form>
            <div className="mt-4 flex items-center justify-between text-sm text-muted">
              <button className="hover:text-fg disabled:opacity-60" disabled={loading} type="button" onClick={() => setIsSignup((v) => !v)}>
                {isSignup ? "Already have an account? Sign in" : "New here? Create account"}
              </button>
              <button className="hover:text-fg disabled:opacity-60" disabled={loading} type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
