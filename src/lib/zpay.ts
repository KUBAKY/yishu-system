import crypto from "crypto";
import { headers } from "next/headers";

const ZPAY_API_URL = "https://zpayz.cn/mapi.php";
const ZPAY_PID = process.env.ZPAY_PID || "2025092411423631";
const ZPAY_KEY = process.env.ZPAY_KEY || "QPFByBhWtaHclWp3gSrc3yNYxeg3GwT5";

export interface ZPayCreateResponse {
  code: number;
  msg: string;
  trade_no?: string;
  payurl?: string;
  qrcode?: string;
  img?: string;
}

/**
 * Generate ZPay MD5 Signature
 */
export function generateZpaySign(params: Record<string, string>): string {
  // 1. Sort by key alphabetically
  const keys = Object.keys(params).filter((k) => k !== "sign" && k !== "sign_type" && params[k] !== "").sort();

  // 2. Build string: a=b&c=d&e=f
  const str = keys.map((k) => `${k}=${params[k]}`).join("&");

  // 3. Append KEY and output MD5
  const md5Result = crypto.createHash("md5").update(str + ZPAY_KEY, "utf8").digest("hex");
  return md5Result.toLowerCase();
}

/**
 * Call ZPay to create a payment link/QR
 */
export async function createZpayOrder({
  out_trade_no,
  name,
  money,
  type = "alipay",
  notify_url,
  param = ""
}: {
  out_trade_no: string;
  name: string;
  money: string;
  type?: "alipay" | "wxpay";
  notify_url: string;
  param?: string;
}): Promise<ZPayCreateResponse> {
  // Get Client IP
  const headersList = await headers();
  const clientip = headersList.get("x-forwarded-for") || "127.0.0.1";

  const payload: Record<string, string> = {
    pid: ZPAY_PID,
    type,
    out_trade_no,
    notify_url,
    name,
    money,
    clientip,
    device: "pc",
    param,
  };

  const sign = generateZpaySign(payload);
  payload.sign = sign;
  payload.sign_type = "MD5";

  // mapi.php uses form-data representation
  const formData = new URLSearchParams();
  for (const key of Object.keys(payload)) {
    formData.append(key, payload[key]);
  }

  const response = await fetch(ZPAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(`ZPay API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data as ZPayCreateResponse;
}

/**
 * Verify a received ZPay Notify parameter payload
 */
export function verifyZpaySign(params: Record<string, string>): boolean {
  if (!params.sign || !params.sign_type) return false;
  const calculated = generateZpaySign(params);
  return calculated === params.sign.toLowerCase();
}
