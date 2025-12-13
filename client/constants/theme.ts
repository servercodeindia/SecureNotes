import { Platform } from "react-native";

const primaryLight = "#4A90E2";
const primaryDark = "#5A9FEF";

export const Colors = {
  light: {
    text: "#000000",
    textSecondary: "#666666",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: primaryLight,
    link: "#007AFF",
    primary: primaryLight,
    backgroundRoot: "transparent",
    backgroundDefault: "rgba(255, 255, 255, 0.7)",
    backgroundSecondary: "rgba(255, 255, 255, 0.5)",
    backgroundTertiary: "rgba(255, 255, 255, 0.3)",
    success: "#34C759",
    error: "#FF3B30",
    warning: "#FFCC00",
    running: "#007AFF",
    glassBackground: "rgba(255, 255, 255, 0.65)",
    glassBorder: "rgba(255, 255, 255, 0.5)",
    gradientStart: "#f0f4f8",
    gradientEnd: "#e8f0fe",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#a0a0a0",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: primaryDark,
    link: "#0A84FF",
    primary: primaryDark,
    backgroundRoot: "transparent",
    backgroundDefault: "rgba(255, 255, 255, 0.08)",
    backgroundSecondary: "rgba(255, 255, 255, 0.05)",
    backgroundTertiary: "rgba(255, 255, 255, 0.03)",
    success: "#34C759",
    error: "#FF453A",
    warning: "#FFD60A",
    running: "#0A84FF",
    glassBackground: "rgba(255, 255, 255, 0.08)",
    glassBorder: "rgba(255, 255, 255, 0.12)",
    gradientStart: "#0a0a0f",
    gradientEnd: "#15151f",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
