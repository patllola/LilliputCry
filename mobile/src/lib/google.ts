import { GoogleSignin } from "@react-native-google-signin/google-signin";

let configured = false;

export function configureGoogleSignIn(): void {
  if (configured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!webClientId) return;
  GoogleSignin.configure({
    webClientId,
    iosClientId,
    offlineAccess: false,
  });
  configured = true;
}

export async function signInWithGoogle(): Promise<string | null> {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (response.type !== "success") return null;
  return response.data.idToken;
}

export async function googleSignOut(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // best-effort
  }
}
