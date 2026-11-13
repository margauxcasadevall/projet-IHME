import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { api } from "../api.js";
import Brand from "./Brand.jsx";

export default function AuthScreen({ onLogin, initialError }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api(`/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify(form)
      });
      onLogin(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-art">
        <div className="auth-art-top"><Brand /></div>
        <div className="art-copy">
          <span className="eyebrow light">ZOU! · ESPACE ADHÉRENTS</span>
          <h1>Sorties<br /><em>outdoor.</em></h1>
          <p>Randonnée, course, trail et vélo entre adhérents.</p>
        </div>
        <div className="art-caption"><span>RANDONNÉE</span><span>COURSE · TRAIL · VÉLO</span></div>
      </div>
      <section className="auth-panel">
        <div className="mobile-brand"><Brand /></div>
        <div className="auth-form-wrap">
          <span className="eyebrow"><span className="eyebrow-dot" /> ESPACE ADHÉRENTS</span>
          <h2>{mode === "login" ? "Connexion" : "Créer un compte"}</h2>
          <p className="auth-subtitle">{mode === "login" ? "Accédez aux sorties et à vos inscriptions." : "Inscrivez-vous pour accéder aux sorties."}</p>
          <div className="auth-tabs" role="tablist" aria-label="Connexion ou inscription">
            <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Connexion</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Créer un compte</button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && (
              <label>
                Votre nom
                <input required minLength="2" maxLength="80" autoComplete="name" placeholder="Camille Martin" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
              </label>
            )}
            <label>
              Adresse e-mail
              <input required type="email" autoComplete="email" placeholder="vous@exemple.fr" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              Mot de passe
              <input required type="password" minLength="8" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="8 caractères minimum" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </label>
            {(error || initialError) && <div className="form-error" role="alert">{error || initialError}</div>}
            <button className="button button-dark auth-submit" disabled={busy}>
              {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"} <ArrowRight size={17} />
            </button>
          </form>
          <aside className="demo-credentials" aria-label="Identifiants de démonstration">
            <p>Compte de démonstration partagé</p>
            <span>E-mail <code>demo@zou.fr</code></span>
            <span>Mot de passe <code>ZouDemo2026!</code></span>
          </aside>
        </div>
      </section>
    </main>
  );
}
