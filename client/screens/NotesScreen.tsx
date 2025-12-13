import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
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
import { HeaderTitle } from "@/components/HeaderTitle";
import { GradientBackground } from "@/components/GradientBackground";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function NoteCard({
  note,
  onPress,
  onDelete,
  onToggleStar,
  onCopy,
}: {
  note: Note;
  onPress: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
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
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: isDark
      ? "rgba(255, 255, 255, 0.18)"
      : "rgba(255, 255, 255, 0.8)",
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
            onPress={() => onToggleStar()}
            hitSlop={8}
            style={styles.actionButton}
          >
            <Feather
              name="star"
              size={18}
              color={note.isStarred ? Colors[isDark ? "dark" : "light"].warning : theme.textSecondary}
              style={note.isStarred ? { opacity: 1 } : { opacity: 0.5 }}
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

export default function NotesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startVoiceRecognition = useCallback(async () => {
    if (Platform.OS !== "web") {
      Alert.alert(
        "Voice Search",
        "Voice search is available when running in a web browser. Try using the web version for this feature."
      );
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      Alert.alert(
        "Not Supported",
        "Voice recognition is not supported in this browser. Please try Chrome or Edge."
      );
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setSearchQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          Alert.alert(
            "Microphone Access",
            "Please allow microphone access to use voice search."
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error("Voice recognition error:", error);
      setIsListening(false);
    }
  }, []);

  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const loadNotes = useCallback(async () => {
    const loadedNotes = await getNotes();
    setNotes(loadedNotes);
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

  const handleToggleStar = async (id: string) => {
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

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="file-text" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
      <ThemedText
        type="body"
        style={[styles.emptyText, { color: theme.textSecondary }]}
      >
        Save YouTube videos and play later
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.emptySubtext, { color: theme.textSecondary }]}
      >
        Tap the + button to create your first note
      </ThemedText>
    </View>
  );

  const searchGlassStyle = {
    backgroundColor: isDark
      ? "rgba(118, 118, 128, 0.24)"
      : "rgba(118, 118, 128, 0.12)",
    borderWidth: 0,
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
        <HeaderTitle />
        <Pressable
          onPress={() => navigation.navigate("NoteEditor", {})}
          style={({ pressed }) => [
            styles.addButton,
            { 
              backgroundColor: theme.primary, 
              opacity: pressed ? 0.8 : 1,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
          ]}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <View
        style={[
          styles.searchContainer,
          searchGlassStyle,
        ]}
      >
        <Feather
          name="search"
          size={16}
          color={isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)"}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput, 
            { color: theme.text, outlineStyle: "none" } as any
          ]}
          placeholder="Search notes..."
          placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.4)"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable 
            onPress={() => setSearchQuery("")} 
            hitSlop={8}
            style={styles.clearButton}
          >
            <Feather name="x" size={16} color={isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.4)"} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={isListening ? stopVoiceRecognition : startVoiceRecognition}
          style={({ pressed }) => [
            styles.micButton,
            isListening && styles.micButtonActive,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={8}
        >
          <Feather
            name="mic"
            size={18}
            color={isListening ? theme.primary : (isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)")}
          />
        </Pressable>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
          filteredNotes.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <NoteCard
              note={item}
              onPress={() => navigation.navigate("NoteEditor", { noteId: item.id })}
              onDelete={() => handleDeleteNote(item.id)}
              onToggleStar={() => handleToggleStar(item.id)}
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
  clearButton: {
    marginRight: Spacing.xs,
    padding: Spacing.xs,
  },
  micButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  micButtonActive: {
    opacity: 1,
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
