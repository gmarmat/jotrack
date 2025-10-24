import { NextResponse } from "next/server";

export async function GET() {
  const serverFlag = process.env.INTERVIEW_V2 === "1";
  const clientFlag = process.env.NEXT_PUBLIC_INTERVIEW_V2 === "1";
  return NextResponse.json({
    ok: true,
    mode: serverFlag && clientFlag ? "v2" : "legacy",
    serverFlag,
    clientFlag,
    note: "When both flags are true and you start on the same port, UI + API are guaranteed V2."
  });
}
