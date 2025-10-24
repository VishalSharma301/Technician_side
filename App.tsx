import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AuthScreen from "./src/app/screens/AuthScreen/AuthScreen";
// import OTPVerificationScreen from "./src/app/screens/AuthScreen/OtpScreen";
import { NavigationContainer } from "@react-navigation/native";
import NotificationScreen from "./src/app/screens/AuthenticatedScreens/NotificationScreen";
import ProfileScreen from "./src/app/screens/AuthenticatedScreens/ProfileScreen";
import MessageScreen from "./src/app/screens/AuthenticatedScreens/MessageScreen";
import { JobContextProvider } from "./src/store/JobContext";
import { useContext, useEffect } from "react";
import * as Api from "./src/util/ApiService";
import JobDetailsScreen from "./src/app/screens/AuthenticatedScreens/JobDetailsScreen";
import HomeScreenx from "./src/app/screens/AuthenticatedScreens/HomeScreenx";
import JobsScreen from "./src/app/screens/AuthenticatedScreens/JobsScreen";
import ProfileContextProvider, {
  ProfileContext,
} from "./src/store/ProfileContext";
import AuthContextProvider, { AuthContext } from "./src/store/AuthContext";
import OTPVerificationScreen from "./src/app/screens/AuthScreen/OtpScreen";
import { getProfileData, getToken } from "./src/util/setAsyncStorage";
import SettingsScreen from "./src/app/screens/AuthenticatedScreens/SettingsScreen";
import CalendarScreen from "./src/app/screens/AuthenticatedScreens/CalendarScreen";
import EditProfileScreen from "./src/app/screens/AuthenticatedScreens/EditProfileScreen";
// import JobsScreen from "./src/app/screens/AuthenticatedScreens/JobsScreen";

const Stack = createStackNavigator();
const Tabs = createBottomTabNavigator();

const HomeIcon = require("./assets/tabs/home.png");
const MessageIcon = require("./assets/tabs/msg.png");
const CalendarIcon = require("./assets/tabs/cal.png");
const ProfileIcon = require("./assets/tabs/profile.png");

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreenx}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="JobDetailsScreen" component={JobDetailsScreen}  options={{ headerShown: false }}/>
      <Stack.Screen name="NotificationScreen" component={NotificationScreen}  options={{ headerShown: false }}/>
      <Stack.Screen
        name="JobsScreen"
        component={JobsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function JobList() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MessageScreen"
        component={MessageScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="JobDetailsScreen" component={JobDetailsScreen}  options={{ headerShown: false }}/>
      
    </Stack.Navigator>
  );
}

function AuthenticationScreens() {
  // useEffect(() => {
  //   Api.setBaseUrl("http://10.0.2.2:5000/api");
  //   Api.setTechnicianId("tech-123"); // the ID used in db.json
  // }, []);
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AuthScreen"
        component={AuthScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="OtpScreen"
        component={OTPVerificationScreen}
        options={{
          title: "OTP Verification",
          headerTitleStyle: {
            marginLeft: 100,
          },
        }}
      />
    </Stack.Navigator>
  );
}

export function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      {/* <Stack.Screen name="ProfileScreen" component={ProfileScreen}/> */}
      <Stack.Screen
        name="EditProfileScreen"
        component={EditProfileScreen}
        options={{
          title: "Edit Profile",
          headerTitleStyle: {
            marginLeft: 100,
          },
        }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{
          title: "Settings",
          headerTitleStyle: {
            marginLeft: 100,
          },
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}


function TabScreens() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
        tabBarStyle: {
          height: 60, // ⬅️ Increase height here
          paddingBottom: 7, // optional: move icons/text upward
          paddingTop: 7, // optional: space out from top
        },
      }}
    >
      <Tabs.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => (
            <Image
              source={HomeIcon}
              style={{
                width: 24,
                height: 24,
                // tintColor: focused ? '#1D4ED8' : '#999'
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="JobList"
        component={JobList}
        options={{
          tabBarLabel: "JobList",
          tabBarIcon: ({ focused }) => (
            <Image
              source={MessageIcon}
              style={{
                width: 24,
                height: 24,
                // tintColor: focused ? '#1D4ED8' : '#999'
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="CalendarScreen"
        component={CalendarScreen}
        options={{
          tabBarLabel: "Calendar",
          tabBarIcon: ({ focused }) => (
            <Image
              source={CalendarIcon}
              style={{
                width: 24,
                height: 24,
                // tintColor: focused ? '#1D4ED8' : '#999'
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileStack"
        component={ProfileStack}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => (
            <Image
              source={ProfileIcon}
              style={{
                width: 24,
                height: 24,
                // tintColor: focused ? '#1D4ED8' : '#999'
              }}
            />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

function AuthenticatedStack(){
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TabScreens"
        component={TabScreens}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen
        name="JobDetailsScreen"
        component={JobDetailsScreen}
        options={{ headerShown: false }}
      /> */}
    </Stack.Navigator>
  );
}

function Navigation() {
  const { isAuthenticated, isLoading, token, setToken, setIsAuthenticated } =
    useContext(AuthContext);

  const { setEmail, setFirstName, setPhoneNumber, setId } = useContext(ProfileContext);
  useEffect(() => {
    async function fetchingToken() {
      const storedToken = await getToken();
      const profileData = await getProfileData();
      if (storedToken) {
        setToken(storedToken);
        if (profileData != null) {
          setEmail(profileData.email);
          setFirstName(profileData.name);
          // setLastName(profileData.lastName);
          setPhoneNumber(profileData.phoneNumber);
          setId(profileData._id)
        } else {
          console.log("No profile data loaded");
        }
        setIsAuthenticated(true);
      }
    }

    fetchingToken();
  }, [token]);
  return (
    <NavigationContainer>
      {!isAuthenticated ? <AuthenticationScreens /> : <AuthenticatedStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView>
      {/* <SafeAreaView style={{flex : 1}}> */}
      <AuthContextProvider>
        <ProfileContextProvider>
          <JobContextProvider>
            <Navigation />
          </JobContextProvider>
        </ProfileContextProvider>
      </AuthContextProvider>
      {/* </SafeAreaView> */}
    </GestureHandlerRootView>
  );
}
