"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

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
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--paper)",
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          border: "2px solid var(--hairline)",
          borderTopColor: "var(--accent)",
          animation: "spin 1s linear infinite",
        }} />
      </div>
    );
  }

  if (user) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    fontFamily: "var(--serif-body)",
    fontSize: 15,
    padding: "14px 0",
    background: "transparent",
    border: "none",
    borderBottom: ".5px solid var(--hairline)",
    color: "var(--ink)",
    outline: "none",
    transition: "border-color .2s ease",
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 var(--pad-x)",
      background: "var(--paper)",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h1 style={{
            fontFamily: "var(--serif-display)",
            fontWeight: 300,
            fontSize: 64,
            letterSpacing: "-.03em",
            lineHeight: .9,
            color: "var(--ink)",
            margin: 0,
          }}>
            Proof
          </h1>
          <p className="italic" style={{
            fontFamily: "var(--serif-display)",
            fontSize: 17,
            color: "var(--muted)",
            marginTop: 10,
          }}>
            — a sourdough journal
          </p>
          <p style={{
            fontSize: 14,
            color: "var(--muted-2)",
            marginTop: 14,
            lineHeight: 1.5,
          }}>
            Good bread takes time. So do we.
          </p>
        </div>

        {magicLinkSent ? (
          <div style={{
            textAlign: "center",
            padding: "40px 28px",
            border: ".5px solid var(--hairline)",
            background: "var(--card)",
          }}>
            <h2 style={{
              fontFamily: "var(--serif-display)",
              fontSize: 24,
              fontWeight: 400,
              marginBottom: 12,
            }}>
              Check your email
            </h2>
            <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.5 }}>
              We sent a magic link to <strong style={{ color: "var(--ink)" }}>{email}</strong>
            </p>
            <button
              type="button"
              onClick={() => setMagicLinkSent(false)}
              className="btn-link"
              style={{ marginTop: 20, fontSize: 14 }}
            >
              Use a different method
            </button>
          </div>
        ) : (
          <>
            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "14px 0",
                fontFamily: "var(--serif-display)",
                fontSize: 16,
                color: "var(--ink)",
                background: "var(--card)",
                border: ".5px solid var(--hairline)",
                cursor: "default",
                transition: "background .2s ease",
                marginBottom: 28,
              }}
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
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              margin: "28px 0",
            }}>
              <span style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
              <span className="mono" style={{
                fontSize: 10,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                color: "var(--muted-2)",
              }}>
                or
              </span>
              <span style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {mode === "signup" && (
                <div style={{ marginBottom: 4 }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>Name</div>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    style={inputStyle}
                  />
                </div>
              )}
              <div style={{ marginBottom: 4, marginTop: mode === "signup" ? 20 : 0 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Email</div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 4, marginTop: 20 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Password</div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={inputStyle}
                />
              </div>

              {error && (
                <p style={{
                  fontSize: 13,
                  color: "var(--rose)",
                  marginTop: 12,
                }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn"
                style={{
                  marginTop: 28,
                  width: "100%",
                  justifyContent: "center",
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                {submitting ? "..." : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            {/* Magic link */}
            <button
              type="button"
              onClick={handleMagicLink}
              className="btn-ghost"
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: 12,
                fontSize: 14,
              }}
            >
              Skip the password, use a magic link
            </button>

            {/* Toggle mode */}
            <p style={{
              textAlign: "center",
              marginTop: 32,
              fontSize: 15,
              color: "var(--muted)",
            }}>
              {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                className="btn-link"
                style={{ fontSize: 15 }}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
