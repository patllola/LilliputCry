import * as SecureStore from "expo-secure-store";
import type { UserProfile } from "@/types/user";

const USER_KEY = "lilliputcry_user";
const TOKEN_KEY = "lilliputcry_token";

export async function getStoredUser(): Promise<UserProfile | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function storeUser(user: UserProfile): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
