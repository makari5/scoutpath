import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, Lock, Sparkles } from "lucide-react";
import type { CoursePart, User } from "@shared/schema";
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

export default function CourseRead() {
  const [, params] = useRoute("/course/:id/part/:partId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);

  const courseId = params?.id ? parseInt(params.id, 10) : 0;
  const partId = params?.partId ? parseInt(params.partId, 10) : 0;
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
  const isCourseUnlocked = courseId <= currentStage;

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
    legacyCompleted || (totalParts > 0 && courseProgress.passedParts?.length === totalParts);

  const activePart: CoursePart | undefined = course?.parts.find((p) => p.id === partId);
  const effectivePassedParts = legacyCompleted && course ? new Set(course.parts.map((p) => p.id)) : passedParts;
  const effectiveReadParts = legacyCompleted && course ? new Set(course.parts.map((p) => p.id)) : readParts;
  const canViewPart =
    !!activePart && !!startedAt && !isExpired && activePart.id <= unlockedPartId;

  const ensureStarted = useMemo(
    () => async () => {
      if (!user) return;
      if (!isCourseUnlocked) return;
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
    [courseId, isCourseUnlocked, startedAt, toast, user]
  );

  useEffect(() => {
    if (!user || !course) return;
    if (!isCourseUnlocked) return;
    if (startedAt) return;
    ensureStarted();
  }, [course, ensureStarted, isCourseUnlocked, startedAt, user]);

  useEffect(() => {
    if (completedCourse) {
      setLocation(`/course/${courseId}/certificate`);
    }
  }, [completedCourse, courseId, setLocation]);

  if (!user || !course || !activePart) return null;

  const markAsRead = async (part: CoursePart) => {
    if (!startedAt || isExpired) return;
    if (!readParts.has(part.id)) {
      const nextRead = Array.from(new Set([...(courseProgress.readParts ?? []), part.id]));
      try {
        const res = await apiRequest("PATCH", `/api/users/${user.id}/training`, {
          courseId,
          readParts: nextRead,
        });
        const data = await res.json();
        if (data?.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          setUser(data.user);
        }
        setLocation(`/course/${courseId}/exams`);
      } catch (error: any) {
        toast({
          title: "حدث خطأ",
          description: error?.message || "تعذر حفظ القراءة.",
          variant: "destructive",
        });
      }
    } else {
      setLocation(`/course/${courseId}/exams`);
    }
  };

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
              <h1 className="text-lg md:text-2xl font-black truncate">{activePart.title}</h1>
            </div>
            <div className="flex-shrink-0">
              {effectiveReadParts.has(activePart.id) ? (
                <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black border-0 font-bold">
                  تمت القراءة
                </Badge>
              ) : (
                <Badge className="bg-gradient-to-r from-primary to-chart-4 text-white border-0 font-bold">
                  قراءة
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto p-4 pb-12 space-y-6">
        <Card className="p-6 border-2 border-primary/30 shadow-xl bg-gradient-to-br from-card to-primary/5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black">{activePart.title}</h3>
            <Button
              onClick={() => markAsRead(activePart)}
              disabled={!canViewPart}
              className="bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
            >
              تمت القراءة
            </Button>
          </div>
          <div className="relative bg-muted/30 rounded-xl overflow-hidden border-2 border-primary/20 shadow-inner" style={{ minHeight: "70vh" }}>
            {!canViewPart ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-card to-primary/10">
                <div className="text-center space-y-3">
                  <Lock className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground font-medium">
                    الملف مقفل حتى تبدأ الدورة وتنجح في الجزء السابق.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {isLoadingPdf && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-card to-primary/10 z-10">
                    <div className="text-center space-y-4">
                      <FileText className="w-10 h-10 animate-pulse text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground font-medium">جاري تحميل الملف...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={activePart.pdfPath}
                  className="w-full h-full"
                  style={{ minHeight: "70vh", border: "none" }}
                  title={activePart.title}
                  onLoad={() => setIsLoadingPdf(false)}
                />
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
