import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Lock, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import type { User } from "@shared/schema";
import { courses } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatRemainingTime } from "@/lib/utils";

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

export default function CourseHome() {
  const [, params] = useRoute("/course/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [seasonStartDate, setSeasonStartDate] = useState<number>(new Date('2026-02-08T00:00:00Z').getTime());

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
    // Fetch global settings
    apiRequest("GET", "/api/settings").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.seasonStartDate) {
          setSeasonStartDate(data.settings.seasonStartDate);
        }
      }
    });
  }, []);

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
  }, [user?.id, seasonStartDate]); // Refresh user when season changes might be good, but not strictly needed

  const currentStage = user?.currentStage === 7.5 ? 8 : user?.currentStage || 1;
  const isUnlocked = courseId <= currentStage;

  const trainingProgress = user?.trainingProgress ?? { courses: {}, completedCourses: [] };
  const courseProgress: CourseProgress =
    (trainingProgress.courses?.[String(courseId)] as CourseProgress | undefined) ??
    emptyProgress;

  // Calculate expiration based on GLOBAL season start date, not user start date
  const expiresAt = addMonths(seasonStartDate, 6);
  const isExpired = Date.now() > expiresAt;

  const startedAt = courseProgress.startedAt; // Keep tracking when they *entered*, but it doesn't affect expiry now.

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

  const timeRemainingDays =
    !isExpired ? Math.max(Math.ceil((expiresAt - Date.now()) / 86400000), 0) : 0;

  const ensureStarted = useMemo(
    () => async () => {
      if (!user) return;
      if (!isUnlocked) return;
      if (startedAt) return;
      // If season is expired, don't auto-start new courses? 
      // Actually, if season is expired, nobody can do anything.
      if (isExpired) return;

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
    [courseId, isUnlocked, startedAt, toast, user, isExpired]
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

  const handleStartSeason = async () => {
    if (!confirm("هل أنت متأكد من بدء موسم جديد؟ سيتم تصفير العداد للجميع.")) return;
    try {
      const res = await apiRequest("POST", "/api/admin/start-season");
      if (res.ok) {
        toast({ title: "تم بدء الموسم الجديد بنجاح" });
        setSeasonStartDate(Date.now()); // Update locally
      }
    } catch (e) {
      toast({ title: "خطأ في بدء الموسم", variant: "destructive" });
    }
  };

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

  return (
    <div className="min-h-screen relative overflow-hidden bg-background" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-2/5" />

      <div className="sticky top-0 z-20 backdrop-blur-xl bg-card/90 border-b-2 border-primary/30 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="hover-elevate font-bold"
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              العودة
            </Button>
            <div className="flex-1 min-w-0 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <h1 className="text-lg md:text-2xl font-black truncate">{course.title}</h1>
            </div>
            <div className="flex-shrink-0">
              {completedCourse ? (
                <Badge className="bg-gradient-to-r from-chart-4 to-chart-4/80 text-white border-0 shadow-lg font-bold">
                  مكتملة
                </Badge>
              ) : (
                <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black border-0 shadow-lg font-bold">
                  جارية
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto p-4 pb-12 space-y-6">
        <div className="flex justify-between items-center">
           {user.serial === '101' && (
            <Button 
              onClick={handleStartSeason}
              variant="destructive"
              className="font-bold shadow-lg"
            >
              بدء موسم جديد (Admin)
            </Button>
          )}
          <Button
            onClick={() => setLocation(`/course/${courseId}/exams`)}
            className="bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
          >
            صفحة الامتحانات
          </Button>
        </div>

        <Card className="p-5 border-2 border-primary/20 shadow-lg bg-card/70">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المدة المتبقية للموسم الحالي</p>
              <p className={`text-2xl font-black ${isExpired ? "text-destructive" : "text-primary"}`}>
                {isExpired ? "انتهى الموسم - في انتظار البدء الجديد" : formatRemainingTime(timeRemainingDays)}
              </p>
            </div>
            {isExpired && (
              <Badge variant="destructive" className="font-bold">
                الموسم منتهي
              </Badge>
            )}
          </div>
        </Card>

        <Card className="p-6 border-2 border-primary/30 shadow-xl bg-gradient-to-br from-card to-primary/5">
          <div className="mb-5">
            <h3 className="text-xl font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              أجزاء الدورة
            </h3>
          </div>

          <div className="space-y-3">
            {course.parts.map((part) => {
              const effectivePassed = legacyCompleted ? course.parts.map((p) => p.id).includes(part.id) : passedParts.has(part.id);
              const effectiveRead = legacyCompleted ? course.parts.map((p) => p.id).includes(part.id) : readParts.has(part.id);
              // Unlock logic: Must be (unlocked sequence) AND (season not expired OR already passed)
              // Actually, if season expired, you can't read new parts.
              const unlocked = part.id <= unlockedPartId && startedAt && !isExpired;
              const isRead = effectiveRead;
              const isPassed = effectivePassed;
              return (
                <Card
                  key={part.id}
                  className={`p-4 border transition-all ${
                    unlocked ? "border-primary/30 cursor-pointer hover:shadow-lg" : "border-muted opacity-60"
                  }`}
                  onClick={() => unlocked && setLocation(`/course/${courseId}/part/${part.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{part.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {isPassed
                          ? "تم اجتياز الامتحان"
                          : isRead
                          ? "تمت القراءة - الامتحان متاح"
                          : unlocked
                          ? "متاح للقراءة"
                          : isExpired 
                            ? "الموسم منتهي" 
                            : "مقفل حتى اجتياز الجزء السابق"}
                      </p>
                    </div>
                    {isPassed ? (
                      <CheckCircle2 className="w-6 h-6 text-chart-4" />
                    ) : isRead ? (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black border-0 font-bold">
                        جاهز للامتحان
                      </Badge>
                    ) : unlocked ? (
                      <Badge className="bg-gradient-to-r from-primary to-chart-4 text-white border-0 font-bold">
                        مفتوح
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-bold">
                        {isExpired ? "منتهي" : "مقفل"}
                      </Badge>
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
