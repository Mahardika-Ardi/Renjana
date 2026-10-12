export async function refreshTokenOnServer(cookieHeader: string) {
  const REFRESH_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`;

  try {
    const res = await fetch(REFRESH_ENDPOINT, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    });

    if (!res.ok) return null;

    return res.headers.getSetCookie();
  } catch {
    return null;
  }
}
