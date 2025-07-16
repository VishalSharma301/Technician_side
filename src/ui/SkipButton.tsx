import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface buttonProps {
    onPress : ()=>void
    style? : ViewStyle
}

function SkipButton({ onPress, style }: buttonProps) {
  return (
    <TouchableOpacity style={StyleSheet.compose(styles.root, style)} onPress={onPress}>
      <Text style={styles.text} >Skip</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 33,
    // width: '20%',
    alignItems: "center",
    justifyContent : 'center',
    // alignContent: "center",
    backgroundColor : "#CDE4EF",
   borderRadius : 20,
   padding : 6,
   paddingHorizontal : 16

  },
  text : {
    fontSize : 14,
    fontWeight : "500",
    color : "#2E4886",
    alignSelf : 'center',
    margin : 0
  }
});

export default SkipButton;
