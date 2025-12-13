import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const TAB_BAR_PADDING = 12;
const TAB_BAR_MARGIN = 16;
const TAB_BAR_HEIGHT = 64;
const MAX_TAB_BAR_WIDTH = 380;

export function LiquidGlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  
  const tabBarWidth = Math.min(screenWidth - TAB_BAR_MARGIN * 2, MAX_TAB_BAR_WIDTH);
  const tabCount = state.routes.length;
  const tabWidth = (tabBarWidth - TAB_BAR_PADDING * 2) / tabCount;

  // Center the indicator within each tab: TAB_BAR_PADDING + (tabWidth - indicatorWidth)/2
  // indicatorWidth = tabWidth - 8, so offset = TAB_BAR_PADDING + 4
  const baseOffset = TAB_BAR_PADDING + 4;
  const indicatorPosition = useSharedValue(state.index * tabWidth + baseOffset);

  React.useEffect(() => {
    indicatorPosition.value = withSpring(state.index * tabWidth + baseOffset, {
      damping: 18,
      stiffness: 200,
      mass: 0.8,
    });
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));

  const bottomPadding = Math.max(insets.bottom, Spacing.md);
  const totalHeight = TAB_BAR_HEIGHT + bottomPadding;

  return (
    <View style={[styles.container, { height: totalHeight }]}>
      <View
        style={[
          styles.floatingBar,
          {
            bottom: bottomPadding,
            width: tabBarWidth,
          },
        ]}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={[StyleSheet.absoluteFill, styles.blurView]}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.glassOverlay,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(255, 255, 255, 0.75)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(255, 255, 255, 0.9)",
            },
          ]}
        />
        <View style={styles.tabBarContent}>
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidth - 8,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.18)"
                  : "rgba(255, 255, 255, 0.9)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.25)"
                  : "rgba(200, 200, 200, 0.3)",
              },
              indicatorStyle,
            ]}
          />
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const color = isFocused
              ? isDark ? "#FFFFFF" : "#000000"
              : isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)";

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={[styles.tab, { width: tabWidth }]}
              >
                <View style={styles.tabInner}>
                  {options.tabBarIcon?.({
                    focused: isFocused,
                    color,
                    size: 22,
                  })}
                  <Text
                    style={[
                      styles.label,
                      {
                        color,
                        fontWeight: isFocused ? "600" : "400",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export const LIQUID_GLASS_TAB_BAR_HEIGHT = TAB_BAR_HEIGHT;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  floatingBar: {
    position: "absolute",
    height: TAB_BAR_HEIGHT,
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
    }),
  },
  blurView: {
    borderRadius: BorderRadius["2xl"],
  },
  glassOverlay: {
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1.5,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: TAB_BAR_PADDING,
  },
  indicator: {
    position: "absolute",
    left: 0,
    height: 48,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
      },
    }),
  },
  tab: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
