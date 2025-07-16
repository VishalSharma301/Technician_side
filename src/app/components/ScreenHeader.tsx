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

interface HeaderProps {
  style?: ViewStyle;
  name: string;
  backButton?: boolean;
}

export default function ScreenHeader({
  style,
  name,
  backButton = true,
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
        onPress={() => navigation.navigate("ProfileScreen")}
        style={{}}
      >
        <Ionicons
          name="settings-outline"
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
    // height: verticalScale(28),
    marginTop: verticalScale(13),
    marginBottom: verticalScale(10),
    // borderWidth: 1,
    justifyContent : 'space-between'
  },
  back: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    justifyContent: "center",
    width: scale(43),
    // borderWidth: 1,
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    lineHeight: verticalScale(25),
    // borderWidth: 1,
    width : scale(202.9)
  },
});
