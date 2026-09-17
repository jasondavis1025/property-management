import { NextResponse } from "next/server";
import { runAutoPayCharges } from "@/lib/stripe/autopay-charge";

export const runtime = "nodejs";

function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runAutoPayCharges();
  return NextResponse.json({ ok: true, results });
}

export async function GET(request: Request) {
  return POST(request);
}
