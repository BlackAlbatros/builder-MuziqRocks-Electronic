#!/usr/bin/env sh
set -e

# Downloads gradle-wrapper.jar from Maven Central and writes a minimal gradle-wrapper.properties
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/gradle/wrapper"

JAR_URL="https://repo1.maven.org/maven2/org/gradle/gradle-wrapper/8.4/gradle-wrapper-8.4.jar"
JAR_PATH="$ROOT/gradle/wrapper/gradle-wrapper.jar"

echo "Downloading gradle-wrapper.jar from $JAR_URL ..."
# Use curl or wget
if command -v curl >/dev/null 2>&1; then
  curl -fSL "$JAR_URL" -o "$JAR_PATH"
elif command -v wget >/dev/null 2>&1; then
  wget -O "$JAR_PATH" "$JAR_URL"
else
  echo "Error: curl or wget is required to download gradle-wrapper.jar" >&2
  exit 1
fi

cat > "$ROOT/gradle/wrapper/gradle-wrapper.properties" <<'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

echo "gradle-wrapper.jar downloaded to $JAR_PATH and properties written. You can now run ./gradlew <task>"
