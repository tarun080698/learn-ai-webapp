import { getAuth } from "firebase/auth";
import { app } from "./firebaseClient";

/**
 * Get the current admin's Firebase ID token for API calls
 * This should only be called on the client side
 */
export async function getIdToken(): Promise<string> {
  const auth = getAuth(app);
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user found");
  }

  try {
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error("Failed to get ID token:", error);
    throw new Error("Failed to authenticate request");
  }
}

/**
 * Create authorization headers for admin API calls
 */
export async function createAuthHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
