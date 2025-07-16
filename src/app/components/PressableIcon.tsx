import { Pressable, Text, TextStyle, ViewStyle } from "react-native";

import { StyleSheet } from "react-native";
import colors from "../../constants/colors";
// import { Icon as MaterialIcon} from "@rneui/base";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

interface PressableIconProps {
  name: IoniconName 
  height?: number;
  width?: number;
  onPress?: () => void;
  color: string;
  // IconStyle?: ViewStyle | TextStyle;
  containerStyle?: ViewStyle | ViewStyle[];
  text?: string;
  textStyle?: TextStyle;
  disabled?: boolean;
  materialIcon?: boolean;
}

export default function PressableIcon({
  name,
  height,
  width,
  onPress,
  color,
  // IconStyle,
  containerStyle,
  text,
  textStyle,
  disabled,
  materialIcon = false,
}: PressableIconProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        containerStyle,
        pressed && { opacity: 0.5 },
      ]}
      disabled={disabled}
    >
      {<Ionicons name={name} size={height} color={disabled ?'rgb(154, 153, 153)' :color} />}
      {text && <Text style={textStyle}>{text}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    width: 44,
    color: colors.neutral.Neutral900,
  },
});
