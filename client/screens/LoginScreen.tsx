import React from "react";
import { View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { GradientBackground } from "@/components/GradientBackground";

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, isSigningIn } = useAuth();

  const glassButtonStyle = {
    backgroundColor: isDark
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: isDark
      ? "rgba(255, 255, 255, 0.18)"
      : "rgba(255, 255, 255, 0.8)",
  };

  return (
    <View style={styles.container}>
      <GradientBackground />
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing["2xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="lock" size={48} color={theme.primary} />
          </View>
          <ThemedText type="h1" style={styles.appName}>
            SecureNotes
          </ThemedText>
          <ThemedText type="body" style={[styles.tagline, { color: theme.textSecondary }]}>
            Your notes and passwords, securely stored
          </ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            onPress={signIn}
            disabled={isSigningIn}
            style={({ pressed }) => [
              styles.googleButton,
              glassButtonStyle,
              pressed && { opacity: 0.8 },
              isSigningIn && { opacity: 0.6 },
            ]}
          >
            {isSigningIn ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Feather name="mail" size={20} color="#DB4437" />
                </View>
                <ThemedText type="body" style={styles.buttonText}>
                  Sign in with Google
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "space-between",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  tagline: {
    textAlign: "center",
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.md,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
  },
});
