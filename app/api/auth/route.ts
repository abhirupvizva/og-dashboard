import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin } = body;

    let role = "";
    if (pin === "0000") {
      role = "admin";
    } else if (pin === "1111") {
      role = "1on1_viewer";
    }

    if (!role) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, role });
    
    response.cookies.set("auth_role", role, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      // Not HTTP only so we can read it on the client for conditional rendering
      httpOnly: false,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("auth_role");
  return response;
}
