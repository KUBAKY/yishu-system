import { AuthUser } from "./auth";

export type SendCodeResponse = { ok: true; devCode?: string } | { error: string };
export type AuthResponse = { authenticated: true; user: AuthUser } | { error: string };
export type SaveProfileResponse = { authenticated: true; user: AuthUser } | { error: string };
export type AuthMode = "register" | "login";
