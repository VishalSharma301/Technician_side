import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { moderateScale, scale, verticalScale } from "../../util/scaling";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

type Props = Partial<BottomTabBarProps> & {
  isLocal?: "Home" | "Category";
};

export default function CustomNavBar({ state, navigation, isLocal }: Props) {
  const nav = navigation ?? useNavigation();

  // 🔥 Hide ONLY when used as GLOBAL nav bar AND HomeScreen is active
  // if (!isLocal && state) {
  //   const currentRoute = state.routes[state.index].name;
  //   if (currentRoute === "HomeStack" || currentRoute === "CategoryScreen") {
  //     return null;
  //   }
  // }

  return (
    // <View style={{borderWidth : 0, paddingBottom : verticalScale(10), backgroundColor : 'transparent'}}>
    <View style={styles.bottomNav}>
      {/* <View style={styles.bottomNav2}> */}
        {/* <View
        source={require("../../../assets/bg0.png")}
        style={styles.bottomNav2}
      > */}
        {/* Home */}
        <TouchableOpacity
          onPress={() => nav?.navigate("MoneyScreen")}
          style={[styles.navItem, { marginRight: scale(21) }]}
        >
          <Icon
            name="cash-outline"
            size={moderateScale(20)}
            color={isLocal === "Home" ? "#0583D0" : "#707070"}
          />
          <Text
            style={[
              styles.navText,
              { color: state?.index === 0 ? "#0583D0" : "#707070" },
            ]}
          >
            Money
          </Text>
        </TouchableOpacity>

        {/* Jobs */}
        <TouchableOpacity
          onPress={() => nav?.navigate("JobScreen")}
          style={[styles.navItem, { marginRight: scale(30) }]}
        >
          <Icon
            name="analytics-sharp"
            size={moderateScale(20)}
            color={state?.index === 1 ? "#0583D0" : "#707070"}
          />
          <Text
            style={[
              styles.navText,
              { color: state?.index === 1 ? "#0583D0" : "#707070" },
            ]}
          >
            History
          </Text>
        </TouchableOpacity>

        {/* Cart */}
        <TouchableOpacity
          onPress={() => nav?.navigate("HomeStack")}
          style={styles.cartCenter}
        >
          <LinearGradient
            colors={["#BF7D5A", "#733A1C"]}
            style={{
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              name="briefcase-outline"
              size={moderateScale(28)}
              color={state?.index === 1 ? "#fff" : "#fff"}
            />
            {/* <View style={styles.badge}>
            <Text style={styles.badgeText}>{1}</Text>
          </View> */}
          </LinearGradient>
        </TouchableOpacity>

        {/* Category */}
        <TouchableOpacity
          onPress={() => nav?.navigate("NotificationScreen")}
          style={[styles.navItem, { marginLeft: scale(21) }]}
        >
          <Icon
            name="notifications-outline"
            size={moderateScale(20)}
            color={isLocal === "Category" ? "#0583D0" : "#707070"}
          />
          <Text
            style={[
              styles.navText,
              { color: state?.index === 3 ? "#0583D0" : "#707070" },
            ]}
          >
            Alerts
          </Text>
        </TouchableOpacity>

        {/* Orders */}
        <TouchableOpacity
          onPress={() => nav?.navigate("ProfileStack")}
          style={[styles.navItem, { marginLeft: scale(21) }]}
        >
          <Icon
            name="person-outline"
            size={moderateScale(20)}
            color={state?.index === 4 ? "#0583D0" : "#707070"}
          />
          <Text
            style={[
              styles.navText,
              { color: state?.index === 4 ? "#0583D0" : "#707070" },
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
        {/* </View> */}
      {/* </View> */}
    </View>
    // </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(10),
    height: verticalScale(71),
    width: scale(347),
    borderWidth: 1,
    borderColor: "#864C2D",
    alignItems: "center",
    overflow: "hidden",
    position: "absolute",
    bottom: verticalScale(10),
    marginHorizontal: scale(23),
  },
  bottomNav2: {
    flexDirection: "row",
    justifyContent: "center",
    borderWidth : 1
    // bottom: verticalScale(30),
    // marginHorizontal: scale(23),
    // borderWidth: 0.8,
    // borderColor: "#FFFFFF",
  },
  navItem: { alignItems: "center", alignSelf: "center",  },
  navText: {
    fontSize: moderateScale(12),
    color: "#707070",
    marginTop: verticalScale(2),
    fontWeight: "500",
  },
  cartCenter: {
    width: scale(55),
    height: scale(55),
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#BF7D5A",
    borderRadius: scale(27.5),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginLeft : scale(-5),
  },
  badge: {
    position: "absolute",
    top: verticalScale(0),
    right: scale(0),
    backgroundColor: "white",
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0082D3",
  },
  badgeText: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    color: "#0082D3",
  },
});
