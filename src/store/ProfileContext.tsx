import { createContext, PropsWithChildren, useState } from "react";
import { useEffect } from "react";
// import { getUser } from "../backend/userApi";
// import { FIREBASE_AUTH } from "../../firebaseconfig";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { updateName } from "../utils/localStorageProfile";

interface ProfileContext {
  firstName: string;
  setFirstName: (name: string) => void;
  id: string;
  setId: (Id: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
  email: string;
  setEmail: (name: string) => void;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  isNewUser: boolean;
  setIsNewUser: (value: boolean) => void;
  picture: string;
  setPicture: (uri: string) => void;
  saveUserName: (name: string) => void;
  clearProfile : ()=> void
}

export const ProfileContext = createContext<ProfileContext>({
  firstName: "AmanDeep",
  setFirstName: () => {},
  id: "",
  setId: () => {},
  lastName: "Kaur",
  setLastName: () => {},
  email: "",
  setEmail: () => {},
  phoneNumber: "",
  setPhoneNumber: () => {},
  isNewUser: false,
  setIsNewUser: () => {},
  setPicture: () => {},
  picture: "https://i.pravatar.cc/100",
  saveUserName: () => {},
  clearProfile : ()=>{}
});

export default function ProfileContextProvider({
  children,
}: PropsWithChildren) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [id, setId] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [picture, setPicture] = useState("https://picsum.photos/200/300.jpg");

  // useEffect(() => {
  //   async function fetchUser() {
  //     try {

  //       const localUser = await AsyncStorage.getItem('@user');
  //       if (localUser !== null) {
  //         const user = JSON.parse(localUser);
  //         setFirstName(user["displayName"].split(" ")[0]);
  //         setLastName(user["displayName"].split(" ")[1]);
  //         setEmail(user["email"]);
  //         //setPicture(user["photoURL"]);
  //         setIsNewUser(false);
  //       } else {
  //         console.log("Firebase user: ", FIREBASE_AUTH.currentUser);
  //         const user = await getUser(FIREBASE_AUTH.currentUser?.uid);
  //         console.log("AWS fetchedUser", user);
  //         setFirstName(user.name.split(" ")[0]);
  //         setLastName(user.name.split(" ")[1]);
  //         setEmail(user.email);
  //         setPicture(user.picture);
  //         setIsNewUser(false);
  //         await AsyncStorage.setItem('@user', JSON.stringify(user));
  //       }
  //     } catch (error) {
  //       console.error("Error fetching user", error);
  //     }
  //   }
  //   fetchUser();
  // }, []);

  const saveUserName = async (name: string) => {
    try {
      // await updateName(name)
      setFirstName(name);
    } catch (error) {
      console.error("Error saving name ", error);
    }
  };

  function clearProfile() {
    setEmail("");
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setPicture("");
    
  }

  const value = {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    isNewUser,
    setIsNewUser,
    email,
    setEmail,
    phoneNumber,
    setPhoneNumber,
    picture,
    setPicture,
    saveUserName,
    clearProfile,
    id,
    setId
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
