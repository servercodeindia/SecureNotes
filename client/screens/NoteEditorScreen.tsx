import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import WebView from "react-native-webview";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Fonts } from "@/constants/theme";
import { Note, getNote, createNote, updateNote } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { GradientBackground } from "@/components/GradientBackground";

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function YouTubePlayer({ videoId, theme }: { videoId: string; theme: any }) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0`;
  
  if (Platform.OS === "web") {
    return (
      <View style={[styles.videoContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <iframe
          src={embedUrl}
          style={{ width: "100%", height: "100%", border: "none", borderRadius: BorderRadius.md }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </View>
    );
  }
  
  return (
    <View style={[styles.videoContainer, { backgroundColor: theme.backgroundSecondary }]}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webView}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

type NoteEditorRouteProp = RouteProp<RootStackParamList, "NoteEditor">;

export default function NoteEditorScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NoteEditorRouteProp>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const noteId = route.params?.noteId;
  const isEditing = !!noteId;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isStarred, setIsStarred] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const originalNote = useRef<Note | null>(null);
  const videoId = extractYouTubeId(youtubeUrl);

  useEffect(() => {
    const loadNote = async () => {
      if (noteId) {
        const note = await getNote(noteId);
        if (note) {
          originalNote.current = note;
          setTitle(note.title);
          setContent(note.content);
          setIsStarred(note.isStarred);
          setYoutubeUrl(note.youtubeUrl || "");
          navigation.setOptions({ headerTitle: note.title || "Edit Note" });
        }
      }
    };
    loadNote();
  }, [noteId, navigation]);

  useEffect(() => {
    if (isEditing && originalNote.current) {
      const changed =
        title !== originalNote.current.title ||
        content !== originalNote.current.content ||
        isStarred !== originalNote.current.isStarred ||
        youtubeUrl !== (originalNote.current.youtubeUrl || "");
      setHasChanges(changed);
    } else if (!isEditing) {
      setHasChanges(title.length > 0 || content.length > 0 || youtubeUrl.length > 0);
    }
  }, [title, content, isStarred, youtubeUrl, isEditing]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedYoutubeUrl = youtubeUrl.trim();

    if (!trimmedTitle && !trimmedContent && !trimmedYoutubeUrl) {
      navigation.goBack();
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && noteId) {
        await updateNote(noteId, {
          title: trimmedTitle,
          content: trimmedContent,
          isStarred,
          youtubeUrl: trimmedYoutubeUrl || undefined,
        });
      } else {
        await createNote(trimmedTitle, trimmedContent, isStarred, trimmedYoutubeUrl || undefined);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [title, content, isStarred, youtubeUrl, isEditing, noteId, navigation, isSaving]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      if (Platform.OS === "web") {
        const confirmed = window.confirm("You have unsaved changes. Are you sure you want to discard them?");
        if (confirmed) {
          navigation.goBack();
        }
      } else {
        Alert.alert(
          "Discard Changes?",
          "You have unsaved changes. Are you sure you want to discard them?",
          [
            { text: "Keep Editing", style: "cancel" },
            { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
          ],
        );
      }
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={handleCancel} hitSlop={12}>
          <ThemedText type="body" style={{ color: theme.primary }}>
            Cancel
          </ThemedText>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          hitSlop={12}
          style={{ opacity: isSaving ? 0.5 : 1 }}
        >
          <ThemedText
            type="body"
            style={{ color: theme.primary, fontWeight: "600" }}
          >
            {isSaving ? "Saving..." : "Done"}
          </ThemedText>
        </Pressable>
      ),
    });
  }, [navigation, handleCancel, handleSave, theme, isSaving]);

  const inputGlassStyle = {
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
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.inputCard, inputGlassStyle]}>
          <TextInput
            style={[
              styles.titleInput,
              { color: theme.text, outlineStyle: "none" } as any,
            ]}
            placeholder="Title"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
            autoFocus={!isEditing}
            returnKeyType="next"
            maxLength={100}
          />

          <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }]} />

          <TextInput
            style={[
              styles.contentInput,
              {
                color: theme.text,
                fontFamily: Fonts?.mono,
                outlineStyle: "none",
              } as any,
            ]}
            placeholder="Write your note here..."
            placeholderTextColor={theme.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />
        </View>

        <View style={styles.youtubeSection}>
          <View style={styles.youtubeLabelRow}>
            <Feather name="youtube" size={20} color={Colors[isDark ? "dark" : "light"].error} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: "600" }}>
              YouTube Video
            </ThemedText>
          </View>
          <TextInput
            style={[
              styles.youtubeInput,
              inputGlassStyle,
              { 
                color: theme.text, 
                borderColor: videoId ? Colors[isDark ? "dark" : "light"].success : (isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.5)"),
                outlineStyle: "none",
              } as any,
            ]}
            placeholder="Paste YouTube link (e.g., youtube.com/watch?v=...)"
            placeholderTextColor={theme.textSecondary}
            value={youtubeUrl}
            onChangeText={setYoutubeUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {youtubeUrl.length > 0 && !videoId ? (
            <View style={styles.invalidUrlMessage}>
              <Feather name="alert-circle" size={14} color={Colors[isDark ? "dark" : "light"].error} />
              <ThemedText type="caption" style={{ color: Colors[isDark ? "dark" : "light"].error, marginLeft: Spacing.xs }}>
                Invalid YouTube link
              </ThemedText>
            </View>
          ) : null}
          {videoId ? (
            <YouTubePlayer videoId={videoId} theme={theme} />
          ) : null}
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => setIsStarred(!isStarred)}
            style={({ pressed }) => [
              styles.starButton,
              inputGlassStyle,
              {
                backgroundColor: isStarred
                  ? Colors[isDark ? "dark" : "light"].warning + "20"
                  : (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.75)"),
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather
              name="star"
              size={20}
              color={
                isStarred
                  ? Colors[isDark ? "dark" : "light"].warning
                  : theme.textSecondary
              }
            />
            <ThemedText
              type="body"
              style={{
                color: isStarred
                  ? Colors[isDark ? "dark" : "light"].warning
                  : theme.textSecondary,
                marginLeft: Spacing.sm,
              }}
            >
              Mark as Important
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  inputCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: "600",
    paddingVertical: Spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.md,
  },
  contentInput: {
    fontSize: 16,
    minHeight: 200,
    paddingTop: Spacing.sm,
  },
  youtubeSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  youtubeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  youtubeInput: {
    fontSize: 14,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  invalidUrlMessage: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  videoContainer: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    height: 200,
  },
  webView: {
    flex: 1,
    borderRadius: BorderRadius.md,
  },
  footer: {
    marginTop: Spacing["3xl"],
    paddingTop: Spacing.lg,
  },
  starButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
});
