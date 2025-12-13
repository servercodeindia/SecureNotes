import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Fonts } from "@/constants/theme";
import { Note, getNote } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NoteDetailsRouteProp = RouteProp<RootStackParamList, "NoteDetails">;

function CollapsibleSection({
  title,
  defaultExpanded = false,
  children,
}: {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={styles.sectionHeader}
      >
        <ThemedText type="body" style={{ fontWeight: "600" }}>
          {title}
        </ThemedText>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.textSecondary}
        />
      </Pressable>
      {expanded ? <View style={styles.sectionContent}>{children}</View> : null}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
      <ThemedText type="small" style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function NoteDetailsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NoteDetailsRouteProp>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const noteId = route.params?.noteId;
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    const loadNote = async () => {
      if (noteId) {
        const loadedNote = await getNote(noteId);
        setNote(loadedNote);
        if (loadedNote) {
          navigation.setOptions({ headerTitle: loadedNote.title || "Details" });
        }
      }
    };
    loadNote();
  }, [noteId, navigation]);

  if (!note) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Loading...
        </ThemedText>
      </ThemedView>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusDisplay = () => {
    const colors = Colors[isDark ? "dark" : "light"];
    switch (note.executionStatus) {
      case "success":
        return { text: "Completed successfully", color: colors.success };
      case "failed":
        return { text: "Execution failed", color: colors.error };
      case "running":
        return { text: "Currently running", color: colors.running };
      case "pending":
        return { text: "Pending execution", color: theme.textSecondary };
      default:
        return { text: "Not executed", color: theme.textSecondary };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <CollapsibleSection title="Note Content" defaultExpanded={false}>
          <ThemedText
            type="small"
            style={[styles.codeBlock, { backgroundColor: theme.backgroundSecondary, fontFamily: Fonts?.mono }]}
          >
            {note.content || "No content"}
          </ThemedText>
        </CollapsibleSection>

        <CollapsibleSection title="Details" defaultExpanded={true}>
          <DetailRow label="Created" value={formatDate(note.createdAt)} />
          <DetailRow label="Modified" value={formatDate(note.updatedAt)} />
          <View style={styles.detailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Status
            </ThemedText>
            <View style={styles.statusContainer}>
              <View
                style={[styles.statusDot, { backgroundColor: statusDisplay.color }]}
              />
              <ThemedText type="small" style={{ color: statusDisplay.color }}>
                {statusDisplay.text}
              </ThemedText>
            </View>
          </View>
          {note.executedAt ? (
            <DetailRow label="Last Run" value={formatDate(note.executedAt)} />
          ) : null}
        </CollapsibleSection>

        {note.executionOutput || note.executionError ? (
          <CollapsibleSection title="Output" defaultExpanded={true}>
            {note.executionOutput ? (
              <ThemedText
                type="small"
                style={[
                  styles.codeBlock,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    fontFamily: Fonts?.mono,
                    color: Colors[isDark ? "dark" : "light"].success,
                  },
                ]}
              >
                {note.executionOutput}
              </ThemedText>
            ) : null}
            {note.executionError ? (
              <ThemedText
                type="small"
                style={[
                  styles.codeBlock,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    fontFamily: Fonts?.mono,
                    color: Colors[isDark ? "dark" : "light"].error,
                    marginTop: note.executionOutput ? Spacing.sm : 0,
                  },
                ]}
              >
                Error: {note.executionError}
              </ThemedText>
            ) : null}
          </CollapsibleSection>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate("NoteEditor", { noteId: note.id })}
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="edit-2" size={18} color="#FFFFFF" />
          <ThemedText
            type="body"
            style={{ color: "#FFFFFF", marginLeft: Spacing.sm, fontWeight: "600" }}
          >
            Edit Note
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  section: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  sectionContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  detailValue: {
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  codeBlock: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    fontSize: 13,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
});
