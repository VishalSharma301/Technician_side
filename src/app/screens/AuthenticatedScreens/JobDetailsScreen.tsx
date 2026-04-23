// src/app/screens/AuthenticatedScreens/JobDetailsScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "../../../util/scaling";
import ScreenHeader from "../../components/ScreenHeader";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  Job,
  JobStatus,
  getStatusText,
  getStatusColor,
} from "../../../constants/jobTypes";
import {
  updateJobStatus,
  verifyCompletionPin,
} from "../../../util/servicesApi";
import { useJobs } from "../../../store/JobContext";
import OtpModal from "../../components/OtpModal";
import {
  confirmSchedule,
  markArrived,
  markOnWay,
} from "../../../util/jobHandlingApis";
import { useContext } from "react";
import { AuthContext } from "../../../store/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type ArrivalKey = "CALL_CUSTOMER" | "EN_ROUTE" | "ARRIVED";

type ProgressStep = {
  key: ArrivalKey | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
};

// ─── Progress Steps Definition ───────────────────────────────────────────────

const PROGRESS_STEPS: ProgressStep[] = [
  {
    key: "ASSIGNED",
    title: "Assigned",
    subtitle: "Job assigned",
    color: "#4CAF50",
    bgColor: "#0EA5E9",
  },
  {
    key: "CALL_CUSTOMER",
    title: "Customer Confirmed",
    subtitle: "Called & confirmed",
    color: "#2196F3",
    bgColor: "#2563EB",
  },
  {
    key: "EN_ROUTE",
    title: "En Route",
    subtitle: "Started driving",
    color: "#7C3AED",
    bgColor: "#7C3AED",
  },
  {
    key: "ARRIVED",
    title: "Arrived",
    subtitle: "Reached home",
    color: "#F59E0B",
    bgColor: "#D97706",
  },
  {
    key: "IN_PROGRESS",
    title: "In Progress",
    subtitle: "Work started",
    color: "#7C3AED",
    bgColor: "#BA0092",
  },
  {
    key: "COMPLETED",
    title: "Completed",
    subtitle: "Done!",
    color: "#059669",
    bgColor: "#059669",
  },
];

// ─── Status → history key mapping ────────────────────────────────────────────

const STATUS_TO_STEP: Record<
  string,
  ArrivalKey | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED"
> = {
  technician_assigned: "ASSIGNED",
  confirmed_scheduled: "CALL_CUSTOMER",
  on_way: "EN_ROUTE",
  arrived: "ARRIVED",
  in_progress: "IN_PROGRESS",
  completed: "COMPLETED",
};

// ─── Action config (mirrors JobCard) ─────────────────────────────────────────

type ActionConfig = {
  label: string;
  icon: string;
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
    color: "#2563EB",
    backgroundColor: "#2563EB",
    handler: "callCustomer",
  },
  [JobStatus.CONFIRMED_SCHEDULED]: {
    label: "Start Driving",
    icon: "motorbike",
    color: "#2563EB",
    backgroundColor: "#2563EB",
    handler: "markOnWay",
  },
  [JobStatus.ON_WAY]: {
    label: "I Reached",
    icon: "map-marker-check",
    color: "#7C3AED",
    backgroundColor: "#7C3AED",
    handler: "markArrived",
  },
  [JobStatus.ARRIVED]: {
    label: "Start Inspection",
    icon: "clipboard-search",
    color: "#D97706",
    backgroundColor: "#D97706",
    handler: "startInspection",
  },
  [JobStatus.IN_PROGRESS]: {
    label: "Mark Done",
    icon: "check-circle",
    color: "#059669",
    backgroundColor: "#059669",
    handler: "complete",
  },
  [JobStatus.PARTS_PENDING]: {
    label: "Scheduled Work Completed",
    icon: "clipboard-check",
    color: "#4338CA",
    backgroundColor: "#4338CA",
    handler: "scheduledDone",
  },
  [JobStatus.WORKSHOP_REQUIRED]: {
    label: "Scheduled Work Completed",
    icon: "clipboard-check",
    color: "#4338CA",
    backgroundColor: "#4338CA",
    handler: "scheduledDone",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
}

function getCurrentTime(): string {
  return formatTimestamp(new Date().toISOString());
}

function formatSlot(scheduledDate: string | undefined): string {
  if (!scheduledDate) return "Not specified";
  const date = new Date(scheduledDate);
  // Return a 2-hour window
  const start = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  date.setHours(date.getHours() + 2);
  const end = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${start} – ${end}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const JobDetailsScreen = () => {
  const route = useRoute<any>();
  const job: Job = route.params?.job;
  const { updateStatus } = useJobs();
  const navigation = useNavigation<any>();
  const { token } = useContext(AuthContext);

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stepTimestamps, setStepTimestamps] = useState<
    Partial<Record<string, string>>
  >({});

  const status = job?.status;

  // ── Seed timestamps from statusHistory ──────────────────────────────────────
  useEffect(() => {
    if (!job?.statusHistory) return;
    const timestamps: Record<string, string> = {};
    job.statusHistory.forEach((item: any) => {
      const stepKey = STATUS_TO_STEP[item.status];
      if (stepKey) timestamps[stepKey] = formatTimestamp(item.timestamp);
    });
    setStepTimestamps(timestamps);
  }, [job]);

  if (!job) {
    return (
      <View style={styles.container}>
        <ScreenHeader name="Job Details" />
        <View style={styles.centered}>
          <Text>Job not found</Text>
        </View>
      </View>
    );
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const actionCfg = ACTION_CONFIG[status] ?? null;
  const isCompleted = status === JobStatus.COMPLETED;
  const statusText = getStatusText(status);

  const userName = job.user?.name || "Customer";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const location = [job.address?.city, job.address?.state]
    .filter(Boolean)
    .join(", ");

  const slotText = formatSlot(job.scheduledDate);
  const finalPrice = `₹${Number(job.finalPrice).toLocaleString("en-IN")}`;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCall = () => {
    if (job.user?.phoneNumber) {
      Linking.openURL(`tel:${job.user.phoneNumber}`);
    }
  };

  const handleCallCustomer = useCallback(async () => {
    if (stepTimestamps["CALL_CUSTOMER"]) return;
    try {
      setLoading(true);
      await confirmSchedule(job._id, token);
      updateStatus(job._id, JobStatus.CONFIRMED_SCHEDULED);
      setStepTimestamps((prev) => ({
        ...prev,
        CALL_CUSTOMER: getCurrentTime(),
      }));
    } catch (err) {
      Alert.alert("Error", "Failed to confirm schedule");
    } finally {
      setLoading(false);
    }
  }, [job._id, token, stepTimestamps, updateStatus]);

  const handleMarkOnWay = useCallback(async () => {
    if (!stepTimestamps["CALL_CUSTOMER"]) {
      Alert.alert("Step Required", "Please call the customer first.");
      return;
    }
    if (stepTimestamps["EN_ROUTE"]) return;
    try {
      setLoading(true);
      await markOnWay(job._id, token);
      updateStatus(job._id, JobStatus.ON_WAY);
      setStepTimestamps((prev) => ({ ...prev, EN_ROUTE: getCurrentTime() }));
    } catch {
      Alert.alert("Error", "Failed to mark on way");
    } finally {
      setLoading(false);
    }
  }, [job._id, token, stepTimestamps, updateStatus]);

  const handleMarkArrived = useCallback(async () => {
    if (!stepTimestamps["EN_ROUTE"]) {
      Alert.alert("Step Required", "Please mark En Route first.");
      return;
    }
    try {
      setLoading(true);
      await markArrived(job._id, token);
      updateStatus(job._id, JobStatus.ARRIVED);
      setStepTimestamps((prev) => ({ ...prev, ARRIVED: getCurrentTime() }));
    } catch {
      Alert.alert("Error", "Failed to mark arrived");
    } finally {
      setLoading(false);
    }
  }, [job._id, token, stepTimestamps, updateStatus]);

  const handleStartInspection = useCallback(() => {
    navigation.navigate("JobFlowScreen", { job });
  }, [job, navigation]);

  const handleCompleteJob = useCallback(() => {
    setPinModalVisible(true);
  }, []);

  const handleFollowUp = useCallback(() => {
    navigation.navigate("FollowUpJobScreen", { job });
  }, [job, navigation]);

  const handleVerifyPin = useCallback(
    async (pin: string) => {
      try {
        setLoading(true);
        const response = await updateJobStatus(
          job._id,
          "completed",
          pin,
          "Job completed",
        );
        if (response?.success) {
          updateStatus(job._id, JobStatus.COMPLETED);
          setPinModalVisible(false);
          setStepTimestamps((prev) => ({
            ...prev,
            COMPLETED: getCurrentTime(),
          }));
          Alert.alert("Success", "Job completed and PIN verified!");
        } else {
          Alert.alert("Error", response?.message || "Invalid PIN");
        }
      } catch {
        Alert.alert("Error", "Failed to verify PIN");
      } finally {
        setLoading(false);
      }
    },
    [job._id, updateStatus],
  );

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
        return handleCompleteJob();
      case "scheduledDone":
        return handleFollowUp();
    }
  };

  // ── Which steps are "done" based on current status ───────────────────────────
  const STATUS_ORDER: JobStatus[] = [
    JobStatus.TECHNICIAN_ASSIGNED,
    JobStatus.CONFIRMED_SCHEDULED,
    JobStatus.ON_WAY,
    JobStatus.ARRIVED,
    JobStatus.IN_PROGRESS,
    JobStatus.COMPLETED,
  ];

  const currentIdx = STATUS_ORDER.indexOf(status);

  const isStepDone = (stepIdx: number) => stepIdx <= currentIdx;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon
            name="chevron-left"
            size={moderateScale(22)}
            color={SECONDRY_COLOR}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {job.service?.name || "Job Details"}
        </Text>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isCompleted ? "#E8F5E9" : "#729869" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isCompleted ? "#fff" : "#fff" },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isCompleted ? "#059669" : "#fff" },
            ]}
          >
            {statusText}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CUSTOMER CARD */}
        <View style={styles.card}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: verticalScale(6),
            }}
          >
            <Text style={styles.sectionLabel}>Customer</Text>
            <Text style={styles.amountText}>{finalPrice}</Text>
          </View>
          <View style={styles.customerRow}>
            <View style={styles.customerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.customerName}>{userName}</Text>
                <View style={styles.locationRow}>
                  <Icon
                    name="map-marker-outline"
                    size={moderateScale(13)}
                    color="#936140"
                  />
                  <Text style={styles.locationText}>{location || "—"}</Text>
                </View>
              </View>
            </View>
          </View>
          {/* Call Button */}
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Icon name="phone" size={moderateScale(16)} color="#fff" />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* SLOT + AMOUNT INFO ROW */}
        <View style={styles.infoRow}>
          <View style={[styles.card, styles.infoBox]}>
            <View style={styles.infoLabelRow}>
              <Icon
                name="clock-outline"
                size={moderateScale(13)}
                color="#936140"
              />
              <Text style={styles.sectionLabel}>Slot</Text>
            </View>
            <Text style={styles.infoValue}>{slotText}</Text>
          </View>
          <View
            style={[
              styles.card,
              styles.infoBox,
              { backgroundColor: "#FEEDDC" },
            ]}
          >
            <View style={styles.infoLabelRow}>
              <Icon
                name="currency-inr"
                size={moderateScale(13)}
                color="#936140"
              />
              <Text style={styles.sectionLabel}>Amount</Text>
            </View>
            <Text style={styles.infoValue}>{finalPrice}</Text>
          </View>
        </View>

        {/* QUICK ACTIONS — visible only when job is active */}
        {(status === JobStatus.IN_PROGRESS ||
          status === JobStatus.ARRIVED ||
          status === JobStatus.ON_WAY) && (
          <View style={styles.card}>
            <Text
              style={[
                styles.sectionLabel,
                {
                  marginLeft: scale(4),
                  marginBottom: verticalScale(12),
                  color: "#0EA5E9",
                  fontWeight: "600",
                  fontSize: moderateScale(12),
                },
              ]}
            >
              Quick Actions
            </Text>
            <View style={styles.quickActionsRow}>
              {/* Add Part */}
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate("AddPartScreen", { job })}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#FCF5ED" },
                  ]}
                >
                  <Icon
                    name="puzzle-outline"
                    size={moderateScale(24)}
                    color="#864C2D"
                  />
                </View>
                <Text style={[styles.quickActionLabel, { color: "#DA8456" }]}>
                  Add Part
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.quickActionDivider} />

              {/* Add Service */}
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate("AddServiceScreen", { job })}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#EDF8F4" },
                  ]}
                >
                  <Icon
                    name="briefcase-outline"
                    size={moderateScale(24)}
                    color="#5D9669"
                  />
                </View>
                <Text style={[styles.quickActionLabel, { color: "#059669" }]}>
                  Add Service
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.quickActionDivider} />

              {/* Reschedule */}
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate("RescheduleScreen", { job })}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: "#F2F1FB" },
                  ]}
                >
                  <Icon
                    name="calendar-clock"
                    size={moderateScale(24)}
                    color="#6138CD"
                  />
                </View>
                <Text style={[styles.quickActionLabel, { color: "#6138CD" }]}>
                  Reschedule
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* PROGRESS CARD */}
        <View style={styles.card}>
          <Text
            style={[styles.sectionLabel, { marginBottom: verticalScale(16) }]}
          >
            Job Progress
          </Text>
          {PROGRESS_STEPS.map((step, idx) => {
            const done = isStepDone(idx);
            const timestamp = stepTimestamps[step.key];
            const isLast = idx === PROGRESS_STEPS.length - 1;

            return (
              <View key={step.key} style={styles.stepRow}>
                {/* Icon + connector line */}
                <View style={styles.stepLeft}>
                  <View
                    style={[
                      styles.stepIcon,
                      {
                        backgroundColor: done ? step.bgColor : "#F5F5F5",
                      },
                    ]}
                  >
                    <Icon
                      name="check"
                      size={moderateScale(16)}
                      color={done ? "#FFF" : "#ccc"}
                    />
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.stepLine,
                        { backgroundColor: done ? step.bgColor : "#E0E0E0" },
                      ]}
                    />
                  )}
                </View>

                {/* Step body */}
                <View style={styles.stepBody}>
                  <View style={styles.stepTitleRow}>
                    <Text
                      style={[
                        styles.stepTitle,
                        { color: done ? "#1a1a1a" : "#aaa" },
                      ]}
                    >
                      {step.title}
                    </Text>
                    {timestamp ? (
                      <Text style={styles.stepTime}>{timestamp}</Text>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.stepSubtitle,
                      { color: done ? "#888" : "#ccc" },
                    ]}
                  >
                    {step.subtitle}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Spacer for bottom bar */}
        <View style={{ height: verticalScale(80) }} />
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      {!isCompleted && actionCfg && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: actionCfg.backgroundColor },
              loading && { opacity: 0.7 },
            ]}
            onPress={handlePrimaryAction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon
                  name={actionCfg.icon as any}
                  size={moderateScale(18)}
                  color="#fff"
                />
                <Text style={styles.actionButtonText}>{actionCfg.label}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isCompleted && (
        <View style={styles.bottomBar}>
          <View style={[styles.actionButton, { backgroundColor: "#059669" }]}>
            <Icon name="check-circle" size={moderateScale(18)} color="#fff" />
            <Text style={styles.actionButtonText}>Completed & Verified</Text>
          </View>
        </View>
      )}

      {/* PIN MODAL */}
      <OtpModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        onSubmit={handleVerifyPin}
        title="Enter Completion PIN"
      />
    </View>
  );
};

const PRIMARY_COLOR = "#864C2D";
const SECONDRY_COLOR = "#936140";
// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5EB",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    backgroundColor: "#F2DDC5",
    marginBottom: verticalScale(20),
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  backText: {
    fontSize: moderateScale(13),
    color: SECONDRY_COLOR,
  },
  headerTitle: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: "#1a1a1a",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(4),
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: 99,
  },
  statusText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },

  // Quick actions
  quickActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(30),
    // justifyContent : "space-between",
  },
  quickActionBtn: {
    flex: 1,
    alignItems: "center",
    gap: verticalScale(6),
    paddingVertical: verticalScale(4),
    // borderWidth : 1
  },
  quickActionIcon: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(14),
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    textAlign: "center",
  },
  quickActionDivider: {
    width: 1,
    height: scale(50),
    backgroundColor: "#F2D6B5",
  },
  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(6),
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: scale(12),
    borderWidth: 0.5,
    borderColor: "#F2D6B5",
    padding: scale(14),
    marginBottom: verticalScale(10),
  },

  sectionLabel: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#936140",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    // marginBottom: verticalScale(8),
  },

  // Customer card
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flex: 1,
  },
  avatar: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "#F2DDC5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#864C2D",
  },
  customerName: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#1a1a1a",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(3),
    marginTop: verticalScale(2),
  },
  locationText: {
    fontSize: moderateScale(11),
    color: "#936140",
  },
  amountText: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  callButton: {
    backgroundColor: "#864C2D",
    borderRadius: scale(8),
    paddingVertical: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    marginTop: verticalScale(12),
  },
  callButtonText: {
    color: "#fff",
    fontSize: moderateScale(13),
    fontWeight: "600",
  },

  // Info row
  infoRow: {
    flexDirection: "row",
    gap: scale(10),
    marginBottom: verticalScale(0),
  },
  infoBox: {
    flex: 1,
    marginBottom: verticalScale(10),
  },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent : 'center',
    gap: scale(4),
    marginBottom: verticalScale(4),
  },
  infoValue: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },

  // Progress steps
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(12),
  },
  stepLeft: {
    alignItems: "center",
  },
  stepIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(4),
  },
  stepLine: {
    width: 2,
    height: verticalScale(30),
    marginVertical: verticalScale(2),
  },
  stepBody: {
    flex: 1,
    paddingTop: verticalScale(2),
    paddingBottom: verticalScale(10),
  },
  stepTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepTitle: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  stepTime: {
    fontSize: moderateScale(11),
    color: "#888",
  },
  stepSubtitle: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(1),
  },

  // Bottom action bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF5EB",
    borderTopWidth: 0.5,
    borderTopColor: "#F2D6B5",
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(24),
  },
  actionButton: {
    borderRadius: scale(12),
    paddingVertical: verticalScale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },
  actionButtonText: {
    color: "#fff",
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
});

export default JobDetailsScreen;
