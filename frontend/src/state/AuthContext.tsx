import { createContext, useContext, useMemo, useState } from "react";

const TOKEN_KEY = "cityvision_token";
const USERNAME_KEY = "cityvision_username";

interface AuthContextValue {
  token: string | null;
  username: string | null;
  isLoggedIn: boolean;
  signIn: (token: string, username: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USERNAME_KEY));

  const signIn = (nextToken: string, nextUsername: string) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USERNAME_KEY, nextUsername);
    setToken(nextToken);
    setUsername(nextUsername);
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    setToken(null);
    setUsername(null);
  };

  const value = useMemo(
    () => ({
      token,
      username,
      isLoggedIn: Boolean(token),
      signIn,
      signOut
    }),
    [token, username]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
