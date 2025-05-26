import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // If there's a token, the user has been authenticated and passed the email allowlist
      return !!token;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
});

export const config = {
  matcher: ["/conversations-history/:path*", "/pdf-management/:path*"],
};