import { useContext, useEffect, useState } from "react";
import { Text, TextInput, View, StyleSheet, Alert } from "react-native";
import BookNowButton from "../../../ui/BookNowButton";
import { AuthContext } from "../../../store/AuthContext";
import { ProfileContext } from "../../../store/ProfileContext";
// import { createUser, userLogin } from "../../util/userLogin";
import { useNavigation } from "@react-navigation/native";
import { saveProfileData } from "../../../util/setAsyncStorage";
import { updateProfile } from "../../../util/profileApi";

export default function EditProfileScreen() {
  const {
    firstName,
    phoneNumber,
    lastName,
    setFirstName,
    setLastName,
    email,
    setEmail,
    id
  } = useContext(ProfileContext); // assumes user = { phoneNumber: "..." }
  const { setIsAuthenticated, token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  //   const [firstName, setFirstName] = useState("");
  //   const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  //   const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    setFullName(`${firstName} ${lastName}`.trim());
  }, [firstName, lastName]);

  //   useEffect(() => {
  //     if (user?.phoneNumber) {
  //       setPhoneNumber(user.phoneNumber);
  //     }
  //   }, [user]);

  const userProfileData = {
    firstName,
    lastName,
    email,
    phoneNumber,
  };

  async function updateProfileData() {
    try {
      if (!firstName || !lastName || !email) {
        Alert.alert(
          "Incomplete Data",
          "Please fill all the fields before saving."
        );
        return;
      }
      const res = await updateProfile(token, userProfileData, id);

      const update = {
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
        phoneNumber: res.phoneNumber,
      };
      
      await saveProfileData(update);
      navigation.goBack();
    } catch (err) {
      console.error("Update profile failed:", err);
      Alert.alert("Error", "Something went wrong while updating profile.");
    }
  }

  // console.log(userProfileData);

  return (
    <View style={styles.container}>
      <Text>First Name</Text>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />

      <Text>Last Name</Text>
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />

      <Text>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={[styles.input, { backgroundColor: "#fff" }]}
      />

      <Text>Phone Number</Text>
      <TextInput
        value={phoneNumber}
        editable={false}
        style={[styles.input, { backgroundColor: "#eee" }]}
      />

      <BookNowButton text="Save" onPress={updateProfileData} />
      <BookNowButton text="Skip" onPress={() => setIsAuthenticated(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },
});
