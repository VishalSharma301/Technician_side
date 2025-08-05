import AsyncStorage from "@react-native-async-storage/async-storage";

interface userData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber : string
}

export async function saveProfileData(userProfileData: userData) {
  const profileData = JSON.stringify(userProfileData);
  try {
    await AsyncStorage.setItem("profileData", profileData);
    console.log("Saved Profile Data", userProfileData);
    
  } catch (err) {
    console.error("error getting profile data", err);
  }
}

export async function getProfileData() {
  try {
    const profileData = await AsyncStorage.getItem("user");
    console.log('loaded profile data', profileData );
    
    return profileData != null ? JSON.parse(profileData) : null;
  } catch (err) {
    console.error("error getting profileData", err);
  }
}

export async function getToken() {
  try {
    const storedToken = await AsyncStorage.getItem("token");
    if (storedToken) {
      console.log("got token", storedToken);
      return storedToken;
    }
  } catch (error) {
    console.log("error fetching token : ", error);
  }
}