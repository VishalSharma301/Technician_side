// src/app/screens/AuthenticatedScreens/JobsScreen.tsx - UPDATED VERSION
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useJobs } from "../../../store/JobContext";
import { Job, JobStatus, getStatusText } from "../../../constants/jobTypes";
import JobCard from "../../components/JobCard";
import { scale, verticalScale, moderateScale } from "../../../util/scaling";
import ScreenHeader from "../../components/ScreenHeader";
import {
  updateJobStatus,
  verifyCompletionPin,
} from "../../../util/servicesApi";
import OtpModal from "../../components/OtpModal";
import { Alert } from "react-native";

const JobsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { jobs, loading, stats, fetchJobs, updateStatus } = useJobs();

  // ============================================
  // STATE
  // ============================================

  const [statusFilter, setStatusFilter] = useState<JobStatus | null>(
    (route.params?.filterStatus as JobStatus) || null
  );
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================
  // STATUS CHIPS
  // ============================================

  const statusChips = [
    { label: "All", status: null },
    { label: "Assigned", status: JobStatus.TECHNICIAN_ASSIGNED },
    { label: "In Progress", status: JobStatus.IN_PROGRESS },
    { label: "Completed", status: JobStatus.COMPLETED },
    { label: "Cancelled", status: JobStatus.CANCELLED },
  ];

  // ============================================
  // FETCH JOBS WITH FILTER
  // ============================================

  useEffect(() => {
    const filters: any = {};

    if (statusFilter) {
      filters.status = statusFilter;
    }

    if (route.params?.filterToday) {
      filters.today = true;
    }

    fetchJobs(filters);
  }, [statusFilter, route.params?.filterToday]);

  // ============================================
  // FILTER JOBS BY STATUS
  // ============================================

  const filteredJobs = statusFilter
    ? jobs.filter((job) => job.status === statusFilter)
    : jobs;

  // ============================================
  // START JOB HANDLER
  // ============================================

  const handleStartJob = useCallback(
    async (jobId: string) => {
      try {
        const response = await updateJobStatus(
          jobId,
          "in_progress",
          "Job started"
        );

        if (response && response.success) {
          updateStatus(jobId, JobStatus.IN_PROGRESS);
          Alert.alert("Success", "Job started successfully");
        } else {
          Alert.alert("Error", "Failed to start job");
        }
      } catch (error) {
        console.error("Error starting job:", error);
        Alert.alert("Error", "Failed to start job");
      }
    },
    [updateStatus]
  );

  // ============================================
  // COMPLETE JOB HANDLER
  // ============================================

  const handleCompleteJob = useCallback((jobId: string) => {
    setSelectedJobId(jobId);
    setPinModalVisible(true);
  }, []);

  // ============================================
  // VERIFY PIN HANDLER
  // ============================================

  const handleVerifyPin = useCallback(
    async (pin: string) => {
      if (!selectedJobId) return;

      try {
        setIsLoading(true);
        const response = await verifyCompletionPin(selectedJobId, pin);

        if (response && response.success) {
          updateStatus(selectedJobId, JobStatus.COMPLETED);
          setPinModalVisible(false);
          setSelectedJobId(null);
          Alert.alert("Success", "Job completed and PIN verified!");
        } else {
          Alert.alert("Error", response?.message || "Invalid PIN");
        }
      } catch (error) {
        console.error("Error verifying PIN:", error);
        Alert.alert("Error", "Failed to verify PIN");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedJobId, updateStatus]
  );

  // ============================================
  // ALERT HANDLER
  // ============================================

  const handleAlert = useCallback((jobId: string) => {
    Alert.alert(
      "Report Issue",
      "Do you want to report an issue with this job?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          onPress: () => {
            Alert.prompt(
              "Issue Description",
              "Briefly describe the issue:",
              (text) => {
                if (text) {
                  Alert.alert("Thank you", "Issue reported successfully");
                }
              }
            );
          },
        },
      ]
    );
  }, []);

  // ============================================
  // NAVIGATE TO JOB DETAILS
  // ============================================

  const handleNavigateToDetails = useCallback(
    (job: Job) => {
      navigation.navigate("JobDetailsScreen", { job });
    },
    [navigation]
  );

  // ============================================
  // RENDER JOB CARD
  // ============================================

  const renderJobCard = useCallback(
    ({ item }: { item: Job }) => (
      <JobCard
        job={item}
        onStart={handleStartJob}
        onComplete={handleCompleteJob}
        onAlert={handleAlert}
        navigate={handleNavigateToDetails}
      />
    ),
    [handleStartJob, handleCompleteJob, handleAlert, handleNavigateToDetails]
  );

  // ============================================
  // RENDER EMPTY STATE
  // ============================================

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Icon name="inbox-outline" size={scale(60)} color="#CCC" />
        <Text style={styles.emptyText}>No jobs found</Text>
        <Text style={styles.emptySubtext}>
          {statusFilter
            ? `No ${getStatusText(statusFilter).toLowerCase()} jobs`
            : "Check back later for new jobs"}
        </Text>
      </View>
    ),
    [statusFilter]
  );

  // ============================================
  // RENDER HEADER
  // ============================================

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{stats.totalJobs}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{stats.assigned}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsContainer}>
          {statusChips.map((chip) => (
            <Pressable
              key={chip.status || "all"}
              style={[
                styles.chip,
                (chip.status === statusFilter ||
                  (!chip.status && !statusFilter)) &&
                  styles.chipActive,
              ]}
              onPress={() => setStatusFilter(chip.status)}
            >
              <Text
                style={[
                  styles.chipText,
                  (chip.status === statusFilter ||
                    (!chip.status && !statusFilter)) &&
                    styles.chipTextActive,
                ]}
              >
                {chip.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    ),
    [stats, statusFilter]
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaView style={styles.container} >
      <ScreenHeader name="Jobs" backButton={true} />

      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={styles.listContent}
        scrollEnabled={filteredJobs.length > 0 || loading}
        showsVerticalScrollIndicator={false}
      />

      {/* LOADING INDICATOR */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#165297" />
        </View>
      )}

      {/* PIN MODAL */}
      <OtpModal
        visible={pinModalVisible}
        onClose={() => {
          setPinModalVisible(false);
          setSelectedJobId(null);
        }}
        onSubmit={handleVerifyPin}
        title="Enter Completion PIN"
        // description="Ask customer for the completion PIN to verify job completion"
        // loading={isLoading}
      />
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  listContent: {
    paddingBottom: verticalScale(20),
  },
  headerContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(16),
  },
  statBadge: {
    alignItems: "center",
    paddingHorizontal: scale(8),
  },
  statNumber: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: "#165297",
  },
  statLabel: {
    fontSize: moderateScale(10),
    color: "#666",
    marginTop: verticalScale(2),
    textAlign: "center",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  chip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    backgroundColor: "#E8E8E8",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  chipActive: {
    backgroundColor: "#165297",
    borderColor: "#165297",
  },
  chipText: {
    fontSize: moderateScale(12),
    color: "#666",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(80),
  },
  emptyText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#666",
    marginTop: verticalScale(16),
  },
  emptySubtext: {
    fontSize: moderateScale(13),
    color: "#999",
    marginTop: verticalScale(8),
    textAlign: "center",
    paddingHorizontal: scale(24),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});

export default JobsScreen;
