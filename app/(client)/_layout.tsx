// ─────────────────────────────────────────────────────────────────────────────
// Client Tabs — Home · Explore · Plots · Documents · Profile
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

type IconName = keyof typeof MaterialIcons.glyphMap;

function TabItem({
  label,
  icon,
  focused,
}: {
  label: string;
  icon: IconName;
  focused: boolean;
}) {
  return (
    <View style={styles.item}>
      <View style={[styles.iconPill, focused ? styles.iconPillActive : null]}>
        <MaterialIcons
          name={icon}
          size={22}
          color={focused ? Colors.brand : Colors.textMuted}
        />
      </View>
      <Text
        style={[styles.label, focused ? styles.labelActive : null]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ClientTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.barItem,
      }}
    >
      <Tabs.Screen
        name="portal"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem label="Home" icon="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem label="Explore" icon="explore" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem label="My Plots" icon="landscape" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem label="Documents" icon="folder-open" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem label="Profile" icon="person-outline" focused={focused} />
          ),
        }}
      />
      {/* Hidden from tab bar */}
      <Tabs.Screen name="subscription/[id]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: Platform.OS === "ios" ? 86 : 70,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  barItem: { alignItems: "center", justifyContent: "center" },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  iconPill: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  iconPillActive: { backgroundColor: Colors.brand50 },
  label: { fontSize: 10, fontWeight: "600", color: Colors.textMuted },
  labelActive: { color: Colors.brand, fontWeight: "800" },
});
