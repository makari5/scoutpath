import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import jsQR from "jsqr";

interface BarcodeScannerProps {
  onScan: (barcodeNumber: string) => void;
  isLoading?: boolean;
}

export function BarcodeScanner({ onScan, isLoading }: BarcodeScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process barcode
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setError('فشل معالجة الصورة');
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        setIsProcessing(false);
        setTimeout(() => onScan(code.data), 300);
      } else {
        setError('لم يتم العثور على باركود في الصورة. يرجى التأكد من وضوح الصورة والمحاولة مرة أخرى.');
        setIsProcessing(false);
      }
    };

    const imgReader = new FileReader();
    imgReader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    imgReader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-5" dir="rtl">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-barcode-file"
      />

      <Card 
        className="border-2 border-dashed border-primary/40 hover-elevate cursor-pointer transition-all duration-300 overflow-hidden relative group bg-gradient-to-br from-card to-primary/5"
        onClick={handleClick}
        data-testid="card-barcode-upload"
      >
        {/* Animated Border Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        <div className="relative p-10 flex flex-col items-center justify-center text-center space-y-5">
          {previewUrl ? (
            <div className="w-full max-w-xs space-y-4">
              <div className="relative rounded-xl overflow-hidden border-4 border-primary/30 shadow-2xl">
                <img 
                  src={previewUrl} 
                  alt="Barcode preview" 
                  className="w-full h-auto"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-primary/90 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-12 h-12 animate-spin text-white mx-auto" />
                      <p className="text-white font-bold">جاري المعالجة...</p>
                    </div>
                  </div>
                )}
                {!isProcessing && !error && (
                  <div className="absolute top-3 right-3 w-10 h-10 bg-chart-4 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-chart-4 to-primary flex items-center justify-center shadow-2xl">
                  <Camera className="w-12 h-12 text-primary-foreground" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <h3 className="text-xl font-black text-foreground">
                    ارفع صورة الباركود
                  </h3>
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
                <p className="text-sm text-muted-foreground max-w-sm font-medium leading-relaxed">
                  اضغط هنا لالتقاط صورة أو اختيار صورة من المعرض
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {error && (
        <div className="p-5 bg-gradient-to-r from-destructive/10 via-destructive/20 to-destructive/10 border-2 border-destructive/30 rounded-xl shadow-lg" data-testid="text-barcode-error">
          <p className="text-sm text-destructive text-center font-medium leading-relaxed">{error}</p>
        </div>
      )}
    </div>
  );
}
