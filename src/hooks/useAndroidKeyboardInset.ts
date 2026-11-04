// ─────────────────────────────────────────────────────────────────────────────
// useAndroidKeyboardInset — how far the on-screen keyboard overlaps the
// screen on Android, 0 when hidden (and always 0 on iOS).
//
// With edge-to-edge (Android 15+) the window no longer resizes for the
// keyboard, and KeyboardAvoidingView's "height" mode can leave the view
// shrunk after the keyboard closes (a grey band at the bottom). Screens pad
// their scroll content by this value instead.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Dimensions, Keyboard, Platform } from "react-native";

export function useAndroidKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", (e) =>
      setInset(
        Math.max(0, Dimensions.get("screen").height - e.endCoordinates.screenY),
      ),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () => setInset(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return inset;
}
