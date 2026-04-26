import { useEffect } from "react";
import { useRouter } from "expo-router";
import { getStoredToken } from "@/lib/auth";

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    getStoredToken().then((token) => {
      if (token) {
        router.replace("/(app)/dashboard");
      } else {
        router.replace("/(auth)/login");
      }
    });
  }, []);

  return null;
}
