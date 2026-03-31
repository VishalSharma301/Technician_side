import React, { useCallback, useContext, useState, useEffect } from "react";
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
import { Job, JobStatus, getStatusColor } from "../../constants/jobTypes";
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

const ALL_STATUSES: JobStatus[] = [
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
  JobStatus.ON_WAY,
];

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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id } = useContext(ProfileContext);
  const { token } = useContext(AuthContext);

  const [arrivalSteps, setArrivalSteps] = useState<
    Partial<Record<ArrivalKey, string>>
  >({});

  // Initialize arrival steps from job history
  useEffect(() => {
    if (job && job.statusHistory) {
      const steps: Partial<Record<ArrivalKey, string>> = {};
      
      job.statusHistory.forEach((item: any) => {
        if (item.status === "customer_called") {
          steps.CALL_CUSTOMER = new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });
        } else if (item.status === "on_way") {
          steps.EN_ROUTE = new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });
        } else if (item.status === "in_progress") {
          steps.ARRIVED = new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      });
      
      setArrivalSteps(steps);
    }
  }, [job]);

  // Early return if job is invalid
  if (!job || !job._id) {
    return null;
  }

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
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

  async function handleArrivalStatus(
    newStatus: any,
    arrivalStatus: ArrivalKey,
  ) {
    try {
      await handleStatusChange(newStatus);

      setArrivalSteps((prev) => {
        if (prev[arrivalStatus]) return prev;
        return {
          ...prev,
          [arrivalStatus]: getCurrentTime(),
        };
      });
    } catch (err) {
      Alert.alert("Error");
    }
  }

  // Extract data safely
  const serviceName = job?.service?.name || "AC Repair";
  const userName = job?.user?.name || "Vishal Sharma";
  const city = job?.address?.city || "Morinda";
  const state = job?.address?.state || "Punjab";
  const status = job?.status || JobStatus.TECHNICIAN_ASSIGNED;
  const issue = job?.issue || "Ac is Not Working";

  const statusColour = getStatusColor(status);

  const customerCalled = job.statusHistory?.find(
    (item) => item.status === "customer_called"
  );

  const customerCalledTime = customerCalled
    ? new Date(customerCalled.timestamp).toLocaleString([], {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const enRouteTime = arrivalSteps.EN_ROUTE || 
    (job.statusHistory?.find((item) => item.status === "on_way") 
      ? new Date(job.statusHistory.find((item) => item.status === "on_way").timestamp)
          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : null);

  const arrivedTime = arrivalSteps.ARRIVED ||
    (job.statusHistory?.find((item) => item.status === "in_progress")
      ? new Date(job.statusHistory.find((item) => item.status === "in_progress").timestamp)
          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : null);

  const callCustomer = async (jobId: string, payload: any) => {
    try {
      const { data } = await axios.post(
        `${BASE}/api/technicians/jobs/${jobId}/call-customer`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );
      return data;
    } catch (error: any) {
      console.error("Call Customer API Error:", error?.response?.data || error);
      throw error?.response?.data || error;
    }
  };

  const handleCallCustomer = async (jobId: string) => {
    if (!jobId) return;

    try {
      setLoading(true);

      const payload = {
        status: "customer_called",
        changedBy: {
          userType: "technician",
          userId: id,
        },
        notes: "Discussed arrival time",
        timestamp: new Date().toISOString(),
      };

      await callCustomer(jobId, payload);
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

  const handleStartInspection = useCallback(async () => {
    try {
      setLoading(true);
      navigation.navigate("JobFlowScreen", { job });
    } catch (error) {
      console.error("Error starting job:", error);
      Alert.alert("Error", "Failed to start job");
    } finally {
      setLoading(false);
    }
  }, [job, navigation]);

  const handleCompleteJob = useCallback(async () => {
    onComplete(job._id);
  }, [job._id, onComplete]);

  const handleScheduledWorkCompleted = useCallback(async () => {
    onScheduledWorkCompleted(job._id);
  }, [job._id, onScheduledWorkCompleted]);

  const handleAlert = useCallback(() => {
    onAlert(job._id);
  }, [job._id, onAlert]);

  const handleNavigate = useCallback(() => {
    navigate(job);
  }, [job, navigate]);

  return (
    <Pressable onPress={handleNavigate} style={styles.pressable}>
      <CustomView radius={scale(8)}>
        <View style={styles.card}>
          {/* In-Progress Badge */}
          <View style={[styles.badge, { backgroundColor: "#FFA500" }]}>
            <Text style={styles.badgeText}>in-Progress</Text>
          </View>

          {/* Name and Location Row */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.name}>{userName}</Text>
              <Text style={styles.location}>
                {city} {state}
              </Text>
            </View>
          </View>

          {/* AC Repair and Due Time */}
          <View style={styles.serviceHeaderRow}>
            <Text style={styles.serviceHeader}>Ac Repair</Text>
            <Text style={styles.dueText}>Due in 12h 45min</Text>
          </View>

          {/* AC Repair Service Row */}
          <View style={styles.serviceRow}>
            <LinearGradient
              colors={["#027CC7", "#004DBD"]}
              style={styles.iconBox}
            >
              <Icon name="air-conditioner" size={20} color="#fff" />
            </LinearGradient>
            <Text style={styles.serviceText}>AC Repair</Text>
          </View>

          {/* Issue Text */}
          <Text style={styles.issueText}>{issue}</Text>

          {/* Location */}
          <Text style={styles.locationDetail}>
            {city} {state}
          </Text>

          {/* Timeline Steps */}
          <View style={styles.timelineContainer}>
            {/* Call Customer */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  (arrivalSteps.CALL_CUSTOMER || customerCalled) && styles.timelineDotCompleted
                ]}>
                  {!(arrivalSteps.CALL_CUSTOMER || customerCalled) && (
                    <Text style={styles.timelineIcon}>📞</Text>
                  )}
                </View>
                {!(arrivalSteps.EN_ROUTE || enRouteTime) && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineText}>Call Customer</Text>
                {(arrivalSteps.CALL_CUSTOMER || customerCalled) && (
                  <Text style={styles.timelineTime}>
                    {customerCalledTime || arrivalSteps.CALL_CUSTOMER}
                  </Text>
                )}
              </View>
              {!(arrivalSteps.CALL_CUSTOMER || customerCalled) && (
                <TouchableOpacity 
                  style={styles.timelineButton}
                  onPress={() => handleCallCustomer(job._id)}
                >
                  <Text style={styles.timelineButtonText}>Start</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* En Route */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  (arrivalSteps.EN_ROUTE || enRouteTime) && styles.timelineDotCompleted
                ]}>
                  {!(arrivalSteps.EN_ROUTE || enRouteTime) && (
                    <Text style={styles.timelineIcon}>🚗</Text>
                  )}
                </View>
                {!(arrivalSteps.ARRIVED || arrivedTime) && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineText}>En Route</Text>
                {(arrivalSteps.EN_ROUTE || enRouteTime) && (
                  <Text style={styles.timelineTime}>
                    {enRouteTime}
                  </Text>
                )}
              </View>
              {!(arrivalSteps.EN_ROUTE || enRouteTime) && (
                <TouchableOpacity 
                  style={styles.timelineButton}
                  onPress={() => handleArrivalStatus("on_way", "EN_ROUTE")}
                >
                  <Text style={styles.timelineButtonText}>Start</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Arrived */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  (arrivalSteps.ARRIVED || arrivedTime) && styles.timelineDotCompleted
                ]}>
                  {!(arrivalSteps.ARRIVED || arrivedTime) && (
                    <Text style={styles.timelineIcon}>📍</Text>
                  )}
                </View>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineText}>Arrived</Text>
                {(arrivalSteps.ARRIVED || arrivedTime) && (
                  <Text style={styles.timelineTime}>
                    {arrivedTime}
                  </Text>
                )}
              </View>
              {!(arrivalSteps.ARRIVED || arrivedTime) && (
                <TouchableOpacity 
                  style={styles.timelineButton}
                  onPress={() => handleArrivalStatus("in_progress", "ARRIVED")}
                >
                  <Text style={styles.timelineButtonText}>Start</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Start Job Button */}
          <TouchableOpacity 
            style={styles.startJobButton}
            onPress={() => onStart(job._id)}
          >
            <Text style={styles.startJobButtonText}>Start Job</Text>
          </TouchableOpacity>
        </View>
      </CustomView>

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
    marginBottom: verticalScale(14),
    marginHorizontal: scale(16),
  },
  card: {
    padding: scale(16),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FFA500",
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(6),
    borderTopRightRadius: scale(12),
    borderBottomLeftRadius: scale(12),
  },
  badgeText: {
    color: "#fff",
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  topRow: {
    marginTop: verticalScale(20),
    marginBottom: verticalScale(8),
  },
  name: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#1A1A1A",
  },
  location: {
    fontSize: moderateScale(14),
    color: "#666666",
    marginTop: verticalScale(2),
  },
  serviceHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  serviceHeader: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#1A1A1A",
  },
  dueText: {
    fontSize: moderateScale(14),
    color: "#FF6B6B",
    fontWeight: "500",
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  iconBox: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(6),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(8),
  },
  serviceText: {
    fontSize: moderateScale(16),
    fontWeight: "500",
    color: "#333333",
  },
  issueText: {
    fontSize: moderateScale(14),
    color: "#666666",
    marginBottom: verticalScale(4),
  },
  locationDetail: {
    fontSize: moderateScale(14),
    color: "#666666",
    marginBottom: verticalScale(16),
  },
  timelineContainer: {
    marginBottom: verticalScale(20),
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: verticalScale(8),
  },
  timelineLeft: {
    alignItems: "center",
    width: scale(30),
  },
  timelineDot: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  timelineDotCompleted: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  timelineIcon: {
    fontSize: moderateScale(12),
  },
  timelineLine: {
    width: 2,
    height: verticalScale(25),
    backgroundColor: "#E0E0E0",
    marginTop: verticalScale(2),
  },
  timelineContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: scale(8),
    paddingVertical: verticalScale(2),
  },
  timelineText: {
    fontSize: moderateScale(14),
    color: "#333333",
  },
  timelineTime: {
    fontSize: moderateScale(12),
    color: "#666666",
    marginRight: scale(8),
  },
  timelineButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: scale(4),
    marginLeft: scale(8),
  },
  timelineButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  startJobButton: {
    backgroundColor: "#007AFF",
    paddingVertical: verticalScale(14),
    borderRadius: scale(8),
    alignItems: "center",
  },
  startJobButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: scale(16),
    borderTopLeftRadius: scale(16),
    borderTopRightRadius: scale(16),
  },
  modalTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginBottom: verticalScale(12),
  },
  statusOption: {
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  statusOptionTxt: {
    fontSize: moderateScale(14),
    color: "#153B93",
    fontWeight: "500",
  },
});

export default JobCard;