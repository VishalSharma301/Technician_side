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
import { login } from "../../../util/authApi";
import { ProfileContext } from "../../../store/ProfileContext";
import { AuthContext } from "../../../store/AuthContext";
// import storeUserProfileData from "../../../util/userData";
// import phoneAuthentication, { verifyOtp } from "../../../util/authentication";

export default function AuthScreen() {
  const [countryCode, setCountryCode] = useState<string>("+91");
  const [phoneNumberInput, setPhoneNumberInput] = useState<string>("");
  // const [phNumber, setPhNumber] = useState<string>("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loginWithOtp, setLoginWithOtp] = useState(true);
  // const { setIsAuthenticated } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const {setIsAuthenticated} =useContext(AuthContext)
  //   const { setToken, token } = useContext(LocalAuthContext);
    const {
      setPhoneNumber,
      setFirstName,
      setLastName,
      setIsNewUser,
      setEmail,
      phoneNumber
    } = useContext(ProfileContext);

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
        "Please enter a valid country code starting with + followed by 1 to 3 digits."
      );
      return false;
    }

    if (!phoneNumberRegex.test(phoneNumber)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number."
      );
      return false;
    }

    return true;
  }

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
 

    const result = await login(phoneNumber);

    if (result) {
      Alert.alert('OTP Sent', 'Check your phone for OTP');
      // You can now navigate to OTP screen or store data
      navigation.navigate('OtpScreen')
    } else {
      Alert.alert('Login Failed', 'Invalid phone number or server error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      // behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topContainer}>
          <View
            style={{
              // height: "38%",
              // borderWidth: 1,
              borderRadius: 60,
              // backgroundColor: "#FBBF24",
              // elevation :  2
            }}
          >
            <Image
              style={styles.image}
              source={require("../../../../assets/Frame 69.png")}
            />
          </View>

          <View>
            <Text
              style={{
                alignSelf: "center",
                fontSize: moderateScale(25),
                fontWeight: "700",
                marginTop: verticalScale(14),
              }}
            >
              Login
            </Text>
            <Text
              style={{
                alignSelf: "center",
                fontSize: moderateScale(16),
                fontWeight: "500",
                color: "#596378",
              }}
            >
              Welcome Back
            </Text>
          </View>

          {loginWithOtp && (
            <View style={styles.formContainer}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              ></View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.countryCodeInput}
                  placeholder="+1"
                  keyboardType="phone-pad"
                  maxLength={3}
                  defaultValue="+91"
                  placeholderTextColor={"#00000000"}
                  onChangeText={(text) => setCountryCode(text)}
                />
                <TextInput
                  style={styles.phoneNumberInput}
                  placeholder="Enter Mobile Number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus={true}
                  onChangeText={(text) => setPhoneNumberInput(text)}
                  placeholderTextColor={"black"}
                />
              </View>
            </View>
          )}

          {!loginWithOtp && (
            <View style={{ marginHorizontal: scale(16) }}>
              <CustomTextInput
                header="Email"
                icon="mail"
                placeholder="Email or Phone"
              />
              <CustomTextInput
                header="Password"
                icon="lock-closed"
                placeholder="Email or Phone"
              />
              <TouchableOpacity style={{ alignSelf: "flex-end" }}>
                <Text
                  style={{
                    color: "#153B93",
                    fontSize: moderateScale(16),
                    fontWeight: "500",
                    lineHeight: moderateScale(17),
                  }}
                >
                  Forgot Password
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <BookNowButton
            // onPress={() => setOtpSent(true)}
            // onPress={() => navigation.navigate("NotificationScreen")}
            onPress={() => handleLogin()}
            text="Login"
            textStyle={{
              fontSize: 18,
              fontWeight: "500",
            }}
            style={{
              height: verticalScale(48),
              width: scale(358),
              marginHorizontal: 24,
              borderRadius: moderateScale(9),
              alignSelf: "center",
              marginVertical: verticalScale(15),
              // marginTop: 16,
            }}
          />

          <DividerWithText />

          <BookNowButton
            onPress={() => setLoginWithOtp(!loginWithOtp)}
            text={!loginWithOtp ? "login with OTP" : "login with E-mail"}
            textStyle={{
              fontSize: 18,
              fontWeight: "500",
              color: "black",
            }}
            style={{
              height: verticalScale(43),
              width: scale(358),
              marginHorizontal: 24,
              borderRadius: moderateScale(9),
              alignSelf: "center",
              marginVertical: verticalScale(10),
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: "#E6E6E6",
              // marginTop: 16,
            }}
          />

          <View style={{ flexDirection: "row", alignSelf: "center" }}>
            <Text
              style={{
                color: "#596378",
                fontSize: moderateScale(16),
                fontWeight: "500",
              }}
            >
              Dont have an account ?{" "}
            </Text>
            <TouchableOpacity onPress={()=>setIsAuthenticated(true)}>
              <Text
                style={{
                  color: "#153B93",
                  fontSize: moderateScale(16),
                  fontWeight: "700",
                }}
              >
                SignUp
              </Text>
            </TouchableOpacity>
          </View>

          <Image
            source={require("../../../../assets/Frame 64.png")}
            style={{
              height: verticalScale(51),
              width: scale(191),
              resizeMode: "contain",
              alignSelf: "center",
              marginVertical: verticalScale(15),
            }}
          />

          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontWeight: "500", color: "#596378" }}>
              {" "}
              By Continuing, you agree to our
            </Text>

            <View style={{ flexDirection: "row", marginTop: 8, gap: 24 }}>
              <TouchableOpacity>
                <Text
                  style={{
                    borderStyle: "dotted",
                    borderBottomWidth: 1,
                    color: "#596378",
                    padding: 3,
                    fontSize: 10,
                    fontWeight: "500",
                  }}
                >
                  Terms of Service
                </Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text
                  style={{
                    borderStyle: "dotted",
                    borderBottomWidth: 1,
                    color: "#596378",
                    padding: 3,
                    fontSize: 10,
                    fontWeight: "500",
                  }}
                >
                  Privacy Policy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text
                  style={{
                    borderStyle: "dotted",
                    borderBottomWidth: 1,
                    color: "#596378",
                    padding: 3,
                    fontSize: 10,
                    fontWeight: "500",
                  }}
                >
                  Content Policy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flexGrow: 1,
    // paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  topContainer: {
    flex: 1,
    borderWidth: 1,

    // justifyContent: 'center',
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  image: {
    height: verticalScale(224),
    width: "100%",
    resizeMode: "stretch",
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
