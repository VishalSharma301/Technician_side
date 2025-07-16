import {
    Image,
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

function NextButton({ onPress, style }: buttonProps) {
  return (
    <TouchableOpacity style={StyleSheet.compose(styles.root, style)} onPress={onPress}>
       
            
      <Text style={styles.text}>{">"}</Text>
       
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    height : 55,
    width : 55,
    borderRadius : 16,
    backgroundColor : '#2E4886',

  },
 text : {
    fontSize : 25,
    color : 'white',
    alignSelf : 'center',
    margin : 8
 }
});

export default NextButton;
