import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
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
import { Note, getNotes, deleteNote, toggleNoteStar } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { GradientBackground } from "@/components/GradientBackground";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StarredNoteCard({
  note,
  onPress,
  onDelete,
  onUnstar,
  onCopy,
}: {
  note: Note;
  onPress: () => void;
  onDelete: () => void;
  onUnstar: () => void;
  onCopy: () => void;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const previewText = note.content.split("\n")[0].slice(0, 100);
  const formattedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const glassStyle = {
    backgroundColor: isDark
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(255, 255, 255, 0.75)",
    borderWidth: 1,
    borderColor: isDark
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(255, 255, 255, 0.6)",
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={() => {
        if (Platform.OS === "web") {
          if (window.confirm("Are you sure you want to delete this note?")) {
            onDelete();
          }
        } else {
          Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onDelete },
          ]);
        }
      }}
      style={[
        styles.noteCard,
        glassStyle,
        animatedStyle,
      ]}
    >
      <View style={styles.noteHeader}>
        <ThemedText type="h4" style={styles.noteTitle} numberOfLines={1}>
          {note.title || "Untitled"}
        </ThemedText>
        <View 
          style={styles.noteActions}
          onStartShouldSetResponder={() => true}
          onResponderRelease={(e) => e.stopPropagation()}
        >
          <Pressable
            onPress={() => onCopy()}
            hitSlop={8}
            style={styles.actionButton}
          >
            <Feather
              name="copy"
              size={18}
              color={theme.textSecondary}
              style={{ opacity: 0.7 }}
            />
          </Pressable>
          <Pressable
            onPress={() => onUnstar()}
            hitSlop={8}
            style={styles.actionButton}
          >
            <Feather
              name="star"
              size={18}
              color={Colors[isDark ? "dark" : "light"].warning}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              if (Platform.OS === "web") {
                if (window.confirm("Are you sure you want to delete this note?")) {
                  onDelete();
                }
              } else {
                Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: onDelete },
                ]);
              }
            }}
            hitSlop={8}
            style={styles.actionButton}
          >
            <Feather
              name="trash-2"
              size={18}
              color={Colors[isDark ? "dark" : "light"].error}
              style={{ opacity: 0.7 }}
            />
          </Pressable>
        </View>
      </View>
      <ThemedText
        type="small"
        style={[styles.notePreview, { color: theme.textSecondary }]}
        numberOfLines={2}
      >
        {previewText || "No content"}
      </ThemedText>
      <View style={styles.noteFooter}>
        <ThemedText
          type="caption"
          style={[styles.noteDate, { color: theme.textSecondary }]}
        >
          {formattedDate}
        </ThemedText>
        {note.youtubeUrl ? (
          <View style={styles.youtubeIndicator}>
            <Feather 
              name="youtube" 
              size={14} 
              color={Colors[isDark ? "dark" : "light"].error}
            />
            <ThemedText
              type="caption"
              style={{ color: Colors[isDark ? "dark" : "light"].error, marginLeft: 4 }}
            >
              Video
            </ThemedText>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

export default function StarredScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotes = useCallback(async () => {
    const allNotes = await getNotes();
    const starredNotes = allNotes.filter((note) => note.isStarred);
    setNotes(starredNotes);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    await loadNotes();
  };

  const handleUnstar = async (id: string) => {
    await toggleNoteStar(id);
    await loadNotes();
  };

  const handleCopyNote = async (note: Note) => {
    const textToCopy = note.title 
      ? `${note.title}\n\n${note.content}` 
      : note.content;
    await Clipboard.setStringAsync(textToCopy);
    Alert.alert("Copied", "Note copied to clipboard");
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="star" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
      <ThemedText
        type="body"
        style={[styles.emptyText, { color: theme.textSecondary }]}
      >
        No important notes
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.emptySubtext, { color: theme.textSecondary }]}
      >
        Star a note to mark it as important
      </ThemedText>
    </View>
  );

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
        <ThemedText type="h2">Important</ThemedText>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
          notes.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <StarredNoteCard
              note={item}
              onPress={() => navigation.navigate("NoteEditor", { noteId: item.id })}
              onDelete={() => handleDeleteNote(item.id)}
              onUnstar={() => handleUnstar(item.id)}
              onCopy={() => handleCopyNote(item)}
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyList: {
    flex: 1,
  },
  noteCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  noteTitle: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  notePreview: {
    marginBottom: Spacing.sm,
  },
  noteFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noteDate: {
    opacity: 0.7,
  },
  youtubeIndicator: {
    flexDirection: "row",
    alignItems: "center",
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
});
