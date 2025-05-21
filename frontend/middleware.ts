import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      return !!token;
    },
  },
  pages: {
    signIn: "sign-in/",
  },
});

export const config = {
  matcher: ["/conversations-history/:path*", "/pdf-management/:path*"],
};