"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// 24 Mountains (24山)
const MOUNTAINS_24 = [
  "子", "癸", "丑", "艮", "寅", "甲", "卯", "乙", "辰", "巽", "巳", "丙",
  "午", "丁", "未", "坤", "申", "庚", "酉", "辛", "戌", "乾", "亥", "壬"
];

// 8 Trigrams (八卦)
const TRIGRAMS_8 = [
  { name: "坎", angle: 0 },
  { name: "艮", angle: 45 },
  { name: "震", angle: 90 },
  { name: "巽", angle: 135 },
  { name: "离", angle: 180 },
  { name: "坤", angle: 225 },
  { name: "兑", angle: 270 },
  { name: "乾", angle: 315 },
];

export default function CompassToolPage() {
  const [heading, setHeading] = useState<number>(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [manualMode, setManualMode] = useState<boolean>(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice =
      typeof window !== "undefined" &&
      typeof (DeviceOrientationEvent as any)?.requestPermission === "function";
    setIsIOS(isIOSDevice);

    if (!isIOSDevice && typeof window !== "undefined" && "ondeviceorientationabsolute" in window) {
       // Android absolute orientation
       window.addEventListener("deviceorientationabsolute", handleOrientation as any);
       setPermissionGranted(true);
    } else if (!isIOSDevice && typeof window !== "undefined" && "ondeviceorientation" in window) {
       // Standard/Relative orientation
       window.addEventListener("deviceorientation", handleOrientation);
       setPermissionGranted(true);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientationabsolute", handleOrientation as any);
        window.removeEventListener("deviceorientation", handleOrientation);
      }
    };
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    let compass = 0;
    
    // iOS (webkitCompassHeading is clockwise from North)
    if ((event as any).webkitCompassHeading) {
      compass = (event as any).webkitCompassHeading;
    } 
    // Android (alpha is counter-clockwise from North, usually)
    else if (event.alpha !== null) {
       compass = 360 - event.alpha;
    }

    // Normalize to 0-360
    compass = (compass + 360) % 360;
    setHeading(compass);
  }, []);

  const requestAccess = async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === "function") {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === "granted") {
          setPermissionGranted(true);
          window.addEventListener("deviceorientation", handleOrientation);
          setError("");
        } else {
          setError("未获得罗盘权限");
        }
      } catch (e) {
        setError("请求权限失败");
      }
    } else {
      // Non-iOS devices usually don't need explicit permission request for this API
      setError("您的设备不支持需授权的罗盘API，请直接尝试使用或切换手动模式");
    }
  };

  const getMountain = (deg: number) => {
    // 24 mountains, each 15 degrees. Starts with Zi (North) at 0 (352.5 - 7.5)
    // Shift by 7.5 to align 0 with center of Zi
    const index = Math.floor(((deg + 7.5) % 360) / 15);
    return MOUNTAINS_24[index] || "子";
  };

  const getTrigram = (deg: number) => {
    // 8 trigrams, each 45 degrees. Starts with Kan (North) at 0 (337.5 - 22.5)
    const index = Math.floor(((deg + 22.5) % 360) / 45);
    return TRIGRAMS_8[index]?.name || "坎";
  };

  return (
    <main className="min-h-screen bg-(--color-xuanqing) text-(--color-xuanpaper) px-6 py-12 overflow-hidden">
      <div className="max-w-2xl mx-auto space-y-8 flex flex-col items-center">
        <div className="w-full flex items-center justify-between">
            <h1 className="text-3xl font-song text-(--color-gold-light)">电子罗盘</h1>
             <Link href="/">
              <Button variant="outline" size="sm">返回</Button>
            </Link>
        </div>

        <div className="relative w-80 h-80 md:w-96 md:h-96">
          {/* Compass Body */}
          <div 
            className="absolute inset-0 rounded-full border-4 border-gold-line/60 bg-black/40 backdrop-blur-sm shadow-[0_0_50px_rgba(212,175,55,0.1)] transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${-heading}deg)` }}
          >
             {/* Center Crosshair */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[1px] bg-gold-line/20 absolute"></div>
                <div className="h-full w-[1px] bg-gold-line/20 absolute"></div>
             </div>

             {/* Trigrams Ring */}
             {TRIGRAMS_8.map((t, i) => {
                 const angle = i * 45;
                 return (
                     <div 
                        key={t.name}
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-full flex flex-col justify-between py-8 pointer-events-none"
                        style={{ transform: `rotate(${angle}deg)` }}
                     >
                        <span className="text-2xl font-song font-bold text-(--color-gold-light) rotate-180">{t.name}</span>
                        {/* Opposite side logic handled by mapping all 8 */}
                     </div>
                 )
             })}
             
             {/* 24 Mountains Ring (Inner) */}
             {MOUNTAINS_24.map((m, i) => {
                 const angle = i * 15;
                 return (
                     <div 
                        key={m}
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-full flex flex-col justify-between py-16 pointer-events-none"
                        style={{ transform: `rotate(${angle}deg)` }}
                     >
                        <span className="text-xs text-xuanpaper/80">{m}</span>
                     </div>
                 )
             })}
          </div>

          {/* Fixed Needle / Indicator */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[60px] border-b-red-600/80 -translate-y-8 drop-shadow-lg"></div>
              <div className="w-3 h-3 rounded-full bg-gold-line border border-white/50 absolute"></div>
          </div>
          
           {/* Current Heading Display */}
           <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-center w-full">
              <p className="text-4xl font-mono text-(--color-gold-light)">{Math.round(heading)}°</p>
              <p className="text-lg text-xuanpaper/80 mt-1 font-song">
                  {getTrigram(heading)}宫 · {getMountain(heading)}山
              </p>
           </div>
        </div>

        <div className="pt-20 space-y-4 w-full max-w-sm text-center">
            {isIOS && !permissionGranted && (
                <Button onClick={requestAccess} className="w-full" variant="primary">
                    授权罗盘访问传感器
                </Button>
            )}
            
            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="bg-black/20 p-4 rounded-lg border border-gold-line/20">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-xuanpaper/60">手动调试模式</span>
                    <input 
                        type="checkbox" 
                        checked={manualMode} 
                        onChange={(e) => setManualMode(e.target.checked)}
                        className="accent-(--color-gold-light)"
                    />
                </div>
                {manualMode && (
                    <input 
                        type="range" 
                        min="0" 
                        max="360" 
                        value={heading} 
                        onChange={(e) => setHeading(Number(e.target.value))}
                        className="w-full accent-(--color-gold-light)"
                    />
                )}
            </div>

            <p className="text-xs text-xuanpaper/40">
                提示：请保持手机水平放置。受设备磁力计影响，读数仅供参考，不作为精密勘测依据。
            </p>
        </div>
      </div>
    </main>
  );
}
