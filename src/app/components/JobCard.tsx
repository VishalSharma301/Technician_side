import React, { useCallback, useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "../../util/scaling";
import {
  Job,
  JobStatus,
  STATUS_THEME,
  getStatusColor,
  getStatusText,
} from "../../constants/jobTypes";
import { useNavigation } from "@react-navigation/native";
import { useJobs } from "../../store/JobContext";
import { updateJobStatus } from "../../util/servicesApi";
import CustomView from "./CustomView";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { BASE } from "../../util/BASE_URL";
import { ProfileContext } from "../../store/ProfileContext";
import { AuthContext } from "../../store/AuthContext";
import { JobType } from "../../constants/job";

type Props = {
  job: JobType;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onStartInspection: (id: string) => void;
  onScheduledWorkCompleted: (id: string) => void;
  onAlert: (id: string) => void;
  navigate: (job: Job) => void;
};

type ArrivalKey = "CALL_CUSTOMER" | "EN_ROUTE" | "ARRIVED";

const JobCard: React.FC<Props> = ({
  job,
  onStart,
  onComplete,
  onStartInspection,
  onScheduledWorkCompleted,
  onAlert,
  navigate,
}) => {
  const navigation = useNavigation<any>();
  const { updateStatus } = useJobs();
  const { id } = useContext(ProfileContext);
  const { token } = useContext(AuthContext);

  const [arrivalSteps, setArrivalSteps] = useState<
    Partial<Record<ArrivalKey, string>>
  >({});

  const status = job?.status || JobStatus.TECHNICIAN_ASSIGNED;
  // const statusColour = getStatusColor(status);
  const statusText = getStatusText(status);

  const serviceName = job?.service?.name || "AC Repair";
  const userName = job?.user?.name || "Customer";
  const city = job?.address?.city || "Location";
  const state = job?.address?.state || "";

  function getStatusTheme(status: JobStatus) {
    return (
      STATUS_THEME[status] || {
        main: "#FF0000",
        light: "#FF00001A",
        border: "#FF00003D",
        iconBg: "#E5E7EB",
        text: "#374151",
      }
    );
  }

  const theme = getStatusTheme(status);

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStatusChange = async (newStatus: any) => {
    try {
      const response = await updateJobStatus(
        job._id,
        newStatus,
        undefined,
        `Status changed`,
      );

      if (response?.success) {
        updateStatus(job._id, newStatus);
      }
    } catch (error) {
      Alert.alert("Error updating status");
    }
  };

  const handleArrivalStatus = async (
    newStatus: any,
    arrivalStatus: ArrivalKey,
  ) => {
    await handleStatusChange(newStatus);

    setArrivalSteps((prev) => {
      if (prev[arrivalStatus]) return prev;

      return {
        ...prev,
        [arrivalStatus]: getCurrentTime(),
      };
    });
  };

  const handleCallCustomer = async () => {
    setArrivalSteps((prev) => {
      if (prev.CALL_CUSTOMER) return prev;
      return { ...prev, CALL_CUSTOMER: getCurrentTime() };
    });
  };

  const handleNavigate = useCallback(() => {
    navigate(job);
  }, [job]);

  return (
    <Pressable onPress={handleNavigate} style={styles.pressable}>
      <CustomView radius={12}>
        <View style={styles.card}>
          {/* STATUS BADGE */}
          <View style={[styles.badge, { backgroundColor: theme.main }]}>
            <Text style={styles.badgeText}>{statusText}</Text>
          </View>

          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.name}>{userName}</Text>
              <Text style={styles.location}>
                {city} {state}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.serviceTitle}>Ac Repair</Text>
              <Text style={[styles.due, {color : theme.main}]}>Due in 12h 45min</Text>
            </View>
          </View>

          {/* SERVICE TABS */}
          <View style={[styles.tabs, { borderColor: theme.border }]}>
            <View style={[styles.activeTab, { backgroundColor: theme.main }]}>
              <View
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 6,
                  backgroundColor: "#F5F4F9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="air-conditioner" size={24} color={theme.main} />
              </View>
              <Text style={styles.activeTabText}>AC Repair</Text>
            </View>

            <View style={[styles.tab, { backgroundColor: theme.light }]}>
              <View
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 6,
                  backgroundColor: theme.main,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="air-conditioner" size={24} color="#fff" />
              </View>
              <Text style={styles.tabText}>Ac is Not Working</Text>
            </View>
          </View>

          {/* TIMELINE */}
          <View style={styles.timelineContainer}>
            {/* LOCATION PILL */}
            <View style={styles.locationPill}>
              <Icon name="map-marker" size={16} color="#4A6CF7" />
              <Text style={styles.locationText}>
                {city} {state}
              </Text>
            </View>

            {/* CALL CUSTOMER */}
            <TouchableOpacity
              style={styles.timelineRow}
              onPress={handleCallCustomer}
            >
              <View style={styles.timelineIcon}>
                <Icon name="phone" size={16} color="#027CC7" />
              </View>

              <Text style={styles.timelineText}>Call Customer</Text>

              {arrivalSteps.CALL_CUSTOMER && (
                <Text style={styles.timelineTime}>
                  {arrivalSteps.CALL_CUSTOMER}
                </Text>
              )}
            </TouchableOpacity>

            {/* EN ROUTE */}
            <TouchableOpacity
              style={styles.timelineRow}
              onPress={() => handleArrivalStatus("on_way", "EN_ROUTE")}
            >
              <View style={styles.timelineIcon}>
                <Icon name="motorbike" size={16} color="#027CC7" />
              </View>

              <Text style={styles.timelineText}>En Route</Text>

              {arrivalSteps.EN_ROUTE && (
                <Text style={styles.timelineTime}>{arrivalSteps.EN_ROUTE}</Text>
              )}
            </TouchableOpacity>

            {/* ARRIVED */}
            <TouchableOpacity
              style={styles.timelineRow}
              onPress={() => handleArrivalStatus("in_progress", "ARRIVED")}
            >
              <View style={styles.timelineIcon}>
                <Icon name="map-marker" size={16} color="#027CC7" />
              </View>

              <Text style={styles.timelineText}>Arrived</Text>

              {arrivalSteps.ARRIVED && (
                <Text style={styles.timelineTime}>{arrivalSteps.ARRIVED}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* START BUTTON */}
          {status === JobStatus.TECHNICIAN_ASSIGNED && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => onStart(job._id)}
            >
              <LinearGradient
                colors={["#027CC7", "#004DBD"]}
                style={styles.startGradient}
              >
                <Icon name="play" size={16} color="#fff" />
                <Text style={styles.startText}>Start Job</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </CustomView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    marginHorizontal: 16,
    marginBottom: 16,
  },

  card: {
    padding: 16,
  },

  badge: {
    position: "absolute",
    right: 12,
    top: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 12,
  },

  badgeText: {
    color: "#fff",
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
  },

  location: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },

  serviceTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  due: {
    color: "#F59E0B",
    marginTop: 4,
    fontWeight: "500",
  },

  tabs: {
    flexDirection: "row",
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
  },

  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6.5,
    // borderRadius: 8,
    backgroundColor: "#EEF2FF",
    flex: 1,
    // marginRight: 8,
  },

  activeTab: {
    backgroundColor: "#004DBD",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6.5,
    // borderRadius: 8,
    // marginRight: 8,
    width: 149,
  },

  tabText: {
    marginLeft: 6,
    fontSize: 16,
    // color: "#004DBD",
  },

  activeTabText: {
    marginLeft: 6,
    color: "#fff",
    fontSize: 16,
  },

  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9EAF4",
    padding: 10,
    borderRadius: 20,
    marginTop: 11,
    marginBottom: 10,
  },

  locationText: {
    marginLeft: 6,
    color: "#555",
  },

  timelineContainer: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#F5F4F9",
    padding: 10,
    borderWidth: 1,
    borderColor: "#D3D3D3",
    // height : 264
  },

  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E9EAF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  timelineText: {
    flex: 1,
    fontSize: 15,
  },

  timelineTime: {
    fontSize: 13,
    color: "#777",
  },

  startButton: {
    marginTop: 16,
  },

  startGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 25,
  },

  startText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },
});

export default JobCard;
