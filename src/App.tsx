import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import GetAssessed from "./pages/GetAssessed";
import RequestAssessment from "./pages/RequestAssessment";
import Auth from "./pages/Auth";
import MySkillProfile from "./pages/MySkillProfile";
import StudentProfiles from "./pages/StudentProfiles";
import PaymentSuccess from "./pages/PaymentSuccess";
import TakeAssessment from "./pages/TakeAssessment";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { AdminRoute } from "./components/AdminRoute";

const queryClient = new QueryClient();

const App = () => {
  console.log("🚀 App component rendering...");

  // Debug environment variables
  console.log("🔧 Environment variables check:");
  console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL ? "✅ Present" : "❌ Missing");
  console.log("VITE_SUPABASE_PUBLISHABLE_KEY:", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "✅ Present" : "❌ Missing");
  console.log("NODE_ENV:", import.meta.env.NODE_ENV);
  console.log("MODE:", import.meta.env.MODE);

  // Debug Supabase client initialization
  try {
    console.log("🔗 Checking Supabase client...");
    console.log("Supabase client object:", supabase ? "✅ Available" : "❌ Null");
    console.log("🔗 Supabase client initialized successfully");
  } catch (error) {
    console.error("❌ Supabase client initialization failed:", error);
  }

  console.log("🔄 BrowserRouter and Routes rendering...");

  try {
    console.log("🚀 Rendering JSX structure...");
    const jsx = (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/get-assessed" element={<GetAssessed />} />
              <Route path="/request-assessment" element={<RequestAssessment />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/my-skill-profile" element={<MySkillProfile />} />
              <Route path="/profiles" element={<StudentProfiles />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/take-assessment/:assessmentId" element={<TakeAssessment />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
    console.log("✅ JSX structure created successfully");
    return jsx;
  } catch (error) {
    console.error("❌ Error during JSX rendering:", error);
    return <div>Error rendering app</div>;
  }
};

export default App;
