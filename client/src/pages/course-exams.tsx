import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Lock, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import type { User } from "@shared/schema";
import { courses } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type CourseProgress = {
  startedAt?: number;
  readParts: number[];
  passedParts: number[];
  completedAt?: number;
};

const emptyProgress: CourseProgress = { readParts: [], passedParts: [] };

const addMonths = (ms: number, months: number) => {
  const d = new Date(ms);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
};

export default function CourseExams() {
  const [, params] = useRoute("/course/:id/exams");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  const currentStage = user?.currentStage === 7.5 ? 8 : user?.currentStage || 1;
  const isUnlocked = courseId <= currentStage;

  const trainingProgress = user?.trainingProgress ?? { courses: {}, completedCourses: [] };
  const courseProgress: CourseProgress =
    (trainingProgress.courses?.[String(courseId)] as CourseProgress | undefined) ??
    emptyProgress;

  const startedAt = courseProgress.startedAt;
  const expiresAt = startedAt ? addMonths(startedAt, 6) : null;
  const isExpired = expiresAt ? Date.now() > expiresAt : false;

  const legacyCompleted = courseId < currentStage;
  const passedParts = new Set(courseProgress.passedParts ?? []);
  const readParts = new Set(courseProgress.readParts ?? []);
  const totalParts = course?.parts?.length ?? 0;
  const maxPassed = courseProgress.passedParts?.length
    ? Math.max(...courseProgress.passedParts)
    : 0;
  const unlockedPartId = legacyCompleted ? totalParts : startedAt ? Math.min(maxPassed + 1, totalParts) : 0;

  const completedCourse =
    legacyCompleted ||
    trainingProgress.completedCourses?.includes(courseId) ||
    (totalParts > 0 && courseProgress.passedParts?.length === totalParts);

  const ensureStarted = useMemo(
    () => async () => {
      if (!user) return;
      if (!isUnlocked) return;
      if (startedAt) return;
      try {
        const res = await apiRequest("PATCH", `/api/users/${user.id}/training`, {
          courseId,
          startedAt: Date.now(),
          readParts: [],
          passedParts: [],
        });
        const data = await res.json();
        if (data?.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          setUser(data.user);
        }
      } catch (error: any) {
        toast({
          title: "حدث خطأ",
          description: error?.message || "تعذر بدء الدورة.",
          variant: "destructive",
        });
      }
    },
    [courseId, isUnlocked, startedAt, toast, user]
  );

  useEffect(() => {
    if (!user || !course) return;
    if (!isUnlocked) return;
    if (startedAt) return;
    ensureStarted();
  }, [course, ensureStarted, isUnlocked, startedAt, user]);

  useEffect(() => {
    if (completedCourse) {
      setLocation(`/course/${courseId}/certificate`);
    }
  }, [completedCourse, courseId, setLocation]);

  if (!user || !course) return null;

  if (!isUnlocked) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
        <Card className="relative max-w-md w-full p-10 text-center space-y-6 border-2 border-muted shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black">دورة مقفلة</h2>
            <p className="text-muted-foreground leading-relaxed">
              هذه الدورة غير متاحة حاليًا. سيتم فتحها عند وصولك للمرحلة {courseId}
            </p>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            className="w-full bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
            size="lg"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            العودة للوحة التحكم
          </Button>
        </Card>
      </div>
    );
  }

  const effectivePassed = legacyCompleted && course ? new Set(course.parts.map((p) => p.id)) : passedParts;
  const effectiveRead = legacyCompleted && course ? new Set(course.parts.map((p) => p.id)) : readParts;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-2/5" />

      <div className="sticky top-0 z-20 backdrop-blur-xl bg-card/90 border-b-2 border-primary/30 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation(`/course/${courseId}`)}
              className="hover-elevate font-bold"
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              العودة
            </Button>
            <div className="flex-1 min-w-0 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <h1 className="text-lg md:text-2xl font-black truncate">امتحانات {course.title}</h1>
            </div>
            <div className="flex-shrink-0">
              <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black border-0 shadow-lg font-bold">
                جارية
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto p-4 pb-12 space-y-6">
        <Card className="p-6 border-2 border-primary/30 shadow-xl bg-gradient-to-br from-card to-primary/5">
          <div className="mb-5">
            <h3 className="text-xl font-black flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              قائمة الامتحانات
            </h3>
          </div>

          <div className="space-y-3">
            {course.parts.map((part) => {
              const canExam =
                effectiveRead.has(part.id) &&
                !effectivePassed.has(part.id) &&
                !isExpired &&
                part.id <= unlockedPartId;

              const done = effectivePassed.has(part.id);

              return (
                <Card
                  key={part.id}
                  className={`p-4 border transition-all ${
                    canExam ? "border-primary/30 cursor-pointer hover:shadow-lg" : "border-muted opacity-70"
                  }`}
                  onClick={() => canExam && setLocation(`/course/${courseId}/exam/${part.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{part.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {done
                          ? "تم اجتياز الامتحان"
                          : canExam
                          ? "الامتحان متاح"
                          : "اقرأ الجزء أولًا لفتح الامتحان"}
                      </p>
                    </div>
                    {done ? (
                      <CheckCircle2 className="w-6 h-6 text-chart-4" />
                    ) : canExam ? (
                      <Badge className="bg-gradient-to-r from-primary to-chart-4 text-white border-0 font-bold">
                        متاح
                      </Badge>
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
