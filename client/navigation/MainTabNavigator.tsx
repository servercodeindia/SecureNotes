import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import NotesScreen from "@/screens/NotesScreen";
import StarredScreen from "@/screens/StarredScreen";
import PasswordsScreen from "@/screens/PasswordsScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { LiquidGlassTabBar } from "@/components/LiquidGlassTabBar";

export type MainTabParamList = {
  NotesTab: undefined;
  StarredTab: undefined;
  PasswordsTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="NotesTab"
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="NotesTab"
        component={NotesScreen}
        options={{
          title: "Notes",
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="StarredTab"
        component={StarredScreen}
        options={{
          title: "Important",
          tabBarIcon: ({ color, size }) => (
            <Feather name="star" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PasswordsTab"
        component={PasswordsScreen}
        options={{
          title: "Passwords",
          tabBarIcon: ({ color, size }) => (
            <Feather name="lock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
