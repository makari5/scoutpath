import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Lock, 
  CheckCircle2, 
  Circle, 
  Award, 
  BookOpen, 
  TrendingUp,
  LogOut,
  Tent,
  Sparkles
} from "lucide-react";
import type { User } from "@shared/schema";
import { courses } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setLocation("/");
  };

  if (!user) return null;

  const totalCourses = courses.length;
  const currentStage = user.currentStage === 7.5 ? 8 : user.currentStage || 1;
  const currentCourseId = Math.min(Math.max(Math.ceil(currentStage), 1), totalCourses);

  const completedCourses =
    user.trainingProgress?.completedCourses?.length
      ? user.trainingProgress.completedCourses
      : Array.from({ length: Math.max(currentCourseId - 1, 0) }, (_, i) => i + 1);

  const completedCount = completedCourses.length;
  const certificatesCount = completedCount;
  const progressPercentage = Math.round((completedCount / totalCourses) * 100);

  const isCourseUnlocked = (courseId: number) => courseId <= currentCourseId;

  const isCourseCompleted = (courseId: number) => completedCourses.includes(courseId);

  const isCourseInProgress = (courseId: number) =>
    courseId === currentCourseId && !completedCourses.includes(courseId);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background" dir="rtl">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-2/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(76,175,80,0.1),transparent_50%)]" />
      </div>

      {/* Sticky Header with Glass Effect */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-card/80 border-b border-primary/20 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg" />
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center shadow-lg">
                  <Tent className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">أهلاً</p>
                <h2 className="text-xl font-black text-foreground" data-testid="text-dashboard-user-name">{user.name}</h2>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover-elevate"
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto p-4 space-y-8 pb-12">
        {/* Title with Premium Effect */}
        <div className="text-center space-y-4 pt-6">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-7 h-7 text-primary animate-pulse" />
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-l from-primary via-chart-4 to-primary bg-clip-text text-transparent">
              المسار التدريبي
            </h1>
            <Sparkles className="w-7 h-7 text-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-full border border-primary/30">
            <p className="text-2xl font-black text-primary">2025-2030</p>
          </div>
        </div>

        {/* Premium Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-gradient-to-br from-card to-chart-1/5 border-chart-1/30 hover-elevate cursor-pointer transform transition-all hover:scale-105">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-chart-1/20 flex items-center justify-center border border-chart-1/30">
                <BookOpen className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <p className="text-3xl font-black text-foreground" data-testid="text-total-courses">{totalCourses}</p>
                <p className="text-sm text-muted-foreground font-medium">عدد الدورات</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-card to-chart-4/5 border-chart-4/30 hover-elevate cursor-pointer transform transition-all hover:scale-105">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-chart-4/20 flex items-center justify-center border border-chart-4/30">
                <CheckCircle2 className="w-6 h-6 text-chart-4" />
              </div>
              <div>
                <p className="text-3xl font-black text-foreground" data-testid="text-completed-courses">{completedCount}</p>
                <p className="text-sm text-muted-foreground font-medium">دورات مكتملة</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-card to-chart-3/5 border-chart-3/30 hover-elevate cursor-pointer transform transition-all hover:scale-105">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-chart-3/20 flex items-center justify-center border border-chart-3/30">
                <Award className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-3xl font-black text-foreground" data-testid="text-certificates-count">{certificatesCount}</p>
                <p className="text-sm text-muted-foreground font-medium">شهادات</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-card to-chart-2/5 border-chart-2/30 hover-elevate cursor-pointer transform transition-all hover:scale-105">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-chart-2/20 flex items-center justify-center border border-chart-2/30">
                <TrendingUp className="w-6 h-6 text-chart-2" />
              </div>
              <div>
                <p className="text-3xl font-black text-foreground" data-testid="text-progress-percentage">{progressPercentage}%</p>
                <p className="text-sm text-muted-foreground font-medium">الإنجاز</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Premium Progress Card */}
        <Card className="p-8 bg-gradient-to-br from-card via-primary/5 to-card border-2 border-primary/30 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                التقدم الإجمالي
              </h3>
              <span className="text-lg font-black text-primary">{completedCount} من {totalCourses}</span>
            </div>
            <div className="relative">
              <Progress value={progressPercentage} className="h-4 bg-muted/50" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
        </Card>

        {/* Premium Courses List */}
        <div className="space-y-5">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            الدورات التدريبية
          </h2>
          
          <div className="space-y-4">
            {courses.map((course) => {
              const unlocked = isCourseUnlocked(course.id);
              const completed = isCourseCompleted(course.id);
              const inProgress = isCourseInProgress(course.id);

              return (
                <Card
                  key={course.id}
                  className={`overflow-hidden border-2 transition-all transform ${
                    !unlocked 
                      ? 'opacity-50 border-muted' 
                      : completed
                      ? 'border-chart-4/30 bg-gradient-to-r from-card to-chart-4/5 hover-elevate cursor-pointer hover:scale-[1.02] hover:shadow-xl'
                      : 'border-primary/30 bg-gradient-to-r from-card to-primary/5 hover-elevate cursor-pointer hover:scale-[1.02] hover:shadow-xl'
                  }`}
                  onClick={() => unlocked && setLocation(`/course/${course.id}`)}
                  data-testid={`card-course-${course.id}`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-5">
                      <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                        completed 
                          ? 'bg-gradient-to-br from-chart-4 to-chart-4/80 border-2 border-chart-4/30' 
                          : inProgress
                          ? 'bg-gradient-to-br from-yellow-500 to-yellow-400 border-2 border-yellow-500/30'
                          : unlocked 
                          ? 'bg-gradient-to-br from-primary to-primary/80 border-2 border-primary/30' 
                          : 'bg-muted border-2 border-muted-foreground/20'
                      }`}>
                        {completed ? (
                          <CheckCircle2 className="w-7 h-7 text-white" />
                        ) : unlocked ? (
                          <Circle className="w-7 h-7 text-white" />
                        ) : (
                          <Lock className="w-7 h-7 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="font-black text-foreground leading-tight text-lg">
                            {course.title}
                          </h3>
                          {completed && (
                            <Badge className="bg-gradient-to-r from-chart-4 to-chart-4/80 text-white border-0 flex-shrink-0 shadow-lg font-bold">
                              مكتملة
                            </Badge>
                          )}
                          {!completed && inProgress && (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black border-0 flex-shrink-0 shadow-lg font-bold">
                              جاري الدراسة
                            </Badge>
                          )}
                          {!unlocked && (
                            <Badge variant="secondary" className="flex-shrink-0 font-bold">
                              مقفلة
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {unlocked 
                            ? completed 
                              ? 'تم إكمال هذه الدورة بنجاح' 
                              : inProgress
                              ? 'أنت تدرس هذه الدورة حالياً'
                              : 'اضغط لبدء الدورة'
                            : `يتم فتحها في المرحلة ${course.id}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
