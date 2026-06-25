// ─────────────────────────────────────────────────────────────────────────────
// Tab Navigator — Material icons + active purple pill. Browse users see Explore.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useUnreadCount } from "@/hooks/useUnreadCount";

type IconName = keyof typeof MaterialIcons.glyphMap;

function TabItem({
  label,
  icon,
  focused,
  badge,
}: {
  label: string;
  icon: IconName;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={styles.item}>
      <View style={[styles.iconPill, focused ? styles.iconPillActive : null]}>
        <MaterialIcons
          name={icon}
          size={22}
          color={focused ? Colors.brand : Colors.textMuted}
        />
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
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

export default function TabLayout() {
  const role = useAuthStore((s) => s.role);
  const unreadCount = useUnreadCount();

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
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem label="Explore" icon="explore" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Dashboard"
              icon="space-dashboard"
              focused={focused}
            />
          ),
          href: role ? "/(tabs)/dashboard" : null,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Earnings"
              icon="account-balance-wallet"
              focused={focused}
            />
          ),
          href: role === "realtor" ? "/(tabs)/earnings" : null,
        }}
      />
      <Tabs.Screen
        name="recruits"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem label="Recruits" icon="groups" focused={focused} />
          ),
          href: role === "realtor" ? "/(tabs)/recruits" : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              label="Profile"
              icon="person-outline"
              focused={focused}
              badge={unreadCount}
            />
          ),
        }}
      />
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
  item: { alignItems: "center", justifyContent: "center", width: 64 },
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
  badge: {
    position: "absolute",
    top: -4,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  badgeText: { fontSize: 9, fontWeight: "900", color: "#fff", lineHeight: 12 },
});
