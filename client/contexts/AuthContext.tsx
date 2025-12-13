import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { setCurrentUserId, initStorage } from "@/lib/storage";

WebBrowser.maybeCompleteAuthSession();

const getRedirectUri = () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location) {
      return window.location.origin;
    }
    return "http://localhost:8081";
  }
  return makeRedirectUri({
    scheme: "securenotes",
  });
};

const redirectUri = getRedirectUri();

const AUTH_STORAGE_KEY = "@auth:user";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSigningIn: boolean;
  isAuthenticated: boolean;
  signIn: () => void;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    loadStoredUser();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        fetchUserInfo(authentication.accessToken);
      }
    } else if (response?.type === "error" || response?.type === "dismiss") {
      setIsSigningIn(false);
    }
  }, [response]);

  const fetchUserInfo = async (accessToken: string) => {
    try {
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      if (!userInfoResponse.ok) {
        throw new Error("Failed to fetch user info");
      }

      const userInfo = await userInfoResponse.json();
      
      const newUser: User = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      };

      setUser(newUser);
      await setCurrentUserId(newUser.id);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const loadStoredUser = async () => {
    try {
      await initStorage();
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        await setCurrentUserId(parsedUser.id);
      }
    } catch (error) {
      console.error("Error loading stored user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = useCallback(() => {
    setIsSigningIn(true);
    promptAsync();
  }, [promptAsync]);

  const signInAsGuest = useCallback(async () => {
    try {
      const guestUser: User = {
        id: "guest-" + Date.now(),
        email: "guest@local",
        name: "Guest User",
      };
      setUser(guestUser);
      await setCurrentUserId(guestUser.id);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(guestUser));
    } catch (error) {
      console.error("Error signing in as guest:", error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setUser(null);
      await setCurrentUserId(null);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSigningIn,
        isAuthenticated: !!user,
        signIn,
        signInAsGuest,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
