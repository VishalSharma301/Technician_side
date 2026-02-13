import React, { useCallback, useState } from "react";
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

type Props = {
  job: Job;
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

const JobCard: React.FC<Props> = ({
  job,
  onStart,
  onComplete,
  onStartInspection,
  onScheduledWorkCompleted,
  onAlert,
  navigate,
}) => {
  const navigation = useNavigation();
  const { updateStatus } = useJobs();
  const [showStatusModal, setShowStatusModal] = useState(false);
  // ============================================
  // SAFE DATA EXTRACTION
  // ============================================

  // Early return if job is invalid
  if (!job || !job._id) {
    return null;
  }

  const handleStatusChange = async (newStatus: any) => {
    try {
      setShowStatusModal(false);

      const response = await updateJobStatus(
        job._id,
        newStatus, // backend enum
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

  // Extract data safely with optional chaining
  const serviceName = job?.service?.name || "Service";
  const categoryName = job?.service?.category?.name || "Category";
  const userName = job?.user?.name || "Customer";
  const city = job?.address?.city || "Location";
  const state = job?.address?.state || "";
  const zipcode = job?.zipcode || "N/A";
  const price = job?.finalPrice || 0;
  const status = job?.status || JobStatus.TECHNICIAN_ASSIGNED;

  // ============================================
  // STATUS COLOR
  // ============================================

  const statusColour = getStatusColor(status);

  // ============================================
  // PROGRESS BAR WIDTH
  // ============================================

  const progressWidth =
    status === JobStatus.COMPLETED || status === JobStatus.CANCELLED
      ? "100%"
      : status === JobStatus.TECHNICIAN_ASSIGNED
        ? "15%"
        : status === JobStatus.IN_PROGRESS
          ? "70%"
          : "50%";

  // ============================================
  // START JOB HANDLER
  // ============================================

  // const handleStartJob = useCallback(async () => {
  //   try {
  //     const response = await updateJobStatus(
  //       job._id,
  //       "in_progress",
  //       undefined,
  //       "Job started"
  //     );
  //       console.log( "start response : ", response);

  //     if (response && response.success) {
  //       updateStatus(job._id, JobStatus.IN_PROGRESS);
  //       onStart(job._id);
  //       Alert.alert("Success", "Job started successfully");
  //     } else {
  //       Alert.alert("Error", "Failed to start job");
  //     }
  //   } catch (error) {
  //     console.error("Error starting job:", error);
  //     Alert.alert("Error", "Failed to start job");
  //   }
  // }, [job._id, updateStatus, onStart]);

  // ============================================
  // COMPLETE JOB HANDLER
  // ============================================

  const handleCompleteJob = useCallback(async () => {
    // This opens PIN modal in parent component
    onComplete(job._id);
  }, [job._id, onComplete]);

  const handleScheduledWorkCompleted = useCallback(async () => {
    // This opens PIN modal in parent component
    onScheduledWorkCompleted(job._id);
  }, [job._id, onScheduledWorkCompleted]);

  // ============================================
  // ALERT HANDLER
  // ============================================

  const handleAlert = useCallback(() => {
    onAlert(job._id);
  }, [job._id, onAlert]);

  // ============================================
  // NAVIGATION TO DETAILS
  // ============================================

  const handleNavigate = useCallback(() => {
    navigate(job);
  }, [job, navigate]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <Pressable onPress={handleNavigate} style={styles.pressable}>
      <View style={styles.card}>
        {/* Row 1: Customer name + Service type */}
        <View style={styles.rowBetween}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={styles.name} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.typeText} numberOfLines={1}>
              {serviceName}
            </Text>
          </View>
        </View>
<Text style={styles.address} numberOfLines={1}>
          id : {job._id}
        </Text>
        {/* Row 2: Address/Zipcode */}
        <Text style={styles.address} numberOfLines={1}>
          {city}
          {state && `, ${state}`} - {zipcode}
        </Text>

        {/* Row 3: Service Category Tag */}
        <View style={styles.tagRow}>
          <Icon name="tag-outline" size={moderateScale(16)} color="#666" />
          <Text style={styles.tagText} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>

        {/* Row 4: Status + Progress Bar */}
        <View style={styles.deadlineRow}>
          <View style={styles.statusRow}>
            <Text style={styles.deadlineTxt}>{status}</Text>

            <TouchableOpacity
              onPress={() => setShowStatusModal(true)}
              style={styles.statusActionBtn}
            >
              <Icon name="tune-vertical" size={18} color="#153B93" />
            </TouchableOpacity>
          </View>

          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: progressWidth,
                  backgroundColor: statusColour,
                },
              ]}
            />
          </View>
        </View>

        {/* Row 5: Action Buttons */}
        <View style={styles.actionRow}>
          {/* Show START button only if ASSIGNED */}
          {status === JobStatus.TECHNICIAN_ASSIGNED && (
            <TouchableOpacity
              onPress={() => onStart(job._id)}
              style={styles.startBtn}
            >
              <Icon
                name="play-circle-outline"
                size={moderateScale(16)}
                color="#fff"
              />
              <Text style={[styles.startTxt, { marginLeft: scale(6) }]}>
                Start Job
              </Text>
            </TouchableOpacity>
          )}




  {( status === JobStatus.PARTS_PENDING || status === JobStatus.WORKSHOP_REQUIRED) && (
            <TouchableOpacity
              onPress={handleScheduledWorkCompleted}
              style={styles.completeBtn}
            >
              <Icon
                name="check-circle-outline"
                size={moderateScale(16)}
                color="#153B93"
              />
              <Text style={[styles.completeTxt, { marginLeft: scale(6) }]}>
                Schecduled Work Completed
              </Text>
            </TouchableOpacity>
          )}


          {/* Show COMPLETE button only if IN PROGRESS */}


          {(status === JobStatus.IN_PROGRESS ) && (
            <TouchableOpacity
              onPress={handleCompleteJob}
              style={styles.completeBtn}
            >
              <Icon
                name="check-circle-outline"
                size={moderateScale(16)}
                color="#153B93"
              />
              <Text style={[styles.completeTxt, { marginLeft: scale(6) }]}>
                Mark Complete
              </Text>
            </TouchableOpacity>
          )}

          {status === JobStatus.ON_WAY && (
            <TouchableOpacity
              onPress={() => onStartInspection(job._id)}
              style={styles.completeBtn}
            >
              <Icon
                name="check-circle-outline"
                size={moderateScale(16)}
                color="#153B93"
              />
              <Text style={[styles.completeTxt, { marginLeft: scale(6) }]}>
                Start Inspection
              </Text>
            </TouchableOpacity>
          )}

          {/* Show COMPLETED label if completed */}
          {status === JobStatus.COMPLETED && (
            <View style={[styles.completeBtn, { backgroundColor: "#E8F5E9" }]}>
              <Icon
                name="check-circle"
                size={moderateScale(16)}
                color="#34C759"
              />
              <Text
                style={[
                  styles.completeTxt,
                  { color: "#34C759", marginLeft: scale(6) },
                ]}
              >
                Completed
              </Text>
            </View>
          )}

          {/* Alert Button - Always visible for in progress jobs */}
         
              <TouchableOpacity
                onPress={handleAlert}
                style={[styles.alertBtn, { borderColor: "#FF6B6B" }]}
              >
                <Icon
                  name="alert-circle-outline"
                  size={moderateScale(20)}
                  color="#FF6B6B"
                />
              </TouchableOpacity>
           
        </View>

        {/* Price Display */}
        <View style={[styles.rowBetween, { marginTop: verticalScale(8) }]}>
          <Text style={{ fontSize: moderateScale(12), color: "#666" }}>
            Price:
          </Text>
          <Text
            style={{
              fontSize: moderateScale(14),
              fontWeight: "600",
              color: "#165297",
            }}
          >
            ₹{price}
          </Text>
        </View>
      </View>
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

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  pressable: {
    marginBottom: verticalScale(14),
    marginHorizontal: scale(16),
  },
  card: {
    backgroundColor: "#FCF3E233",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#ffffff",
    padding: scale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 3,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#1A1A1A",
  },
  typeText: {
    fontSize: moderateScale(14),
    fontWeight: "500",
    color: "#666",
    marginTop: verticalScale(4),
  },
  address: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(12),
    fontWeight: "400",
    color: "#999",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(8),
  },
  tagText: {
    marginLeft: scale(6),
    fontSize: moderateScale(12),
    fontWeight: "400",
    color: "#666",
  },
  deadlineRow: {
    marginTop: verticalScale(10),
  },
  deadlineTxt: {
    fontWeight: "600",
    marginBottom: verticalScale(6),
    fontSize: moderateScale(12),
    color: "#333",
  },
  barBg: {
    width: "100%",
    height: verticalScale(8),
    backgroundColor: "#F5F5F5",
    borderRadius: scale(4),
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: scale(4),
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(12),
    gap: scale(8),
  },
  startBtn: {
    backgroundColor: "#153B93",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(8),
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  startTxt: {
    color: "#fff",
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  completeBtn: {
    borderWidth: 1,
    borderColor: "#153B93",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(8),
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  completeTxt: {
    color: "#153B93",
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  alertBtn: {
    borderWidth: 2,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    borderRadius: scale(8),
    justifyContent: "center",
    alignItems: "center",
  },
  alertTxt: {
    fontWeight: "bold",
    fontSize: moderateScale(18),
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(6),
  },

  statusActionBtn: {
    padding: scale(6),
    borderRadius: scale(8),
    backgroundColor: "#EAF0FF",
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
