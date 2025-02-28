import { LoginResponse } from "@/types";
import { backend } from "../../config/apiConfig";



interface UserAuthData {
  email: string;
  name?: string;
  language: string;
}

export const login = async (
  email: string = "peter@yepp.ai",
  name: string = "",
  language: string = "English"
): Promise<LoginResponse> => {

  const payload: UserAuthData = {
    email,
    name,
    language,
  };

  try {
    const response = await fetch(`${backend.serverUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      user: data.user,
      access_token: data.access_token,
    };
  } catch (error) {
    console.error("Login failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};
