import "react-native-reanimated";
import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StyleSheet } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { AppLoader } from "@/components/ui/AppLoader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { Colors } from "@/constants/theme";
import { useRef } from "react";
import * as Linking from "expo-linking";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function ReferralDeepLinkHandler() {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const handledOnce = useRef(false);

  useEffect(() => {
    if (!isHydrated) return;

    const handleUrl = (url: string | null) => {
      if (!url) return;
      try {
        const { queryParams } = Linking.parse(url);
        const ref = queryParams?.ref;
        if (typeof ref !== "string" || ref.length === 0) return;
        if (user) return; // logged-in users don't get re-routed to signup
        router.push({
          pathname: "/(auth)/realtor-signup",
          params: { ref },
        } as any);
      } catch {
        // Ignore malformed URLs
      }
    };

    // Cold-start URL
    if (!handledOnce.current) {
      handledOnce.current = true;
      Linking.getInitialURL()
        .then(handleUrl)
        .catch(() => {});
    }

    // While-running URL events
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [isHydrated, user]);

  return null;
}

function RouteGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { user, clientUser } = useAuthStore();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inClientGroup = segments[0] === "(client)";
    const inAdminGroup = segments[0] === "(admin)";
    const inTabsGroup = segments[0] === "(tabs)";

    if (!user && inAdminGroup) {
      router.replace("/(auth)/admin-login" as any);
      return;
    }
    if (!clientUser && inClientGroup) {
      router.replace("/(auth)/client-login" as any);
      return;
    }
    // A logged-in client should never sit in the realtor/public tab group —
    // catches back-button drift and deep-link mishaps. Only redirect when this
    // is purely a client session (no realtor/admin user present).
    if (clientUser && !user && inTabsGroup) {
      router.replace("/(client)/portal" as any);
      return;
    }
    if (user && user.role !== "admin" && inAdminGroup) {
      router.replace("/(tabs)" as any);
      return;
    }
    if (user && inAuthGroup) {
      if (user.role === "admin") router.replace("/(admin)/dashboard" as any);
      else router.replace("/(tabs)" as any);
    }
  }, [user, clientUser, segments]);

  return null;
}

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    hydrate();
  }, []);

  // Hide native splash once our React app is mounted
  useEffect(() => {
    if (isHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isHydrated]);

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
          <BottomSheetModalProvider>
            <StatusBar style="light" backgroundColor={Colors.brand} />
            <OfflineBanner />

            {/* Show branded loader until auth state is hydrated from storage */}
            {!isHydrated ? (
              <AppLoader message="Getting things ready..." />
            ) : (
              <>
                <RouteGuard />
                <ReferralDeepLinkHandler />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "slide_from_right",
                  }}
                >
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(auth)"
                    options={{
                      headerShown: false,
                      animation: "slide_from_bottom",
                    }}
                  />
                  <Stack.Screen
                    name="(client)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(admin)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="estate/[slug]"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/edit-profile"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/bank-details"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/change-password"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/notification-preference"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/client-edit-profile"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="settings/client-change-password"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="leaderboard"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="notification"
                    options={{ headerShown: false, animation: "slide_from_bottom" }}
                  />
                  <Stack.Screen
                    name="subscription/new"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </>
            )}
          </BottomSheetModalProvider>
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
