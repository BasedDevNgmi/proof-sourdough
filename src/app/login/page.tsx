"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { StarterBubbles } from "@/components/ui/starter-bubbles";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        router.replace("/");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.replace("/");
      }
    }
    setSubmitting(false);
  }

  async function handleMagicLink() {
    setError("");
    if (!email) {
      setError("Enter your email first");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setSubmitting(false);
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) setError(error.message);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <StarterBubbles />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        {/* Branding */}
        <div className="text-center mb-10">
          <h1
            className="font-[family-name:var(--font-playfair)] text-4xl font-semibold tracking-tight"
            style={{ color: "var(--text)" }}
          >
            {["P", "r", "o", "o", "f"].map((letter, i) => (
              <motion.span
                key={i}
                className="inline-block"
                animate={{ y: [0, -3, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            Good bread takes time. So do we.
          </p>
        </div>

        {magicLinkSent ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border-subtle)" }}
          >
            <p className="text-lg font-medium mb-2" style={{ color: "var(--text)" }}>Check your email</p>
            <p className="text-sm px-6" style={{ color: "var(--text-muted)" }}>
              We sent a magic link to <strong style={{ color: "var(--text)" }}>{email}</strong>
            </p>
            <button
              type="button"
              onClick={() => setMagicLinkSent(false)}
              className="mt-4 text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              Use a different method
            </button>
          </motion.div>
        ) : (
          <>
            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-colors mb-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-ghost)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailLogin} className="space-y-3">
              {mode === "signup" && (
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text)" }}
              />

              {error && (
                <p className="text-xs text-rose-400 px-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
              >
                {submitting ? "..." : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            {/* Magic link */}
            <button
              type="button"
              onClick={handleMagicLink}
              className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "var(--accent-surface)", color: "var(--accent)" }}
            >
              Skip the password, use a magic link
            </button>

            {/* Toggle mode */}
            <p className="text-center mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
              {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                className="font-medium"
                style={{ color: "var(--accent)" }}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
