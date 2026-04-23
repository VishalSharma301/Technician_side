import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
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
import { ProfileContext } from "../../store/ProfileContext";
import { AuthContext } from "../../store/AuthContext";
import { JobType } from "../../constants/job";
import {
  confirmSchedule,
  markArrived,
  markOnWay,
} from "../../util/jobHandlingApis";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  job: JobType;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onStartInspection: (id: string) => void;
  onScheduledWorkCompleted: (id: string) => void;
  onAlert: (id: string) => void;
  navigate: (job: JobType) => void; // FIX #10 — unified to JobType (was Job)
};

type ArrivalKey = "CALL_CUSTOMER" | "EN_ROUTE" | "ARRIVED";

// Only expose statuses that make sense to manually override
const ALL_STATUSES: JobStatus[] = [
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
  JobStatus.ON_WAY,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const time = date
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
  return `${day} ${month}, ${time}`;
}

function getCurrentTime(): string {
  return formatTimestamp(new Date().toISOString());
}

/** Returns a human-readable countdown like "12h 45min" from now until deadline */
function getCountdown(deadline: string | undefined): string {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Overdue";
  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const { token } = useContext(AuthContext);

  // FIX #11 — loading state is now used to disable buttons & show spinner
  const [loading, setLoading] = useState(false);

  const [arrivalSteps, setArrivalSteps] = useState<
    Partial<Record<ArrivalKey, string>>
  >({});

  // FIX #13 — added a trigger button in the UI so this modal is reachable
  const [showStatusModal, setShowStatusModal] = useState(false);

  // ── Seed arrival steps from server history ──────────────────────────────────
  useEffect(() => {
    if (!job?.statusHistory) return;

    const steps: Partial<Record<ArrivalKey, string>> = {};

    job.statusHistory.forEach((item: any) => {
      const formatted = formatTimestamp(item.timestamp);
      if (item.status === "confirmed_scheduled")
        steps.CALL_CUSTOMER = formatted;
      else if (item.status === "on_way") steps.EN_ROUTE = formatted;
      else if (item.status === "arrived") steps.ARRIVED = formatted;
    });

    setArrivalSteps((prev) => ({
  ...steps,
  ...prev,
}));
  }, [job]);

  // ── Guard ───────────────────────────────────────────────────────────────────
  if (!job || !job._id) return null;

  // ── Derived values ──────────────────────────────────────────────────────────
  const status = job?.status || JobStatus.TECHNICIAN_ASSIGNED;
  const statusText = getStatusText(status);
  const theme = getStatusTheme(status);

  // FIX #6 — use real data instead of hardcoded strings
  const serviceName = job?.service?.name || "Service";
  const serviceIssue = job?.service?.issue || "Issue not specified";
  const userName = job?.user?.name || "Customer";
  const city = job?.address?.city || "Location";
  const state = job?.address?.state || "";

  // FIX #7 — compute due countdown from real job deadline
  const dueText = job?.scheduledDate ? getCountdown(job.scheduledDate) : "";

  // Derive timestamps from history or optimistic local state
  const findHistoryTime = (statusKey: string): string | null => {
    const entry = job.statusHistory?.find(
      (item: any) => item.status === statusKey,
    );
    return entry ? formatTimestamp(entry.timestamp) : null;
  };

  const customerCalledTime =
    arrivalSteps.CALL_CUSTOMER || findHistoryTime("confirmed_scheduled");
  const enRouteTime = arrivalSteps.EN_ROUTE || findHistoryTime("on_way");
  const arrivedTime = arrivalSteps.ARRIVED || findHistoryTime("arrived");

  // ── FIX #3 — sequential enforcement helpers ─────────────────────────────────
  const canMarkEnRoute = !!customerCalledTime;
  const canMarkArrived = !!enRouteTime;

  // ── Handlers ────────────────────────────────────────────────────────────────

  /** Manual status override via modal (dev/admin tool) */
  const handleStatusChange = async (newStatus: JobStatus) => {
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

  /** CALL CUSTOMER — confirms schedule */
  const handleCallCustomer = async () => {
    if (customerCalledTime) return; // already done
    try {
      setLoading(true);
      await confirmSchedule(job._id, token);
      // FIX #8 — update global context after API success
      updateStatus(job._id, JobStatus.CONFIRMED_SCHEDULED);
      setArrivalSteps((prev) => ({
        ...prev,
        CALL_CUSTOMER: getCurrentTime(),
      }));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to confirm schedule");
    } finally {
      setLoading(false);
    }
  };

  // FIX #1 — removed duplicate handleMarkOnWay; single handler below used everywhere
  /** EN ROUTE — marks technician on the way */
  const handleMarkOnWay = async () => {
    if (enRouteTime) return; // already done
    // FIX #3 — enforce sequence: must have called customer first
    if (!customerCalledTime) {
      Alert.alert("Step Required", "Please call the customer first.");
      return;
    }
    try {
      setLoading(true);
      await markOnWay(job._id, token);
      // FIX #8 — update global context
      updateStatus(job._id, JobStatus.ON_WAY);
      setArrivalSteps((prev) => ({
        ...prev,
        EN_ROUTE: getCurrentTime(),
      }));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to mark on way");
    } finally {
      setLoading(false);
    }
  };

  /** ARRIVED — marks technician arrived and progresses job to IN_PROGRESS */
  const handleMarkArrived = async () => {
    if (arrivedTime) return; // already done
    // FIX #3 — enforce sequence: must be en route first
    if (!enRouteTime) {
      Alert.alert("Step Required", "Please mark En Route first.");
      return;
    }
    try {
      setLoading(true);
      await markArrived(job._id, token);

      
      // FIX #5 — update global context so badge reflects new status
      updateStatus(job._id, JobStatus.ARRIVED);

      setArrivalSteps((prev) => ({
        ...prev,
        ARRIVED: getCurrentTime(),
      }));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to mark arrived");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJob = useCallback(async () => {
    onComplete(job._id);
  }, [job._id, onComplete]);

  // const handleScheduledWorkCompleted = useCallback(async () => {
  //   onScheduledWorkCompleted(job._id); 
  // }, [job._id, onScheduledWorkCompleted]);

    const handleScheduledWorkCompleted = useCallback(() => {
    navigation.navigate("FollowUpJobScreen", { job });
  }, [job, navigation]);

  // FIX #9 — single consistent inspection handler: navigate to JobFlowScreen
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
  }, [job, navigate]);

  // ── Render ──────────────────────────────────────────────────────────────────

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
              {/* FIX #6 — use real service name */}
              <Text style={styles.serviceTitle}>{serviceName}</Text>
              {/* FIX #7 — use computed countdown; hide if no deadline */}
              {dueText ? (
                <Text style={[styles.due, { color: theme.main }]}>
                  Due in {dueText}
                </Text>
              ) : null}
            </View>
          </View>

          {/* SERVICE TABS */}
          <View style={[styles.tabs, { borderColor: theme.border }]}>
            <View style={[styles.activeTab, { backgroundColor: theme.main }]}>
              <View style={styles.tabIconWrap}>
                <Icon name="air-conditioner" size={24} color={theme.main} />
              </View>
              {/* FIX #6 — dynamic service name */}
              <Text style={styles.activeTabText}>{serviceName}</Text>
            </View>

            <View style={[styles.tab, { backgroundColor: theme.light }]}>
              <View
                style={[styles.tabIconWrap, { backgroundColor: theme.main }]}
              >
                <Icon name="air-conditioner" size={24} color="#fff" />
              </View>
              {/* FIX #6 — dynamic service issue */}
              <Text style={styles.tabText}>{serviceIssue}</Text>
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
            <View style={styles.timelineRow}>
              <View style={styles.timelineIcon}>
                <Icon name="phone" size={16} color="#027CC7" />
              </View>
              <Text style={styles.timelineText}>Call Customer</Text>
              {customerCalledTime ? (
                <Text style={styles.timelineTime}>{customerCalledTime}</Text>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.timelineStartBtn,
                    loading && styles.disabledBtn,
                  ]}
                  onPress={handleCallCustomer}
                  disabled={loading}
                >
                  {/* FIX #11 — show spinner while loading */}
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.timelineStartBtnText}>Start</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* EN ROUTE */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIcon}>
                <Icon name="motorbike" size={16} color="#027CC7" />
              </View>
              <Text style={styles.timelineText}>En Route</Text>
              {enRouteTime ? (
                <Text style={styles.timelineTime}>{enRouteTime}</Text>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.timelineStartBtn,
                    // FIX #3 — visually dim if previous step not done
                    (!canMarkEnRoute || loading) && styles.disabledBtn,
                  ]}
                  // FIX #1 — single unified handler
                  onPress={handleMarkOnWay}
                  disabled={!canMarkEnRoute || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.timelineStartBtnText}>Start</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* ARRIVED */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIcon}>
                <Icon name="map-marker" size={16} color="#027CC7" />
              </View>
              <Text style={styles.timelineText}>Arrived</Text>
              {arrivedTime ? (
                <Text style={styles.timelineTime}>{arrivedTime}</Text>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.timelineStartBtn,
                    // FIX #3 — visually dim if previous step not done
                    (!canMarkArrived || loading) && styles.disabledBtn,
                  ]}
                  // FIX #2, #5 — unified handler that also updates status
                  onPress={handleMarkArrived}
                  disabled={!canMarkArrived || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.timelineStartBtnText}>Start</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionRow}>
           

            {/* SCHEDULED WORK COMPLETED */}
            {(status === JobStatus.PARTS_PENDING ||
              status === JobStatus.WORKSHOP_REQUIRED) && (
              <TouchableOpacity
                onPress={handleScheduledWorkCompleted}
                style={styles.outlineButton}
                disabled={loading}
              >
                <Text style={styles.outlineButtonText}>
                  Scheduled Work Completed
                </Text>
              </TouchableOpacity>
            )}

            {/* START INSPECTION — FIX #9: unified handler for both ARRIVED & ON_WAY */}
            {(status === JobStatus.ARRIVED || status === JobStatus.IN_PROGRESS ) && (
              <TouchableOpacity
                onPress={handleStartInspection}
                style={styles.outlineButton}
                disabled={loading}
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
                disabled={loading}
              >
                <Icon name="alert" size={18} color="#153B93" />
              </TouchableOpacity>
            )}

            {/* FIX #13 — trigger button for status override modal (admin use) */}
            <TouchableOpacity
              onPress={() => setShowStatusModal(true)}
              style={styles.overrideButton}
            >
              <Icon name="dots-vertical" size={20} color="#777" />
            </TouchableOpacity>
          </View>
        </View>
      </CustomView>

      {/* STATUS CHANGE MODAL — FIX #13: now reachable via the ⋮ button */}
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
            <Text style={styles.modalTitle}>Override Job Status</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    flex: 1,
  },

  activeTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6.5,
    width: 149,
  },

  tabIconWrap: {
    height: 32,
    width: 32,
    borderRadius: 6,
    backgroundColor: "#F5F4F9",
    alignItems: "center",
    justifyContent: "center",
  },

  tabText: {
    marginLeft: 6,
    fontSize: 14,
    flexShrink: 1,
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
    minWidth: 52,
    alignItems: "center",
  },

  timelineStartBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // FIX #11 — disabled visual state
  disabledBtn: {
    backgroundColor: "#B0C4DE",
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

  // FIX #13 — new button to open status override modal
  overrideButton: {
    width: 36,
    height: 44,
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
