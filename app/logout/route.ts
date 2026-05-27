import { NextResponse } from "next/server";
import { authAccessCookie, authRefreshCookie } from "@/lib/auth/session";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(authAccessCookie);
  response.cookies.delete(authRefreshCookie);
  return response;
}
