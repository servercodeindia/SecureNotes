import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Note {
  id: string;
  title: string;
  content: string;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
  youtubeUrl?: string;
  executionStatus?: "pending" | "running" | "success" | "failed";
  executionOutput?: string;
  executionError?: string;
  executedAt?: string;
}

const USER_KEY_PREFIX = "@user:";
const NOTES_SUFFIX = ":notes";
const SETTINGS_SUFFIX = ":settings";
const CURRENT_USER_KEY = "@auth:current_user_id";

export interface Settings {
  displayName: string;
  theme: "system" | "light" | "dark";
  fontSize: number;
  autoSave: boolean;
  executionTimeout: number;
}

const defaultSettings: Settings = {
  displayName: "My Notes",
  theme: "system",
  fontSize: 16,
  autoSave: true,
  executionTimeout: 30,
};

let currentUserId: string | null = null;
let storageReady = false;

export async function initStorage(): Promise<void> {
  if (storageReady) return;
  try {
    const storedUserId = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (storedUserId) {
      currentUserId = storedUserId;
    }
    storageReady = true;
  } catch (error) {
    console.error("Error initializing storage:", error);
    storageReady = true;
  }
}

export async function setCurrentUserId(userId: string | null): Promise<void> {
  currentUserId = userId;
  try {
    if (userId) {
      await AsyncStorage.setItem(CURRENT_USER_KEY, userId);
    } else {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (error) {
    console.error("Error setting current user ID:", error);
  }
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function isStorageReady(): boolean {
  return storageReady;
}

function getNotesKey(): string {
  if (!currentUserId) {
    return "@quicknotes:notes";
  }
  return `${USER_KEY_PREFIX}${currentUserId}${NOTES_SUFFIX}`;
}

function getSettingsKey(): string {
  if (!currentUserId) {
    return "@quicknotes:settings";
  }
  return `${USER_KEY_PREFIX}${currentUserId}${SETTINGS_SUFFIX}`;
}

export async function getNotes(): Promise<Note[]> {
  try {
    const data = await AsyncStorage.getItem(getNotesKey());
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("Error getting notes:", error);
    return [];
  }
}

export async function saveNotes(notes: Note[]): Promise<void> {
  try {
    await AsyncStorage.setItem(getNotesKey(), JSON.stringify(notes));
  } catch (error) {
    console.error("Error saving notes:", error);
  }
}

export async function getNote(id: string): Promise<Note | null> {
  const notes = await getNotes();
  return notes.find((note) => note.id === id) || null;
}

export async function createNote(
  title: string,
  content: string,
  isStarred: boolean = false,
  youtubeUrl?: string,
): Promise<Note> {
  const notes = await getNotes();
  const now = new Date().toISOString();
  const newNote: Note = {
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    content,
    isStarred,
    createdAt: now,
    updatedAt: now,
    youtubeUrl,
  };
  notes.unshift(newNote);
  await saveNotes(notes);
  return newNote;
}

export async function updateNote(
  id: string,
  updates: Partial<Omit<Note, "id" | "createdAt">>,
): Promise<Note | null> {
  const notes = await getNotes();
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) return null;

  notes[index] = {
    ...notes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveNotes(notes);
  return notes[index];
}

export async function deleteNote(id: string): Promise<boolean> {
  const notes = await getNotes();
  const filtered = notes.filter((note) => note.id !== id);
  if (filtered.length === notes.length) return false;
  await saveNotes(filtered);
  return true;
}

export async function toggleNoteStar(id: string): Promise<Note | null> {
  const notes = await getNotes();
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) return null;

  notes[index] = {
    ...notes[index],
    isStarred: !notes[index].isStarred,
    updatedAt: new Date().toISOString(),
  };
  await saveNotes(notes);
  return notes[index];
}

export async function getSettings(): Promise<Settings> {
  try {
    const data = await AsyncStorage.getItem(getSettingsKey());
    if (data) {
      return { ...defaultSettings, ...JSON.parse(data) };
    }
    return defaultSettings;
  } catch (error) {
    console.error("Error getting settings:", error);
    return defaultSettings;
  }
}

export async function saveSettings(
  settings: Partial<Settings>,
): Promise<Settings> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(getSettingsKey(), JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error saving settings:", error);
    return defaultSettings;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([getNotesKey(), getSettingsKey()]);
  } catch (error) {
    console.error("Error clearing data:", error);
  }
}
