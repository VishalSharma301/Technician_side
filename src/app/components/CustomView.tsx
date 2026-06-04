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
  shadowColor? : ColorValue;
  borderColor? : ColorValue;

  /** 🔥 NEW */
  gradientColors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
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
  shadowColor="#864C2D4A",
  borderColor="#ffffff",

  /** 🔥 NEW */
  gradientColors,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 1 },
}: CustomViewProps) {
  const resolvedColors: readonly [ColorValue, ColorValue, ...ColorValue[]] =
    isGradient
      ? (gradientColors ?? ["#FEF2E3", "#FEF2E3"])
      : ["#FFFFFF", "#FFFFFF"];

  return (
    // 🔹 Shadow layer
    <View
      style={[
        {
          backgroundColor: shadowColor,
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
              borderWidth: moderateScale(0.7),
              borderColor: borderColor,
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
