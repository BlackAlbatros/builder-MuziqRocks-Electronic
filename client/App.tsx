import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/Category";
import WatchPage from "./pages/Watch";
import { Header } from "./components/layout/Header";
import { Splash } from "./components/layout/Splash";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const setupBackButton = async () => {
      if (Capacitor?.isNativePlatform?.()) {
        try {
          const core = await import("@capacitor/core");
          const AppClass = (core as any).App;
          if (AppClass?.addListener) {
            const listener = AppClass.addListener(
              "backButton",
              ({ canGoBack }: { canGoBack: boolean }) => {
                if (canGoBack || window.location.pathname !== "/") {
                  navigate(-1);
                }
              },
            );
            return () => listener?.remove?.();
          }
        } catch (err) {
          console.warn("Back button handler setup failed", err);
        }
      }
    };
    const cleanup = setupBackButton();
    return () => {
      cleanup?.then?.((fn) => fn?.());
    };
  }, [navigate]);

  return (
    <>
      <Splash />
      <Header />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/watch/:id" element={<WatchPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
