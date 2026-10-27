import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erreur d’affichage de l’application Zou! :", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="loading-screen" role="alert">
          <h1>La page a rencontré une erreur.</h1>
          <p>{this.state.error.message || "Erreur d’affichage inconnue."}</p>
          <p>Rechargez l’application pour réessayer. Si le problème revient, transmettez ce message au support.</p>
          <button className="button button-dark" onClick={() => window.location.reload()}>Recharger</button>
        </main>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </React.StrictMode>
);
