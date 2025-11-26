import React, { useCallback, memo, useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Image,
  FlatList,
  ListRenderItem,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { scale, verticalScale, moderateScale } from "../../../util/scaling";
import ScreenHeader from "../../components/ScreenHeader";
import JobCard from "../../components/JobCard";
import { useJobs } from "../../../store/JobContext";
import usePolling from "../../../customHooks/usePollingHook";
import { Job, JobStatus } from "../../../constants/jobTypes";
import {
  updateJobStatus,
  verifyCompletionPin,
} from "../../../util/servicesApi";
import { ProfileContext } from "../../../store/ProfileContext";
import OtpModal from "../../components/OtpModal";
import { AuthContext } from "../../../store/AuthContext";
import HomeBox from "../../components/HomeBox";

const HomeScreenx = () => {
  const navigation = useNavigation<any>();

  const { firstName, lastName, picture } = useContext(ProfileContext);
  const { token } = useContext(AuthContext);

  // Job Context
  const { jobs, loading, stats, refreshing, updateStatus, refreshJobs } =
    useJobs();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  console.log("token is :", token);

  // The hook automatically:
  // - Polls every 30 seconds
  // - Fetches jobs from API
  // - Adds to JobContext
  // - Pauses/resumes based on app state
  usePolling();

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
  // COMPLETE JOB HANDLER (REQUEST PIN)
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
        setPinLoading(true);
        // const response = await verifyCompletionPin(selectedJobId, pin);
        const response = await updateJobStatus(
          selectedJobId,
          "completed",
          pin,
          "Job completed"
        );

        console.log("PIN Verification Response:", response);

        if (response && response.success) {
          updateStatus(selectedJobId, JobStatus.COMPLETED);
          setPinModalVisible(false);
          setSelectedJobId(null);
          Alert.alert("Success", "Job completed and PIN verified!");

          // Refresh jobs to get updated stats
          await refreshJobs();
        } else {
          Alert.alert("Error", response?.message || "Invalid PIN");
        }
      } catch (error) {
        console.error("Error verifying PIN:", error);
        Alert.alert("Error", "Failed to verify PIN");
      } finally {
        setPinLoading(false);
      }
    },
    [selectedJobId, updateStatus, refreshJobs]
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
            console.log("Reporting issue for job:", jobId);
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
      console.log("Job : ", job);

      // navigation.navigate("JobDetailsScreen", { job });
    },
    [navigation]
  );

  // ============================================
  // NAVIGATE TO JOBS SCREEN WITH FILTER
  // ============================================

  const handleStatCardPress = useCallback(
    (status: string) => {
      navigation.navigate("JobsScreen", { filterStatus: status });
    },
    [navigation]
  );

  // ============================================
  // RENDER JOB CARD
  // ============================================

  const renderJobCard: ListRenderItem<Job> = useCallback(
    ({ item }) => (
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
        <Icon name="calendar-check" size={scale(60)} color="#ccc" />
        <Text style={styles.emptyText}>No jobs scheduled for today</Text>
        <Text style={styles.emptySubText}>
          Check back later or view all jobs
        </Text>
      </View>
    ),
    []
  );

  // ============================================
  // RENDER HEADER
  // ============================================

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* Profile Section */}
        {/* <LinearGradient
          colors={["#165297", "#2472CC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileContent}>
            <View style={styles.profileInfo}>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.technicianName}>
                {firstName && lastName
                  ? `${firstName} ${lastName}`
                  : firstName || "Technician"}
              </Text>
              <Text style={styles.role}>Service Technician</Text>
            </View>
            <Image
              source={
                picture
                  ? { uri: picture }
                  : require("../../../../assets/default-avatar.png")
              }
              style={styles.avatar}
            />
          </View>
        </LinearGradient> */}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
           <HomeBox
    onPress={() => handleStatCardPress("technician_assigned")}
    title="Pending"
    count={stats.assigned}
  />

  <HomeBox
    onPress={() => handleStatCardPress("in_progress")}
    title="Ongoing"
    count={stats.inProgress}
  />

  <HomeBox
    onPress={() => handleStatCardPress("completed")}
    title="Completed"
    count={stats.completed}
  />

  <HomeBox
    onPress={() => navigation.navigate("JobsScreen", { filterToday: true })}
    title="Today"
    count={stats.todayJobs}
  />

          {/* <Pressable style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#E3F2FD" }]}
            >
              <Icon name="clock-outline" size={scale(24)} color="#165297" />
            </View>
            <Text style={styles.statNumber}>{stats.assigned}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() => handleStatCardPress("in_progress")}
          >
            <View
              style={[styles.statIconContainer, { backgroundColor: "#FFF3E0" }]}
            >
              <Icon name="progress-wrench" size={scale(24)} color="#FF9500" />
            </View>
            <Text style={styles.statNumber}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>Ongoing</Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() => handleStatCardPress("completed")}
          >
            <View
              style={[styles.statIconContainer, { backgroundColor: "#E8F5E9" }]}
            >
              <Icon
                name="check-circle-outline"
                size={scale(24)}
                color="#34C759"
              />
            </View>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() =>
              navigation.navigate("JobsScreen", { filterToday: true })
            }
          >
            <View
              style={[styles.statIconContainer, { backgroundColor: "#F3E5F5" }]}
            >
              <Icon name="calendar-today" size={scale(24)} color="#9C27B0" />
            </View>
            <Text style={styles.statNumber}>{stats.todayJobs}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </Pressable> */}
        </View>

        {/* Today's Jobs Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Pressable onPress={() => navigation.navigate("JobsScreen")}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>
      </View>
    ),
    [stats, handleStatCardPress, navigation, firstName, lastName, picture]
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: scale(20) }}>
        <ScreenHeader name="Home" backButton={false} />
      </View>

      <HomeBox />

      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshJobs}
            colors={["#165297"]}
            tintColor="#165297"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* PIN VERIFICATION MODAL */}
      <OtpModal
        visible={pinModalVisible}
        onClose={() => {
          setPinModalVisible(false);
          setSelectedJobId(null);
        }}
        onSubmit={handleVerifyPin}
        title="Enter Completion PIN"
        // description="Ask customer for the completion PIN to verify job completion"
        // loading={pinLoading}
      />
    </View>
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
    paddingHorizontal: scale(9),
    borderWidth : 1
  },
  profileCard: {
    borderRadius: moderateScale(16),
    padding: scale(20),
    marginBottom: verticalScale(16),
  },
  profileContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: moderateScale(14),
    color: "#FFFFFF",
    opacity: 0.9,
  },
  technicianName: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: verticalScale(4),
  },
  role: {
    fontSize: moderateScale(12),
    color: "#FFFFFF",
    opacity: 0.8,
    marginTop: verticalScale(4),
  },
  avatar: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  statsContainer: {
    flexWrap : 'wrap',
    flexDirection: "row",
    justifyContent: "center",
    // marginBottom: verticalScale(20),
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    padding: scale(12),
    marginHorizontal: scale(4),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  statNumber: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: verticalScale(4),
  },
  statLabel: {
    fontSize: moderateScale(11),
    color: "#666666",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  viewAllText: {
    fontSize: moderateScale(14),
    color: "#165297",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#666666",
    marginTop: verticalScale(16),
  },
  emptySubText: {
    fontSize: moderateScale(14),
    color: "#999999",
    marginTop: verticalScale(8),
  },
});

export default memo(HomeScreenx);
