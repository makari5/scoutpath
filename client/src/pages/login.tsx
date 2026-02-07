import { useState } from "react";
import { useLocation } from "wouter";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Sparkles } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBarcodeScanned = async (barcodeNumber: string) => {
    setIsLoading(true);

    try {
      // Clear any existing user data first
      localStorage.removeItem("currentUser");
      
      console.log(`🔍 Attempting login with barcode: ${barcodeNumber}`);
      
      const response = await apiRequest(
        "POST",
        "/api/auth/barcode-login",
        { barcodeNumber }
      );

      const data = await response.json();

      if (data.user) {
        console.log(`✅ Login successful for user:`, data.user);
        console.log(`🔍 User ID from server:`, data.user.id);
        console.log(`📋 Full user data:`, JSON.stringify(data.user, null, 2));
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${data.user.name}`,
        });

        setLocation("/profile");
      }
    } catch (error: any) {
      console.error(`❌ Login failed:`, error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "الرقم غير موجود في النظام. يرجى التواصل مع المسؤول.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-2/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(76,175,80,0.1),transparent_50%)]" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-chart-2/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          {/* Logo with Glow Effect */}
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl scale-110" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary via-primary to-chart-4 flex items-center justify-center border-4 border-primary/30 shadow-2xl hover-elevate transition-transform hover:scale-110 overflow-hidden">
                <img 
                  src="/scouts.png" 
                  alt="Scout Logo" 
                  className="w-16 h-16 object-contain drop-shadow-lg"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-l from-primary via-chart-4 to-primary bg-clip-text text-transparent">
                  المسار التدريبي للجوالة والقادة
                </h1>
                <Sparkles className="w-6 h-6 text-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-full border border-primary/30">
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  2025-2030
                </p>
              </div>
              <p className="text-lg md:text-xl text-muted-foreground font-medium">
                رحلة إعداد القادة المستقبليين
              </p>
            </div>
          </div>

          {/* Login Card with Premium Design */}
          <div className="space-y-6">
            <div className="text-center space-y-3 bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-primary/20 shadow-lg">
              <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                تسجيل الدخول
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                من فضلك استخدم الباركود الخاص بك لاستكمال عملية تسجيل الدخول على المسار التدريبي
              </p>
            </div>

            <BarcodeScanner onScan={handleBarcodeScanned} isLoading={isLoading} />
          </div>

          {/* Footer with Glow */}
          <div className="text-center pt-6">
            <div className="inline-block px-4 py-2 bg-card/70 backdrop-blur-sm rounded-full border border-border shadow-sm">
              <p className="text-xs text-muted-foreground font-medium">
                مجموعة أولاد العذراء الكشفية والإرشادية
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
