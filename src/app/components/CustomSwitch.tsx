import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { moderateScale, scale, verticalScale } from "../../util/scaling";

interface CustomSwitchProps {
  value: boolean;
  onToggle?: (val: boolean) => void;
}

export default function CustomSwitch({ value, onToggle }: CustomSwitchProps) {
  const [switchState, setSwitchState] = useState<boolean>(value);

  function toggleSwitch() {
    const newValue = !switchState;
    setSwitchState(newValue);
    onToggle?.(newValue);
  }

  return (
    <TouchableOpacity
      style={{
        width: scale(48),
        height: scale(25.79),
        borderRadius: scale(200),
        backgroundColor: switchState ? "#045BD8" : "#CDE1FF",
        alignItems: switchState ? "flex-end" : "flex-start",
        justifyContent: "center",
        paddingHorizontal: scale(2.15),
      }}
      onPress={toggleSwitch}
    >
      <View
        style={{
          height: scale(20.06),
          width: scale(20.06),
          borderRadius: scale(20),
          backgroundColor: switchState ? "#CDE1FF" : "#045BD8",
        }}
      ></View>
    </TouchableOpacity>
  );
}
