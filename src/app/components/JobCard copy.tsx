import React, { useCallback, useContext, useEffect, useState } from "react";
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
import { confirmSchedule, markArrived, markOnWay } from "../../util/jobHandlingApis";

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

const ALL_STATUSES: JobStatus[] = [
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
  JobStatus.ON_WAY,
];

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
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Seed arrival steps from server history on mount / job change
  useEffect(() => {
    if (!job?.statusHistory) return;

    const steps: Partial<Record<ArrivalKey, string>> = {};

    job.statusHistory.forEach((item: any) => {
      const date = new Date(item.timestamp);

      const day = date.getDate().toString().padStart(2, "0");

      const month = date
        .toLocaleString("en-US", { month: "short" })
        .toUpperCase();

      const time = date
        .toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .toLowerCase();

      const formatted = `${day} ${month}, ${time}`;
      if (item.status === "confirmed_scheduled")
        steps.CALL_CUSTOMER = formatted;
      else if (item.status === "on_way") steps.EN_ROUTE = formatted;
      else if (item.status === "arrived") steps.ARRIVED = formatted;
    });

    setArrivalSteps(steps);
  }, [job]);

  // Early return if job is invalid
  if (!job || !job._id) {
    return null;
  }

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

  // Derive server-side timestamps for each timeline step
  const findHistoryTime = (statusKey: string) => {
    const entry = job.statusHistory?.find(
      (item: any) => item.status === statusKey,
    );

    if (!entry) return null;

    const date = new Date(entry.timestamp);

    const day = date.getDate().toString().padStart(2, "0");

    const month = date
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();

    const time = date
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();

    return `${day} ${month}, ${time}`;
  };

  const customerCalledTime =
    arrivalSteps.CALL_CUSTOMER || findHistoryTime("confirmed_scheduled");
  const enRouteTime = arrivalSteps.EN_ROUTE || findHistoryTime("on_way");
  const arrivedTime = arrivalSteps.ARRIVED || findHistoryTime("arrived");

  const getCurrentTime = () => {
    const now = new Date();

    const day = now.getDate().toString().padStart(2, "0");
    const month = now.toLocaleString("en-US", { month: "short" }).toUpperCase();

    const time = now
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();

    return `${day} ${month}, ${time}`;
  };

  const handleStatusChange = async (newStatus: any) => {
    try {
      setShowStatusModal(false);

      const response = await updateJobStatus(
        job._id,
        newStatus,
        undefined,
        `Status changed to ${newStatus}`,
      );

      if (response?.success) {
        updateStatus(job._id, newStatus);
        Alert.alert("Success", `Job set to ${newStatus}`);
      } else {
        Alert.alert("Error", "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    }
  };
  const handleMarkOnWay = async () => {
    try {
      setShowStatusModal(false);

      const response = await markOnWay(job._id, token);

      // if (response?.success) {
      //   // updateStatus(job._id, JobStatus.ON_WAY);
      //   Alert.alert("Success", `Job set to ${JobStatus.ON_WAY}`);
      // } else {
      //   Alert.alert("Error", "Failed to update status");
      // }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleArrivedAPI = async (arrivalStatus: ArrivalKey) => {
  try {
    setLoading(true);

    // 1️⃣ mark arrived
    await markArrived(job._id, token);

    // 2️⃣ change job status to in_progress
    // await updateJobStatus(
    //   job._id,
    //   JobStatus.IN_PROGRESS,
    //   undefined,
    //   "Technician started job"
    // );

    // 3️⃣ temporary frontend timestamp
    setArrivalSteps((prev) => {
      if (prev[arrivalStatus]) return prev;

      return {
        ...prev,
        [arrivalStatus]: getCurrentTime(),
      };
    });

  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Failed to mark arrived");
  } finally {
    setLoading(false);
  }
};
  const handleOnWayAPI = async (arrivalStatus: ArrivalKey) => {
    try {
      setLoading(true);

      await markOnWay(job._id, token);

      // temporary timestamp until backend refresh
      setArrivalSteps((prev) => {
        if (prev[arrivalStatus]) return prev;

        return {
          ...prev,
          [arrivalStatus]: getCurrentTime(),
        };
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to mark on way");
    } finally {
      setLoading(false);
    }
  };

  const handleCallCustomer = async () => {
    try {
      setLoading(true);

      await confirmSchedule(job._id, token);
      setArrivalSteps((prev) => {
        if (prev.CALL_CUSTOMER) return prev;
        return { ...prev, CALL_CUSTOMER: getCurrentTime() };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJob = useCallback(async () => {
    onComplete(job._id);
  }, [job._id, onComplete]);

  const handleScheduledWorkCompleted = useCallback(async () => {
    onScheduledWorkCompleted(job._id);
  }, [job._id, onScheduledWorkCompleted]);

  const handleStartInspection = useCallback(async () => {
    try {
      setLoading(true);
      navigation.navigate("JobFlowScreen", { job });
    } catch (error) {
      console.error("Error starting inspection:", error);
      Alert.alert("Error", "Failed to start inspection");
    } finally {
      setLoading(false);
    }
  }, [job, navigation]);

  const handleAlert = useCallback(() => {
    onAlert(job._id);
  }, [job._id, onAlert]);

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
              <Text style={[styles.due, { color: theme.main }]}>
                Due in 12h 45min
              </Text>
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
              // onPress={() => !customerCalledTime && handleCallCustomer(job._id)}
            >
              <View style={styles.timelineIcon}>
                <Icon name="phone" size={16} color="#027CC7" />
              </View>

              <Text style={styles.timelineText}>Call Customer</Text>

              {customerCalledTime ? (
                <Text style={styles.timelineTime}>{customerCalledTime}</Text>
              ) : (
                <TouchableOpacity
                  style={styles.timelineStartBtn}
                  onPress={() => handleCallCustomer()}
                >
                  <Text style={styles.timelineStartBtnText}>Start</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* EN ROUTE */}
            <TouchableOpacity
              style={styles.timelineRow}
              // onPress={() =>
              //   !enRouteTime && handleArrivalStatus("on_way", "EN_ROUTE")
              // }
            >
              <View style={styles.timelineIcon}>
                <Icon name="motorbike" size={16} color="#027CC7" />
              </View>

              <Text style={styles.timelineText}>En Route</Text>

              {enRouteTime ? (
                <Text style={styles.timelineTime}>{enRouteTime}</Text>
              ) : (
                <TouchableOpacity
                  style={styles.timelineStartBtn}
                  onPress={() => handleOnWayAPI("EN_ROUTE")}
                >
                  <Text style={styles.timelineStartBtnText}>Start</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* ARRIVED */}
            <TouchableOpacity
              style={styles.timelineRow}
              // onPress={() =>
              //   !arrivedTime && handleArrivalStatus("in_progress", "ARRIVED")
              // }
            >
              <View style={styles.timelineIcon}>
                <Icon name="map-marker" size={16} color="#027CC7" />
              </View>

              <Text style={styles.timelineText}>Arrived</Text>

              {arrivedTime ? (
                <Text style={styles.timelineTime}>{arrivedTime}</Text>
              ) : (
                <TouchableOpacity
                  style={styles.timelineStartBtn}
                  onPress={() => handleArrivedAPI("ARRIVED")}
                >
                  <Text style={styles.timelineStartBtnText}>Start</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionRow}>
            {/* START JOB */}
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

            {/* SCHEDULED WORK COMPLETED */}
            {(status === JobStatus.PARTS_PENDING ||
              status === JobStatus.WORKSHOP_REQUIRED) && (
              <TouchableOpacity
                onPress={handleScheduledWorkCompleted}
                style={styles.outlineButton}
              >
                <Text style={styles.outlineButtonText}>
                  Scheduled Work Completed
                </Text>
              </TouchableOpacity>
            )}

            {/* START INSPECTION (IN_PROGRESS) */}
            {status === JobStatus.ARRIVED && (
              <TouchableOpacity
                onPress={handleStartInspection}
                style={styles.outlineButton}
              >
                <Text style={styles.outlineButtonText}>Start Inspection</Text>
              </TouchableOpacity>
            )}

            {/* START INSPECTION (ON_WAY) */}
            {status === JobStatus.ON_WAY && (
              <TouchableOpacity
                onPress={() => onStartInspection(job._id)}
                style={styles.outlineButton}
              >
                <Text style={styles.outlineButtonText}>Start Inspection</Text>
              </TouchableOpacity>
            )}

            {/* COMPLETED STATE */}
            {status === JobStatus.COMPLETED && (
              <View
                style={[
                  styles.outlineButton,
                  {
                    borderColor: "#34C759",
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                ]}
              >
                <Icon name="check-circle" size={16} color="#34C759" />
                <Text
                  style={[
                    styles.outlineButtonText,
                    { color: "#34C759", marginLeft: 6 },
                  ]}
                >
                  Completed
                </Text>
              </View>
            )}

            {/* ALERT BUTTON — always visible except when completed */}
            {status !== JobStatus.COMPLETED && (
              <TouchableOpacity
                onPress={handleAlert}
                style={styles.alertButton}
              >
                <Icon name="alert" size={18} color="#153B93" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CustomView>

      {/* STATUS CHANGE MODAL */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Change Job Status</Text>
            {ALL_STATUSES.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.statusOption}
                onPress={() => handleStatusChange(item)}
              >
                <Text style={styles.statusOptionTxt}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
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

  timelineStartBtn: {
    backgroundColor: "#027CC7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },

  timelineStartBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  startButton: {
    flex: 1,
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

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },

  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#153B93",
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  outlineButtonText: {
    color: "#153B93",
    fontSize: 13,
    fontWeight: "600",
  },

  alertButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#153B93",
    justifyContent: "center",
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  modalTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },

  statusOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  statusOptionTxt: {
    fontSize: 14,
    color: "#153B93",
    fontWeight: "500",
  },
});

export default JobCard;
