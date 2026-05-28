import { cookies } from "next/headers";

export const authAccessCookie = "performlabs_access_token";
export const authRefreshCookie = "performlabs_refresh_token";

export async function setAuthCookies(input: {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}) {
  const cookieStore = await cookies();
  const maxAge = input.expiresIn ?? 60 * 60 * 24 * 7;

  cookieStore.set(authAccessCookie, input.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  cookieStore.set(authRefreshCookie, input.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(authAccessCookie);
  cookieStore.delete(authRefreshCookie);
}
