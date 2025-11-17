import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const GetAssessed = lazy(() => import("./pages/GetAssessed"));
const RequestAssessment = lazy(() => import("./pages/RequestAssessment"));
const Auth = lazy(() => import("./pages/Auth"));
const MySkillProfile = lazy(() => import("./pages/MySkillProfile"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const TakeAssessment = lazy(() => import("./pages/TakeAssessment"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/get-assessed" element={<GetAssessed />} />
            <Route path="/request-assessment" element={<RequestAssessment />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/my-skill-profile" element={<MySkillProfile />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/take-assessment/:assessmentId" element={<TakeAssessment />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
