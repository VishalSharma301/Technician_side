// src/app/screens/AuthenticatedScreens/JobDetailsScreen.tsx
import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "../../../util/scaling";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { JobStatus, getStatusText } from "../../../constants/jobTypes";
import {
  getServiceRequestById,
  updateJobStatus,
} from "../../../util/servicesApi";
import { useJobs } from "../../../store/JobContext";
import OtpModal from "../../components/OtpModal";
import {
  confirmSchedule,
  markArrived,
  markInProgress,
  markOnWay,
} from "../../../util/jobHandlingApis";
import { AuthContext } from "../../../store/AuthContext";
import CollectPaymentModal from "../../components/CollectPaymentModal";
import { JobType } from "../../../constants/job";
import InvoiceItemCard from "../../components/InvoiceItemCard";
import {
  removeAdditionalService,
  requestVerification,
  resendVerification,
} from "../../../api/services";
import { removeUsedPart } from "../../../api/inventory";
import ScreenWrapper from "../../components/ScreenWrapper";
import { handleRescheduleJob } from "../../../util/resheduleHandler";
import SuccessAlert from "../../components/SuccessAlert";

// ─── Types ───────────────────────────────────────────────────────────────────

type ArrivalKey = "CALL_CUSTOMER" | "EN_ROUTE" | "CLICK_PICTURES" | "ARRIVED";

type ProgressStepKey =
  | ArrivalKey
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESCHEDULE_REQUESTED"
  | "RESCHEDULE_APPROVED"
  | "JOB_RESUMED"
  | "COMPLETED"
  | "VERIFICATION_REQUESTED"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED";

type ProgressStep = {
  key: ProgressStepKey;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
};

// ─── Status → history key mapping ────────────────────────────────────────────

const STATUS_TO_STEP: Record<string, ProgressStepKey> = {
  technician_assigned: "ASSIGNED",
  confirmed_scheduled: "CALL_CUSTOMER",
  on_way: "EN_ROUTE",
  arrived: "ARRIVED",
  in_progress: "IN_PROGRESS",
  verification_requested: "VERIFICATION_REQUESTED",
  user_verified: "VERIFICATION_APPROVED",
  user_verification_rejected: "VERIFICATION_REJECTED",
  parts_pending: "RESCHEDULE_APPROVED",
  at_workshop: "RESCHEDULE_APPROVED",
  completed: "COMPLETED",
};

// ─── Action config ────────────────────────────────────────────────────────────

type ActionConfig = {
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
  handler:
    | "callCustomer"
    | "markOnWay"
    | "markArrived"
    | "inProgress"
    | "complete"
    | "scheduledDone"
    | "restartJob"
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
    label: "Start Job",
    icon: "clipboard-search",
    color: "#D97706",
    backgroundColor: "#D97706",
    handler: "inProgress",
  },
  [JobStatus.IN_PROGRESS]: {
    label: "Mark Done",
    icon: "check-circle",
    color: "#059669",
    backgroundColor: "#059669",
    handler: "complete",
  },
  // [JobStatus.VERIFICATION_REQUESTED]: {
  //   label: "Mark Done",
  //   icon: "check-circle",
  //   color: "#059669",
  //   backgroundColor: "#059669",
  //   handler: "complete",
  // },
  [JobStatus.USER_VERIFIED]: {
    label: "Mark Done",
    icon: "check-circle",
    color: "#059669",
    backgroundColor: "#059669",
    handler: "complete",
  },
  [JobStatus.PARTS_PENDING]: {
    label: "Start Job",
    icon: "play-circle-outline",
    color: "#7C3AED",
    backgroundColor: "#7C3AED",
    handler: "restartJob",
  },
  [JobStatus.WORKSHOP_REQUIRED]: {
    label: "Start Job",
    icon: "play-circle-outline",
    color: "#7C3AED",
    backgroundColor: "#7C3AED",
    handler: "restartJob",
  },
  [JobStatus.USER_VERIFICATION_REJECTED]: {
    label: "Start Job",
    icon: "play-circle-outline",
    color: "#DC2626",
    backgroundColor: "#DC2626",
    handler: "restartJob",
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
  const jobId: string = route.params?.jobId;
  const navigation = useNavigation<any>();
  const { updateStatus } = useJobs();
  const { token } = useContext(AuthContext);

  // ── 1. ALL useState — no exceptions ──────────────────────────────────────
  const [job, setJob] = useState<JobType | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [stepTimestamps, setStepTimestamps] = useState<
    Partial<Record<string, string>>
  >({});
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [status, setStatus] = useState<JobStatus | undefined>(undefined);
  const [parts, setParts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [pendingParts, setPendingParts] = useState<any[]>([]);
  const [pendingServices, setPendingServices] = useState<any[]>([]);
  const [successAlert, setSuccessAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState<"Success"|"Error">("Success");
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    subtitle: string;
    color: string;
    action: (() => void) | null;
  }>({
    visible: false,
    title: "",
    subtitle: "",
    color: "#2563EB",
    action: null,
  });

  // ── 2. ALL useEffect ──────────────────────────────────────────────────────

  // Fetch job on mount
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await getServiceRequestById(jobId);
        setJob(response);
        setStatus(response?.status);
      } catch (error) {
        console.error("Failed to fetch job", error);
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchJob();
  }, [jobId]);

  console.log(job);

  // Sync parts & services when job loads/updates
  useEffect(() => {
    setParts(job?.inspection?.usedParts || []);
    setServices(job?.inspection?.additionalServices || []);
  }, [job]);

  // Seed timestamps from statusHistory
  useEffect(() => {
    if (!job?.statusHistory) return;
    const timestamps: Record<string, string> = {};

    job.statusHistory.forEach((item: any) => {
      const stepKey = STATUS_TO_STEP[item.status];
      if (stepKey) timestamps[stepKey] = formatTimestamp(item.timestamp);

      if (item.status === "verification_requested") {
        timestamps["RESCHEDULE_REQUESTED"] = formatTimestamp(item.timestamp);
      }
    });

    const inProgressEntries = job.statusHistory.filter(
      (h: any) => h.status === "in_progress",
    );
    if (inProgressEntries.length >= 2) {
      timestamps["JOB_RESUMED"] = formatTimestamp(
        inProgressEntries[inProgressEntries.length - 1].timestamp,
      );
    }

    setStepTimestamps(timestamps);
  }, [job]);

  // ── 3. ALL useCallback ────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    if (!job?._id) return;
    try {
      setRefreshing(true);
      const updatedJob = await getServiceRequestById(job._id);
      setJob(updatedJob!);
      setStatus(updatedJob?.status);
    } catch (error) {
      console.error("Refresh failed", error);
    } finally {
      setRefreshing(false);
    }
  }, [job?._id]);

  const handleRequestVerification = useCallback(async () => {
    if (!job?._id) return;
    try {
      setLoading(true);
      await requestVerification(job._id);
      setVerificationRequested(true);
      setStepTimestamps((prev) => ({
        ...prev,
        VERIFICATION_REQUESTED: getCurrentTime(),
      }));
      Alert.alert("Success", "Verification requested successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to request verification");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [job?._id]);

  const handleCallCustomer = useCallback(async () => {
    if (!job?._id) return;
    if (stepTimestamps["CALL_CUSTOMER"]) return;
    try {
      setLoading(true);
      await confirmSchedule(job._id, token);
      updateStatus(job._id, JobStatus.CONFIRMED_SCHEDULED);
      setStatus(JobStatus.CONFIRMED_SCHEDULED);
      setStepTimestamps((prev) => ({
        ...prev,
        CALL_CUSTOMER: getCurrentTime(),
      }));
    } catch {
      Alert.alert("Error", "Failed to confirm schedule");
    } finally {
      setLoading(false);
    }
  }, [job?._id, token, stepTimestamps, updateStatus]);

  const handleMarkOnWay = useCallback(async () => {
    if (!job?._id) return;
    if (!stepTimestamps["CALL_CUSTOMER"]) {
      Alert.alert("Step Required", "Please call the customer first.");
      return;
    }
    if (stepTimestamps["EN_ROUTE"]) return;
    try {
      setLoading(true);
      await markOnWay(job._id, token);
      updateStatus(job._id, JobStatus.ON_WAY);
      setStatus(JobStatus.ON_WAY);
      setStepTimestamps((prev) => ({ ...prev, EN_ROUTE: getCurrentTime() }));
    } catch {
      Alert.alert("Error", "Failed to mark on way");
    } finally {
      setLoading(false);
    }
  }, [job?._id, token, stepTimestamps, updateStatus]);

  const handleMarkArrived = useCallback(async () => {
    if (!job?._id) return;
    if (!stepTimestamps["EN_ROUTE"]) {
      Alert.alert("Step Required", "Please mark En Route first.");
      return;
    }
    try {
      setLoading(true);
      await markArrived(job._id, token);
      updateStatus(job._id, JobStatus.ARRIVED);
      setStatus(JobStatus.ARRIVED);
      setStepTimestamps((prev) => ({ ...prev, ARRIVED: getCurrentTime() }));
    } catch {
      Alert.alert("Error", "Failed to mark arrived");
    } finally {
      setLoading(false);
    }
  }, [job?._id, token, stepTimestamps, updateStatus]);

  const handleMarkInProgress = useCallback(async () => {
    if (!job?._id) return;
    if (!stepTimestamps["ARRIVED"]) {
      Alert.alert("Step Required", "Please mark Arrived first.");
      return;
    }
    try {
      setLoading(true);
      await markInProgress(job._id, token);
      updateStatus(job._id, JobStatus.IN_PROGRESS);
      setStatus(JobStatus.IN_PROGRESS);
      setStepTimestamps((prev) => ({ ...prev, IN_PROGRESS: getCurrentTime() }));
    } catch {
      Alert.alert("Error", "Failed to mark in progress");
    } finally {
      setLoading(false);
    }
  }, [job?._id, token, stepTimestamps, updateStatus]);

  const handleRestartJob = useCallback(async () => {
    if (!job?._id) return;
    try {
      setLoading(true);
      await markInProgress(job._id, token);
      updateStatus(job._id, JobStatus.IN_PROGRESS);
      setStatus(JobStatus.IN_PROGRESS);
      setVerificationRequested(false); // ← NEW: allow re-requesting after rejection
      setStepTimestamps((prev) => ({
        ...prev,
        JOB_RESUMED: getCurrentTime(),
        IN_PROGRESS: getCurrentTime(),
      }));
    } catch {
      Alert.alert("Error", "Failed to restart job");
    } finally {
      setLoading(false);
    }
  }, [job?._id, token, updateStatus]);

  const handleCompleteJob = useCallback(() => {
    setPinModalVisible(true);
  }, []);

  const handleVerifyPin = useCallback(
    async (pin: string) => {
      if (!job?._id) return;
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
          setStatus(JobStatus.COMPLETED);
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
    [job?._id, updateStatus],
  );

  const handleRemoveService = useCallback(
    async (jobId: string, serviceId: string) => {
      try {
        setLoading(true);
        await removeAdditionalService(jobId, serviceId);
        setServices((prev) => prev.filter((s) => s._id !== serviceId));
        setPendingServices((prev) => prev.filter((s) => s._id !== serviceId));
      } catch (error) {
        console.error("Error removing service:", error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleRemovePart = useCallback(
    async (jobId: string, partId: string) => {
      try {
        setLoading(true);
        await removeUsedPart(jobId, partId);
        setParts((prev) => prev.filter((p) => p._id !== partId));
        setPendingParts((prev) => prev.filter((p) => p._id !== partId));
      } catch (error) {
        console.error("Error removing part:", error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ── Resend reschedule request ─────────────────────────────────────────────

  const handleResendReschedule = useCallback(async () => {
    if (!job?._id) return;
    const type = job.inspection?.completionType as
      | "parts_pending"
      | "workshop_required"
      | undefined;
    if (!type) return;
    try {
      setLoading(true);
      const inspection = job.inspection;
      const today = new Date().toISOString().split("T")[0];
      await handleRescheduleJob(job._id, type, {
        partName:
          type === "workshop_required"
            ? inspection?.itemDescription || "Workshop Item"
            : inspection?.requiredParts?.[0]?.partName || "Pending Part",
        repairRequired:
          inspection?.repairRequired || "Rescheduled by technician",
        estimatedCost: String(inspection?.estimatedCost ?? 0),
        expectedReturnDate: inspection?.expectedReturnDate || today,
        expectedReturnDateLabel: inspection?.expectedReturnDate || today,
      });
      Alert.alert("Success", "Reschedule request resent to customer.");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.message || "Failed to resend reschedule request.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [job]);

  // ── Resend verification request ───────────────────────────────────────────

  const handleResendVerification = useCallback(async () => {
    if (!job?._id) return;
    try {
      setLoading(true);
      await resendVerification(job._id);
      setAlertTitle("Success");
      setAlertMessage("Verification request resent to customer.");
      setSuccessAlert(true);
    } catch (err: any) {
      setAlertTitle("Error");
      setAlertMessage(err?.message || "Failed to resend verification request.");
      setSuccessAlert(true);
      // Alert.alert(
      //   "Error",
      //   err?.message || "Failed to resend verification request.",
      // );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [job?._id]);

  // ── 4. ALL useFocusEffect ─────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh]),
  );

  // ── 5. EARLY RETURN — after every single hook ─────────────────────────────

  if (loading || !job) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  // ── 6. Derived values (no hooks below this line) ──────────────────────────

  const TotalAmount = `₹ ${
    job.inspection ? job.inspection?.totals?.grandTotal : job.finalPrice
  }`;

  const allParts = [...parts, ...pendingParts];
  const allServices = [...services, ...pendingServices];
  const hasItems = allParts.length > 0 || allServices.length > 0;

  const rescheduleType = job.inspection?.completionType as
    | "parts_pending"
    | "workshop_required"
    | undefined;

  const isRescheduleVerification =
    rescheduleType === "parts_pending" ||
    rescheduleType === "workshop_required";

  const isRescheduledStatus =
    status === JobStatus.PARTS_PENDING ||
    status === JobStatus.WORKSHOP_REQUIRED;

  const hadRescheduleHistory = job.statusHistory?.some(
    (h: any) => h.status === "parts_pending" || h.status === "at_workshop",
  );

  const isRescheduleFlow =
    isRescheduleVerification || isRescheduledStatus || hadRescheduleHistory;

  const isVerificationRejected =
    status === JobStatus.USER_VERIFICATION_REJECTED;

  const hadVerificationRejection = job.statusHistory?.some(
    (h: any) => h.status === "user_verification_rejected",
  );

  // True while rejected OR after restart-from-rejection (job is back in progress)
  const isVerificationRejectionFlow =
    isVerificationRejected || hadVerificationRejection;

  const isWaitingForRescheduleApproval =
    status === JobStatus.VERIFICATION_REQUESTED && isRescheduleVerification;

  const rescheduleSubtitle =
    rescheduleType === "workshop_required"
      ? "Workshop required"
      : "Parts required";

  const rescheduleApprovedSubtitle =
    rescheduleType === "workshop_required"
      ? "Workshop approved by customer"
      : "Parts sourcing approved by customer";

  const actionCfg = ACTION_CONFIG[status!] ?? null;
  const isCompleted = status === JobStatus.COMPLETED;
  const statusText = getStatusText(status!);

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
  const slotText = formatSlot(job?.scheduledDate || job?.bookedAt);

  // ── Progress steps ────────────────────────────────────────────────────────

  // const getProgressSteps = (): ProgressStep[] => {
  //   const baseSteps: ProgressStep[] = [
  //     {
  //       key: "ASSIGNED",
  //       title: "Assigned",
  //       subtitle: "Job assigned",
  //       color: "#4CAF50",
  //       bgColor: "#0EA5E9",
  //     },
  //     {
  //       key: "CALL_CUSTOMER",
  //       title: "Customer Confirmed",
  //       subtitle: "Called & confirmed",
  //       color: "#2196F3",
  //       bgColor: "#2563EB",
  //     },
  //     {
  //       key: "EN_ROUTE",
  //       title: "En Route",
  //       subtitle: "Started driving",
  //       color: "#7C3AED",
  //       bgColor: "#7C3AED",
  //     },
  //     {
  //       key: "ARRIVED",
  //       title: "Arrived",
  //       subtitle: "Reached home",
  //       color: "#F59E0B",
  //       bgColor: "#D97706",
  //     },
  //     {
  //       key: "CLICK_PICTURES",
  //       title: "Click Pictures",
  //       subtitle: "Capture site photos",
  //       color: "#0EA5E9",
  //       bgColor: "#0EA5E9",
  //     },
  //     {
  //       key: "IN_PROGRESS",
  //       title: "In Progress",
  //       subtitle: "Work started",
  //       color: "#7C3AED",
  //       bgColor: "#BA0092",
  //     },
  //   ];

  //   const completionVerificationSteps: ProgressStep[] = hasItems
  //     ? [
  //         {
  //           key: "VERIFICATION_REQUESTED",
  //           title: "Verification Requested",
  //           subtitle: "Waiting for customer",
  //           color: "#F59E0B",
  //           bgColor: "#D97706",
  //         },
  //         {
  //           key: "VERIFICATION_APPROVED",
  //           title: "Verification Approved",
  //           subtitle: "Customer approved",
  //           color: "#059669",
  //           bgColor: "#059669",
  //         },
  //       ]
  //     : [];

  //   const completedStep: ProgressStep = {
  //     key: "COMPLETED",
  //     title: "Completed",
  //     subtitle: "Done!",
  //     color: "#059669",
  //     bgColor: "#059669",
  //   };

  //   if (isRescheduleFlow) {
  //     const rescheduleSteps: ProgressStep[] = [
  //       {
  //         key: "RESCHEDULE_REQUESTED",
  //         title: "Reschedule Requested",
  //         subtitle: rescheduleSubtitle,
  //         color: "#F59E0B",
  //         bgColor: "#D97706",
  //       },
  //       {
  //         key: "RESCHEDULE_APPROVED",
  //         title: "Customer Approved",
  //         subtitle: rescheduleApprovedSubtitle,
  //         color: "#7C3AED",
  //         bgColor: "#7C3AED",
  //       },
  //       {
  //         key: "JOB_RESUMED",
  //         title: "Job Resumed",
  //         subtitle: "Work restarted by technician",
  //         color: "#7C3AED",
  //         bgColor: "#BA0092",
  //       },
  //     ];
  //     return [
  //       ...baseSteps,
  //       ...rescheduleSteps,
  //       ...completionVerificationSteps,
  //       completedStep,
  //     ];
  //   }

  //   return [...baseSteps, ...completionVerificationSteps, completedStep];
  // };

  const getProgressSteps = (): ProgressStep[] => {
    const baseSteps: ProgressStep[] = [
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
        key: "CLICK_PICTURES",
        title: "Click Pictures",
        subtitle: "Capture site photos",
        color: "#0EA5E9",
        bgColor: "#0EA5E9",
      },
      {
        key: "IN_PROGRESS",
        title: "In Progress",
        subtitle: "Work started",
        color: "#7C3AED",
        bgColor: "#BA0092",
      },
    ];

    const completedStep: ProgressStep = {
      key: "COMPLETED",
      title: "Completed",
      subtitle: "Done!",
      color: "#059669",
      bgColor: "#059669",
    };

    // ── Reschedule flow ──────────────────────────────────────────────────────
    if (isRescheduleFlow) {
      const rescheduleSteps: ProgressStep[] = [
        {
          key: "RESCHEDULE_REQUESTED",
          title: "Reschedule Requested",
          subtitle: rescheduleSubtitle,
          color: "#F59E0B",
          bgColor: "#D97706",
        },
        {
          key: "RESCHEDULE_APPROVED",
          title: "Customer Approved",
          subtitle: rescheduleApprovedSubtitle,
          color: "#7C3AED",
          bgColor: "#7C3AED",
        },
        {
          key: "JOB_RESUMED",
          title: "Job Resumed",
          subtitle: "Work restarted by technician",
          color: "#7C3AED",
          bgColor: "#BA0092",
        },
      ];

      const verificationSteps: ProgressStep[] = hasItems
        ? isVerificationRejected
          ? [
              {
                key: "VERIFICATION_REQUESTED",
                title: "Verification Requested",
                subtitle: "Waiting for customer",
                color: "#F59E0B",
                bgColor: "#D97706",
              },
              {
                key: "VERIFICATION_REJECTED",
                title: "Verification Rejected",
                subtitle: "Customer rejected inspection",
                color: "#DC2626",
                bgColor: "#DC2626",
              },
            ]
          : [
              {
                key: "VERIFICATION_REQUESTED",
                title: "Verification Requested",
                subtitle: "Waiting for customer",
                color: "#F59E0B",
                bgColor: "#D97706",
              },
              {
                key: "VERIFICATION_APPROVED",
                title: "Verification Approved",
                subtitle: "Customer approved",
                color: "#059669",
                bgColor: "#059669",
              },
            ]
        : [];

      return [
        ...baseSteps,
        ...rescheduleSteps,
        ...verificationSteps,
        completedStep,
      ];
    }

    // ── Verification rejection flow ──────────────────────────────────────────
    if (isVerificationRejectionFlow && hasItems) {
      const rejectionSteps: ProgressStep[] = [
        {
          key: "VERIFICATION_REQUESTED",
          title: "Verification Requested",
          subtitle: "Waiting for customer",
          color: "#F59E0B",
          bgColor: "#D97706",
        },
        {
          key: "VERIFICATION_REJECTED",
          title: "Verification Rejected",
          subtitle: "Customer rejected inspection",
          color: "#DC2626",
          bgColor: "#DC2626",
        },
        {
          key: "JOB_RESUMED",
          title: "Job Resumed",
          subtitle: "Technician restarted work",
          color: "#7C3AED",
          bgColor: "#BA0092",
        },
      ];
      return [...baseSteps, ...rejectionSteps, completedStep];
    }

    // ── Normal flow ──────────────────────────────────────────────────────────
    const completionVerificationSteps: ProgressStep[] = hasItems
      ? [
          {
            key: "VERIFICATION_REQUESTED",
            title: "Verification Requested",
            subtitle: "Waiting for customer",
            color: "#F59E0B",
            bgColor: "#D97706",
          },
          {
            key: "VERIFICATION_APPROVED",
            title: "Verification Approved",
            subtitle: "Customer approved",
            color: "#059669",
            bgColor: "#059669",
          },
        ]
      : [];

    return [...baseSteps, ...completionVerificationSteps, completedStep];
  };

  const progressSteps = getProgressSteps();

  const STATUS_ORDER: string[] = [
    JobStatus.TECHNICIAN_ASSIGNED,
    JobStatus.CONFIRMED_SCHEDULED,
    JobStatus.ON_WAY,
    JobStatus.ARRIVED,
    "CLICK_PICTURES",
    JobStatus.IN_PROGRESS,
    ...(isRescheduleFlow
      ? [
          JobStatus.VERIFICATION_REQUESTED,
          JobStatus.PARTS_PENDING,
          JobStatus.WORKSHOP_REQUIRED,
          "JOB_RESUMED",
        ]
      : isVerificationRejectionFlow
        ? [
            JobStatus.VERIFICATION_REQUESTED,
            JobStatus.USER_VERIFICATION_REJECTED,
            "JOB_RESUMED", // set by handleRestartJob
          ]
        : [JobStatus.VERIFICATION_REQUESTED, JobStatus.USER_VERIFIED]),
    JobStatus.COMPLETED,
  ];

  const currentIdx = STATUS_ORDER.indexOf(status!);

  const isStepDone = (stepIdx: number, stepKey: string): boolean => {
    if (stepKey === "CLICK_PICTURES") {
      return (
        !!stepTimestamps["CLICK_PICTURES"] || !!stepTimestamps["IN_PROGRESS"]
      );
    }
    if (stepKey === "RESCHEDULE_REQUESTED") {
      return (
        !!stepTimestamps["RESCHEDULE_REQUESTED"] ||
        isRescheduledStatus ||
        !!stepTimestamps["RESCHEDULE_APPROVED"] ||
        !!stepTimestamps["JOB_RESUMED"] ||
        status === JobStatus.COMPLETED
      );
    }
    if (stepKey === "RESCHEDULE_APPROVED") {
      return (
        !!stepTimestamps["RESCHEDULE_APPROVED"] ||
        !!stepTimestamps["JOB_RESUMED"] ||
        status === JobStatus.COMPLETED
      );
    }
    if (stepKey === "VERIFICATION_REJECTED") {
      return (
        isVerificationRejected ||
        hadVerificationRejection ||
        status === JobStatus.COMPLETED
      );
    }

    // Update JOB_RESUMED to also cover rejection-restart:
    if (stepKey === "JOB_RESUMED") {
      return (
        !!stepTimestamps["JOB_RESUMED"] ||
        (hadVerificationRejection &&
          status !== JobStatus.USER_VERIFICATION_REJECTED) ||
        status === JobStatus.COMPLETED
      );
    }

    // if (stepKey === "JOB_RESUMED") {
    //   return !!stepTimestamps["JOB_RESUMED"] || status === JobStatus.COMPLETED;
    // }
    if (stepKey === "VERIFICATION_REQUESTED") {
      return (
        verificationRequested ||
        status === JobStatus.VERIFICATION_REQUESTED ||
        status === JobStatus.USER_VERIFIED ||
        status === JobStatus.COMPLETED
      );
    }
    if (stepKey === "VERIFICATION_APPROVED") {
      return (
        status === JobStatus.USER_VERIFIED || status === JobStatus.COMPLETED
      );
    }
    if (stepKey === "COMPLETED") {
      return status === JobStatus.COMPLETED;
    }
    return stepIdx <= currentIdx;
  };

  // ── Action handlers ───────────────────────────────────────────────────────

  const handleCall = () => {
    if (job.user?.phoneNumber) Linking.openURL(`tel:${job.user.phoneNumber}`);
  };

  const handleClickPictures = () => {
    if (!stepTimestamps["ARRIVED"]) {
      Alert.alert("Step Required", "Please mark Arrived first.");
      return;
    }
    if (stepTimestamps["CLICK_PICTURES"]) return;
    setStepTimestamps((prev) => ({
      ...prev,
      CLICK_PICTURES: getCurrentTime(),
    }));
  };

  const handlePrimaryAction = () => {
    if (!actionCfg) return;
    switch (actionCfg.handler) {
      case "callCustomer":
        return handleCallCustomer();
      case "markOnWay":
        return handleMarkOnWay();
      case "markArrived":
        return handleMarkArrived();
      case "inProgress":
        return handleMarkInProgress();
      case "complete":
        return handleCompleteJob();
      case "restartJob":
        return handleRestartJob();
      case "scheduledDone":
        return navigation.navigate("FollowUpJobScreen", { job });
    }
  };

  // ── Visibility flags ──────────────────────────────────────────────────────

  const hideAllActions = isWaitingForRescheduleApproval;

  const showRequestVerification =
    !isRescheduleFlow &&
    status === JobStatus.IN_PROGRESS &&
    !verificationRequested &&
    hasItems;

  const showMarkDone =
    !isRescheduleFlow &&
    (status === JobStatus.USER_VERIFIED ||
      (status === JobStatus.IN_PROGRESS && verificationRequested) ||
      (status === JobStatus.IN_PROGRESS && !hasItems));

  const showRequestVerificationAfterReschedule =
    isRescheduleFlow &&
    status === JobStatus.IN_PROGRESS &&
    !verificationRequested &&
    hasItems;

  const showMarkDoneAfterReschedule =
    isRescheduleFlow &&
    (status === JobStatus.USER_VERIFIED ||
      (status === JobStatus.IN_PROGRESS && verificationRequested) ||
      (status === JobStatus.IN_PROGRESS && !hasItems));

  const showClickPicturesButton =
    status === JobStatus.ARRIVED && !stepTimestamps["CLICK_PICTURES"];

  const effectiveShowRequestVerification =
    showRequestVerification || showRequestVerificationAfterReschedule;
  const effectiveShowMarkDone = showMarkDone || showMarkDoneAfterReschedule;

  // ── Resend button visibility ──────────────────────────────────────────────

  // Show when waiting for customer to approve a reschedule
  const showResendReschedule = isWaitingForRescheduleApproval;

  // Show when a verification request (for add parts/services) has been sent
  // and we're still waiting (not yet user_verified or completed)
  const showResendVerification =
    !isRescheduleFlow &&
    (status === JobStatus.VERIFICATION_REQUESTED ||
      (status === JobStatus.IN_PROGRESS && verificationRequested && hasItems));

  // ── Status pill colors ────────────────────────────────────────────────────

  const getStatusPillColors = () => {
    if (isCompleted) {
      return {
        backgroundColor: "#E8F5E9",
        dotColor: "#059669",
        textColor: "#059669",
      };
    }

    if (isWaitingForRescheduleApproval) {
      return {
        backgroundColor: "#FEF3C7",
        dotColor: "#D97706",
        textColor: "#D97706",
      };
    }

    if (isRescheduledStatus) {
      return {
        backgroundColor: "#EDE9FE",
        dotColor: "#7C3AED",
        textColor: "#7C3AED",
      };
    }

    switch (status) {
      case JobStatus.TECHNICIAN_ASSIGNED:
        return {
          backgroundColor: "#E0F2FE",
          dotColor: "#0EA5E9",
          textColor: "#0EA5E9",
        };

      case JobStatus.CONFIRMED_SCHEDULED:
        return {
          backgroundColor: "#DBEAFE",
          dotColor: "#2563EB",
          textColor: "#2563EB",
        };

      case JobStatus.ON_WAY:
        return {
          backgroundColor: "#EDE9FE",
          dotColor: "#7C3AED",
          textColor: "#7C3AED",
        };

      case JobStatus.ARRIVED:
        return {
          backgroundColor: "#FEF3C7",
          dotColor: "#D97706",
          textColor: "#D97706",
        };

      case JobStatus.IN_PROGRESS:
        return {
          backgroundColor: "#F3E8FF",
          dotColor: "#BA0092",
          textColor: "#BA0092",
        };

      case JobStatus.VERIFICATION_REQUESTED:
        return {
          backgroundColor: "#FEF3C7",
          dotColor: "#D97706",
          textColor: "#D97706",
        };

      case JobStatus.USER_VERIFIED:
        return {
          backgroundColor: "#DCFCE7",
          dotColor: "#059669",
          textColor: "#059669",
        };
    

      case JobStatus.USER_VERIFICATION_REJECTED:
        return {
          backgroundColor: "#FEF2F2",
          dotColor: "#DC2626",
          textColor: "#991B1B",
        };
        
      default:
        return {
          backgroundColor: "#F3F4F6",
          dotColor: "#6B7280",
          textColor: "#6B7280",
        };
    }
  };

  const statusColors = getStatusPillColors();

  // ── Confirm modal helpers ─────────────────────────────────────────────────

  const openConfirmation = () => {
    if (!actionCfg && !isRescheduledStatus) return;
    const handler = isRescheduledStatus ? "restartJob" : actionCfg?.handler;
    const MAP: Record<string, { title: string; subtitle: string }> = {
      callCustomer: {
        title: "Call & Confirm",
        subtitle: 'Change to "Customer Confirmed"?',
      },
      markOnWay: { title: "Start Driving", subtitle: 'Change to "En Route"?' },
      markArrived: { title: "I Reached", subtitle: 'Change to "Arrived"?' },
      inProgress: { title: "Start Work", subtitle: 'Change to "In Progress"?' },
      complete: { title: "Mark Done", subtitle: 'Change to "Completed"?' },
      restartJob: {
        title: "Start Job",
        subtitle: "Resume work? Parts/workshop are ready.",
      },
    };
    const info = MAP[handler ?? ""] ?? {
      title: "Confirm",
      subtitle: "Are you sure?",
    };
    setConfirmModal({
      visible: true,
      title: info.title,
      subtitle: info.subtitle,
      color: isRescheduledStatus
        ? "#7C3AED"
        : (actionCfg?.backgroundColor ?? "#2563EB"),
      action: handlePrimaryAction,
    });
  };

  const openVerificationConfirmation = () => {
    setConfirmModal({
      visible: true,
      title: "Request Verification",
      subtitle: "Send verification request before completing job?",
      color: "#F59E0B",
      action: handleRequestVerification,
    });
  };

  // ── Action button props ───────────────────────────────────────────────────

  const getActionButtonProps = () => {
    if (effectiveShowRequestVerification) {
      return {
        bgColor: "#F59E0B",
        icon: "shield-check",
        label: "Request Verification",
        onPress: openVerificationConfirmation,
      };
    }
    if (effectiveShowMarkDone) {
      return {
        bgColor: "#059669",
        icon: "check-circle",
        label: "Mark Done",
        onPress: openConfirmation,
      };
    }
    if (showClickPicturesButton) {
      return {
        bgColor: "#0EA5E9",
        icon: "camera",
        label: "Click Pictures",
        onPress: handleClickPictures,
      };
    }
    if (isRescheduledStatus) {
      return {
        bgColor: actionCfg?.backgroundColor ?? "#7C3AED",
        icon: actionCfg?.icon ?? "play-circle-outline",
        label: actionCfg?.label ?? "Start Job",
        onPress: openConfirmation,
      };
    }
    return {
      bgColor: actionCfg?.backgroundColor,
      icon: actionCfg?.icon,
      label: actionCfg?.label,
      onPress: openConfirmation,
    };
  };

  const actionBtnProps = !hideAllActions ? getActionButtonProps() : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <SuccessAlert
          visible={successAlert}
          title={alertTitle}
          message={alertMessage}
          onConfirm={() => setSuccessAlert(false)}
        />
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Icon
              name="chevron-left"
              size={moderateScale(22)}
              color={SECONDARY_COLOR}
            />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {job.service?.name || "Job Details"}
          </Text>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: statusColors.backgroundColor,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusColors.dotColor,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: statusColors.textColor,
                },
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
              <Text style={styles.amountText}>{TotalAmount}</Text>
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
              <Text style={styles.infoValue}>{TotalAmount}</Text>
            </View>
          </View>

          {/* WAITING FOR RESCHEDULE APPROVAL BANNER */}
          {isWaitingForRescheduleApproval && (
            <View style={styles.waitingBanner}>
              <View style={styles.waitingBannerIconWrap}>
                <Icon
                  name="clock-alert-outline"
                  size={moderateScale(22)}
                  color="#D97706"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.waitingBannerTitle}>
                  Awaiting Customer Approval
                </Text>
                <Text style={styles.waitingBannerSubtitle}>
                  {rescheduleType === "workshop_required"
                    ? "Waiting for customer to approve workshop requirement."
                    : "Waiting for customer to approve parts sourcing."}
                  {"\n"}The action button will appear once they confirm.
                </Text>
              </View>
            </View>
          )}

          {/* RESCHEDULE APPROVED BANNER */}
          {isRescheduledStatus && (
            <View style={[styles.waitingBanner, styles.approvedBanner]}>
              <View
                style={[
                  styles.waitingBannerIconWrap,
                  { backgroundColor: "#EDE9FE" },
                ]}
              >
                <Icon
                  name="check-decagram-outline"
                  size={moderateScale(22)}
                  color="#7C3AED"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.waitingBannerTitle, { color: "#5B21B6" }]}>
                  Customer Approved
                </Text>
                <Text style={styles.waitingBannerSubtitle}>
                  {rescheduleType === "workshop_required"
                    ? "Workshop job confirmed. Tap 'Start Job' when ready to resume."
                    : "Parts sourcing confirmed. Tap 'Start Job' when parts arrive."}
                </Text>
              </View>
            </View>
          )}
          {/* VERIFICATION REJECTED BANNER */}
{isVerificationRejected && (
  <View style={[styles.waitingBanner, styles.rejectedBanner]}>
    <View style={[styles.waitingBannerIconWrap, { backgroundColor: "#FEE2E2" }]}>
      <Icon
        name="close-circle-outline"
        size={moderateScale(22)}
        color="#DC2626"
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.waitingBannerTitle, { color: "#991B1B" }]}>
        Verification Rejected
      </Text>
      <Text style={styles.waitingBannerSubtitle}>
        Customer rejected the inspection. Tap &apos;Start Job&apos; to resume
        work, then re-submit or complete the job.
      </Text>
    </View>
  </View>
)}

          {/* QUICK ACTIONS */}
          {status === JobStatus.IN_PROGRESS && (
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
                <View style={styles.quickActionDivider} />
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() =>
                    navigation.navigate("AddServiceScreen", { job })
                  }
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
                <View style={styles.quickActionDivider} />
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() =>
                    navigation.navigate("RescheduleScreen", { job })
                  }
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

          {/* INVOICE ITEMS */}
          {(allParts.length > 0 || allServices.length > 0) && (
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
                Invoice Items
              </Text>
              {parts.map((part: any) => (
                <InvoiceItemCard
                  key={part._id}
                  title={part.productName}
                  quantity={part.quantity}
                  price={part.totalWithGst}
                  type="part"
                  status={job.inspection?.userVerified}
                  deleteDisabled={job.status !== JobStatus.IN_PROGRESS}
                  onDelete={() => handleRemovePart(job._id, part._id)}
                />
              ))}
              {services.map((item: any) => (
                <InvoiceItemCard
                  key={item._id}
                  title={item.serviceName}
                  quantity={item.quantity}
                  price={item.totalPrice}
                  type={item.isCustom ? "custom" : "additional"}
                  status={job.inspection?.userVerified}
                  deleteDisabled={job.status !== JobStatus.IN_PROGRESS}
                  onDelete={() => handleRemoveService(job._id, item._id)}
                />
              ))}
            </View>
          )}

          {/* PROGRESS CARD */}
          <View style={styles.card}>
            <Text
              style={[styles.sectionLabel, { marginBottom: verticalScale(16) }]}
            >
              Job Progress
            </Text>
            {progressSteps.map((step, idx) => {
              const done = isStepDone(idx, step.key);
              const timestamp = stepTimestamps[step.key];
              const isLast = idx === progressSteps.length - 1;
              const isRescheduleStep =
                step.key === "RESCHEDULE_REQUESTED" ||
                step.key === "RESCHEDULE_APPROVED" ||
                step.key === "JOB_RESUMED";

              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View
                      style={[
                        styles.stepIcon,
                        {
                          backgroundColor: done ? step.bgColor : "#F5F5F5",
                          borderWidth: isRescheduleStep && !done ? 1.5 : 0,
                          borderColor: isRescheduleStep
                            ? step.bgColor
                            : "transparent",
                          borderStyle: "dashed",
                        },
                      ]}
                    >
                      <Icon
                        name={
                          step.key === "RESCHEDULE_REQUESTED"
                            ? "clock-alert"
                            : step.key === "RESCHEDULE_APPROVED"
                              ? "check-decagram"
                              : step.key === "JOB_RESUMED"
                                ? "replay"
                                : "check"
                        }
                        size={moderateScale(14)}
                        color={
                          done
                            ? "#FFF"
                            : isRescheduleStep
                              ? step.bgColor
                              : "#ccc"
                        }
                      />
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.stepLine,
                          {
                            backgroundColor: done ? step.bgColor : "#E0E0E0",
                            borderStyle: isRescheduleStep ? "dashed" : "solid",
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.stepBody}>
                    <View style={styles.stepTitleRow}>
                      <Text
                        style={[
                          styles.stepTitle,
                          {
                            color: done
                              ? "#1a1a1a"
                              : isRescheduleStep
                                ? step.color + "99"
                                : "#aaa",
                          },
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

          {/* ACTION BUTTON AREA */}
          <View style={{ marginBottom: verticalScale(16) }}>
            {/* Primary action button */}
            {!isCompleted && !hideAllActions && actionBtnProps?.label && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: actionBtnProps.bgColor },
                  loading && { opacity: 0.7 },
                ]}
                onPress={actionBtnProps.onPress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon
                      name={actionBtnProps.icon as any}
                      size={moderateScale(18)}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>
                      {actionBtnProps.label}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Resend Reschedule Request */}
            {showResendReschedule && (
              <TouchableOpacity
                style={[styles.resendButton, loading && { opacity: 0.6 }]}
                onPress={handleResendReschedule}
                disabled={loading}
                activeOpacity={0.75}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#D97706" />
                ) : (
                  <>
                    <Icon
                      name="refresh"
                      size={moderateScale(15)}
                      color="#D97706"
                    />
                    <Text style={styles.resendButtonText}>
                      Resend Reschedule Request
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Resend Verification Request */}
            {showResendVerification && (
              <TouchableOpacity
                style={[styles.resendButton, loading && { opacity: 0.6 }]}
                onPress={handleResendVerification}
                disabled={loading}
                activeOpacity={0.75}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#D97706" />
                ) : (
                  <>
                    <Icon
                      name="refresh"
                      size={moderateScale(15)}
                      color="#D97706"
                    />
                    <Text style={styles.resendButtonText}>
                      Resend Verification Request
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom spacer so content clears the fixed bar */}
          <View style={{ height: verticalScale(100) }} />
        </ScrollView>

        {/* COLLECT PAYMENT (completed) */}
        {isCompleted && (
          <TouchableOpacity onPress={() => setPaymentModalVisible(true)}>
            <View style={styles.bottomBar}>
              <View
                style={[styles.actionButton, { backgroundColor: "#059669" }]}
              >
                <Icon
                  name="check-circle"
                  size={moderateScale(18)}
                  color="#fff"
                />
                <Text style={styles.actionButtonText}>Collect Payment</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* PIN MODAL */}
        <OtpModal
          visible={pinModalVisible}
          onClose={() => setPinModalVisible(false)}
          onSubmit={handleVerifyPin}
          title="Enter Completion PIN"
        />

        <CollectPaymentModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          totalAmount={TotalAmount}
          jobId={job._id}
          token={token}
          onPaymentCollected={() => {
            setPaymentModalVisible(false);
            updateStatus(job._id, JobStatus.COMPLETED);
          }}
          onDisputeRaised={() => {
            setPaymentModalVisible(false);
          }}
        />

        {/* CONFIRM MODAL */}
        <Modal transparent visible={confirmModal.visible} animationType="slide">
          <View
            style={{
              flex: 1,
              // backgroundColor: "rgba(0,0,0,0.3)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: scale(25),
                borderTopRightRadius: scale(25),
                paddingHorizontal: scale(30),
                paddingVertical: verticalScale(40),
              }}
            >
              <View
                style={{
                  alignSelf: "center",
                  backgroundColor: "#0596691F",
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#05966933",
                }}
              >
                <Icon name="check" size={24} color="#059669" />
              </View>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: moderateScale(18),
                  fontWeight: "700",
                  color: "#864C2D",
                }}
              >
                {confirmModal.title}
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: "#2F83B2",
                  marginTop: 6,
                  marginBottom: 20,
                }}
              >
                {confirmModal.subtitle}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: confirmModal.color,
                  padding: moderateScale(14),
                  borderRadius: scale(6),
                  alignItems: "center",
                  marginBottom: verticalScale(10),
                }}
                onPress={() => {
                  confirmModal.action?.();
                  setConfirmModal({ ...confirmModal, visible: false });
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Yes, Confirm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: confirmModal.color + "10",
                  padding: moderateScale(14),
                  borderRadius: scale(6),
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: confirmModal.color + "20",
                }}
                onPress={() =>
                  setConfirmModal({ ...confirmModal, visible: false })
                }
              >
                <Text style={{ color: confirmModal.color, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

const PRIMARY_COLOR = "#864C2D";
const SECONDARY_COLOR = "#936140";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5EB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    backgroundColor: "#F2DDC5",
    marginBottom: verticalScale(20),
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: scale(2) },
  backText: { fontSize: moderateScale(13), color: SECONDARY_COLOR },
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
  statusText: { fontSize: moderateScale(11), fontWeight: "600" },
  waitingBanner: {
    backgroundColor: "#FFFBEB",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: scale(14),
    marginBottom: verticalScale(10),
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(12),
  },
  approvedBanner: { backgroundColor: "#F5F3FF", borderColor: "#DDD6FE" },
  rejectedBanner: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  waitingBannerIconWrap: {
    backgroundColor: "#FEF3C7",
    padding: scale(8),
    borderRadius: scale(10),
    alignSelf: "flex-start",
  },
  waitingBannerTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#92400E",
    marginBottom: verticalScale(3),
  },
  waitingBannerSubtitle: {
    fontSize: moderateScale(11),
    color: "#78350F",
    lineHeight: moderateScale(16),
  },
  quickActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(30),
  },
  quickActionBtn: {
    flex: 1,
    alignItems: "center",
    gap: verticalScale(6),
    paddingVertical: verticalScale(4),
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(200),
  },
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
  },
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
  locationText: { fontSize: moderateScale(11), color: "#936140" },
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
  infoRow: {
    flexDirection: "row",
    gap: scale(10),
    marginBottom: verticalScale(0),
  },
  infoBox: { flex: 1, marginBottom: verticalScale(10) },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    marginBottom: verticalScale(4),
  },
  infoValue: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: scale(12) },
  stepLeft: { alignItems: "center" },
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
  stepTitle: { fontSize: moderateScale(13), fontWeight: "600" },
  stepTime: { fontSize: moderateScale(11), color: "#888" },
  stepSubtitle: { fontSize: moderateScale(11), marginTop: verticalScale(1) },
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
  // ── Resend button ──────────────────────────────────────────────────────────
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(6),
    marginTop: verticalScale(10),
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: scale(10),
    paddingVertical: verticalScale(11),
    backgroundColor: "#FFFBEB",
  },
  resendButtonText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#D97706",
  },
});

export default JobDetailsScreen;
