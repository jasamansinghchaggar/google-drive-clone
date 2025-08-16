import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const sessionCookie = (await cookies()).get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await getCurrentUser(sessionCookie.value);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}
