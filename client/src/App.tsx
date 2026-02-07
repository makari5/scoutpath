import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import Profile from "@/pages/profile";
import Dashboard from "@/pages/dashboard";
import CourseHome from "@/pages/course-home";
import CourseRead from "@/pages/course-read";
import CourseExams from "@/pages/course-exams";
import CourseExam from "@/pages/course-exam";
import CourseResult from "@/pages/course-result";
import CourseCertificate from "@/pages/course-certificate";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/profile" component={Profile} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/course/:id" component={CourseHome} />
      <Route path="/course/:id/part/:partId" component={CourseRead} />
      <Route path="/course/:id/exams" component={CourseExams} />
      <Route path="/course/:id/exam/:partId" component={CourseExam} />
      <Route path="/course/:id/result/:partId" component={CourseResult} />
      <Route path="/course/:id/certificate" component={CourseCertificate} />
      <Route component={NotFound} />
    </Switch>
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
