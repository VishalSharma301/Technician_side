import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { verticalScale, moderateScale, scale } from "../../util/scaling";

type Props = {
  visible: boolean;
  title?: "Success" | "Error";
  message?: string;
  buttonText?: string;
  onConfirm: () => void;
};

export default function SuccessAlert({
  visible,
  title = "Success",
  message = "Verification Request Sent to Customer",
  buttonText = "Confirm",
  onConfirm,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient
          colors={["#3A2316", "#1F120C", "#3A2316"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          {/* Decorative Elements */}
          <View style={styles.decorContainer}>
            <View style={styles.leftDecor}>
              <Dot />
              <Dot small />
              <Star />
              <Dot small />
            </View>

            <View style={styles.rightDecor}>
              <Dot />
              <Dot small />
              <Star />
              <Dot small />
            </View>
          </View>

          {/* Success Icon */}
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={["#2B1A12", "#1B100B"]}
              style={styles.iconGradient}
            >
              <Ionicons
                name={title === "Success" ? "checkmark" : "close"}
                size={title === "Success" ? scale(32) : scale(40)}
                color={title === "Success" ? "#73D977" : "#EF4444"}
              />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.buttonWrapper}
            onPress={onConfirm}
          >
            <LinearGradient
              colors={["#E8C69C", "#E8C69C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

function Dot({ small = false }: { small?: boolean }) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: small ? scale(4) : scale(6),
          height: small ? scale(4) : scale(6),
        },
      ]}
    />
  );
}

function Star() {
  return <Text style={styles.star}>✦</Text>;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(0),
  },

  container: {
    width: "100%",
    maxWidth: scale(360),
    minHeight: verticalScale(320),

    borderRadius: moderateScale(28),
    borderWidth: moderateScale(2),
    borderColor: "#DFA65E",

    paddingHorizontal: scale(24),
    paddingTop: verticalScale(34),
    paddingBottom: verticalScale(26),

    alignItems: "center",
    overflow: "hidden",
  },

  decorContainer: {
    position: "absolute",
    top: verticalScale(58),
    width: "100%",

    flexDirection: "row",
    justifyContent: "space-between",

    paddingHorizontal: scale(32),
  },

  leftDecor: {
    alignItems: "center",
    gap: verticalScale(12),
  },

  rightDecor: {
    alignItems: "center",
    gap: verticalScale(12),
  },

  dot: {
    backgroundColor: "#D89A3D",
    borderRadius: 999,
    opacity: 0.9,
  },

  star: {
    color: "#D89A3D",
    fontSize: moderateScale(13),
  },

  iconWrapper: {
    width: scale(78),
    height: scale(78),
    borderRadius: scale(39),

    borderWidth: 2,
    borderColor: "#D89A3D",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: verticalScale(18),
  },

  iconGradient: {
    width: "88%",
    height: "88%",
    borderRadius: 999,

    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#FFFFFF",
    fontSize: moderateScale(30),
    fontWeight: "700",
    marginBottom: verticalScale(10),
    letterSpacing: 0.5,
  },

  message: {
    color: "#DCC6AF",
    fontSize: moderateScale(15),
    textAlign: "center",
    lineHeight: verticalScale(24),

    paddingHorizontal: scale(8),
    marginBottom: verticalScale(32),
  },

  buttonWrapper: {
    width: "100%",
    borderRadius: moderateScale(10),
    overflow: "hidden",
  },

  button: {
    width: "100%",
    paddingVertical: verticalScale(12),
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#E8C69C",
    borderWidth: 1,
  },

  buttonText: {
    color: "#2A1A10",
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
});
