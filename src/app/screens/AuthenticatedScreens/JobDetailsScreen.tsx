// src/app/screens/AuthenticatedScreens/JobDetailsScreen.tsx - UPDATED VERSION
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
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "../../../util/scaling";
import ScreenHeader from "../../components/ScreenHeader";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  Job,
  JobStatus,
  getStatusText,
  getStatusColor,
  formatScheduledDateTime,
} from "../../../constants/jobTypes";
import {
  updateJobStatus,
  verifyCompletionPin,
} from "../../../util/servicesApi";
import { useJobs } from "../../../store/JobContext";
import OtpModal from "../../components/OtpModal";
import IconBox from "../../components/IconBox";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const JobDetailsScreen = () => {
  const route = useRoute<any>();
  const job: Job = route.params?.job;
  const { updateStatus } = useJobs();
const navigation = useNavigation<any>()
  // ============================================
  // STATE
  // ============================================

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "1", text: "Verify customer availability", completed: false },
    { id: "2", text: "Check service requirements", completed: false },
    { id: "3", text: "Complete service", completed: false },
    { id: "4", text: "Collect customer feedback", completed: false },
    { id: "5", text: "Get completion PIN", completed: false },
  ]);

  // ============================================
  // TOGGLE CHECKLIST ITEM
  // ============================================

  const toggleChecklistItem = useCallback((id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  // ============================================
  // START JOB
  // ============================================

  const handleStartJob = useCallback(async () => {
    try {
      setLoading(true);
      navigation.navigate('JobFlowScreen', {job})
      // const response = await updateJobStatus(
      //   job._id,
      //   "in_progress",
      //   "Job started from details screen"
      // );

      // if (response && response.success) {
      //   updateStatus(job._id, JobStatus.IN_PROGRESS);
      //   Alert.alert("Success", "Job started successfully");
      // } else {
      //   Alert.alert("Error", "Failed to start job");
      // }
    } catch (error) {
      console.error("Error starting job:", error);
      Alert.alert("Error", "Failed to start job");
    } finally {
      setLoading(false);
    }
  }, [job._id, updateStatus]);

  // ============================================
  // COMPLETE JOB (REQUEST PIN)
  // ============================================

  const handleCompleteJob = useCallback(() => {
    setPinModalVisible(true);
  }, []);

  // ============================================
  // VERIFY PIN
  // ============================================

  const handleVerifyPin = useCallback(
    async (pin: string) => {
      try {
        setLoading(true);
        const response = await verifyCompletionPin(job._id, pin);

        if (response && response.success) {
          updateStatus(job._id, JobStatus.COMPLETED);
          setPinModalVisible(false);
          Alert.alert("Success", "Job completed and PIN verified!");
        } else {
          Alert.alert(
            "Error",
            response?.message || "Invalid PIN. Please try again."
          );
        }
      } catch (error) {
        console.error("Error verifying PIN:", error);
        Alert.alert("Error", "Failed to verify PIN");
      } finally {
        setLoading(false);
      }
    },
    [job._id, updateStatus]
  );

  if (!job) {
    return (
      <View style={styles.container}>
        <ScreenHeader name="Job Details" />
        <View style={styles.loadingContainer}>
          <Text>Job not found</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(job.status);

  return (
    <View style={styles.container}>
      <ScreenHeader name="Job Details" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* STATUS CARD */}
        {/* <View style={styles.card}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>
              {getStatusText(job.status)}
            </Text>
          </View>
          <Text style={styles.cardTitle}>Service Status</Text>
          <Text style={styles.statusText}>{job.status}</Text>
          {job.paymentStatus && (
            <>
              <Text
                style={[styles.cardTitle, { marginTop: verticalScale(12) }]}
              >
                Payment Status
              </Text>
              <Text style={styles.statusText}>{job.paymentStatus}</Text>
            </>
          )}
        </View> */}

        {/* CUSTOMER INFO CARD */}
        {/* <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Information</Text>
          <View style={styles.locationContent}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>Name</Text>
              <Text style={styles.locationValue}>{job.user.name}</Text>

              <Text
                style={[styles.locationName, { marginTop: verticalScale(12) }]}
              >
                Phone
              </Text>
              <Text style={styles.locationValue}>{job.user.phoneNumber}</Text>

              <Text
                style={[styles.locationName, { marginTop: verticalScale(12) }]}
              >
                Email
              </Text>
              <Text style={styles.locationValue}>{job.user.email}</Text>
            </View>
          </View>
        </View> */}
        <View
          style={[{ flexDirection: "row", marginBottom: verticalScale(20) }]}
        >
          <View style={{ width: scale(60), aspectRatio: 1, borderWidth: 0 }}>
            <Image
              source={require("../../../../assets/userIcon.png")}
              style={{ height: "100%", width: "100%", resizeMode: "contain" }}
            />
          </View>
          <View style={{ borderWidth: 0, marginLeft: scale(12), flex: 1 }}>
            <Text style={{ fontWeight: "600", fontSize: moderateScale(24) }}>
              {job.user.name}
            </Text>
            <Text
              style={[styles.locationValue, { marginTop: verticalScale(4) }]}
            >
              {job.address?.street || "street"}, {job.address?.city || "city"},{" "}
              {job.address?.state || "state"} -{" "}
              {job.address?.zipcode || "zipcode"}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: verticalScale(4),
                gap: scale(5),
              }}
            >
              <IconBox
                name="email-outline"
                boxSize={moderateScale(24)}
                iconSize={moderateScale(16)}
              />
              <Text style={{ fontSize: moderateScale(14), fontWeight: "400" }}>
                {job.user.email}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: verticalScale(4),
                gap: scale(5),
              }}
            >
              <IconBox
                name="phone-outline"
                boxSize={moderateScale(24)}
                iconSize={moderateScale(16)}
              />
              <Text style={{ fontSize: moderateScale(14), fontWeight: "400" }}>
                {job.user.phoneNumber}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: verticalScale(4),
                gap: scale(5),
              }}
            >
              <IconBox
                name="phone-outline"
                boxSize={moderateScale(24)}
                iconSize={moderateScale(16)}
              />
              <Text style={{ fontSize: moderateScale(14), fontWeight: "400" }}>
                {job._id}
              </Text>
            </View>
          </View>
        </View>

        {/* ADDRESS? CARD */}
        {/* <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Location</Text>
          <Text style={styles.locationValue}>
            {job.address?.street || "street"}
          </Text>
          <Text style={[styles.locationValue, { marginTop: verticalScale(4) }]}>
            {job.address?.city || "city"}, {job.address?.state || "state"} -{" "}
            {job.address?.zipcode || "zipcode"}
          </Text>
          {job.address?.coordinates && (
            <Text
              style={[
                styles.locationValue,
                {
                  marginTop: verticalScale(8),
                  fontSize: moderateScale(11),
                  color: "#999",
                },
              ]}
            >
              Coordinates: {job.address?.coordinates.lat || "lat"},{" "}
              {job.address?.coordinates.lon || "lon"}
            </Text>
          )}
        </View> */}

        {/* SERVICE DETAILS CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service:</Text>
            <Text style={styles.detailValue}>{job.service.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{job.service.category.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Base Price:</Text>
            <Text style={styles.detailValue}>₹{job.service.basePrice}</Text>
          </View>

          {job.selectedOption && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Option:</Text>
              <Text style={styles.detailValue}>
                {job.selectedOption.name} (₹{job.selectedOption.price})
              </Text>
            </View>
          )}

          {job.selectedBrand && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brand:</Text>
              <Text style={styles.detailValue}>{job.selectedBrand.name}</Text>
            </View>
          )}

          {job.quantity > 1 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>{job.quantity}</Text>
            </View>
          )}

          <View
            style={[
              styles.detailRow,
              {
                marginTop: verticalScale(12),
                borderTopWidth: 1,
                borderTopColor: "#EEE",
                paddingTop: verticalScale(12),
              },
            ]}
          >
            <Text style={[styles.detailLabel, { fontWeight: "bold" }]}>
              Final Price:
            </Text>
            <Text
              style={[
                styles.detailValue,
                {
                  fontWeight: "bold",
                  color: "#165297",
                  fontSize: moderateScale(16),
                },
              ]}
            >
              ₹{job.finalPrice}
            </Text>
          </View>
           <Text style={[styles.detailLabel, { fontWeight: "bold" }]}>Scheduled Date & Time</Text>
          <Text style={styles.detailValue}>{formatScheduledDateTime(job)}</Text>
        </View>

        {/* SCHEDULE CARD */}
        {/* <View style={styles.card}>
          <Text style={styles.cardTitle}>Scheduled Date & Time</Text>
          <Text style={styles.detailValue}>{formatScheduledDateTime(job)}</Text>
        </View> */}

        {/* NOTES CARD */}
        {/* {job.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.detailValue}>{job.notes}</Text>
          </View>
        )} */}

        {/* SPECIAL INSTRUCTIONS CARD */}
        {/* {job.specialInstructions && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Special Instructions</Text>
            <Text style={styles.detailValue}>{job.specialInstructions}</Text>
          </View>
        )} */}

        {/* CHECKLIST CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Repair Steps</Text>
          {checklist.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleChecklistItem(item.id)}
              style={styles.checklistItem}
            >
              <View
                style={[
                  styles.checkbox,
                  item.completed && styles.checkboxChecked,
                ]}
              >
                {item.completed && (
                  <Icon name="check" size={moderateScale(14)} color="#fff" />
                )}
              </View>
              <Text
                style={[
                  styles.checklistText,
                  item.completed && styles.checklistTextCompleted,
                ]}
              >
                {item.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionCard}>
          {
          // job.status === JobStatus.TECHNICIAN_ASSIGNED 
          true && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleStartJob}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon
                    name="play-circle-fill"
                    size={moderateScale(20)}
                    color="#fff"
                  />
                  <Text style={styles.actionButtonText}>Start Job</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {job.status === JobStatus.IN_PROGRESS && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#34C759" }]}
              onPress={handleCompleteJob}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon
                    name="check-circle"
                    size={moderateScale(20)}
                    color="#fff"
                  />
                  <Text style={styles.actionButtonText}>Mark Complete</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {job.status === JobStatus.COMPLETED && !job.pinVerified && (
            <View style={[styles.actionButton, { backgroundColor: "#FF9500" }]}>
              <Icon
                name="pending-actions"
                size={moderateScale(20)}
                color="#fff"
              />
              <Text style={styles.actionButtonText}>
                Pending PIN Verification
              </Text>
            </View>
          )}

          {job.status === JobStatus.COMPLETED && job.pinVerified && (
            <View style={[styles.actionButton, { backgroundColor: "#34C759" }]}>
              <Icon name="verified" size={moderateScale(20)} color="#fff" />
              <Text style={styles.actionButtonText}>Completed & Verified</Text>
            </View>
          )}
        </View>

        <View style={{ height: verticalScale(40) }} />
      </ScrollView>

      {/* PIN MODAL */}
      {job.status === JobStatus.IN_PROGRESS && (
        <OtpModal
          visible={pinModalVisible}
          onClose={() => setPinModalVisible(false)}
          onSubmit={handleVerifyPin}
          title="Enter Completion PIN"
          // description="Ask customer for the completion PIN"
          // loading={loading}
        />
      )}
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#F5F7FA",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FCF3E233",
    borderRadius: moderateScale(12),
    padding: scale(16),
    marginBottom: verticalScale(12),
    shadowColor: "#DBC6AD1F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
    borderWidth : 1,
    borderColor : '#ffffff'
  },
  cardTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    color: "#000",
    marginBottom: verticalScale(8),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    marginBottom: verticalScale(12),
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  statusText: {
    fontSize: moderateScale(14),
    color: "#1A1A1A",
    fontWeight: "500",
  },
  locationContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  locationValue: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    color: "#1A1A1A",
    marginTop: verticalScale(4),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#666",
  },
  detailValue: {
    fontSize: moderateScale(13),
    fontWeight: "500",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "right",
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  checkbox: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderWidth: 1,
    borderColor: "#576F9B59",
    borderRadius: moderateScale(4),
    marginRight: scale(12),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor : '#7494CE1A'
  },
  checkboxChecked: {
    backgroundColor: "#165297",
    borderColor: "#165297",
  },
  checklistText: {
    fontSize: moderateScale(14),
    fontWeight : '400',
    color: "#000",
    flex: 1,
  },
  checklistTextCompleted: {
    textDecorationLine: "none",
    color: "#999",
  },
  actionCard: {
    marginBottom: verticalScale(24),
  },
  actionButton: {
    backgroundColor: "#165297",
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(16),
    borderRadius: moderateScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(10),
  },
  actionButtonText: {
    color: "#fff",
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginLeft: scale(10),
  },
});

export default JobDetailsScreen;
