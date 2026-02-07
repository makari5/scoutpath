import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import type { CoursePart, User } from "@shared/schema";
import { courses } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getPartExam } from "@/lib/exams";

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

export default function CourseExam() {
  const [, params] = useRoute("/course/:id/exam/:partId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});

  const courseId = params?.id ? parseInt(params.id, 10) : 0;
  const partId = params?.partId ? parseInt(params.partId, 10) : 0;
  const course = courses.find((c) => c.id === courseId);
  const part: CoursePart | undefined = course?.parts.find((p) => p.id === partId);

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

  const cooldownKey = user?.id
    ? `examCooldown:${user.id}:${courseId}:${partId}`
    : null;
  const cooldownUntil = cooldownKey
    ? Number(localStorage.getItem(cooldownKey) || 0)
    : 0;
  const isCooldownActive = cooldownUntil > Date.now();

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

  const effectivePassedParts = legacyCompleted && course ? new Set(course.parts.map((p) => p.id)) : passedParts;
  const effectiveReadParts = legacyCompleted && course ? new Set(course.parts.map((p) => p.id)) : readParts;

  const canExam =
    !!part &&
    !!startedAt &&
    !isExpired &&
    isCourseUnlocked &&
    effectiveReadParts.has(part.id) &&
    !effectivePassedParts.has(part.id) &&
    part.id <= unlockedPartId;

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

  if (!user || !course || !part) return null;

  if (!canExam) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
        <Card className="relative max-w-md w-full p-10 text-center space-y-6 border-2 border-muted shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black">الامتحان غير متاح</h2>
            <p className="text-muted-foreground leading-relaxed">
              يجب قراءة الجزء أولًا قبل فتح الامتحان.
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

  const exam = getPartExam(courseId, part.id, part.title);

  if (exam.questions.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
        <Card className="relative max-w-md w-full p-10 text-center space-y-6 border-2 border-destructive/40 shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 mx-auto flex items-center justify-center">
            <Lock className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-destructive">لا يوجد أسئلة لهذا الباب</h2>
            <p className="text-muted-foreground leading-relaxed">
              راجع ملف الامتحانات لهذا الباب ثم أعد المحاولة.
            </p>
          </div>
          <Button
            onClick={() => setLocation(`/course/${courseId}/exams`)}
            className="w-full bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
            size="lg"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            العودة لصفحة الامتحانات
          </Button>
        </Card>
      </div>
    );
  }

  if (isCooldownActive) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
        <Card className="relative max-w-md w-full p-10 text-center space-y-6 border-2 border-destructive/40 shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 mx-auto flex items-center justify-center">
            <Lock className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-destructive">الامتحان مؤجل</h2>
            <p className="text-muted-foreground leading-relaxed">
              يمكنك إعادة الامتحان بعد 5 دقائق من آخر محاولة غير ناجحة.
            </p>
          </div>
          <Button
            onClick={() => setLocation(`/course/${courseId}/exams`)}
            className="w-full bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
            size="lg"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            العودة لصفحة الامتحانات
          </Button>
        </Card>
      </div>
    );
  }

  const submitExam = async () => {
    if (exam.questions.length === 0) {
      toast({
        title: "لا يوجد أسئلة",
        description: "لا يمكن تسليم امتحان بدون أسئلة.",
        variant: "destructive",
      });
      return;
    }
    const score = exam.questions.reduce((acc, q, idx) => {
      const selected = examAnswers[idx];
      return selected === q.correctIndex ? acc + 1 : acc;
    }, 0);
    const passed = score >= exam.passScore && exam.questions.length > 0;

    if (passed) {
      const nextPassed = Array.from(
        new Set([...(courseProgress.passedParts ?? []), part.id])
      ).sort((a, b) => a - b);
      const nextRead = Array.from(
        new Set([...(courseProgress.readParts ?? []), part.id])
      ).sort((a, b) => a - b);

      const completedNow = nextPassed.length === totalParts;

      try {
        const res = await apiRequest("PATCH", `/api/users/${user.id}/training`, {
          courseId,
          readParts: nextRead,
          passedParts: nextPassed,
          completedAt: completedNow ? Date.now() : undefined,
        });
        const data = await res.json();
        if (data?.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
          setUser(data.user);
        }
      } catch (error: any) {
        toast({
          title: "حدث خطأ",
          description: error?.message || "تعذر حفظ النتيجة.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!passed && cooldownKey) {
      localStorage.setItem(cooldownKey, String(Date.now() + 5 * 60 * 1000));
    }

    if (passed && (courseProgress.passedParts?.length ?? 0) + 1 === totalParts) {
      setLocation(`/course/${courseId}/certificate`);
    } else {
      setLocation(
        `/course/${courseId}/result/${part.id}?score=${score}&total=${exam.questions.length}&pass=${
          passed ? 1 : 0
        }`
      );
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
              onClick={() => setLocation(`/course/${courseId}/exams`)}
              className="hover-elevate font-bold"
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              العودة
            </Button>
            <div className="flex-1 min-w-0 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
              <h1 className="text-lg md:text-2xl font-black truncate">{exam.title}</h1>
            </div>
            <div className="flex-shrink-0">
              <span className="text-sm text-muted-foreground">
                عدد الأسئلة: {exam.questions.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto p-4 pb-12 space-y-6">
        <Card className="p-6 space-y-6 bg-gradient-to-br from-card to-primary/5 border-2 border-primary/20 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-2xl font-black">{exam.title}</h3>
            <p className="text-muted-foreground">
              عدد الأسئلة: {exam.questions.length} - النجاح من: {exam.passScore}
            </p>
          </div>

          <Separator />

          <div className="space-y-6">
            {exam.questions.map((q, idx) => {
              const selected = typeof examAnswers[idx] === "number" ? String(examAnswers[idx]) : undefined;
              return (
                <Card key={idx} className="p-5 border border-primary/20">
                  <div className="space-y-4">
                    <p className="font-bold leading-relaxed">
                      {idx + 1}. {q.question}
                    </p>
                    <RadioGroup
                      value={selected}
                      onValueChange={(value) => {
                        const v = Number(value);
                        if (Number.isNaN(v)) return;
                        setExamAnswers((prev) => ({ ...prev, [idx]: v }));
                      }}
                      className="gap-3"
                    >
                      {q.options.map((opt, optIdx) => {
                        const id = `q-${idx}-opt-${optIdx}`;
                        return (
                          <div key={id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                            <RadioGroupItem value={String(optIdx)} id={id} />
                            <Label htmlFor={id} className="flex-1 cursor-pointer font-medium">
                              {opt}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            <Progress
              value={
                exam.questions.length
                  ? (Object.keys(examAnswers).length / exam.questions.length) * 100
                  : 0
              }
              className="h-3 bg-muted/50"
            />
            <Button
              onClick={submitExam}
              className="w-full bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
            >
              تسليم الامتحان
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
