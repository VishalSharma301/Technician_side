import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { moderateScale, scale, verticalScale } from "../util/scaling";

interface buttonProps {
    onPress : ()=>void
    style? : ViewStyle
    text? : string
    textStyle? : TextStyle
}

export default function BookNowButton({textStyle, onPress, style, text }: buttonProps) {
  return (
    <TouchableOpacity style={StyleSheet.compose(styles.root, style)} onPress={onPress}>
      <Text style={[styles.text, textStyle]} >{text || "Book Now"}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    height: verticalScale(30),
    width: scale(83),
    alignItems: "center",
    justifyContent : 'center',
    // alignContent: "center",
    backgroundColor : "#2E4886",
   borderRadius : scale(100),
   padding :  moderateScale(7),
   paddingHorizontal : scale(11)

  },
  text : {
    fontSize : moderateScale(12),
    fontWeight : "500",
    color : "white",
    alignSelf : 'center',
    margin : 0,
    lineHeight : moderateScale(15)

  }
});


