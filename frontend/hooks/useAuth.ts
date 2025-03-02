import { LoginResponse } from "@/types";
import { login } from "@/utils/auth/login";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

const useAuth = () => {
  const { data: session, status } = useSession();
  const [authData, setAuthData] = useState<LoginResponse | null>(null);

  useEffect(() => {
    const handleUserData = async () => {
      if (session?.user?.email) {
        const userEmail = session.user.email;
        console.log("User email:", userEmail);

        try {
          const userData = await login();
          console.log(userData, "authData");
          setAuthData(userData);
        } catch (error) {
          console.error("Login error:", error);
          setAuthData(null);
        }
      }
    };

    if (status === "authenticated" && session) {
      handleUserData();
    }
  }, [session, status]);

  return {
    authData,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    session,
  };
};

export default useAuth;
