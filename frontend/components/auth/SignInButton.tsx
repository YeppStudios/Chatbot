"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function SignInButton() {
  const { data: session } = useSession();

  if (session && session.user) {
    return (
      <div>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 border flex gap-2 border-slate-200  rounded-lg text-slate-700  hover:border-slate-400 hover:text-slate-900  hover:shadow transition duration-150"
        >
          <Image
            width={24}
            height={24}
            className="w-6 h-6"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            loading="lazy"
            alt="google logo"
          />
          <span>Sign out</span>
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/" })}
      className="px-4 py-2 border flex gap-2 border-slate-200  rounded-lg text-slate-700  hover:border-slate-400 hover:text-slate-900  hover:shadow transition duration-150"
    >
      <Image
        width={24}
        height={24}
        className="w-6 h-6"
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        loading="lazy"
        alt="google logo"
      />
      <span>Login with Google</span>
    </button>
  );
}
