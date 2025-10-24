// src/screens/HomeScreen.tsx
import React, { useCallback, memo, useContext, useState, useEffect } from "react";
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
  startJob,
  
  updateJobStatus,
  verifyCompletionPin,
  
} from "../../../util/ApiService";
import { ProfileContext } from "../../../store/ProfileContext";
import BookNowButton from "../../../ui/BookNowButton";
import { AuthContext } from "../../../store/AuthContext";
import { fetchAssignedServices } from "../../../util/servicesApi";
import OtpModal from "../../components/OtpModal";
import { getToken } from "../../../util/setAsyncStorage";

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
 const [showOtp, setShowOtp] = useState(false);
 const [selectedId, setSelectedId] = useState("");
 const [pin, setPin] = useState("");
  const { jobs, stats, loading, error, updateStatus } = useJobs();
  const pollNow = usePolling();
  const {setToken, token} = useContext(AuthContext);
useEffect(() => {
  if(!token){
    const fetchToken = async () => {
      const storedToken = await getToken();
      if (storedToken) {
      setToken(storedToken);
      console.log("Token fetched from storage:");
      
      }
    }
    fetchToken()
    }
}, []);


  const onRefresh = useCallback(() => {
    pollNow();
  }, [pollNow]);

  const upcomingJobs = jobs.filter(
    (j) =>
      j.status === JobStatus.PENDING || j.status === JobStatus.DEADLINE_ALERT || j.status === JobStatus.ONGOING
  );

  const handleStartJob = useCallback(
    async (jobId: string) => {
      try {
        await startJob(jobId);
        updateStatus(jobId, JobStatus.ONGOING);
        Alert.alert("Success", "Job started successfully!");
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Failed to start job");
      }
    },
    [updateStatus]
  );

const askOTP = (id : string) => {
  setSelectedId(id)
  setShowOtp(true)
}

  const handleCompleteJob = useCallback(
    async (otp: string) => {
      setShowOtp(false)
      try {
        await verifyCompletionPin(token,selectedId, otp);
        console.log("selectedId, otp :", selectedId, otp);
        
        updateStatus(selectedId, JobStatus.COMPLETED);
        Alert.alert("Success", "Job completed successfully!");
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Failed to complete job");
      }
    },
    [updateStatus]
  );

  const handleAlertJob = useCallback(
    async (jobId: string) => {
      try {
        await updateJobStatus(jobId, JobStatus.DEADLINE_ALERT);
        updateStatus(jobId, JobStatus.DEADLINE_ALERT);
        Alert.alert("Alert", "Job marked as urgent!");
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Failed to update job");
      }
    },
    [updateStatus]
  );

  const handleNavigateToDetails = useCallback(
    (job: Job) => navigation.navigate("JobDetails", { job }),
    [navigation]
  );

  const renderJob: ListRenderItem<Job> = useCallback(
    ({ item }) => (
      <JobCard
        job={item}
        onStart={handleStartJob}
    
        // onComplete={()=>askOTP(item._id)}
        onComplete={askOTP}
        onAlert={handleAlertJob}
        navigate={handleNavigateToDetails}
      />
    ),
    [handleStartJob, handleCompleteJob, handleAlertJob, handleNavigateToDetails]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        backButton={false}
        name="Welcome Technician"
        style={{ paddingHorizontal: scale(22) }}
        rightIconName="notifications"
        onRightIconPress={() => navigation.navigate("NotificationScreen")}
      />
          <OtpModal visible={showOtp} onSubmit={handleCompleteJob} onClose={()=>setShowOtp(false  ) 
          } />
      <FlatList
        data={upcomingJobs}
        keyExtractor={(item) => item._id}
        renderItem={renderJob}
        ListHeaderComponent={<HeaderPart stats={stats} error={error} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="briefcase-check" size={48} color="#666" />
            <Text style={styles.emptyText}>No pending jobs</Text>
            <Text style={styles.emptySubText}>
              New jobs will appear here automatically
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default memo(HomeScreen);

/* -------------------------------------------------------------------------- */
/*                               helper header                                */
/* -------------------------------------------------------------------------- */

interface HeaderProps {
  stats: {
    pending: number;
    ongoing: number;
    completed: number;
    deadlineAlert: number;
  };
  error: string | null;
}

const HeaderPart: React.FC<HeaderProps> = ({ stats, error }) => {
  const navigation = useNavigation<any>(); // Moved here inside component
  const { firstName, lastName, picture } = useContext(ProfileContext);
  const { token } = useContext(AuthContext);

  async function fetch() {
    try{
      console.log("pressed");
      const respose = await fetchAssignedServices(token);
      if(respose){
        return respose
      }else{
        console.warn("unexpected responce");
        
      }
    }catch(err){
      console.error('error occures', err);
      
    }
  }

  return (
    <>
      {/* profile */}
      <View style={styles.profileSection}>
        <View style={styles.imageSection}>
          <Image source={{ uri: picture }} style={styles.avatar} />
          <LinearGradient
            colors={["#DB9F00", "#FFB800"]}
            style={styles.gradient}
          />
        </View>
        <Text style={styles.name}>{firstName + "" + lastName}</Text>
        <Text style={styles.role}>HVAC Technician</Text>
      </View>

      {/* stats */}
      <View style={styles.gridRow}>
        <Pressable
          onPress={() =>
            navigation.navigate("JobsScreen", {
              defaultStatus: JobStatus.PENDING,
            })
          }
        >
          <StatCard label="Pending Jobs" value={stats.pending} bg="#658CB226" />
        </Pressable>
        <Pressable
          onPress={() =>
            navigation.navigate("JobsScreen", {
              defaultStatus: JobStatus.COMPLETED,
            })
          }
        >
          <StatCard
            label="Completed Jobs"
            value={stats.completed}
            bg="#CCE4D6"
          />
        </Pressable>
      </View>
      <View style={styles.gridRow}>
        <Pressable
          onPress={() =>
            navigation.navigate("JobsScreen", {
              defaultStatus: JobStatus.ONGOING,
            })
          }
        >
          <StatCard label="Ongoing Jobs" value={stats.ongoing} bg="#DDE8F7" />
        </Pressable>
        <Pressable
          onPress={() =>
            navigation.navigate("JobsScreen", {
              defaultStatus: JobStatus.DEADLINE_ALERT,
            })
          }
        >
          <StatCard
            label="Deadline Alert"
            value={stats.deadlineAlert}
            bg="#CD9E5126"
          />
        </Pressable>
      </View>

      {/* error banner */}
      {error && (
        <View style={styles.error}>
          <Icon name="alert-circle" size={16} color="#C03B3B" />
          <Text style={styles.errorTxt}>{error}</Text>
        </View>
      )}

      {/* <BookNowButton text="Fetch Jobs" onPress={fetch} /> */}

      <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
      <Text style={styles.subText}>
        {stats.pending + stats.deadlineAlert} require attention
      </Text>
    </>
  );
};

interface StatProps {
  label: string;
  value: number | string;
  bg: string;
}

const StatCard: React.FC<StatProps> = ({ label, value, bg }) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F0F4FF" },
  container: { padding: scale(16), paddingBottom: verticalScale(120) },

  /* profile */
  profileSection: {
    alignItems: "center",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(16),
  },
  imageSection: {
    height: scale(105),
    width: scale(105),
    borderRadius: scale(52.5),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: scale(52.5),
    zIndex: 1,
  },
  gradient: { ...StyleSheet.absoluteFillObject },
  name: {
    marginTop: verticalScale(7),
    fontSize: moderateScale(24),
    fontWeight: "600",
    lineHeight: verticalScale(33.6),
  },
  role: {
    fontSize: moderateScale(12),
    fontWeight: "500",
    color: "#666",
    marginTop: verticalScale(3),
  },

  /* stats */
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },
  statCard: {
    width: scale(169),
    aspectRatio: 169 / 97,
    padding: scale(14),
    borderRadius: scale(12),
  },
  statLabel: { fontSize: moderateScale(18), fontWeight: "600", color: "#000" },
  statValue: {
    fontWeight: "600",
    fontSize: moderateScale(28),
    marginTop: verticalScale(6),
  },

  /* banners & titles */
  error: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: verticalScale(12),
  },
  errorTxt: {
    color: "#C03B3B",
    fontSize: moderateScale(13),
    marginLeft: scale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    marginTop: verticalScale(6),
  },
  subText: {
    fontSize: moderateScale(16),
    fontWeight: "400",
    color: "#888",
    marginBottom: verticalScale(13),
  },

  /* empty */
  emptyContainer: {
    alignItems: "center",
    padding: scale(32),
    backgroundColor: "#fff",
    borderRadius: scale(12),
    marginTop: verticalScale(16),
  },
  emptyText: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#666",
    marginTop: verticalScale(12),
  },
  emptySubText: {
    fontSize: moderateScale(14),
    color: "#999",
    textAlign: "center",
    marginTop: verticalScale(4),
  },
});
