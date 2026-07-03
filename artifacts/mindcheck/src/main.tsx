import React from "react";
import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";

import "./index.css";

// Backend URL
setBaseUrl("http://localhost:8080");

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);