import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Define your email allowlist here
// You can also set ALLOWED_EMAILS environment variable as a comma-separated list
const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS 
  ? process.env.ALLOWED_EMAILS.split(',').map(email => email.trim())
  : [
      "peter@yepp.ai",
      "metrum.cryoflex@gmail.com",
    ];

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only check email allowlist for Google provider
      if (account?.provider === "google") {
        const email = user.email;
        if (!email || !ALLOWED_EMAILS.includes(email)) {
          console.log(`Access denied for email: ${email}`);
          return false; // Deny sign in
        }
        console.log(`Access granted for email: ${email}`);
      }
      return true; // Allow sign in
    },
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user }) {
      return token;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error", // Custom error page for unauthorized access
  },
});

export { handler as GET, handler as POST };
