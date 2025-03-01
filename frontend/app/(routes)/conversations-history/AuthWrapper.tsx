"use client";

import useAuth from "@/hooks/useAuth";
import { useEffect } from "react";

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { authData, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && authData?.access_token) {
      localStorage.setItem("auth_token", authData.access_token);
    }
  }, [authData, isAuthenticated]);

  return <>{children}</>;
};

export default AuthWrapper;
