import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { ColorValue, StyleProp, View, ViewStyle } from "react-native";
import { moderateScale, scale, verticalScale } from "../../util/scaling";

interface CustomViewProps {
  shadowStyle?: StyleProp<ViewStyle>;
  boxStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
  radius: number;
  height?: number;
  width?: number;
  isGradient?: boolean;

  /** 🔥 NEW */
  gradientColors?: readonly [ColorValue, ColorValue, ...ColorValue[]]
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
}

export default function CustomView({
  shadowStyle,
  boxStyle,
  children,
  radius,
  height,
  width,
  isGradient = true,

  /** 🔥 NEW */
  gradientColors,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 1 },
}: CustomViewProps) {
  const resolvedColors: readonly [ColorValue, ColorValue, ...ColorValue[]] =
  isGradient
    ? gradientColors ?? ["#F7F6FA", "#EDEBF4"]
    : ["#FFFFFF", "#FFFFFF"];

  return (
    // 🔹 Shadow layer
    <View
      style={[
        {
          backgroundColor: "#8092ACA6",
          borderRadius: radius + scale(0),
          borderBottomRightRadius: radius + scale(1),
          borderTopLeftRadius: radius + scale(1),
          paddingLeft: scale(1),
          paddingBottom: verticalScale(1),
        },
        shadowStyle,
      ]}
    >
      {/* 🔹 Actual card */}
      <View
        style={{
          backgroundColor: isGradient ? resolvedColors[0] : "#FFFFFF",
          borderRadius: radius,
        }}
      >
        <LinearGradient
          colors={resolvedColors}
          start={gradientStart}
          end={gradientEnd}
          style={[
            {
              height,
              width,
              borderRadius: radius,
              borderWidth : moderateScale(0.7),
              borderColor : '#ffffff'
            },
            boxStyle,
          ]}
        >
          {children}
        </LinearGradient>
      </View>
    </View>
  );
}
