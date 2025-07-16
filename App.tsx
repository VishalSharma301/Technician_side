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
import HomeScreen from "./src/app/screens/AuthenticatedScreens/HomeScreen";
import MessageScreen from "./src/app/screens/AuthenticatedScreens/MessageScreen";

const Stack = createStackNavigator();
const Tabs = createBottomTabNavigator();

const HomeIcon = require("./assets/tabs/home.png");
const MessageIcon = require("./assets/tabs/msg.png");
const CalendarIcon = require("./assets/tabs/cal.png");
const ProfileIcon = require("./assets/tabs/profile.png");



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
        name="HomeScreens"
        component={HomeScreen}
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
        name="MessageScreen"
        component={MessageScreen}
        options={{
          tabBarLabel: "Messages",
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
        name="NotificationScreen"
        component={NotificationScreen}
        options={{
          tabBarLabel: "Notifications",
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
        name="ProfileScreen"
        component={ProfileScreen}
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


function AuthenticationScreens() {
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
        name="HomeScreen"
        component={TabScreens}
        options={{
          headerShown: false,
        }}
      />
      {/* <Stack.Screen
        name="OtpScreen"
        component={OTPVerificationScreen}
        options={{
          title: "OTP Verification",
          headerTitleStyle: {
            marginLeft: 100,
          },
        }}
      /> */}
    </Stack.Navigator>
  );
}

function Navigation() {
  return (
    <NavigationContainer>
      <AuthenticationScreens />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView>
      {/* <SafeAreaView style={{flex : 1}}> */}
        <Navigation />
      {/* </SafeAreaView> */}
    </GestureHandlerRootView>
  );
}

