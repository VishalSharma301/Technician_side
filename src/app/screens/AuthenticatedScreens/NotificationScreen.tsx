import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { verticalScale, moderateScale, scale } from "../../../util/scaling";
import { useNavigation } from "@react-navigation/native";
import NotificationCard from "../../components/NotificationCard";
import ScreenWrapper from "../../components/ScreenWrapper";

export default function NotificationScreen() {
  const navigation = useNavigation();

  return (
    <ScreenWrapper>
    <View style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Alerts</Text>
          <Text style={styles.unreadText}>3 unread</Text>
        </View>
        <TouchableOpacity style={styles.markAllBtn}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <NotificationCard
          iconName="briefcase-outline"
          iconBgColor="#E8F5EE"
          iconColor="#3A9E6F"
          title="New Job!"
          subtitle="Chimney cleaning · Chandigarh 11:00 AM"
          time="9:05 AM"
        />

        <NotificationCard
          iconName="business-outline"
          iconBgColor="#E8F5EE"
          iconColor="#3A9E6F"
          title="Money Received!"
          subtitle="Chimney cleaning · Chandigarh 11:00 AM"
          time="9:05 AM"
        />

        <NotificationCard
          iconName="star-outline"
          iconBgColor="#FFF3E8"
          iconColor="#E8843A"
          title="New Rating!"
          subtitle="Neelam Azora gave you 4.8 ⭐"
          time="9:05 AM"
        />

        <NotificationCard
          iconName="checkmark-circle-outline"
          iconBgColor="#EEF0FA"
          iconColor="#6B7CBA"
          title="Confirmed"
          subtitle="Harpreet Singh confirmed the job"
          time="9:05 AM"
        />

        <NotificationCard
          iconName="settings-outline"
          iconBgColor="#F0F0F0"
          iconColor="#888888"
          title="App Update"
          subtitle="Fuvay v2.41 is available"
          time="8:00 AM"
        />
      </ScrollView>
    </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5EDE0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(14),
    backgroundColor : '#F2DDC5',
    marginBottom : verticalScale(15)
  },
  headerTitle: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#864C2D",
    // lineHeight: verticalScale(24),
  },
  unreadText: {
    fontSize: moderateScale(12),
    color: "#1B5678B2",
    marginTop: verticalScale(2),
  },
  markAllBtn: {
    backgroundColor: "#864C2D",
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
  },
  markAllText: {
    color: "#fff",
    fontSize: moderateScale(13),
    fontWeight: "500",
  },
  container: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(100),
    gap: verticalScale(10),
  },
});