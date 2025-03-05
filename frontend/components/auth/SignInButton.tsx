"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import AuthButton from "./AuthButton";

export default function SignInButton() {
  const { data: session } = useSession();

  if (session?.user) {
    return <AuthButton onClick={() => signOut()}>Sign out</AuthButton>;
  }

  return (
    <AuthButton
      onClick={() =>
        signIn("google", { callbackUrl: "/conversations-history" })
      }
    >
      Login with Google
    </AuthButton>
  );
}
