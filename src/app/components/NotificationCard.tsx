import { StyleSheet, Text, View } from "react-native";
import { moderateScale, scale, verticalScale } from "../../util/scaling";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface NotificationCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  time: string;
  color? : string;
  urgent? : boolean
}

const blue = "#153B93"

export default function NotificationCard({
  icon,
  title,
  subtitle,
  time,
  color = blue,
  urgent = false
}: NotificationCardProps) {
  return (
    <View style={[styles.card,urgent &&{ paddingVertical : verticalScale(10),paddingHorizontal: scale(10), height : verticalScale(103), backgroundColor : blue,} ]}>
      <View style={{height : '100%'}}>
      <View style={[styles.icon, urgent && { backgroundColor : 'transparent'}]}>
        <MaterialCommunityIcons
          name={icon}
          size={urgent ? moderateScale(24) :moderateScale(16)}
          color={urgent ? 'white' : color}
        />
        {/* <Text style={styles.infoIcon}>{icon}</Text> */}
      </View>
      </View>
      <View style={urgent && {gap : verticalScale(4)}}>
        <Text style={[styles.cardTitle, urgent && {fontSize : moderateScale(16), fontWeight : '600', color : '#fff'}]}>{title}</Text>
        <Text style={[styles.cardSubtitle, urgent &&{ color : '#fff'}]}>{subtitle}</Text>
        <Text style={[styles.cardTime, urgent &&{ color : '#fff'}]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    justifyContent : 'flex-start',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(8),
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    elevation: 1,
    height : verticalScale(94)
    // height : verticalScale(94)
  },
  icon: {
    height: moderateScale(24),
    width: moderateScale(24),
    borderWidth: 1,
    marginRight: scale(9),
    borderColor: "#576F9B47",
    backgroundColor: "#7494CE1A",
    borderRadius: moderateScale(5),
    alignItems: "center",
    justifyContent: "center",
    // top : verticalScale(-14)
    // position : 'absolute'
  },
  infoIcon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },
  cardTitle: {
    fontWeight: "500",
    fontSize: moderateScale(12),
  },
  cardSubtitle: {
    color: "#000000B2",
    fontWeight: "500",
    fontSize: moderateScale(12),
    marginTop: verticalScale(3),
  },
  cardTime: {
    color: "#000000B2",
    fontWeight: "500",
    fontSize: moderateScale(12),
    marginTop: verticalScale(3),
  },
});
