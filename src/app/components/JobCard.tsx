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

type Props = {
  job: JobType;
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

// ─── Action config ────────────────────────────────────────────────────────────
// Note: The primary CTA on this card always navigates to JobDetailsScreen.
// Labels/colors here drive the status pill and button appearance only.

type ActionConfig = {
  label: string;
  icon?: string;
  next: JobStatus | null;
  color: string;
  backgroundColor: string;
  handler:
    | "callCustomer"
    | "markOnWay"
    | "markArrived"
    | "startInspection"
    | "complete"
    | "restartJob"        // ← replaces scheduledDone for parts/workshop
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
    label: "Start Job",
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
  // Reschedule waiting: amber warning — no action possible from card level
  [JobStatus.VERIFICATION_REQUESTED]: {
    label: "Waiting for Customer",
    icon: "clock-alert-outline",
    next: null,
    color: "#D97706",
    backgroundColor: "#FFFBEB",
    handler: null,
  },
  [JobStatus.USER_VERIFIED]: {
    label: "Mark Done",
    icon: "check-circle",
    next: JobStatus.COMPLETED,
    color: "#059669",
    backgroundColor: "#ECFDF5",
    handler: "complete",
  },
  // After customer approves reschedule → technician restarts from JobDetailsScreen
  [JobStatus.PARTS_PENDING]: {
    label: "Start Job",
    icon: "play-circle-outline",
    next: JobStatus.IN_PROGRESS,
    color: "#7C3AED",
    backgroundColor: "#F5F3FF",
    handler: "restartJob",
  },
  [JobStatus.WORKSHOP_REQUIRED]: {
    label: "Start Job",
    icon: "play-circle-outline",
    next: JobStatus.IN_PROGRESS,
    color: "#7C3AED",
    backgroundColor: "#F5F3FF",
    handler: "restartJob",
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

const handleCall = (phoneNumber: string) => {
  Linking.openURL(`tel:${phoneNumber}`);
};

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

  if (!job || !job._id) return null;

  // ── Derived values ──────────────────────────────────────────────────────────
  const status = job?.status || JobStatus.TECHNICIAN_ASSIGNED;
  const statusText = getStatusText(status);

  const serviceName = job?.service?.name || "Service";
  const userName = job?.user?.name || "Customer";
  const city = job?.address?.city || "";
  const state = job?.address?.state || "";
  const location = [city, state].filter(Boolean).join(", ");
  const slotText = formatSlot(job?.scheduledDate);
  // Mirror JobDetailsScreen: prefer inspection grand total when available,
  // because finalPrice reflects only the original booking price and never
  // updates when the technician adds parts or services mid-job.
  const rawAmount = job.inspection?.totals?.grandTotal ?? job?.finalPrice;
  const amount = formatAmount(rawAmount);

  const customerCalledTime =
    arrivalSteps.CALL_CUSTOMER ||
    (job.statusHistory?.find((i: any) => i.status === "confirmed_scheduled")
      ? formatTimestamp(
          job.statusHistory.find((i: any) => i.status === "confirmed_scheduled")
            .timestamp,
        )
      : null);
  const enRouteTime =
    arrivalSteps.EN_ROUTE ||
    (job.statusHistory?.find((i: any) => i.status === "on_way")
      ? formatTimestamp(
          job.statusHistory.find((i: any) => i.status === "on_way").timestamp,
        )
      : null);

  // ── Reschedule flow detection (mirrors JobDetailsScreen) ───────────────────
  const rescheduleType = job.inspection?.completionType as
    | "parts_pending"
    | "workshop_required"
    | undefined;

  const isRescheduleVerification =
    rescheduleType === "parts_pending" || rescheduleType === "workshop_required";

  // True when waiting for customer to approve the reschedule request
  const isWaitingForRescheduleApproval =
    status === JobStatus.VERIFICATION_REQUESTED && isRescheduleVerification;

  // True when customer has approved and job is in parts/workshop holding state
  const isRescheduledStatus =
    status === JobStatus.PARTS_PENDING ||
    status === JobStatus.WORKSHOP_REQUIRED;

  // ── Status pill color override for reschedule states ─────────────────────────
  // actionCfg colors are used for the pill; override when needed for reschedule.
  const actionCfg = ACTION_CONFIG[status] ?? null;

  const pillColor = isWaitingForRescheduleApproval
    ? "#D97706"
    : isRescheduledStatus
      ? "#7C3AED"
      : actionCfg?.color ?? "#936140";

  const pillBgColor = isWaitingForRescheduleApproval
    ? "#FFFBEB"
    : isRescheduledStatus
      ? "#F5F3FF"
      : actionCfg?.backgroundColor ?? "#F5F5F5";

  // Pill label override
  const pillLabel = isWaitingForRescheduleApproval
    ? "Awaiting Approval"
    : isRescheduledStatus
      ? rescheduleType === "workshop_required"
        ? "Workshop Required"
        : "Parts Pending"
      : statusText;

  // ── CTA visibility ────────────────────────────────────────────────────────
  const isCompleted = status === JobStatus.COMPLETED;

  // Always show "View Details" unless completed — the actual action happens
  // inside JobDetailsScreen where full context is available.
  const showViewDetails = !isCompleted;

  // Derive CTA appearance
  const ctaColor = isWaitingForRescheduleApproval
    ? "#D97706"
    : isRescheduledStatus
      ? "#7C3AED"
      : actionCfg?.color ?? "#2563EB";

  const ctaBgColor = isWaitingForRescheduleApproval
    ? "#FFFBEB"
    : isRescheduledStatus
      ? "#F5F3FF"
      : actionCfg?.backgroundColor ?? "#EFF6FF";

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

  const handleNavigate = useCallback(() => {
    navigate(job);
  }, [job, navigate]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Pressable
      onPress={handleNavigate}
      style={styles.pressable}
    >
      <View style={styles.card}>
        {/* ── ROW 1: Name + Amount ── */}
        <View style={styles.row1}>
          <View style={styles.row1Left}>
            <Text style={styles.name}>{userName}</Text>
            <View style={styles.locationRow}>
              <Icon
                name="map-marker-outline"
                size={verticalScale(18)}
                color={SECONDARY_COLOR}
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

          {slotText ? (
            <View style={styles.slotRow}>
              <Icon name="clock-outline" size={13} color={SECONDARY_COLOR} />
              <Text style={styles.slotText}>{slotText}</Text>
            </View>
          ) : null}

          {/* Status pill */}
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: pillBgColor,
                borderColor: pillColor + "35",
              },
            ]}
          >
            {/* Extra clock icon for waiting state */}
            {isWaitingForRescheduleApproval && (
              <Icon
                name="clock-alert-outline"
                size={moderateScale(10)}
                color={pillColor}
              />
            )}
            <View
              style={[styles.statusDot, { backgroundColor: pillColor }]}
            />
            <Text style={[styles.statusPillText, { color: pillColor }]}>
              {pillLabel}
            </Text>
          </View>
        </View>

        {/* ── ROW 3: Action Buttons ── */}
        <View style={styles.actionRow}>
          {/* Call button — always visible unless completed */}
          {!isCompleted && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(job.user.phoneNumber)}
              disabled={loading}
            >
              <Icon name="phone" size={16} color="#fff" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          )}

          {/* View Details CTA — navigates to JobDetailsScreen for all active jobs */}
          {showViewDetails && (
            <TouchableOpacity
              style={[
                styles.ctaButton,
                loading && styles.ctaButtonDisabled,
                {
                  backgroundColor: ctaBgColor,
                  borderColor: ctaColor + "35",
                },
              ]}
              onPress={() => navigation.navigate("JobDetailsScreen", { job })}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={ctaColor} />
              ) : (
                <>
                  <Text
                    style={[styles.ctaButtonText, { color: ctaColor }]}
                  >
                    View Details
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={ctaColor}
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
const SECONDARY_COLOR = "#936140";

const styles = StyleSheet.create({
  pressable: {
    marginHorizontal: scale(9),
    marginBottom: 12,
  },

  card: {
    padding: verticalScale(17),
    gap: verticalScale(11),
    borderWidth: moderateScale(1),
    borderColor: "#F2D6B5",
    borderRadius: scale(8),
    backgroundColor: "#fff",
  },

  // ── Row 1 ──
  row1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
    color: SECONDARY_COLOR,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B45309",
  },

  // ── Row 2 ──
  row2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: verticalScale(4),
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  slotText: {
    fontSize: 11,
    color: SECONDARY_COLOR,
    marginLeft: 2,
  },

  // Status pill
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: scale(4),
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
    textTransform: "capitalize",
  },

  // ── Row 3: Actions ──
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: verticalScale(30),
  },

  callButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 18,
    paddingVertical: verticalScale(4),
    borderRadius: scale(6),
  },
  callButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

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