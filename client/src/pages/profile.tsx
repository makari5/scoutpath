import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Tent, User as UserIcon, Award, Sparkles } from "lucide-react";
import type { User } from "@shared/schema";
import { courses } from "@shared/schema";

export default function Profile() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    console.log(`📱 Profile page - Raw localStorage data:`, storedUser);
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log(`👤 Profile page - Parsed user:`, parsedUser);
      console.log(`🆔 Profile page - User ID:`, parsedUser.id);
      setUser(parsedUser);
    } else {
      console.log(`❌ Profile page - No user data in localStorage, redirecting to login`);
      setLocation("/");
    }
  }, [setLocation]);

  if (!user) return null;

  const stageNames = courses.map((c) => c.title);

  const stageValue = user.currentStage === 7.5 ? 8 : user.currentStage;
  const stageNameIndex = Math.min(
    Math.max(Math.ceil(stageValue) - 1, 0),
    stageNames.length - 1
  );

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-2/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(76,175,80,0.15),transparent_50%)]" />
        <div className="absolute top-40 left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto p-4 space-y-8">
        {/* Header with Glowing Logo */}
        <div className="text-center space-y-6 pt-8">
          <div className="flex justify-center relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary via-chart-4 to-primary flex items-center justify-center border-4 border-primary/30 shadow-2xl">
              <Tent className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <div className="inline-block px-6 py-3 bg-card/70 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-lg">
            <h2 className="text-lg font-bold text-foreground">
              مجموعة أولاد العذراء الكشفية والإرشادية
            </h2>
          </div>
        </div>

        {/* Premium ID Card */}
        <Card className="overflow-hidden border-2 border-primary/30 shadow-2xl transform transition-all hover:scale-[1.02]">
          {/* Card Header with Gradient */}
          <div className="relative bg-gradient-to-br from-primary via-chart-4 to-primary/90 p-8 text-primary-foreground overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center border-2 border-primary-foreground/30 shadow-xl backdrop-blur-sm">
                <UserIcon className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <h3 className="text-3xl font-black drop-shadow-lg" data-testid="text-user-name">{user.name}</h3>
                </div>
                <p className="text-primary-foreground/90 text-sm font-medium">المسار التدريبي 2025-2030</p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-8 space-y-6 bg-gradient-to-b from-card to-card/50">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">الرقم التسلسلي</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-8 bg-gradient-to-b from-primary to-chart-4 rounded-full" />
                  <p className="text-2xl font-black text-foreground" data-testid="text-serial-number">{user.serial}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">المرحلة الحالية</p>
                <Badge variant="secondary" className="text-base px-4 py-2 bg-gradient-to-r from-primary/10 to-chart-4/10 border border-primary/30 font-bold" data-testid="badge-current-stage">
                  المرحلة {user.currentStage}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-semibold">المستوى الحالي</span>
              </div>
              <div className="p-4 bg-gradient-to-r from-primary/5 to-chart-4/5 rounded-xl border border-primary/20">
                <p className="font-bold text-foreground text-lg" data-testid="text-current-level">
                  {stageNames[stageNameIndex]}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Premium Start Button */}
        <Button
          onClick={() => setLocation("/dashboard")}
          size="lg"
          className="w-full text-xl py-7 bg-gradient-to-r from-primary via-chart-4 to-primary hover:shadow-2xl hover:scale-105 transition-all font-black relative overflow-hidden group"
          data-testid="button-start-training"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          <span className="relative flex items-center gap-3">
            <Sparkles className="w-6 h-6 animate-pulse" />
            بدء المسار التدريبي
            <ArrowLeft className="w-6 h-6 rotate-180" />
          </span>
        </Button>
      </div>
    </div>
  );
}
