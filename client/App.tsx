import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/Category";
import WatchPage from "./pages/Watch";
import { Header } from "./components/layout/Header";
import { Splash } from "./components/layout/Splash";
import { Footer } from "./components/layout/Footer";

const queryClient = new QueryClient();

const RouteSpacer = () => {
  const location = useLocation();
  // spacer height equals header height; hide on watch pages
  if (location.pathname && location.pathname.startsWith('/watch')) return null;
  return <div className="h-16" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Splash />
        <Header />
        {/* spacer to account for fixed header height on non-watch routes */}
        <RouteSpacer />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/watch/:id" element={<WatchPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
