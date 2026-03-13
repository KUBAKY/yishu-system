import { NextRequest, NextResponse } from "next/server";
import { verifyZpaySign } from "@/lib/zpay";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  return handleNotify(request);
}

export async function GET(request: NextRequest) {
  return handleNotify(request);
}

async function handleNotify(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params: Record<string, string> = {};

    if (request.method === "GET") {
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } else {
      const isUrlEncoded = request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
      if (isUrlEncoded) {
        const text = await request.text();
        const searchParams = new URLSearchParams(text);
        searchParams.forEach((value, key) => {
          params[key] = value;
        });
      } else {
        const body = await request.json();
        Object.keys(body).forEach((key) => {
          params[key] = body[key];
        });
      }
    }

    // Verify Sign
    const isValid = verifyZpaySign(params);
    if (!isValid) {
      console.error("ZPay Notify - Invalid Signature", params);
      return new NextResponse("fail", { status: 400 });
    }

    const { out_trade_no, trade_no, trade_status } = params;

    if (trade_status === "TRADE_SUCCESS") {
      try {
        await (prisma as import("@prisma/client").PrismaClient).order.update({
          where: { outTradeNo: out_trade_no },
          data: {
            status: "PAID",
            tradeNo: trade_no,
            payTime: new Date(),
          }
        });
      } catch (err) {
        console.error("ZPay Notify - DB Update Error", err);
      }
    }

    return new NextResponse("success");
  } catch (err) {
    console.error("ZPay Notify Error:", err);
    return new NextResponse("fail", { status: 500 });
  }
}
