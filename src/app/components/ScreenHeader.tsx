import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { moderateScale, scale, verticalScale } from "../../util/scaling";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// 👇 Grab the correct type from Ionicons
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface HeaderProps {
  style?: ViewStyle;
  name: string;
  backButton?: boolean;
  onRightIconPress?: () => void;
  rightIconName?: IoniconName; // ✅ strongly typed now
}

export default function ScreenHeader({
  style,
  name,
  backButton = true,
  onRightIconPress,
  rightIconName = "settings-outline",
}: HeaderProps) {
  const navigation = useNavigation<any>();
  return (
    <View style={[styles.header, style]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ opacity: !backButton ? 0 : 1 }}
        disabled={!backButton}
      >
        <Text style={styles.back}>{`< Back`}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{name}</Text>
      <TouchableOpacity
        onPress={onRightIconPress || (() => navigation.navigate("SettingsScreen"))}
      >
        <Ionicons
          name={rightIconName}
          size={moderateScale(24)}
          color="#000"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(13),
    marginBottom: verticalScale(10),
    justifyContent: "space-between",
  },
  back: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    justifyContent: "center",
    width: scale(43),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    lineHeight: verticalScale(25),
    width: scale(202.9),
  },
});
