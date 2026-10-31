// ─────────────────────────────────────────────────────────────────────────────
// withGradleMemory — gives Gradle and the Kotlin daemon enough heap/metaspace.
//
// `expo prebuild` writes org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m,
// which runs out of Metaspace (KSP in expo-updates) on a cold-cache release
// build. This plugin re-applies larger limits on every prebuild.
// ─────────────────────────────────────────────────────────────────────────────
const { withGradleProperties } = require("expo/config-plugins");

const PROPS = {
  "org.gradle.jvmargs":
    "-Xmx6g -XX:MaxMetaspaceSize=2g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8",
  "kotlin.daemon.jvmargs": "-Xmx4g -XX:MaxMetaspaceSize=1g",
};

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(PROPS)) {
      const existing = cfg.modResults.find(
        (item) => item.type === "property" && item.key === key
      );
      if (existing) existing.value = value;
      else cfg.modResults.push({ type: "property", key, value });
    }
    return cfg;
  });
};
