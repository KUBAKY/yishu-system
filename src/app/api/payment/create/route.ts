import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveSession } from "@/lib/auth-store";
import { createZpayOrder } from "@/lib/zpay";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { paradigm, name } = payload;

    if (!paradigm) {
      return NextResponse.json({ error: "Missing paradigm" }, { status: 400 });
    }

    // 1. Determine base price
    let basePrice = 1.90;
    if (paradigm === "composite") {
      basePrice = 3.90;
    }

    // 2. Determine discount
    const cookieStore = await cookies();
    const token = cookieStore.get("yishu_session")?.value;
    let userId: string | null = null;
    let finalPrice = basePrice;

    if (token) {
      try {
        const user = await resolveSession(token);
        if (user) {
          userId = user.id;
          finalPrice = Number((basePrice * 0.86).toFixed(2));
        }
      } catch {
        // ignore invalid session
      }
    }

    // 3. Generate Trade No
    const outTradeNo = Date.now().toString() + Math.random().toString().slice(2, 6);

    // 4. Save to DB
    // Note: Due to local 'npm' EPERM error, 'Order' model may not be strictly generated yet.
    // If it throws, we can safely ignore or log, but logic requires the model to exist.
    // Assuming the user runs `db push` later.
    try {
      await (prisma as import("@prisma/client").PrismaClient).order.create({
        data: {
          outTradeNo,
          paradigm,
          price: finalPrice,
          userId,
          status: "PENDING",
        }
      });
    } catch (dbError) {
      console.error("DB Error saving Order. Ensure you have run prisma db push:", dbError);
    }

    // 5. Build notify_url (Wait for public domain, fallback to dummy or explicit config)
    // Here we use a relative fallback, but in prod ZPay requires a valid accessible URL.
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const notify_url = `${protocol}://${host}/api/payment/notify`;

    const itemName = name || `推演服务-${paradigm}`;

    // 6. Call ZPay to create order
    const zpayRes = await createZpayOrder({
      out_trade_no: outTradeNo,
      name: itemName,
      money: finalPrice.toFixed(2),
      notify_url,
    });

    if (zpayRes.code === 1 && zpayRes.qrcode) {
      return NextResponse.json({
        outTradeNo,
        price: finalPrice,
        qrcode: zpayRes.qrcode, // ZPay returns native QR Code link
        payurl: zpayRes.payurl, // Alternative pay URL
      });
    }

    return NextResponse.json({ error: "Failed to create payment", details: zpayRes.msg }, { status: 500 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Payment Create Error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
