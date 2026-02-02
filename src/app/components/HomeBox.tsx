import React from "react";
import {
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import { scale, moderateScale, verticalScale } from "../../util/scaling";

interface HomeBoxProps {
  onPress?: () => void;
  borderColor?: string;
  boxColor?: string;
  circleColor?: string;
  image: ImageSourcePropType;
  title: string;
  count: string | number;
}

export default function HomeBox({
  onPress,
  borderColor = "#1553CD",
  boxColor = "#055FE133",
  circleColor = "#1257D11A",
  image,
  title,
  count,
}: HomeBoxProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.container, { borderColor, backgroundColor: boxColor }]}>
        
        <Image style={styles.icon} source={image} />

        <Text style={styles.title}>{title}</Text>

        <View style={[styles.circle, { backgroundColor: circleColor }]}>
          <Text style={styles.count}>{count}</Text>
        </View>

      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: scale(1),
    width: scale(178),
    height: verticalScale(104),
    borderRadius: moderateScale(12),
    alignItems: "center",
    alignSelf: "center",
    // marginBottom: verticalScale(22),
    overflow: "hidden",
  },

  icon: {
    height: verticalScale(42),
    width: scale(39),
    marginTop: verticalScale(6),
    resizeMode: "contain",
  },

  title: {
    fontWeight: "600",
    fontSize: moderateScale(16),
    marginTop: verticalScale(-2),
  },

  circle: {
    width: scale(111),
    height: scale(111),
    borderRadius: scale(111),
    alignItems: "center",
    
  },

  count: {
    fontWeight: "600",
    fontSize: moderateScale(16),
    marginTop: verticalScale(4),
  },
});
