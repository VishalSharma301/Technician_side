import React, { useCallback, useContext, useEffect, useState, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { scale, verticalScale, moderateScale } from "../../../util/scaling";
import JobCard from "../../components/jojo";
import HomeBox from "../../components/HomeBox";
import { AuthContext } from "../../../store/AuthContext";
import { BASE } from "../../../util/BASE_URL";
import CustomNavBar from "../../components/CustomNavBar";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useJobs } from "../../../store/JobContext";
import axios from "axios";

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { token, logout } = useContext(AuthContext);
  const {fetchJobs}= useJobs()

  const [homeData, setHomeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================
  // FETCH HOME DATA
  // =========================
 const fetchHome = async () => {
  try {
    const res = await axios.get(`${BASE}/api/technicians/home`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = res.data;

    if (data.success) {
      setHomeData(data);
      console.log("data :", data);

      fetchJobs();
    } else {
      Alert.alert("Error", data.message || "Failed to load home data");
    }
  } catch (err : any) {
    console.log("fetchHome error:", err);

    // Token expired / unauthorized
    if (err.response?.status === 401) {
      logout();
      return;
    }

    Alert.alert("Error", "Something went wrong");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    fetchHome();
  }, []);

  // =========================
  // FORMAT EARNING
  // =========================
  const formatEarning = (n: number) => {
    if (!n) return "₹0";
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${n}`;
  };

  // =========================
  // ACTION BUTTON HANDLER
  // =========================
  const handleActionTap = async (job: any) => {
    try {
      const { apiPath, method } = job.actionButton;

      if (!apiPath) {
        navigation.navigate("JobDetailsScreen", { jobId: job.jobId });
        return;
      }

      const url = `/api/technicians/jobs/${job.jobId}/${apiPath}`;

      await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchHome(); // refresh UI
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Action failed");
    }
  };

  // =========================
  // RENDER JOB CARD
  // =========================
  const renderJobCard = ({ item }: any) => (
    <JobCard
      job={item}
      onAction={() => handleActionTap(item)}
      onCall={() => {}}
      navigate={() =>
        navigation.navigate("JobDetailsScreen", { jobId: item.jobId })
      }
    />
  );

  // =========================
  // HEADER
  // =========================
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* LOCATION + POINTS */}
      <View style={styles.topRow}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={18} />
          <Text style={styles.pinText}>
            {homeData?.meta?.zipcode || "--"}
          </Text>
        </View>

        <LinearGradient
          colors={["#729869", "#729869"]}
          style={styles.pointsBox}
        >
          <Text style={{ color: "#fff", fontSize: 12 }}>POINTS</Text>
          <Text style={styles.pointsText}>0</Text>
        </LinearGradient>
      </View>

      {/* DATE */}
     

      {/* STATS */}
      <View style={styles.statsContainer}>
        <HomeBox
          title="Total"
          count={homeData?.stats?.total}
          boxColor="#FFEAD7"
        />

        <HomeBox
          title="Active"
          count={homeData?.stats?.active}
        />

        <HomeBox
          title="Earnings"
          count={formatEarning(homeData?.stats?.todayEarnings)}
        />
      </View>

      {/* TODAY HEADER */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
           <Text style={{ marginTop: 6, fontSize: 12 }}>
        {homeData?.meta?.date}
      </Text>({homeData?.todayJobs?.count || 0})
        </Text>
      </View>
    </View>
  );

  // =========================
  // EMPTY STATE
  // =========================
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="calendar-check" size={60} color="#ccc" />
      <Text>No jobs for today</Text>
    </View>
  );

  if (loading) return null;

  const renderDelayedSection = () => {
  if (!homeData?.delayedGroups?.length) return null;

  return (
    <View style={styles.delayedContainer}>
      {homeData.delayedGroups.map((group: any, index: number) => (
        <View key={index} style={styles.delayedGroup}>
          <Text style={styles.delayedTitle}>
            Delayed - {group.dateLabel}
          </Text>

          {group.jobs.map((job: any) => (
            <JobCard
              key={job.jobId}
              job={job}
              onAction={() => handleActionTap(job)}
              navigate={() =>
                navigation.navigate("JobDetailsScreen", {
                  jobId: job.jobId,
                })
              }
            />
          ))}
        </View>
      ))}
    </View>
  );
};

  return (
    <ScreenWrapper>
    <View style={styles.container}>
      <FlatList
  data={homeData?.todayJobs?.jobs || []}
  renderItem={renderJobCard}
  keyExtractor={(item) => item.jobId}
  ListHeaderComponent={renderHeader}
  ListEmptyComponent={renderEmpty}
  ListFooterComponent={renderDelayedSection}
  contentContainerStyle={{
    paddingBottom: verticalScale(100),
  }}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        fetchHome();
      }}
    />
  }
/>

      {/* DELAYED SECTION */}
      {/* {homeData?.delayedGroups?.map((group: any, index: number) => (
        <View key={index} style={{ padding: 10, borderWidth : 1, marginBottom : 0 }}>
          <Text style={{ color: "red", fontWeight: "bold" }}>
            Delayed - {group.dateLabel}
          </Text>

          {group.jobs.map((job: any) => (
            <JobCard
              key={job.jobId}
              job={job}
              onAction={() => handleActionTap(job)}
              navigate={() =>
                navigation.navigate("JobDetailsScreen", {
                  jobId: job.jobId,
                })
              }
            />
          ))}
        </View>
      ))} */}
      <CustomNavBar isLocal="Home" />
    </View>
    </ScreenWrapper>
  );
};

export default memo(HomeScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5EB",
  },
  headerContainer: {
    padding: 12,
    backgroundColor: "#F2DDC5",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pinText: {
    marginLeft: 6,
    fontWeight: "600",
  },
  pointsBox: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  pointsText: {
    color: "#fff",
    fontWeight: "bold",
  },
  delayedContainer: {
  paddingHorizontal: 0,
  paddingTop: 8,
  marginTop : 6
  // borderWidth : 1
},

delayedGroup: {
  marginBottom: 20,
},

delayedTitle: {
  color: "red",
  fontWeight: "bold",
  marginBottom: 0,
  marginLeft : 11
},
  statsContainer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent : 'space-evenly'
    // gap: 8,
  },
  sectionHeader: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
});