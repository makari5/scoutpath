import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Lock,
  FileText,
  ClipboardList,
  Award,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { CoursePart, User } from "@shared/schema";
import { courses } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getPartExam } from "@/lib/exams";
import { formatRemainingTime } from "@/lib/utils";

type CourseProgress = {
  startedAt?: number;
  readParts: number[];
  passedParts: number[];
  completedAt?: number;
};

const emptyProgress: CourseProgress = {
  readParts: [],
  passedParts: [],
};

const addMonths = (ms: number, months: number) => {
  const d = new Date(ms);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
};

export default function CourseDetail() {
  const [, params] = useRoute("/course/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [seasonStartDate, setSeasonStartDate] = useState<number>(new Date('2026-02-08T00:00:00Z').getTime());
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);

  const [examPartId, setExamPartId] = useState<number | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examResult, setExamResult] = useState<{ score: number; passed: boolean } | null>(null);

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
  }, [user?.id, seasonStartDate]);

  const currentStage = user?.currentStage === 7.5 ? 8 : user?.currentStage || 1;
  const isUnlocked = courseId <= currentStage;

  const trainingProgress = user?.trainingProgress ?? { courses: {}, completedCourses: [] };
  const courseProgress: CourseProgress =
    (trainingProgress.courses?.[String(courseId)] as CourseProgress | undefined) ??
    emptyProgress;

  // Global season logic
  const expiresAt = addMonths(seasonStartDate, 6);
  const isExpired = Date.now() > expiresAt;
  
  const startedAt = courseProgress.startedAt; // Entry time

  const passedParts = new Set(courseProgress.passedParts ?? []);
  const readParts = new Set(courseProgress.readParts ?? []);
  const maxPassed = courseProgress.passedParts?.length
    ? Math.max(...courseProgress.passedParts)
    : 0;
  const totalParts = course?.parts?.length ?? 0;
  const unlockedPartId = startedAt ? Math.min(maxPassed + 1, totalParts) : 0;
  const completedCourse =
    trainingProgress.completedCourses?.includes(courseId) ||
    (totalParts > 0 && courseProgress.passedParts?.length === totalParts);

  useEffect(() => {
    if (!user || !course) return;
    if (selectedPartId !== null) return;
    if (unlockedPartId <= 0) return;
    setSelectedPartId(unlockedPartId);
  }, [course, selectedPartId, unlockedPartId, user]);

  useEffect(() => {
    if (!user || !course) return;
    if (examPartId !== null) return;
    const nextExam = course.parts.find(
      (p) => readParts.has(p.id) && !passedParts.has(p.id)
    );
    if (nextExam) setExamPartId(nextExam.id);
  }, [course, examPartId, readParts, passedParts, user]);

  useEffect(() => {
    if (examPartId === null) return;
    setExamAnswers({});
    setExamResult(null);
  }, [examPartId]);

  if (!user || !course) return null;

  const updateTrainingProgress = async (patch: {
    courseId: number;
    startedAt?: number;
    readParts?: number[];
    passedParts?: number[];
    completedAt?: number;
  }) => {
    if (!user) return;
    try {
      const res = await apiRequest("PATCH", `/api/users/${user.id}/training`, patch);
      const data = await res.json();
      if (data?.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch (error: any) {
      toast({
        title: "حدث خطأ",
        description: error?.message || "تعذر حفظ التقدم. حاول مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const startCourse = async () => {
    if (!isUnlocked) return;
    if (startedAt) return;
    if (isExpired) {
        toast({
            title: "عفواً",
            description: "الموسم منتهي حالياً. انتظر بدء الموسم الجديد.",
            variant: "destructive"
        });
        return;
    }
    await updateTrainingProgress({
      courseId,
      startedAt: Date.now(),
      readParts: [],
      passedParts: [],
    });
  };

  const markAsRead = async (part: CoursePart) => {
    if (!startedAt || isExpired) return;
    if (!readParts.has(part.id)) {
      const nextRead = Array.from(new Set([...(courseProgress.readParts ?? []), part.id]));
      await updateTrainingProgress({
        courseId,
        readParts: nextRead,
      });
    }
  };

  const handleSubmitExam = async () => {
    if (!examPartId) return;
    const part = course.parts.find((p) => p.id === examPartId);
    if (!part) return;

    const exam = getPartExam(courseId, part.id, part.title);
    const score = exam.questions.reduce((acc, q, idx) => {
      const selected = examAnswers[idx];
      return selected === q.correctIndex ? acc + 1 : acc;
    }, 0);
    const passed = score >= exam.passScore;

    setExamResult({ score, passed });

    if (!passed) {
      toast({
        title: "نتيجة الامتحان",
        description: `للأسف رسبت. نتيجتك ${score} من ${exam.questions.length}.`,
        variant: "destructive",
      });
      return;
    }

    const nextPassed = Array.from(
      new Set([...(courseProgress.passedParts ?? []), part.id])
    ).sort((a, b) => a - b);
    const nextRead = Array.from(
      new Set([...(courseProgress.readParts ?? []), part.id])
    ).sort((a, b) => a - b);

    const completedNow = nextPassed.length === course.parts.length;

    await updateTrainingProgress({
      courseId,
      readParts: nextRead,
      passedParts: nextPassed,
      completedAt: completedNow ? Date.now() : undefined,
    });

    toast({
      title: "مبروك!",
      description: `نجحت في ${part.title}.`,
    });

    setExamAnswers({});
    setExamResult(null);

    if (completedNow) {
      toast({
        title: "تم إكمال الدورة",
        description: "تم تسجيل نجاحك والانتقال للدورة التالية.",
      });
      setLocation("/dashboard");
    } else {
      const nextPart = course.parts.find((p) => p.id === part.id + 1);
      if (nextPart) {
        setSelectedPartId(nextPart.id);
        setExamPartId(nextPart.id);
      }
    }
  };

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

  const activePart = course.parts.find((p) => p.id === selectedPartId) ?? course.parts[0];
  const canViewPart =
    !!activePart && !!startedAt && !isExpired && activePart.id <= unlockedPartId;

  const examPart = course.parts.find((p) => p.id === examPartId);
  const exam = examPart ? getPartExam(courseId, examPart.id, examPart.title) : null;

  const timeRemainingDays =
    !isExpired ? Math.max(Math.ceil((expiresAt - Date.now()) / 86400000), 0) : 0;

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
              ) : startedAt ? (
                <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black border-0 shadow-lg font-bold">
                  جارية
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-bold">
                  متاحة للبدء
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto p-4 pb-12 space-y-6">
        {!startedAt && !completedCourse && (
          <Card className="p-6 border-2 border-primary/30 shadow-xl bg-gradient-to-br from-card to-primary/5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-black">ابدأ الدورة الآن</h2>
                <p className="text-muted-foreground leading-relaxed">
                  بعد بدء الدورة لديك 6 أشهر لإنهائها. سيتم فتح الأجزاء بالتسلسل.
                </p>
              </div>
              <Button
                onClick={startCourse}
                className="bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
                size="lg"
              >
                ابدأ الدورة
              </Button>
            </div>
          </Card>
        )}

        {startedAt && (
          <Card className="p-5 border-2 border-primary/20 shadow-lg bg-card/70">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">المدة المتبقية لإكمال الدورة</p>
                <p className={`text-2xl font-black ${isExpired ? "text-destructive" : "text-primary"}`}>
                  {isExpired ? "انتهت المدة" : formatRemainingTime(timeRemainingDays)}
                </p>
              </div>
              {isExpired && (
                <Badge variant="destructive" className="font-bold">
                  الدورة انتهت مدتها
                </Badge>
              )}
            </div>
          </Card>
        )}

        <Tabs defaultValue="training" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-sm p-1.5 border-2 border-primary/20 shadow-lg">
            <TabsTrigger value="training" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-4 data-[state=active]:text-white font-bold transition-all">
              <FileText className="w-4 h-4" />
              القراءة
            </TabsTrigger>
            <TabsTrigger value="exams" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-4 data-[state=active]:text-white font-bold transition-all">
              <ClipboardList className="w-4 h-4" />
              الامتحانات
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-chart-4 data-[state=active]:text-white font-bold transition-all">
              <Award className="w-4 h-4" />
              الشهادة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="training" className="space-y-5">
            <Card className="p-6 border-2 border-primary/30 shadow-xl bg-gradient-to-br from-card to-primary/5">
              <div className="mb-5">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  ملفات الدورة
                </h3>
              </div>

              <div className="space-y-3">
                {course.parts.map((part) => {
                  const unlocked = part.id <= unlockedPartId && startedAt && !isExpired;
                  const isRead = readParts.has(part.id);
                  const isPassed = passedParts.has(part.id);
                  return (
                    <Card
                      key={part.id}
                      className={`p-4 border transition-all ${
                        unlocked ? "border-primary/30 cursor-pointer hover:shadow-lg" : "border-muted opacity-60"
                      }`}
                      onClick={() => unlocked && setSelectedPartId(part.id)}
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
                              : "مقفل حتى اجتياز الجزء السابق"}
                          </p>
                        </div>
                        {isPassed ? (
                          <Badge className="bg-gradient-to-r from-chart-4 to-chart-4/80 text-white border-0 font-bold">
                            ناجح
                          </Badge>
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
                            مقفل
                          </Badge>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 border-2 border-primary/30 shadow-xl bg-gradient-to-br from-card to-primary/5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black">{activePart?.title}</h3>
                <Button
                  onClick={() => activePart && markAsRead(activePart)}
                  disabled={!canViewPart || !activePart || readParts.has(activePart.id)}
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
                          <Sparkles className="w-10 h-10 animate-pulse text-primary mx-auto" />
                          <p className="text-sm text-muted-foreground font-medium">جاري تحميل الملف...</p>
                        </div>
                      </div>
                    )}
                    <iframe
                      src={activePart?.pdfPath}
                      className="w-full h-full"
                      style={{ minHeight: "70vh", border: "none" }}
                      title={activePart?.title}
                      onLoad={() => setIsLoadingPdf(false)}
                    />
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="exams" className="space-y-5">
            {isExpired ? (
              <Card className="p-10 text-center space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
                <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                  <Lock className="w-12 h-12 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">انتهت مدة الدورة</h3>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    لا يمكن أداء الامتحانات بعد انتهاء مدة الدورة.
                  </p>
                </div>
              </Card>
            ) : (
              <>
                <Card className="p-6 border-2 border-primary/30 shadow-xl bg-gradient-to-br from-card to-primary/5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black">اختيار الجزء للامتحان</h3>
                    </div>
                    <div className="grid gap-3">
                      {course.parts.map((part) => {
                        const canExam = readParts.has(part.id) && !passedParts.has(part.id) && !isExpired;
                        const done = passedParts.has(part.id);
                        return (
                          <Card
                            key={part.id}
                            className={`p-4 border transition-all ${
                              canExam ? "border-primary/30 cursor-pointer hover:shadow-lg" : "border-muted opacity-70"
                            }`}
                            onClick={() => canExam && setExamPartId(part.id)}
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
                  </div>
                </Card>

                {!exam || !examPart ? (
                  <Card className="p-10 text-center space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
                    <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                      <Lock className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black">لا يوجد امتحان متاح</h3>
                      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        قم بقراءة الجزء أولًا ثم ارجع لفتح الامتحان.
                      </p>
                    </div>
                  </Card>
                ) : (
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
                                {idx + 1}. {q.text}
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
                        value={(Object.keys(examAnswers).length / exam.questions.length) * 100}
                        className="h-3 bg-muted/50"
                      />
                      <Button
                        onClick={handleSubmitExam}
                        className="w-full bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
                      >
                        تسليم الامتحان
                      </Button>
                    </div>

                    {examResult && (
                      <Card className="p-4 border border-primary/20 bg-card/70">
                        <p className="font-bold">
                          نتيجتك: {examResult.score} / {exam.questions.length}
                        </p>
                      </Card>
                    )}
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="certificates">
            {(() => {
              const canShowCertificate = completedCourse;
              const certificateSrc = `/${courseId}.jpg`;

              if (!canShowCertificate) {
                return (
                  <Card className="p-16 text-center space-y-6 bg-gradient-to-br from-card to-muted/10 border-2 border-muted shadow-xl">
                    <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                      <Lock className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black">الشهادة غير متاحة بعد</h3>
                      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        ستظهر شهادتك هنا بعد اجتياز جميع أجزاء الدورة.
                      </p>
                    </div>
                  </Card>
                );
              }

              return (
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
                          className="text-xl md:text-4xl leading-tight text-center"
                          style={{ color: "#1e3a8a", textShadow: "0 2px 10px rgba(255,255,255,0.8)", marginRight: "22%" }}
                        >
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
