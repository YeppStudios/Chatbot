"use client";

import SignInButton from "@/components/auth/SignInButton";

const SignInPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Sign In</h1>
        <p className="mb-8 text-center text-gray-600">
          Sign in to access your account
        </p>
        <div className="flex justify-center">
          <SignInButton />
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
