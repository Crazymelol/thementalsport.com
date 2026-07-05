import { Text, View } from "react-native";
import { C } from "../../ui/theme";

// Placeholder — replaced by the breathing-tools task.
export default function Tools() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: C.dim }}>Breathing tools coming up.</Text>
    </View>
  );
}
