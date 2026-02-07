import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

const getSearchParams = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    score: Number(params.get("score") || 0),
    total: Number(params.get("total") || 0),
    pass: params.get("pass") === "1",
  };
};

export default function CourseResult() {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/course/:id/result/:partId");

  const courseId = params?.id ? parseInt(params.id, 10) : 0;
  const { score, total, pass } = getSearchParams(window.location.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/dashboard");
    }, 5000);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
      <Card className="relative max-w-lg w-full p-10 text-center space-y-6 border-2 border-primary/20 shadow-2xl">
        <div className="w-24 h-24 rounded-2xl bg-muted mx-auto flex items-center justify-center">
          {pass ? (
            <CheckCircle2 className="w-12 h-12 text-chart-4" />
          ) : (
            <XCircle className="w-12 h-12 text-destructive" />
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black">
            {pass ? "مبروك! نجحت في الامتحان" : "للأسف لم تنجح في الامتحان"}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            نتيجتك {score} من {total}
          </p>
          <p className="text-sm text-muted-foreground">
            سيتم تحويلك تلقائيًا إلى صفحة الدورات خلال 5 ثوانٍ
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => setLocation(`/course/${courseId}`)}
            variant="secondary"
            className="font-bold"
          >
            العودة للدورة
          </Button>
          <Button
            onClick={() => setLocation("/dashboard")}
            className="bg-gradient-to-r from-primary to-chart-4 hover:shadow-xl transition-all font-bold"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            صفحة الدورات
          </Button>
        </div>
      </Card>
    </div>
  );
}
