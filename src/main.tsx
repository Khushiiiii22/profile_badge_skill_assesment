import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("🚀 Starting app initialization...");
console.log("Environment variables:", {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

try {
  const rootElement = document.getElementById("root");
  console.log("Root element found:", rootElement);

  const root = createRoot(rootElement!);
  console.log("Root created, rendering App...");

  root.render(<App />);
  console.log("✅ App rendered successfully");
} catch (error) {
  console.error("❌ Error during app initialization:", error);
}
