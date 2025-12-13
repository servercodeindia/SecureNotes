import React from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { GradientBackground } from "@/components/GradientBackground";
import { useAuth } from "@/contexts/AuthContext";

function SettingRow({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}) {
  const { theme, isDark } = useTheme();

  const glassStyle = {
    backgroundColor: isDark
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(255, 255, 255, 0.75)",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.settingRow,
        glassStyle,
        { opacity: pressed && onPress ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: theme.primary + "20" }]}>
        <Feather name={icon} size={18} color={theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText type="body">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="caption" style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {rightElement}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { theme } = useTheme();

  return (
    <ThemedText
      type="caption"
      style={[styles.sectionHeader, { color: theme.textSecondary }]}
    >
      {title}
    </ThemedText>
  );
}

export default function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, signOut } = useAuth();


  const sectionGlassStyle = {
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
          styles.header,
          {
            paddingTop: insets.top + Spacing.lg,
          },
        ]}
      >
        <ThemedText type="h2">Settings</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <SectionHeader title="ACCOUNT" />
        <View style={[styles.section, sectionGlassStyle]}>
          <View style={styles.userRow}>
            {user?.picture ? (
              <Image
                source={{ uri: user.picture }}
                style={styles.userAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.userAvatar, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="user" size={24} color={theme.primary} />
              </View>
            )}
            <View style={styles.userInfo}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {user?.name || "User"}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {user?.email || "Not signed in"}
              </ThemedText>
            </View>
          </View>
          <View style={styles.divider} />
          <Pressable
            onPress={() => {
              if (Platform.OS === "web") {
                if (window.confirm("Are you sure you want to sign out?")) {
                  signOut();
                }
              } else {
                signOut();
              }
            }}
            style={({ pressed }) => [
              styles.logoutButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="log-out" size={18} color={Colors[isDark ? "dark" : "light"].error} />
            <ThemedText type="body" style={{ color: Colors[isDark ? "dark" : "light"].error, marginLeft: Spacing.md }}>
              Sign Out
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
            SecureNotes v1.0.0
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingSubtitle: {
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + 32 + Spacing.md,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  activityIcon: {
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  emptyActivity: {
    padding: Spacing.xl,
  },
  footer: {
    paddingVertical: Spacing["3xl"],
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
});
