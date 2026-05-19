// Auth middleware — disabled for demo. Re-enable by restoring the matcher below.
export default function middleware() {}

export const config = {
  matcher: [], // was: ["/dashboard/:path*", "/jobs/:path*", "/sign-in"]
};
