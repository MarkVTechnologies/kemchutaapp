// ─────────────────────────────────────────────────────────────────────────────
// ChatMarkdown — renders the small markdown subset the AI assistant writes
// (**bold**, *italic*, [links](url), bullet/numbered lists, # headings) so
// replies don't show raw asterisks. Deliberately dependency-free: anything it
// doesn't recognise is shown as plain text, never dropped.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Linking, StyleProp, Text, TextStyle, View, StyleSheet } from "react-native";

const INLINE =
  /(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\)|\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)/g;

const SAFE_LINK = /^(https?:|mailto:|tel:)/i;

function openLink(url: string) {
  if (SAFE_LINK.test(url)) Linking.openURL(url).catch(() => {});
}

function renderInline(text: string, linkStyle: StyleProp<TextStyle>, keyBase: string) {
  const parts = text.split(INLINE);
  return parts.map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <Text key={key} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label, url] = link;
      return SAFE_LINK.test(url) ? (
        <Text key={key} style={linkStyle} onPress={() => openLink(url)}>
          {label}
        </Text>
      ) : (
        <Text key={key}>{label}</Text>
      );
    }
    if (
      part.length > 2 &&
      ((part.startsWith("*") && part.endsWith("*")) ||
        (part.startsWith("_") && part.endsWith("_")))
    ) {
      return (
        <Text key={key} style={styles.italic}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Text key={key}>{part}</Text>;
  });
}

interface Props {
  content: string;
  textStyle?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
}

export function ChatMarkdown({ content, textStyle, linkStyle }: Props) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  return (
    <View>
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <View key={i} style={styles.gap} />;
        if (/^\s*([-*_])\1{2,}\s*$/.test(line))
          return <View key={i} style={styles.rule} />;

        const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
        const numbered = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
        const heading = /^\s*#{1,6}\s+(.*)$/.exec(line);

        if (bullet || numbered) {
          const marker = bullet ? "•" : `${numbered![1]}.`;
          const body = bullet ? bullet[1] : numbered![2];
          return (
            <View key={i} style={styles.listRow}>
              <Text style={[textStyle, styles.marker]}>{marker}</Text>
              <Text style={[textStyle, styles.listBody]}>
                {renderInline(body, linkStyle, `l${i}`)}
              </Text>
            </View>
          );
        }
        if (heading) {
          return (
            <Text key={i} style={[textStyle, styles.bold]}>
              {renderInline(heading[1], linkStyle, `h${i}`)}
            </Text>
          );
        }
        return (
          <Text key={i} style={textStyle}>
            {renderInline(line, linkStyle, `p${i}`)}
          </Text>
        );
      })}
    </View>
  );
}

/** Plain-text version of an AI reply, for places like report emails. */
export function stripChatMarkdown(content: string): string {
  return content
    .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/(^|[^*\w])\*([^*\s][^*\n]*)\*/g, "$1$2")
    .replace(/(^|[^_\w])_([^_\s][^_\n]*)_/g, "$1$2")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/^(\s*)\*\s+/gm, "$1- ");
}

const styles = StyleSheet.create({
  bold: { fontWeight: "700" },
  italic: { fontStyle: "italic" },
  gap: { height: 6 },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginVertical: 8,
  },
  listRow: { flexDirection: "row", paddingLeft: 2 },
  marker: { width: 16 },
  listBody: { flex: 1 },
});
