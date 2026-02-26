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
  Modal,
  TouchableOpacity,
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
import InspectionModal from "../../components/InspectionModal";
import CustomView from "../../components/CustomView";
import ReviewModal from "../../components/ReviewModal";

type TabType = "today" | "tomorrow" | "week";

type Props = {
  onChange?: (value: TabType) => void;
};

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
  const [showReview, setShowReview] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [selected, setSelected] = useState<TabType>("today");

  function onChange(value: TabType) {
    console.log("Selected tab:", selected);
  }

  const handleSelect = (value: TabType) => {
    setSelected(value);
    onChange?.(value);
  };

  console.log("token is :", token);
  // console.log("Jobs :", jobs);

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
        const response = await updateJobStatus(jobId, "on_way", "Job started");

        if (response && response.success) {
          updateStatus(jobId, JobStatus.ON_WAY);
          Alert.alert("Success", "Job started successfully");
        } else {
          Alert.alert("Error", "Failed to start job");
        }
      } catch (error) {
        console.error("Error starting job:", error);
        Alert.alert("Error", "Failed to start job");
      }
    },
    [updateStatus],
  );
  const handleScheduledWorkCompleted = useCallback(
    async (jobId: string) => {
      try {
        const response = await updateJobStatus(jobId, "in_progress");

        if (response && response.success) {
          updateStatus(jobId, JobStatus.IN_PROGRESS);
          Alert.alert("Success", "Scheduled Job Completed");
        } else {
          Alert.alert("Error", "Failed to mark Scheduled progress");
        }
      } catch (error) {
        console.error(" Error Failed to mark progress:", error);
        Alert.alert("Error", "Failed to mark progress");
      }
    },
    [updateStatus],
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
          "Job completed",
        );

        console.log("PIN Verification Response:", response);

        if (response && response.success) {
          updateStatus(selectedJobId, JobStatus.COMPLETED);
          setPinModalVisible(false);
          setSelectedJobId(null);
          Alert.alert("Success", "Job completed and PIN verified!");
          setShowReview(true);
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
    [selectedJobId, updateStatus, refreshJobs],
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
      ],
    );
  }, []);

  // ============================================
  // NAVIGATE TO JOB DETAILS
  // ============================================

  const handleNavigateToDetails = useCallback(
    (job: Job) => {
      console.log("Job : ", job);

      navigation.navigate("JobDetailsScreen", { job });
    },
    [navigation],
  );

  // ============================================
  // NAVIGATE TO JOBS SCREEN WITH FILTER
  // ============================================

  const handleStatCardPress = useCallback(
    (status: string) => {
      navigation.navigate("JobsScreen", { filterStatus: status });
    },
    [navigation],
  );

  // ============================================
  // RENDER JOB CARD
  // ============================================

  const onStartInspection = (jobId: string) => {
    setSelectedJobId(jobId);
    // setIsInspecting(true);
    navigation.navigate("InspectionScreen", { jobId: jobId });
  };

  const renderJobCard: ListRenderItem<Job> = useCallback(
    ({ item }) => (
      <JobCard
        job={item}
        onStart={handleStartJob}
        onStartInspection={onStartInspection}
        onComplete={handleCompleteJob}
        onAlert={handleAlert}
        navigate={handleNavigateToDetails}
        onScheduledWorkCompleted={handleScheduledWorkCompleted}
      />
    ),
    [handleStartJob, handleCompleteJob, handleAlert, handleNavigateToDetails],
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
    [],
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
            image={require("../../../../assets/pending.png")}
            onPress={() => handleStatCardPress("technician_assigned")}
            title="Pending"
            count={stats.assigned}
            borderColor="#F39962"
            boxColor="#FFEAD7"
            circleColor="#FFDEC4"
          />

          <HomeBox
            image={require("../../../../assets/ongoing.png")}
            onPress={() => handleStatCardPress("in_progress")}
            title="Ongoing"
            count={stats.inProgress}
            borderColor="#00A72E"
            boxColor="#00A12626"
            circleColor="#00AD321A"
          />

          <HomeBox
            image={require("../../../../assets/completed.png")}
            onPress={() => handleStatCardPress("completed")}
            title="Completed"
            count={stats.completed}
          />

          <HomeBox
            image={require("../../../../assets/deadline.png")}
            onPress={() =>
              navigation.navigate("JobsScreen", { filterToday: true })
            }
            title="Today"
            count={stats.todayJobs}
            borderColor="#D07910A6"
            boxColor="#CB760D26"
            circleColor="#CE7A111A"
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
        {/* <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
          <Text style={{ fontWeight: "400", fontSize: moderateScale(16) }}>
            96h Deadline
          </Text>
          <Pressable onPress={() => navigation.navigate("JobsScreen")}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View> */}
        <CustomView
          radius={scale(36)}
          shadowStyle={{ marginBottom: verticalScale(10), overflow: "hidden" }}
          boxStyle={{ overflow: "hidden" }}
        >
          <View style={styles.container1}>
            {/* TODAY */}
            <TouchableOpacity
              style={[styles.tab1, selected === "today" && styles.activeTab1]}
              onPress={() => handleSelect("today")}
            >
              <Icon
                name="calendar-check"
                size={18}
                color={selected === "today" ? "#000" : "#444"}
              />
              <Text
                style={[
                  styles.label1,
                  selected === "today" && styles.activeLabel1,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            {/* TOMORROW */}
            <TouchableOpacity
              style={[
                styles.tab1,
                selected === "tomorrow" && styles.activeTab1,
              ]}
              onPress={() => handleSelect("tomorrow")}
            >
              <Icon
                name="clipboard-text-clock"
                size={18}
                color={selected === "tomorrow" ? "#000" : "#444"}
              />
              <Text
                style={[
                  styles.label1,
                  selected === "tomorrow" && styles.activeLabel1,
                ]}
              >
                Tomorrow
              </Text>
            </TouchableOpacity>

            {/* WITHIN WEEK */}
            <TouchableOpacity
              style={[styles.tab1, selected === "week" && styles.activeTab1]}
              onPress={() => handleSelect("week")}
            >
              <Icon
                name="calendar-week"
                size={18}
                color={selected === "week" ? "#000" : "#444"}
              />
              <Text
                style={[
                  styles.label1,
                  selected === "week" && styles.activeLabel1,
                ]}
              >
                With in Week
              </Text>
            </TouchableOpacity>
          </View>
        </CustomView>
      </View>
    ),
    [
      stats,
      handleStatCardPress,
      navigation,
      firstName,
      lastName,
      picture,
      selected,
    ],
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: scale(20) }}>
        <ScreenHeader name="Home" backButton={false} />
      </View>

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

      <InspectionModal
        visible={isInspecting}
        jobId={selectedJobId!}
        onClose={() => setIsInspecting(false)}
        onInspectionCompleted={() => {}}
      />

      <ReviewModal
        onClose={() => setShowReview(false)}
        // serviceRequestId="12345"
        visible={showReview}
        onSubmit={()=>{}}
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
    // backgroundColor: "#F5F7FA",
  },
  listContent: {
    paddingBottom: verticalScale(20),
  },
  headerContainer: {
    paddingHorizontal: scale(9),
    // borderWidth : 1
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
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "center",
    gap: scale(12),
    marginBottom: verticalScale(20),
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
    flexDirection: "column",
    justifyContent: "space-between",
    // alignItems: "center",
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

  container1: {
    flexDirection: "row",
    // borderWidth: 2,
    overflow: "hidden",
    // backgroundColor: "#EDEFF3",
    // marginHorizontal: scale(16),
    // marginVertical: verticalScale(10),
  },

  tab1: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(10),
    gap: scale(6),
  },

  activeTab1: {
    backgroundColor: "#C9D6E6",
  },

  label1: {
    fontSize: moderateScale(13),
    color: "#444",
    fontWeight: "500",
  },

  activeLabel1: {
    color: "#000",
    fontWeight: "600",
  },
});

export default memo(HomeScreenx);
