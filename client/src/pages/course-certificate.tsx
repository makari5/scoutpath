import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import type { User } from "@shared/schema";
import { courses } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type CourseProgress = {
  startedAt?: number;
  readParts: number[];
  passedParts: number[];
  completedAt?: number;
};

const emptyProgress: CourseProgress = { readParts: [], passedParts: [] };

export default function CourseCertificate() {
  const [, params] = useRoute("/course/:id/certificate");
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);

  const courseId = params?.id ? parseInt(params.id, 10) : 0;
  const course = courses.find((c) => c.id === courseId);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await apiRequest("GET", `/api/users/${user.id}`);
        const data = await res.json();
        if (data?.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          setUser(data.user);
        }
      } catch {
        return;
      }
    })();
  }, [user?.id]);

  if (!user || !course) return null;

  const currentStage = user.currentStage === 7.5 ? 8 : user.currentStage || 1;
  const legacyCompleted = courseId < currentStage;

  const trainingProgress = user.trainingProgress ?? { courses: {}, completedCourses: [] };
  const courseProgress: CourseProgress =
    (trainingProgress.courses?.[String(courseId)] as CourseProgress | undefined) ??
    emptyProgress;

  const completedCourse =
    legacyCompleted ||
    trainingProgress.completedCourses?.includes(courseId) ||
    (course.parts.length > 0 && courseProgress.passedParts?.length === course.parts.length);

  if (!completedCourse) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
        <Card className="relative max-w-md w-full p-10 text-center space-y-6 border-2 border-muted shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black">الشهادة غير متاحة بعد</h2>
            <p className="text-muted-foreground leading-relaxed">
              يجب اجتياز جميع أجزاء الدورة أولًا.
            </p>
          </div>
          <Button
            onClick={() => setLocation(`/course/${courseId}`)}
            className="w-full bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
            size="lg"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            العودة للدورة
          </Button>
        </Card>
      </div>
    );
  }

  const certificateSrc = `/${courseId}.jpg`;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-2/5" />

      <div className="relative max-w-6xl mx-auto p-4 pb-12">
        <Card className="p-6 md:p-8 space-y-6 bg-gradient-to-br from-card to-primary/5 border-2 border-primary/20 shadow-xl">
          <div className="text-center space-y-2">
            <h3 className="text-2xl md:text-3xl font-black">شهادة إتمام الدورة</h3>
            <p className="text-muted-foreground font-medium">{course.title}</p>
          </div>

          <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-2xl border-2 border-primary/20 shadow-2xl bg-muted/10">
            <img
              src={certificateSrc}
              alt={`certificate-${courseId}`}
              className="w-full h-auto block"
              loading="lazy"
            />
            <div className="absolute left-0 right-0 font-black pointer-events-none" style={{ top: "46%" }}>
              <div className="mx-auto w-[92%]" dir="rtl">
                <div
                  className="text-base md:text-2xl leading-tight text-center"
                  style={{ color: "#1e3a8a", textShadow: "0 2px 10px rgba(255,255,255,0.8)", marginRight: "22%" }}
                >
                  {user.name}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => setLocation("/dashboard")}
              className="bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              رجوع للدورات
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
