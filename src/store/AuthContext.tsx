import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { ProfileContext } from "./ProfileContext";
import { getProfileData, getToken } from "../util/setAsyncStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContext {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  token : string,
  setToken :(token : string)=> void,
  fetchToken : ()=>void,
  logout : ()=>void
}

export const AuthContext = createContext<AuthContext>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  isLoading: false,
  setIsLoading: () => {},
  token : '',
  setToken : ()=>{},
  fetchToken : ()=>{},
  logout : ()=>{}
});

export default function AuthContextProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');
  const { setEmail, setFirstName, setLastName, setPhoneNumber, clearProfile, setId } =
    useContext(ProfileContext);

  useEffect(() => {
    async function loadAuth() {
      try {
        const profileData = await getProfileData();
        if (profileData != null) {
          setEmail(profileData.email);
          setFirstName(profileData.name);
          // setLastName(profileData.lastName);
          setPhoneNumber(profileData.phoneNumber);
          setId(profileData._id)
        }else{
          console.log('No profile data loaded');
          
        }
      } catch (err) {
        console.error("unable to load profile data", err);
      }finally{
        setIsLoading(false)
      }
    }
    loadAuth()
  }, []);

  async function fetchToken(){
    try{
      const storedToken = await getToken()
      if(storedToken){
        setToken(storedToken)
      } else{
        console.error('no stored token');
        
      }
    }catch(err){
      console.error('some error occured while storing or fetching token');
      
    }
  }

   async function logout () {
    try{
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('profileData');
      clearProfile()
      setIsAuthenticated(false)
    }catch(err){
      console.error('error removing local data', err);
      
    }
  }


  const value = {
    isAuthenticated,
    setIsAuthenticated,
    isLoading,
    setIsLoading,
    token,
    setToken,
    fetchToken,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
