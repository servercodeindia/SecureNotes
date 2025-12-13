import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const { width, height } = Dimensions.get("window");

export function GradientBackground() {
  const { isDark } = useTheme();

  return (
    <View style={StyleSheet.absoluteFill}>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? "#0a0a0f" : "#f0f4f8",
          },
        ]}
      />
      <View
        style={[
          styles.circle1,
          {
            backgroundColor: isDark
              ? "rgba(90, 159, 239, 0.15)"
              : "rgba(74, 144, 226, 0.12)",
          },
        ]}
      />
      <View
        style={[
          styles.circle2,
          {
            backgroundColor: isDark
              ? "rgba(139, 92, 246, 0.12)"
              : "rgba(167, 139, 250, 0.10)",
          },
        ]}
      />
      <View
        style={[
          styles.circle3,
          {
            backgroundColor: isDark
              ? "rgba(52, 199, 89, 0.08)"
              : "rgba(52, 199, 89, 0.06)",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle1: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    top: -width * 0.4,
    right: -width * 0.3,
  },
  circle2: {
    position: "absolute",
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    bottom: height * 0.15,
    left: -width * 0.3,
  },
  circle3: {
    position: "absolute",
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    bottom: -width * 0.2,
    right: -width * 0.1,
  },
});
