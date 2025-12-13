import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

interface GlassSurfaceProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderRadius?: number;
}

export function GlassSurface({
  children,
  style,
  intensity = 80,
  borderRadius = BorderRadius.xl,
}: GlassSurfaceProps) {
  const { isDark } = useTheme();

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.container,
          {
            borderRadius,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(20px)",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.15)"
              : "rgba(255, 255, 255, 0.5)",
          } as ViewStyle,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderRadius, overflow: "hidden" }, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(255, 255, 255, 0.3)",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(255, 255, 255, 0.6)",
            borderRadius,
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
