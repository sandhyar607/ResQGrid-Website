import React, { useEffect, useState } from "react";

const API = "http://127.0.0.1:5177/api/auth";
const STORAGE_KEY = "resqgrid.session";
const LOGIN_URL = "http://127.0.0.1:5173/login.html";
const PUBLIC_URL = "http://127.0.0.1:5173/public-dashboard.html";

function tokenForThisTab() {
  if (typeof window === "undefined") return "";
  const handoff = new URLSearchParams(window.location.hash.slice(1)).get("rq-session");
  if (handoff) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: handoff }));
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    return handoff;
  }
  const tabToken = window.name.startsWith("resqgrid-session:") ? window.name.slice("resqgrid-session:".length) : "";
  if (tabToken) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: tabToken }));
    return tabToken;
  }
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (stored?.token) return stored.token;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return "";
}

export function readSessionToken() {
  return tokenForThisTab();
}

export async function signOutGovernment() {
  const token = tokenForThisTab();
  try {
    if (token) await fetch(`${API}/signout`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(2000) });
  } catch {
    // Clear the local session even if the API is unavailable.
  } finally {
    window.localStorage.removeItem(STORAGE_KEY);
    window.name = "";
    window.location.replace(LOGIN_URL);
  }
}

export function GovernmentAuthGate({ children }) {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let active = true;
    const token = tokenForThisTab();
    if (!token) {
      window.location.replace(LOGIN_URL);
      return () => { active = false; };
    }
    void fetch(`${API}/session`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(7000) })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (!active) return;
        if (response.ok && String(data.user?.role || "").startsWith("Government Officer")) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: data.user }));
          setVerified(true);
        } else if (response.ok && data.user?.role !== undefined) {
          window.location.replace(PUBLIC_URL);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
          window.name = "";
          window.location.replace(LOGIN_URL);
        }
      })
      .catch(() => { if (active) window.location.replace(LOGIN_URL); });
    return () => { active = false; };
  }, []);

  if (!verified) return <div className="auth-check" role="status" aria-label="Verifying government account" />;
  return children;
}
