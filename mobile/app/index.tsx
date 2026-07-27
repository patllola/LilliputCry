import { useEffect } from "react";
import { useRouter } from "expo-router";
import { getStoredToken, getStoredUser } from "@/lib/auth";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    Promise.all([getStoredToken(), getStoredUser()]).then(([token, user]) => {
      if (!token) {
        router.replace("/(auth)/login");
      } else if (user?.role === "Admin") {
        router.replace("/(app)/admin");
      } else {
        router.replace("/(app)/home");
      }
    });
  }, []);

  return null;
}
