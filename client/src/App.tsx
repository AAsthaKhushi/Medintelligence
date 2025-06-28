import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import Prescriptions from "@/pages/Prescriptions";
import Timeline from "@/pages/timeline";
import Medications from "@/pages/Medications";
import Schedule from "@/pages/Schedule";
import { Header } from "@/components/layout/header";

function Router() {
  return (
    <>
      <Header />
    <Switch>
      <Route path="/" component={Dashboard} />
        <Route path="/prescriptions" component={Prescriptions} />
        <Route path="/timeline" component={Timeline} />
        <Route path="/medications" component={Medications} />
        <Route path="/schedule" component={Schedule} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
