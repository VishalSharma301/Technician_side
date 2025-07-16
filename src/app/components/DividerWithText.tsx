import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { scale } from "../../util/scaling";

interface DividerWithTextProps {
  style?: ViewStyle;
}

export default function DividerWithText({ style }: DividerWithTextProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.line} />
      <Text style={styles.text}>Or</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: scale(16),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E6E9EF",
  },
  text: {
    marginHorizontal: scale(8),
    fontSize: scale(16),
    color: "#596378",
    fontWeight: "500",
  },
});
