import React, { useContext, useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  useWindowDimensions,
  Dimensions,
} from "react-native";
// import OrangeButton from "../../ui/OrangeButton";
// import { AuthContext } from "../../store/AuthContext";
// import {} from "../../../util/location";
// import AuthenticatePhoneNumber from "../../../util/localAPIs";
// import { LocalAuthContext } from "../../store/LocalAuthContext";
// import { ProfileContext } from "../../store/ProfileContext";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import BookNowButton from "../../../ui/BookNowButton";
// import { AuthContext } from "../../../store/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { verticalScale, moderateScale, scale } from "../../../util/scaling";
import CustomTextInput from "../../components/TextInput";
import DividerWithText from "../../components/DividerWithText";
import { login, loginWithEmail } from "../../../util/authApi";
import { ProfileContext } from "../../../store/ProfileContext";
import { AuthContext } from "../../../store/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import AuthInput from "../../components/AuthInput";
import CustomView from "../../components/CustomView";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import storeUserProfileData from "../../../util/userData";
// import phoneAuthentication, { verifyOtp } from "../../../util/authentication";

export default function AuthScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [isOtpLogin, setIsOtpLogin] = useState(false);
  // const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState<string>("+91");
  const [phoneNumberInput, setPhoneNumberInput] = useState<string>("");
  // const [phNumber, setPhNumber] = useState<string>("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loginWithOtp, setLoginWithOtp] = useState(true);
  // const { setIsAuthenticated } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const { setIsAuthenticated, setToken } = useContext(AuthContext);
  const {
    setPhoneNumber,
    setFirstName,
    setLastName,
    setIsNewUser,
    phoneNumber,
    email,
    setEmail
  } = useContext(ProfileContext);

  // const email = "jsingh77247@gmail.com";
  // const password = "123456789";

  const SCREEN_WIDTH = Dimensions.get("screen").width;
  const SCREEN_HEIGHT = Dimensions.get("screen").height;

  useEffect(() => {
    setPhoneNumber(`${countryCode}${phoneNumberInput}`);
  }, [countryCode, phoneNumberInput]);

  function validatePhoneNumber(countryCode: string, phoneNumber: string) {
    const countryCodeRegex = /^\+\d{2}$/;
    const phoneNumberRegex = /^\d{10}$/;

    if (!countryCodeRegex.test(countryCode)) {
      Alert.alert(
        "Invalid Country Code",
        "Please enter a valid country code starting with + followed by 1 to 3 digits.",
      );
      return false;
    }

    if (!phoneNumberRegex.test(phoneNumber)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number.",
      );
      return false;
    }

    return true;
  }
  const toggleSignup = () => {
    setIsSignup((prev) => !prev);
    setIsOtpLogin(false);
  };

  // toggle OTP login
  const toggleOtpLogin = () => {
    setIsOtpLogin((prev) => !prev);
    setIsSignup(false);
  };

  //   async function handelSignIn() {
  //     if (validatePhoneNumber(countryCode, phoneNumberInput)) {
  //       try {
  //         const responseData = await AuthenticatePhoneNumber(
  //           phNumber,
  //           setIsNewUser,
  //           setIsProfileCompleted
  //         );
  //         await storeUserProfileData({
  //           firstName: responseData.user.firstName,
  //           lastName: responseData.user.lastName,
  //           email: responseData.user.email,
  //           phoneNumber: phNumber,
  //         });
  //         const receivedToken = responseData.token;
  //         setToken(receivedToken);
  //         // setPhoneNumber(phNumber);
  //         // setFirstName(responseData.user.firstName);
  //         // setLastName(responseData.user.lastName);
  //         // setEmail(responseData.user.email);
  //         Alert.alert("Logging You In");
  //       } catch (error) {
  //         console.error("Error signing in", error);
  //       }
  //     }
  //   }

  //   async function sendOtpHandler() {
  //     if (validatePhoneNumber(countryCode, phoneNumberInput)) {
  //       try {
  //         await phoneAuthentication(phoneNumberInput).then(() => {
  //           Alert.alert("OTP sent successfully", "Please enter the OTP");
  //           setOtpSent(true);
  //         });
  //       } catch (error) {
  //         console.error("Error sending OTP", error);
  //       }
  //     }
  //   }

  //   const handleConfirmOtp = async () => {
  //     try {
  //       const responseData = await verifyOtp(
  //         phoneNumberInput,
  //         otp,
  //         setIsNewUser,
  //         setIsProfileCompleted
  //       );
  //       await storeUserProfileData({
  //         firstName: responseData.user.firstName,
  //         lastName: responseData.user.lastName,
  //         email: responseData.user.email,
  //         phoneNumber: phNumber,
  //       });
  //       const receivedToken = responseData.token;
  //       setToken(receivedToken);

  //       Alert.alert("Logging You In");
  //     } catch (error) {
  //       console.log("Invalid code. otp");
  //     }
  //   };

  // const handleConfirmOtp = async () => {
  //   try {
  //      confirmOtp(otp);
  //   } catch (error) {
  //     console.log("Invalid code. otp");
  //   }
  // };

  const handleLogin = async () => {
    if(!email || !password){
      Alert.alert('Incomplete Data', 'Both Email and password are required')
      return
    }
    try {
      // setLoading(true);

      const result = await loginWithEmail(email, password);

      if (result && result.token?.token && result.technician) {
        const jwtToken = result.token.token;
        const userData = result.technician;

        console.log("result: ", result);

        try {
          await AsyncStorage.setItem("token", jwtToken);
          setToken(jwtToken);
          console.log("saved token :", jwtToken);

          // Only store if userData is defined and not null
          if (userData) {
            await AsyncStorage.setItem("user", JSON.stringify(userData));
            setIsAuthenticated(true);
          } else {
            console.error(
              "userData is undefined or null, not saving to AsyncStorage",
            );
          }
        } catch (err) {
          console.error("Error saving token or user:", err);
        }
      } else {
        Alert.alert("Verification Failed", "Invalid OTP or server error");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.root}
      // behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          style={styles.image}
          source={require("../../../../assets/placeholder.png")}
        />
        <CustomView radius={moderateScale(12)} >
          <View style={styles.box}>
            <Text style={styles.title}>
              {isOtpLogin ? "Login with OTP" : isSignup ? "Sign Up" : "Login"}
            </Text>
            <Text style={styles.subText}>
              {isOtpLogin
                ? "Enter your phone number to receive an OTP"
                : isSignup
                  ? "Create a new account"
                  : "Welcome Back"}
            </Text>

            {/* Inputs */}
            {isOtpLogin ? (
              <>
                <AuthInput
                  iconName="phone-outline"
                  placeholder="Enter Phone Number"
                  keyboardType="phone-pad"
                  title="Email or Phone"
                  onChangeText={setPhoneNumberInput}
                  maxLength={10}
                  autoFocus={true}
                />
              </>
            ) : (
              <>
                <AuthInput
                  iconName="email-outline"
                  placeholder="Email or Phone"
                  title="Email or Phone"
                  onChangeText={setEmail}
                  value={email}
                />

                {isSignup && (
                  <AuthInput
                    iconName="account-outline"
                    placeholder="User Name"
                    title="User Name"
                  />
                )}

                <AuthInput
                  iconName="lock-outline"
                  placeholder="Enter Your Password"
                  secureTextEntry
                  title="Password"
                  onChangeText={setPassword}
                  value={password}
                />

                {isSignup && (
                  <AuthInput
                    iconName="lock-check-outline"
                    placeholder="Confirm Password"
                    secureTextEntry
                    title="Confirm Password"
                  />
                )}
              </>
            )}

            {/* Forgot Password */}
            {/* {!isSignup && !isOtpLogin && (
              <TouchableOpacity
                onPress={() => navigation.navigate("ResetPasswordScreen")}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )} */}

            {/* Main Button */}
            <TouchableOpacity onPress={handleLogin} style={{marginTop : 12}}>
              <CustomView
              radius={scale(12)}
              gradientColors={["#729869", "#729869"]}
              borderColor={"#E7ECF8"}
              shadowColor={"#77966F"}
              boxStyle={styles.button}
            >
                <Text style={styles.buttonText}>
                  {isOtpLogin ? "Send OTP" : isSignup ? "Sign Up" : "Login"}
                </Text>
             </CustomView>
            </TouchableOpacity>

            {/* OR */}
            {!isSignup && (
              <>
                {!isOtpLogin && (
                  <>
                    {/* <Text style={styles.orText}>Or</Text> */}

                    {/* <TouchableOpacity onPress={toggleOtpLogin}>
                      <CustomView
                        radius={moderateScale(50)}
                        boxStyle={{
                          paddingVertical: verticalScale(8),
                          alignItems: "center",
                        }}
                        shadowStyle={{ marginVertical: verticalScale(10) }}
                      >
                        <Text style={styles.otpText}>Login With OTP</Text>
                      </CustomView>
                    </TouchableOpacity> */}
                  </>
                )}

                {isOtpLogin && (
                  <TouchableOpacity onPress={toggleOtpLogin}>
                    <CustomView
                      radius={moderateScale(50)}
                      boxStyle={{
                        paddingVertical: verticalScale(8),
                        alignItems: "center",
                      }}
                      shadowStyle={{ marginVertical: verticalScale(10) }}
                    >
                      <Text style={[styles.otpText, { color: "#000" }]}>
                        Back to Login
                      </Text>
                    </CustomView>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Footer */}
            {/* {!isOtpLogin && (
              <View style={{ flexDirection: "row", justifyContent: "center" }}>
                <Text style={styles.footerText}>
                  {isSignup
                    ? "Already have an Account? "
                    : "Don’t have an Account? "}
                </Text>
                <TouchableOpacity
                  onPress={toggleSignup}
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={styles.linkText}>
                    {isSignup ? "Login" : "Sign Up"}
                  </Text>
                </TouchableOpacity>
              </View>
            )} */}

            {/* Social Login */}
          </View>
        </CustomView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFF5EB",
  },
  container: {
    alignItems: "center",
    // flexGrow: 1,
    // paddingHorizontal: 20,
    // justifyContent: "center",
  },
  topContainer: {
    // borderWidth: 1,
    backgroundColor: "#FCF3E2",
    borderRadius: moderateScale(12),
    // paddingHorizontal : scale(17),
    // marginHorizontal : scale(9)
    width: scale(375),
  },
  box: {
    width: scale(375),
    // backgroundColor: "#FFFFFF1A",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(17),
    paddingVertical: verticalScale(18),
    borderWidth: 0.9,
    borderColor: "#FFFFFF",
  },
  title: {
    fontSize: moderateScale(25),
    fontWeight: "700",
    textAlign: "center",
  },
  subText: {
    textAlign: "center",
    color: "#596378",
    fontSize: moderateScale(16),
    fontWeight: "500",
    marginBottom: verticalScale(15),
  },
  forgotText: {
    alignSelf: "flex-end",
    color: "#027CC7",
    fontSize: moderateScale(16),
    fontWeight: "500",
  },
  button: {
    // backgroundColor: "#027CC7",
    // borderRadius: moderateScale(50),
    // paddingVertical: verticalScale(10),
    alignItems: "center",
    justifyContent: "center",
    // marginVertical: verticalScale(10),
    height: verticalScale(48),
  },
  buttonText: {
    color: "#fff",
    fontSize: moderateScale(18),
    fontWeight: "500",
  },
  orText: {
    textAlign: "center",
    color: "#666",
  },

  otpText: {
    color: "#000",
    fontWeight: "500",
    fontSize: moderateScale(16),
  },
  footerText: {
    textAlign: "center",
    marginVertical: verticalScale(5),
    fontSize: moderateScale(10),
    fontWeight: "400",
  },
  linkText: {
    color: "#027CC7",
    fontWeight: "700",
    fontSize: moderateScale(10),
  },
  linkText2: {
    color: "#000",
    fontWeight: "500",
    fontSize: moderateScale(8),
    borderBottomWidth: moderateScale(0.7),
    borderColor: "#000",
    borderStyle: "dashed",
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: verticalScale(10),
  },
  socialIcon: {
    width: scale(35),
    height: scale(35),
    backgroundColor: "#E8E8E8",
    borderRadius: moderateScale(8),
    marginHorizontal: scale(6),
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  image: {
    marginVertical: verticalScale(34),

    height: verticalScale(117),
    width: scale(165),
    resizeMode: "contain",
    // position : 'absolute'
  },
  formContainer: {
    // width: "100%",
    marginHorizontal: scale(22),
    marginTop: verticalScale(24),
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "500",
    color: "#596378",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  countryCodeInput: {
    // flex: 1,

    borderRadius: 5,
    padding: 10,
    marginRight: 15,
    elevation: 3,
    backgroundColor: "white",
    marginTop: 5,
    fontSize: 18,
    fontWeight: "500",
    width: scale(71),
  },
  phoneNumberInput: {
    // flex: 4,
    width: scale(257),
    borderRadius: 5,
    padding: 10,
    elevation: 3,
    backgroundColor: "white",
    marginTop: 5,
    fontSize: 16,
    fontWeight: "500",
    tintColor: "#000",
  },
});
