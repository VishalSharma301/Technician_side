// import React, { useRef, useState, useEffect, useContext } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Keyboard,
//   Alert,
// } from "react-native";
// import BookNowButton from "../../../ui/BookNowButton";
// import { useNavigation } from "@react-navigation/native";
// import { AuthContext } from "../../../store/AuthContext";
// import { moderateScale, scale, verticalScale } from "../../../util/scaling";

// export default function OTPVerificationScreen() {
//   const otpLength = 6;
//   const [otp, setOtp] = useState(new Array(otpLength).fill(""));
//   const [timer, setTimer] = useState(30);
//   const inputRefs = useRef([]);
//   const navigation = useNavigation();
//   const { setIsAuthenticated } = useContext(AuthContext);
//   const [focusedIndex, setFocusedIndex] = useState<number | null>();

//   useEffect(() => {
//     const countdown =
//       timer > 0 && setInterval(() => setTimer((t) => t - 1), 1000);
//     return () => clearInterval(countdown);
//   }, [timer]);

//   const handleChange = (text: any, index: any) => {
//     if (isNaN(text)) return;

//     const newOtp = [...otp];
//     newOtp[index] = text;
//     setOtp(newOtp);

//     if (text !== "" && index < otpLength - 1) {
//       inputRefs.current[index + 1].focus();
//     }

//     if (newOtp.every((val) => val !== "")) {
//       Keyboard.dismiss();
//       verifyOtp(newOtp.join(""));
//     }
//   };

//   const handleKeyPress = (e, index) => {
//     if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
//       inputRefs.current[index - 1].focus();
//     }
//   };

//   const verifyOtp = (code: number) => {
//     setIsAuthenticated(true);
//     // Alert.alert('OTP Entered', code);
//     // Replace with actual verification logic
//   };

//   const resendOtp = () => {
//     setOtp(new Array(otpLength).fill(""));
//     setTimer(30);
//     // Add resend OTP logic here
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>We have sent a verification code to</Text>
//       <Text style={styles.subtitle}>your registered mobile number</Text>

//       <View style={styles.otpContainer}>
//         {otp.map((digit, index) => (
//           <TextInput
//             key={index}
//             style={[
//               styles.otpInput,
//               (focusedIndex === index || otp[index] !== "") && styles.focusedInput, // apply style if focused
//             ]}
//             value={digit}
//             onChangeText={(text) => handleChange(text, index)}
//             keyboardType="numeric"
//             maxLength={1}
//             ref={(ref) => (inputRefs.current[index] = ref)}
//             onKeyPress={(e) => handleKeyPress(e, index)}
//             onFocus={() => setFocusedIndex(index)}
//             // onBlur={() => setFocusedIndex(null)}
//           />
//         ))}
//       </View>

//       {/* <TouchableOpacity style={styles.verifyButton} onPress={)}>
//         <Text style={styles.verifyText}>Verify</Text>
//       </TouchableOpacity> */}

//       {/* <BookNowButton onPress={() => verifyOtp(otp.join(''))} style={styles.verifyButton} text='Continue' textStyle={{fontSize : 16}}/> */}

//       <TouchableOpacity
//         disabled={timer > 0}
//         onPress={resendOtp}
//         style={styles.resendContainer}
//       >
//         <View style={{ flexDirection: "row", gap: 5 }}>
//           <Text style={{}}>Didn’t get the OTP?</Text>
//           <Text
//             style={[
//               styles.resendText,
//               { color: timer > 0 ? "gray" : "rgb(70, 140, 159)d" },
//             ]}
//           >
//             {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
//           </Text>
//         </View>

//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           style={{
//             marginTop: 120,
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <Text style={{ color: "blue", fontWeight: "600" }}>
//             {" "}
//             Go back to login methods{" "}
//           </Text>
//         </TouchableOpacity>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: 120,
//     alignItems: "center",
//     backgroundColor: "#fff",
//     paddingHorizontal: 20,
//   },
//   title: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#000",
//   },
//   subtitle: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#000",
//     marginTop: 10,
//     marginBottom: 30,
//     textAlign: "center",
//   },
//   otpContainer: {
//     flexDirection: "row",
//     justifyContent: "space-evenly",
//     width: scale(346),
//     gap: scale(18),
//     marginHorizontal: scale(22),
//     // borderWidth : 1
//   },
//   otpInput: {
//     borderWidth: 2,
//     borderColor: "#E4E9EC",
//     fontSize: moderateScale(16),
//     fontWeight : '500',
//     textAlign: "center",
//     textAlignVertical : 'center',
//     padding: 10,
//     width: scale(41),
//     height: scale(44),
//     color: "#000",
//     borderRadius: 10,
//     // height : '80%'
//   },
//   focusedInput: {
//     borderColor: "#000",
//   },
//   verifyButton: {
//     marginTop: 40,
//     // backgroundColor: '#ff4d4d',
//     // paddingVertical: 12,
//     // paddingHorizontal: 80,
//     width: 150,
//     height: 42,
//     borderRadius: 8,
//   },
//   verifyText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   resendContainer: {
//     marginTop: 20,
//   },
//   resendText: {
//     fontSize: 14,
//     fontWeight: "500",
//   },
// });
