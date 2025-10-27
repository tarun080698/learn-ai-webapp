import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Add diagnostics later - Firebase connectivity, database health, etc.
  return NextResponse.json({ ok: true, version: "plan-0" }, { status: 200 });
}
