import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// import ScreenHeader from "../../components/ScreenHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { verticalScale, moderateScale, scale } from "../../../util/scaling";
import NotificationCard from "../../components/NotificationCard";
import { useNavigation } from "@react-navigation/native";
import ScreenHeader from "../../components/ScreenHeader";

export default function NotificationScreen() {
  const navigation = useNavigation<any>();
  return (
    <SafeAreaView style={styles.safeArea}>
      
      <ScreenHeader name="Notifications"  />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* <TouchableOpacity style={styles.urgentCard}>
          <Text style={styles.urgentTitle}>
            🔵 URGENT: New job assigned (Due in 2h!)
          </Text>
          <Text style={styles.jobText}>Job #123 | AC Repair | 12 Park St</Text>
          <Text style={styles.tapText}>Tap to view details</Text>
        </TouchableOpacity> */}

        <NotificationCard
          icon="information"
          subtitle="Job #123 | AC Repair | 12 Park St"
          time="Tap to view details"
          title="URGENT: New job assigned (Due in 2h!)"
          urgent
        />

        {/* Today Section */}

        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Today</Text>
        <NotificationCard
          icon="information"
          subtitle="Plumbing | 5 Oak Ave"
          time="10:30 AM"
          title="Deadline: 24h left for Job 4456"
          color="#153B93"
        />

        <NotificationCard
          icon="cash-multiple"
          title=" Payment cleared: $120 for Job #789"
          subtitle=" Electrical | Invoice #INV-2025"
          time=" 09:15 AM"
          color="green"
        />

        {/* Yesterday Section */}
        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Yesterday</Text>

        <NotificationCard
          icon="android-messages"
          title="New message from Team Lead"
          subtitle="Parts arrived for Job #123"
          time="Jun 26, 5:45 PM"
        />

        <NotificationCard
          icon="check-circle"
          title="Job #345 marked complete"
          subtitle="Customer: Sarah M."
          time="Jun 26,  2:20 PM"
        />

        {/* Sound Alerts Placeholder */}
        <Text style={styles.soundAlerts}>Sound Alerts</Text>
      </ScrollView>

      {/* Bottom Nav Placeholder */}
   
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F8FF",
    paddingHorizontal: scale(22),
  },
 
  container: {
    // padding: 16,
    paddingBottom: 100,
    paddingTop : verticalScale(10)
  },
  urgentCard: {
    backgroundColor: "#153B93",
    borderRadius: 8,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
    // marginBottom: 20,
    height: verticalScale(103),
    //  alignItems : 'center',
    justifyContent: "space-between",
    // gap : 10
  },
  urgentTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: moderateScale(16),
    lineHeight: verticalScale(19),
    borderWidth: 0.1,
    borderColor: "transparent",
    overflow: "hidden",
    textAlignVertical: "top",
    zIndex: 100,
    // alignSelf : 'flex-start'

    // marginBottom: 4,
  },
  jobText: {
    color: "#fff",
    fontSize: moderateScale(12),
    fontWeight: "500",
    marginLeft: scale(29),
    lineHeight: verticalScale(14),
    borderWidth: 0.1,
    borderColor: "transparent",
    //  marginVertical : verticalScale(6)
  },
  tapText: {
    color: "#fff",
    fontSize: moderateScale(12),
    fontWeight: "500",
    // marginTop: 4,
    marginLeft: scale(29),
    lineHeight: verticalScale(14),
    borderWidth: 0.1,
    borderColor: "transparent",
  },
  sectionTitle: {
    fontWeight: "500",

    fontSize: moderateScale(16),
    marginVertical: verticalScale(10),
    // marginBottom: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: 14,
  },
  cardSubtitle: {
    color: "#666",
    fontSize: 13,
    marginTop: 2,
  },
  cardTime: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  soundAlerts: {
    // marginTop: 20,
    fontWeight: "500",
    fontSize: 16,
  },
  

});
