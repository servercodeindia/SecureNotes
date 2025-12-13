import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import NoteEditorScreen from "@/screens/NoteEditorScreen";
import NoteDetailsScreen from "@/screens/NoteDetailsScreen";
import LoginScreen from "@/screens/LoginScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { GradientBackground } from "@/components/GradientBackground";

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  NoteEditor: { noteId?: string };
  NoteDetails: { noteId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  const { theme } = useTheme();
  return (
    <View style={styles.loadingContainer}>
      <GradientBackground />
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const opaqueScreenOptions = useScreenOptions({ transparent: false });
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NoteEditor"
            component={NoteEditorScreen}
            options={{
              ...opaqueScreenOptions,
              presentation: "modal",
              headerTitle: "New Note",
            }}
          />
          <Stack.Screen
            name="NoteDetails"
            component={NoteDetailsScreen}
            options={{
              ...opaqueScreenOptions,
              presentation: "modal",
              headerTitle: "Details",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
