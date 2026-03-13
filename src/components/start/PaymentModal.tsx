import React, { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paradigm: string;
  name?: string;
}

export function PaymentModal({ isOpen, onClose, onSuccess, paradigm, name }: PaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [outTradeNo, setOutTradeNo] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setLoading(true);
      setError(null);
      setQrCode(null);
      setPrice(null);
      setOutTradeNo(null);
      return;
    }

    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    async function initPayment() {
      try {
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paradigm, name }),
        });

        const data = await res.json();
        
        if (!isMounted) return;

        if (!res.ok) {
          throw new Error(data.error || "创建订单失败");
        }

        setQrCode(data.qrcode);
        setPrice(data.price);
        setOutTradeNo(data.outTradeNo);
        setLoading(false);

        // Start polling
        pollInterval = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/payment/status?outTradeNo=${data.outTradeNo}`);
            const checkData = await checkRes.json();
            if (checkData.status === "PAID") {
              clearInterval(pollInterval!);
              onSuccess();
            }
          } catch (e) {
            console.error("Poll error", e);
          }
        }, 3000);

      } catch (err: unknown) {
        const error = err as Error;
        if (isMounted) {
          setError(error.message || "由于网络问题，无法生成支付码");
          setLoading(false);
        }
      }
    }

    initPayment();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOpen, paradigm, name, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-(--color-bg-panel) border border-(--color-gold-line)/30 rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-(--color-text-secondary) hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-medium text-white mb-2">易支付</h3>
        
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-(--color-gold-text) animate-spin" />
            <p className="text-(--color-text-secondary) text-sm">正在生成付款码...</p>
          </div>
        ) : error ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                // The effect will not re-run unless dependencies change, 
                // but since this is just a mockup error state, we can simply instruct the user to close and reopen.
              }}
              className="text-(--color-gold-text) text-sm hover:underline"
            >
              请关闭重试
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="text-(--color-text-secondary) text-sm space-y-1">
              <p>请使用 <span className="text-[#1677FF] font-medium">支付宝</span> / <span className="text-[#09B83E] font-medium">微信</span> 扫码</p>
              <div className="text-2xl font-bold text-(--color-gold-text) mt-2">
                ¥{price?.toFixed(2)}
              </div>
            </div>

            {qrCode ? (
              <div className="bg-white p-2 rounded-xl">
                {/* Normally ZPay qrCode is an image URL representing the QR */}
                {qrCode.startsWith("http") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={qrCode} alt="Payment QR Code" className="w-48 h-48 object-contain" />
                ) : (
                  <div className="w-48 h-48 border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-black text-xs p-2 break-all text-center">
                    {qrCode}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-48 h-48 bg-black/20 rounded-xl flex items-center justify-center">
                加载失败
              </div>
            )}

            <p className="text-xs text-(--color-text-muted)">
              交易号: {outTradeNo}
              <br/>支付成功后将自动开始推演
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
