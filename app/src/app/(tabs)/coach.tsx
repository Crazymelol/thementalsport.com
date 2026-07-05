import { Text, View } from "react-native";
import { C } from "../../ui/theme";

// Placeholder — replaced by the coach-chat task.
export default function Coach() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: C.dim }}>Coach chat coming up.</Text>
    </View>
  );
}
