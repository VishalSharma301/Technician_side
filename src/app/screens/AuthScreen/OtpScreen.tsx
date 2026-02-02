import React, { useRef, useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Alert,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import BookNowButton from "../../../ui/BookNowButton";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../../store/AuthContext";
import { moderateScale, scale, verticalScale } from "../../../util/scaling";
import { loginDirect, verifyOtp } from "../../../util/authApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileContext } from "../../../store/ProfileContext";
import CustomView from "../../components/CustomView";
import { LinearGradient } from "expo-linear-gradient";

export default function OTPVerificationScreen() {
  const otpLength = 6;
  const [otp, setOtp] = useState(new Array(otpLength).fill(""));
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<any>([]);
  const navigation = useNavigation();
  const { setIsAuthenticated } = useContext(AuthContext);
  const { phoneNumber } = useContext(ProfileContext);
  const [focusedIndex, setFocusedIndex] = useState<number | null>();

  useEffect(() => {
    let countdown: ReturnType<typeof setInterval> | undefined;

    if (timer > 0) {
      countdown = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }

    return () => {
      if (countdown) clearInterval(countdown);
    };
  }, [timer]);

  const handleChange = (text: any, index: any) => {
    if (isNaN(Number(text))) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text !== "" && index < otpLength - 1) {
      inputRefs.current[index + 1].focus();
    }

    if (newOtp.every((val) => val !== "")) {
      Keyboard.dismiss();
      verifyOtpCode(newOtp.join(""));
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const verifyOtpCode = async (code: string) => {
    // ✅ ADDED
    console.log("otpdata : ", phoneNumber + code);
    // const result = await verifyOtp(phoneNumber, code); // ✅ ADDED
 const result = await loginDirect(); // ✅ ADDED


    if (result && result.token?.token && result.technician) {
      const jwtToken = result.token.token;
      const userData = result.technician;

      console.log("result: ", result);

      try {
        await AsyncStorage.setItem("token", jwtToken);
          console.log("saved token :", jwtToken);
          
        // Only store if userData is defined and not null
        if (userData) {
          await AsyncStorage.setItem("user", JSON.stringify(userData));
          setIsAuthenticated(true);
        } else {
          console.error(
            "userData is undefined or null, not saving to AsyncStorage"
          );
        }
      } catch (err) {
        console.error("Error saving token or user:", err);
      }
    } else {
      Alert.alert("Verification Failed", "Invalid OTP or server error");
    }
  };

  const resendOtp = () => {
    setOtp(new Array(otpLength).fill(""));
    setTimer(30);
    // Add resend OTP logic here
  };

  return (
     <View style={styles.container}>
      <CustomView
        radius={moderateScale(12)}
        shadowStyle={{ marginVertical: verticalScale(65) }}
      >
        <View style={styles.box}>
          <Text style={styles.title}>Enter verification</Text>
          <Text style={styles.subText}>
            We’ve sent a code to hello@technicianapp.com
          </Text>

          <View style={styles.codeContainer}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <CustomView radius={moderateScale(8)}  key={i}>
                <TextInput
                 
                  ref={(ref) => {
                    inputRefs.current[i] = ref;
                  }}
                  style={styles.codeBox}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={otp[i]}
                  autoFocus={i === 0}
                  onChangeText={(val) => {
                    const updated = [...otp];
                    updated[i] = val;
                    setOtp(updated);

                    // Auto-jump forward
                    if (val && i < 5) {
                      inputRefs.current[i + 1]?.focus();
                    }

                    // On last box, blur
                    if (i === 5 && val) {
                      inputRefs.current[i]?.blur();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    // Auto-jump backward
                    if (
                      nativeEvent.key === "Backspace" &&
                      otp[i] === "" &&
                      i > 0
                    ) {
                      inputRefs.current[i - 1]?.focus();
                    }
                  }}
                />
              </CustomView>
            ))}
          </View>

          <Text style={styles.resendText}>
            Didn’t get a code?{" "}
            <Text style={styles.linkText}>Click to resend.</Text>
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => {}}>
              <CustomView
                radius={moderateScale(50)}
                boxStyle={{
                  width: scale(96),
                  height: verticalScale(36),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text>Cancel</Text>
              </CustomView>
            </TouchableOpacity>
           
              
             <TouchableOpacity onPress={() => verifyOtpCode(otp.join(""))}>
                          <LinearGradient
                            style={styles.verifyButton}
                            colors={["#027CC7", "#004DBD"]}
                          >
                            <Text style={{ color: "#fff" }}>Verify</Text>
                          </LinearGradient>
                        </TouchableOpacity>
          </View>
        </View>
      </CustomView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: 120,
    alignItems: "center",
    // backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
    box: {
    width: scale(375),
    // height: verticalScale(249),
    // marginHorizontal : scale(9),
    padding: moderateScale(20),
    //  backgroundColor: "#FFFFFF1A",
    paddingHorizontal: moderateScale(17),
    paddingVertical: verticalScale(18),
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // elevation: 100,
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "600",
    color: "#027CC7",
    textAlign: "center",
  },
  subText: {
    textAlign: "center",
    color: "#6B687D",
    fontSize: moderateScale(10),
    fontWeight: "400",
    marginVertical: verticalScale(5),
  },
  codeContainer: {
    flexDirection: "row",
    gap: scale(7),
    justifyContent: "center",
    marginVertical: verticalScale(10),
  },
  codeBox: {
    width: scale(48),
    height: scale(48),
    // backgroundColor: "#FFFFFF1A",
    // borderRadius: moderateScale(8),
    textAlign: "center",
    fontSize: moderateScale(18),
    // borderWidth: 0.9,
    // borderColor: "#ffffff",
  },
 linkText: {
    color: "#000",
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: verticalScale(15),
    gap: scale(12),
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginTop: 10,
    marginBottom: 30,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: scale(346),
    gap: scale(18),
    marginHorizontal: scale(22),
    // borderWidth : 1
  },
  otpInput: {
    borderWidth: 2,
    borderColor: "#E2D3B5",
    fontSize: moderateScale(16),
    fontWeight: "500",
    textAlign: "center",
    textAlignVertical: "center",
    padding: 10,
    width: scale(41),
    height: scale(44),
    color: "#000",
    borderRadius: 10,
    backgroundColor : '#ffffff57'
    // height : '80%'
  },
  focusedInput: {
    borderColor: "#000",
  },
  verifyButton: {
    alignItems: "center",
    justifyContent: "center",
    // paddingVertical: verticalScale(10),
    backgroundColor: "#027CC7",
    borderRadius: moderateScale(50),
    borderWidth: 1,
    borderColor: "#027CC7",
    // marginRight: scale(8),
    width: scale(96),
    height: verticalScale(36),
  },
  verifyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    marginTop: 20,
  },
 resendText: {
    textAlign: "center",
    color: "#000",
    fontWeight: "400",
    marginVertical: verticalScale(10),
  },
});
