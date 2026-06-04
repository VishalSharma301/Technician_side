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
  Linking,
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
import { ProfileContext } from "../../store/ProfileContext";
import { AuthContext } from "../../store/AuthContext";
import { JobType } from "../../constants/job";
import {
  confirmSchedule,
  markArrived,
  markOnWay,
} from "../../util/jobHandlingApis";
import { moderateScale, scale, verticalScale } from "../../util/scaling";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobActionButton = {
  label: string;
  apiPath: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  style: "success" | "primary" | "danger" | "warning"; // extend if needed
};

export type JobCard = {
  actionButton: JobActionButton;
  address: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  isWarranty: boolean;
  jobId: string;
  jobRef: string;
  scheduledDate: string | null;
  serviceIcon: string;
  serviceName: string;
  status: "pending" | "in_progress" | "completed" | "cancelled"; // extend if backend has more
  statusLabel: string;
  timeSlot: string | null;
};

type Props = {
  // job: JobType;
  job: JobCard;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onStartInspection: (id: string) => void;
  onScheduledWorkCompleted: (id: string) => void;
  onAlert: (id: string) => void;
  navigate: (job: JobType) => void;
};

type ArrivalKey = "CALL_CUSTOMER" | "EN_ROUTE" | "ARRIVED";

const ALL_STATUSES: JobStatus[] = [
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
  JobStatus.ON_WAY,
];

// ─── Status → Action Button config (mirrors Fuvay's S map) ───────────────────
// Each entry defines what the primary CTA button shows for a given status,
// and what status it advances to.

type ActionConfig = {
  label: string; // button label
  icon?: string; // MaterialCommunityIcons name
  next: JobStatus | null;
  color: string;
  backgroundColor: string;
  handler:
    | "callCustomer"
    | "markOnWay"
    | "markArrived"
    | "startInspection"
    | "complete"
    | "scheduledDone"
    | null;
};

const ACTION_CONFIG: Partial<Record<JobStatus, ActionConfig>> = {
  [JobStatus.TECHNICIAN_ASSIGNED]: {
    label: "Call & Confirm",
    icon: "phone",
    next: JobStatus.CONFIRMED_SCHEDULED,
    color: "#0EA5E9",
    backgroundColor: "#F0F9FF",
    handler: "callCustomer",
  },
  [JobStatus.CONFIRMED_SCHEDULED]: {
    label: "Start Driving",
    icon: "motorbike",
    next: JobStatus.ON_WAY,
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    handler: "markOnWay",
  },
  [JobStatus.ON_WAY]: {
    label: "I Reached",
    icon: "map-marker-check",
    next: JobStatus.ARRIVED,
    color: "#7C3AED",
    backgroundColor: "#F5F3FF",
    handler: "markArrived",
  },
  [JobStatus.ARRIVED]: {
    label: "Start Inspection",
    icon: "clipboard-search",
    next: JobStatus.IN_PROGRESS,
    color: "#D97706",
    backgroundColor: "#FFFBEB",
    handler: "startInspection",
  },
  [JobStatus.IN_PROGRESS]: {
    label: "Mark Done",
    icon: "check-circle",
    next: JobStatus.COMPLETED,
    color: "#059669",
    backgroundColor: "#ECFDF5",
    handler: "complete",
  },
  [JobStatus.VERIFICATION_REQUESTED]: {
    label: "Verification Requested",
    icon: "check-circle",
    next: JobStatus.COMPLETED,
    color: "#D97706",
    backgroundColor: "#FFFBEB",
    handler: "complete",
  },
  [JobStatus.USER_VERIFIED]: {
    label: "Verification Done",
    icon: "check-circle",
    next: JobStatus.COMPLETED,
    color: "#D97706",
    backgroundColor: "#FFFBEB",
    handler: "complete",
  },
  [JobStatus.PARTS_PENDING]: {
    label: "Scheduled Work Completed",
    icon: "clipboard-check",
    next: null,
    color: "#4338CA",
    backgroundColor: "#E0F2FE",
    handler: "scheduledDone",
  },
  [JobStatus.WORKSHOP_REQUIRED]: {
    label: "Scheduled Work Completed",
    icon: "clipboard-check",
    next: null,
    color: "#4338CA",
    backgroundColor: "#E0F2FE",
    handler: "scheduledDone",
  },
};

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

const handleCall = (phoneNumber : string) => {
  Linking.openURL(`tel:${phoneNumber}`);
};

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

function formatSlot(scheduledDate: string | undefined): string {
  if (!scheduledDate) return "";
  const date = new Date(scheduledDate);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatAmount(amount: number | undefined): string {
  if (!amount) return "";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
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

  const [loading, setLoading] = useState(false);
  const [arrivalSteps, setArrivalSteps] = useState<
    Partial<Record<ArrivalKey, string>>
  >({});
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
    setArrivalSteps((prev) => ({ ...steps, ...prev }));
  }, [job]);

  // if (!job || !job._id) return null;
console.log('jobbbbbb : ', job);

  // ── Derived values ──────────────────────────────────────────────────────────
  const status = job?.status || JobStatus.TECHNICIAN_ASSIGNED;
  // const statusText = getStatusText(status);
  const statusText = job?.statusLabel || getStatusText(status);
  const theme = getStatusTheme(status);

  const serviceName = job.serviceName || "Service";
  const userName = job.customerName || "Customer";
  const location = job.address || "";
  // const state = job.address?.state || "";
  // const location = [city, state].filter(Boolean).join(", ");
  const slotText = formatSlot(job?.scheduledDate || undefined);
  const amount = formatAmount(job?.amount);

  // const customerCalledTime =
  //   arrivalSteps.CALL_CUSTOMER ||
  //   (job.statusHistory?.find((i: any) => i.status === "confirmed_scheduled")
  //     ? formatTimestamp(
  //         job.statusHistory.find((i: any) => i.status === "confirmed_scheduled")
  //           .timestamp,
  //       )
  //     : null);
  // const enRouteTime =
  //   arrivalSteps.EN_ROUTE ||
  //   (job.statusHistory?.find((i: any) => i.status === "on_way")
  //     ? formatTimestamp(
  //         job.statusHistory.find((i: any) => i.status === "on_way").timestamp,
  //       )
  //     : null);

  // ── Action config for current status ────────────────────────────────────────
  const actionCfg = ACTION_CONFIG[status] ?? null;

  // ── Handlers ────────────────────────────────────────────────────────────────

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

  const handleCallCustomer = async () => {
    if (customerCalledTime) return;
    try {
      setLoading(true);
      await confirmSchedule(job._id, token);
      updateStatus(job._id, JobStatus.CONFIRMED_SCHEDULED);
      setArrivalSteps((prev) => ({ ...prev, CALL_CUSTOMER: getCurrentTime() }));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to confirm schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOnWay = async () => {
    if (enRouteTime) return;
    if (!customerCalledTime) {
      Alert.alert("Step Required", "Please call the customer first.");
      return;
    }
    try {
      setLoading(true);
      await markOnWay(job._id, token);
      updateStatus(job._id, JobStatus.ON_WAY);
      setArrivalSteps((prev) => ({ ...prev, EN_ROUTE: getCurrentTime() }));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to mark on way");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkArrived = async () => {
    if (!enRouteTime) {
      Alert.alert("Step Required", "Please mark En Route first.");
      return;
    }
    try {
      setLoading(true);
      await markArrived(job._id, token);
      updateStatus(job._id, JobStatus.ARRIVED);
      setArrivalSteps((prev) => ({ ...prev, ARRIVED: getCurrentTime() }));
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to mark arrived");
    } finally {
      setLoading(false);
    }
  };

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

  const handleComplete = useCallback(() => {
    onComplete(job._id);
  }, [job._id, onComplete]);

  const handleScheduledWorkCompleted = useCallback(() => {
    navigation.navigate("FollowUpJobScreen", { job });
  }, [job, navigation]);

  const handleAlert = useCallback(() => {
    onAlert(job._id);
  }, [job._id, onAlert]);

  const handleNavigate = useCallback(() => {
    navigate(job);
  }, [job, navigate]);

  // ── Dispatch the right handler for the primary CTA button ───────────────────
  const handlePrimaryAction = () => {
    if (!actionCfg) return;
    switch (actionCfg.handler) {
      case "callCustomer":
        return handleCallCustomer();
      case "markOnWay":
        return handleMarkOnWay();
      case "markArrived":
        return handleMarkArrived();
      case "startInspection":
        return handleStartInspection();
      case "complete":
        return handleComplete();
      case "scheduledDone":
        return handleScheduledWorkCompleted();
      default:
        return;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const isCompleted = status === JobStatus.COMPLETED;
  const isTerminal = isCompleted || !actionCfg;

  return (
    <Pressable onPress={handleNavigate} style={styles.pressable}>
      <View style={styles.card}>
        {/* ── ROW 1: Name + Amount ── */}
        <View style={styles.row1}>
          <View style={styles.row1Left}>
            <Text style={styles.name}>{userName}</Text>
            <View style={styles.locationRow}>
              <Icon
                name="map-marker-outline"
                size={verticalScale(18)}
                color={SECONDRY_COLOR}
              />
              <Text style={styles.location}>{location}</Text>
            </View>
          </View>
          <Text style={styles.amount}>{amount ? amount : "₹00"}</Text>
        </View>

        {/* ── ROW 2: Service + Slot + Status pill ── */}
        <View style={styles.row2}>
          <View style={styles.serviceRow}>
            <Icon
              name="scissors-cutting"
              size={15}
              color={PRIMARY_COLOR}
              style={{ marginRight: 5 }}
            />
            <Text style={styles.serviceName}>{serviceName}</Text>
          </View>

          {true ? (
            <View style={styles.slotRow}>
              <Icon name="clock-outline" size={13} color={SECONDRY_COLOR} />
              <Text style={styles.slotText}>{slotText || "Not specified"}</Text>
            </View>
          ) : null}

          {/* Status pill */}
          <View
            style={[
              styles.statusPill,
              { backgroundColor: actionCfg?.backgroundColor, borderColor: actionCfg?.color + "35" },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: actionCfg?.color }]} />
            <Text  style={[styles.statusPillText, { color:actionCfg?.color }]}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* ── ROW 3: Action Buttons ── */}
        <View style={styles.actionRow}>
          {/* Call button — always visible unless completed */}
          {!isCompleted && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => {
                handleCall(job.user.phoneNumber);
              }}
              disabled={loading}
            >
              <Icon name="phone" size={16} color="#fff" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          )}

          {/* Primary CTA — advances the job status */}
          {/* {!isTerminal && (
            <TouchableOpacity
              style={[
                styles.ctaButton,
                loading && styles.ctaButtonDisabled,
                {
                  backgroundColor: actionCfg!.backgroundColor,
                  borderColor: actionCfg!.color + "35", // 20% opacity border
                },
              ]}
              onPress={handlePrimaryAction}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#153B93" />
              ) : (
                <>
                  <Text
                    style={[styles.ctaButtonText, { color: actionCfg!.color }]}
                  >
                    {actionCfg!.label}
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={actionCfg!.color}
                  />
                </>
              )}
            </TouchableOpacity>
          )} */}
          {!isTerminal && (
            <TouchableOpacity
              style={[
                styles.ctaButton,
                loading && styles.ctaButtonDisabled,
                {
                  backgroundColor: actionCfg!.backgroundColor,
                  borderColor: actionCfg!.color + "35", // 20% opacity border
                },
              ]}
              onPress={() => navigation.navigate("JobDetailsScreen", { jobId : job.jobId })}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#153B93" />
              ) : (
                <>
                  <Text
                    style={[styles.ctaButtonText, { color: actionCfg!.color }]}
                  >
                    {'View Details'}
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={actionCfg!.color}
                  />
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Completed state */}
          {isCompleted && (
            <View style={[styles.ctaButton, styles.ctaCompleted]}>
              <Icon name="check-circle" size={16} color="#059669" />
              <Text
                style={[
                  styles.ctaButtonText,
                  { color: "#059669", marginLeft: 6 },
                ]}
              >
                Completed
              </Text>
            </View>
          )}

          {/* ⋮ override button */}
          {/* <TouchableOpacity
            onPress={() => setShowStatusModal(true)}
            style={styles.overrideButton}
          >
            <Icon name="dots-vertical" size={20} color="#aaa" />
          </TouchableOpacity> */}
        </View>
      </View>

      {/* ── STATUS OVERRIDE MODAL ── */}
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

const PRIMARY_COLOR = "#864C2D";
const SECONDRY_COLOR = "#936140";

const styles = StyleSheet.create({
  pressable: {
    marginHorizontal: scale(9),
    marginTop: verticalScale(12),

  },

  card: {
    padding: verticalScale(17),
    gap: verticalScale(11),
    borderWidth: moderateScale(1),
    borderColor: "#F2D6B5",
    borderRadius: scale(8),
    backgroundColor : '#fff',
    // height : verticalScale(155),
  },

  // ── Row 1 ──
  row1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    // borderWidth : 1
  },

  row1Left: {
    flex: 1,
    marginRight: 12,
  },

  name: {
    fontSize: 12,
    fontWeight: "600",
    color: "#864C2D",
    marginBottom: 3,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  location: {
    fontSize: 11,
    color: SECONDRY_COLOR,
    // marginLeft: 2,
  },

  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B45309", // amber — matches Fuvay's P.amber
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 2,
  },

  // ── Row 2 ──
  row2: {
    flexDirection: "row",
    alignItems: "center",
    // gap: 8,
    flexWrap: "wrap",
    marginBottom  : verticalScale(4),
    // borderWidth : 1
  },

  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  serviceName: {
    fontSize: 13,
    fontWeight: "500",
    color: PRIMARY_COLOR,
  },

  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    // backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },

  slotText: {
    fontSize: 11,
    color: SECONDRY_COLOR,
    marginLeft: 2,
  },

  // Status pill
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: scale(4),
    // borderWidth: 1,
    marginLeft: "auto",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },

  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform : 'capitalize'
  },

  // ── Row 3: Actions ──
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: verticalScale(30),
    // marginTop: 2,
  },

  // Brown/amber filled "Call" button
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PRIMARY_COLOR, // matches the brownish call button in the image
    paddingHorizontal: 18,
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
  },

  callButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Outlined "Call & Confirm >" button
  ctaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: moderateScale(1),
    borderColor: "#C6D9FB",
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
    gap: 4,
    backgroundColor: "#EFF6FF",
  },

  ctaButtonDisabled: {
    borderColor: "#B0C4DE",
    opacity: 0.6,
  },

  ctaButtonText: {
    color: "#153B93",
    fontSize: 13,
    fontWeight: "600",
  },

  ctaCompleted: {
    borderColor: "#059669",
    flexDirection: "row",
    justifyContent: "center",
  },

  overrideButton: {
    width: 36,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Modal ──
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
    color: "#0C1A2E",
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
