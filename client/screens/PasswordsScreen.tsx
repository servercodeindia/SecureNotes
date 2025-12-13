import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { GradientBackground } from "@/components/GradientBackground";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { getCurrentUserId } from "@/lib/storage";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PASSWORD_PREFIX = "pwd_";

function getPasswordIndexKey(): string {
  const userId = getCurrentUserId();
  if (!userId) {
    return "@passwords:index";
  }
  return `@user:${userId}:passwords:index`;
}

function getPasswordSecretKey(id: string): string {
  const userId = getCurrentUserId();
  if (!userId) {
    return `${PASSWORD_PREFIX}${id}`;
  }
  return `${PASSWORD_PREFIX}${userId}_${id}`;
}

interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

interface PasswordMetadata {
  id: string;
  title: string;
  username: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

async function getPasswordIndex(): Promise<PasswordMetadata[]> {
  try {
    const data = await AsyncStorage.getItem(getPasswordIndexKey());
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("Error getting password index:", error);
    return [];
  }
}

async function savePasswordIndex(index: PasswordMetadata[]): Promise<void> {
  try {
    await AsyncStorage.setItem(getPasswordIndexKey(), JSON.stringify(index));
  } catch (error) {
    console.error("Error saving password index:", error);
  }
}

async function getPasswordSecret(id: string): Promise<string | null> {
  try {
    const key = getPasswordSecretKey(id);
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error("Error getting password:", error);
    return null;
  }
}

async function savePasswordSecret(id: string, password: string): Promise<void> {
  try {
    const key = getPasswordSecretKey(id);
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(key, password);
    } else {
      await SecureStore.setItemAsync(key, password);
    }
  } catch (error) {
    console.error("Error saving password:", error);
  }
}

async function deletePasswordSecret(id: string): Promise<void> {
  try {
    const key = getPasswordSecretKey(id);
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error("Error deleting password:", error);
  }
}

async function getPasswords(): Promise<PasswordEntry[]> {
  const index = await getPasswordIndex();
  const entries: PasswordEntry[] = [];
  
  for (const meta of index) {
    const password = await getPasswordSecret(meta.id);
    if (password) {
      entries.push({ ...meta, password });
    }
  }
  
  return entries;
}

async function savePassword(entry: PasswordEntry): Promise<void> {
  const index = await getPasswordIndex();
  const existingIdx = index.findIndex((m) => m.id === entry.id);
  
  const metadata: PasswordMetadata = {
    id: entry.id,
    title: entry.title,
    username: entry.username,
    website: entry.website,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
  
  if (existingIdx >= 0) {
    index[existingIdx] = metadata;
  } else {
    index.unshift(metadata);
  }
  
  await savePasswordIndex(index);
  await savePasswordSecret(entry.id, entry.password);
}

async function deletePassword(id: string): Promise<void> {
  const index = await getPasswordIndex();
  const updated = index.filter((m) => m.id !== id);
  await savePasswordIndex(updated);
  await deletePasswordSecret(id);
}

function PasswordCard({
  entry,
  onCopy,
  onDelete,
  onEdit,
  isAuthenticated,
}: {
  entry: PasswordEntry;
  onCopy: (field: "username" | "password") => void;
  onDelete: () => void;
  onEdit: () => void;
  isAuthenticated: boolean;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const [showPassword, setShowPassword] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const glassStyle = {
    backgroundColor: isDark
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: isDark
      ? "rgba(255, 255, 255, 0.18)"
      : "rgba(255, 255, 255, 0.8)",
  };

  const maskedPassword = isAuthenticated && showPassword 
    ? entry.password 
    : "••••••••";

  return (
    <AnimatedPressable
      onPress={onEdit}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={() => {
        if (Platform.OS === "web") {
          if (window.confirm("Are you sure you want to delete this password?")) {
            onDelete();
          }
        } else {
          Alert.alert("Delete Password", "Are you sure you want to delete this password?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onDelete },
          ]);
        }
      }}
      style={[styles.card, glassStyle, animatedStyle]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="lock" size={18} color={theme.primary} />
          </View>
          <View style={styles.titleContainer}>
            <ThemedText type="h4" numberOfLines={1}>
              {entry.title}
            </ThemedText>
            {entry.website ? (
              <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
                {entry.website}
              </ThemedText>
            ) : null}
          </View>
          <View
            onStartShouldSetResponder={() => true}
            onResponderRelease={(e) => e.stopPropagation()}
          >
            <Pressable
              onPress={() => {
                if (Platform.OS === "web") {
                  if (window.confirm("Are you sure you want to delete this password?")) {
                    onDelete();
                  }
                } else {
                  Alert.alert("Delete Password", "Are you sure you want to delete this password?", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: onDelete },
                  ]);
                }
              }}
              hitSlop={8}
              style={styles.deleteButton}
            >
              <Feather name="trash-2" size={18} color={theme.error || "#EF4444"} style={{ opacity: 0.7 }} />
            </Pressable>
          </View>
        </View>
      </View>
      
      <View 
        style={styles.fieldRow}
        onStartShouldSetResponder={() => true}
        onResponderRelease={(e) => e.stopPropagation()}
      >
        <View style={styles.fieldContent}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Username
          </ThemedText>
          <ThemedText type="small" numberOfLines={1}>
            {entry.username}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => onCopy("username")}
          hitSlop={8}
          style={styles.copyButton}
        >
          <Feather name="copy" size={16} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View 
        style={styles.fieldRow}
        onStartShouldSetResponder={() => true}
        onResponderRelease={(e) => e.stopPropagation()}
      >
        <View style={styles.fieldContent}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Password
          </ThemedText>
          <ThemedText type="small" numberOfLines={1}>
            {maskedPassword}
          </ThemedText>
        </View>
        <View style={styles.passwordActions}>
          {isAuthenticated ? (
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={8}
              style={styles.copyButton}
            >
              <Feather 
                name={showPassword ? "eye-off" : "eye"} 
                size={16} 
                color={theme.textSecondary} 
              />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => onCopy("password")}
            hitSlop={8}
            style={styles.copyButton}
          >
            <Feather name="copy" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}

function AddPasswordModal({
  visible,
  onClose,
  onSave,
  editEntry,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt">) => void;
  editEntry?: PasswordEntry | null;
}) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (editEntry) {
      setTitle(editEntry.title);
      setUsername(editEntry.username);
      setPassword(editEntry.password);
      setWebsite(editEntry.website || "");
    } else {
      setTitle("");
      setUsername("");
      setPassword("");
      setWebsite("");
    }
  }, [editEntry, visible]);

  const handleSave = () => {
    if (!title.trim() || !username.trim() || !password.trim()) {
      Alert.alert("Required Fields", "Please fill in title, username, and password.");
      return;
    }
    onSave({
      title: title.trim(),
      username: username.trim(),
      password: password.trim(),
      website: website.trim() || undefined,
    });
    onClose();
  };

  const inputStyle = {
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
    borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)",
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: isDark ? "#1a1a1f" : "#f5f5f7" }]}>
        <View style={[styles.modalHeader, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <ThemedText type="body" style={{ color: theme.primary }}>
              Cancel
            </ThemedText>
          </Pressable>
          <ThemedText type="h4">
            {editEntry ? "Edit Password" : "Add Password"}
          </ThemedText>
          <Pressable onPress={handleSave} hitSlop={8}>
            <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
              Save
            </ThemedText>
          </Pressable>
        </View>

        <KeyboardAwareScrollViewCompat
          style={styles.modalContent}
          contentContainerStyle={styles.modalScrollContent}
        >
          <View style={styles.inputGroup}>
            <ThemedText type="caption" style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Title
            </ThemedText>
            <TextInput
              style={[styles.input, inputStyle, { color: theme.text, outlineStyle: "none" } as any]}
              placeholder="e.g., Gmail, Netflix"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="caption" style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Username / Email
            </ThemedText>
            <TextInput
              style={[styles.input, inputStyle, { color: theme.text, outlineStyle: "none" } as any]}
              placeholder="username@example.com"
              placeholderTextColor={theme.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="caption" style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Password
            </ThemedText>
            <View style={[styles.passwordInputContainer, inputStyle]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text, outlineStyle: "none" } as any]}
                placeholder="Enter password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="caption" style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Website (optional)
            </ThemedText>
            <TextInput
              style={[styles.input, inputStyle, { color: theme.text, outlineStyle: "none" } as any]}
              placeholder="https://example.com"
              placeholderTextColor={theme.textSecondary}
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </KeyboardAwareScrollViewCompat>
      </View>
    </Modal>
  );
}

export default function PasswordsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const authenticate = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsAuthenticated(true);
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access passwords",
        fallbackLabel: "Use passcode",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Authentication error:", error);
      return false;
    }
  }, []);

  const loadPasswords = useCallback(async () => {
    const loaded = await getPasswords();
    setPasswords(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPasswords();
    }, [loadPasswords]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPasswords();
    setRefreshing(false);
  };

  const handleAddPassword = async (entry: Omit<PasswordEntry, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    
    if (editingEntry) {
      const updatedEntry: PasswordEntry = {
        ...editingEntry,
        ...entry,
        updatedAt: now,
      };
      await savePassword(updatedEntry);
    } else {
      const newEntry: PasswordEntry = {
        ...entry,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };
      await savePassword(newEntry);
    }
    setEditingEntry(null);
    await loadPasswords();
  };

  const handleDeletePassword = async (id: string) => {
    await deletePassword(id);
    await loadPasswords();
  };

  const handleCopy = async (entry: PasswordEntry, field: "username" | "password") => {
    if (field === "password" && !isAuthenticated) {
      const success = await authenticate();
      if (!success) return;
    }
    
    const textToCopy = field === "username" ? entry.username : entry.password;
    await Clipboard.setStringAsync(textToCopy);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", `${field === "username" ? "Username" : "Password"} copied to clipboard`);
  };

  const handleEdit = async (entry: PasswordEntry) => {
    if (!isAuthenticated) {
      const success = await authenticate();
      if (!success) return;
    }
    setEditingEntry(entry);
    setModalVisible(true);
  };

  const filteredPasswords = passwords.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.website?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const searchGlassStyle = {
    backgroundColor: isDark
      ? "rgba(118, 118, 128, 0.24)"
      : "rgba(118, 118, 128, 0.12)",
    borderWidth: 0,
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="lock" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
      <ThemedText
        type="body"
        style={[styles.emptyText, { color: theme.textSecondary }]}
      >
        No passwords saved
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.emptySubtext, { color: theme.textSecondary }]}
      >
        Tap + to add your first password
      </ThemedText>
    </View>
  );

  return (
    <View style={styles.container}>
      <GradientBackground />
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.lg },
        ]}
      >
        <ThemedText type="h2">Passwords</ThemedText>
        <Pressable
          onPress={() => {
            setEditingEntry(null);
            setModalVisible(true);
          }}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={[styles.searchContainer, searchGlassStyle]}>
        <Feather
          name="search"
          size={16}
          color={isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)"}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.text, outlineStyle: "none" } as any]}
          placeholder="Search passwords..."
          placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.4)"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
            <Feather name="x" size={16} color={isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)"} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
          filteredPasswords.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredPasswords}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <PasswordCard
              entry={item}
              onCopy={(field) => handleCopy(item, field)}
              onDelete={() => handleDeletePassword(item.id)}
              onEdit={() => handleEdit(item)}
              isAuthenticated={isAuthenticated}
            />
          </Animated.View>
        )}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <AddPasswordModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingEntry(null);
        }}
        onSave={handleAddPassword}
        editEntry={editingEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
    letterSpacing: 0.1,
  } as any,
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  deleteButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  fieldContent: {
    flex: 1,
  },
  copyButton: {
    padding: Spacing.xs,
  },
  passwordActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  separator: {
    height: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
    opacity: 0.7,
  },
  emptySubtext: {
    marginTop: Spacing.xs,
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
});
