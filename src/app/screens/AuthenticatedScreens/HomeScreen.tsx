import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  memo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Animated,
  Easing,
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

// ─────────────────────────────────────────────
// SKELETON SHIMMER COMPONENT
// ─────────────────────────────────────────────
const SkeletonBox = ({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#D4B896",
          opacity,
        },
        style,
      ]}
    />
  );
};

// ─────────────────────────────────────────────
// SKELETON LOADING SCREEN
// ─────────────────────────────────────────────
const SkeletonScreen = () => (
  <View style={styles.container}>
    {/* Header skeleton */}
    <View style={[styles.headerContainer, { gap: 12 }]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <SkeletonBox width={100} height={18} borderRadius={6} />
        <SkeletonBox width={72} height={40} borderRadius={8} />
      </View>

      {/* Stats row */}
      <View style={styles.statsContainer}>
        <SkeletonBox width="30%" height={72} borderRadius={10} />
        <SkeletonBox width="30%" height={72} borderRadius={10} />
        <SkeletonBox width="30%" height={72} borderRadius={10} />
      </View>

      {/* Section header */}
      <SkeletonBox
        width={140}
        height={18}
        borderRadius={6}
        style={{ marginTop: 6 }}
      />
    </View>

    {/* Job card skeletons */}
    {[0, 1, 2].map((i) => (
      <View key={i} style={skeletonCardStyle}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <SkeletonBox width="55%" height={16} borderRadius={5} />
          <SkeletonBox width="25%" height={16} borderRadius={5} />
        </View>
        <SkeletonBox
          width="40%"
          height={13}
          borderRadius={5}
          style={{ marginTop: 8 }}
        />
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <SkeletonBox width={80} height={32} borderRadius={8} />
          <SkeletonBox width={80} height={32} borderRadius={8} />
        </View>
      </View>
    ))}
  </View>
);

const skeletonCardStyle = {
  backgroundColor: "#FFF0E0",
  margin: 10,
  marginBottom: 0,
  borderRadius: 12,
  padding: 14,
  gap: 4,
};

// ─────────────────────────────────────────────
// ANIMATED JOB CARD WRAPPER (stagger + slide)
// ─────────────────────────────────────────────
const AnimatedJobCard = memo(
  ({
    item,
    index,
    onAction,
    onCall,
    navigate,
  }: {
    item: any;
    index: number;
    onAction: () => void;
    onCall: () => void;
    navigate: () => void;
  }) => {
    const translateY = useRef(new Animated.Value(40)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 380,
          delay: index * 80, // stagger: each card 80ms after previous
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          delay: index * 80,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      // <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <JobCard
          job={item}
          onAction={onAction}
          onCall={onCall}
          navigate={navigate}
        />
      // </Animated.View>
    );
  },
);

// ─────────────────────────────────────────────
// ANIMATED STAT VALUE (count-up on mount)
// ─────────────────────────────────────────────
const useCountUp = (target: number, duration = 700) => {
  const [display, setDisplay] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!target || isNaN(target)) return;
    animVal.setValue(0);
    const listener = animVal.addListener(({ value }) => {
      setDisplay(Math.floor(value));
    });
    Animated.timing(animVal, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // JS-driven for value read
    }).start();
    return () => animVal.removeListener(listener);
  }, [target]);

  return display;
};

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { token, logout } = useContext(AuthContext);
  const { fetchJobs } = useJobs();

  const [homeData, setHomeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Header slide-down on data load
  const headerAnim = useRef(new Animated.Value(-30)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // Stats pop-in scale
  const statsScale = useRef(new Animated.Value(0.88)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;

  // Count-up targets (raw numbers)
  const totalTarget = homeData?.stats?.total ?? 0;
  const activeTarget = homeData?.stats?.active ?? 0;
  const earningsTarget = homeData?.stats?.todayEarnings ?? 0;

  const animatedTotal = useCountUp(totalTarget);
  const animatedActive = useCountUp(activeTarget);
  const animatedEarnings = useCountUp(earningsTarget);

  // Delayed section pulse on "Delayed" label
  const delayedPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!homeData?.delayedGroups?.length) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(delayedPulse, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(delayedPulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [homeData?.delayedGroups?.length]);

  // Run header + stats entrance when data arrives
  useEffect(() => {
    if (!homeData) return;

    // Header slides down
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();

    // Stats pop in slightly after header
    Animated.parallel([
      Animated.spring(statsScale, {
        toValue: 1,
        delay: 180,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 300,
        delay: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [homeData]);

  // ─── FETCH HOME DATA ───
  const fetchHome = async () => {
    try {
      const res = await axios.get(`${BASE}/api/technicians/home`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      if (data.success) {
        setHomeData(data);
        fetchJobs();
      } else {
        Alert.alert("Error", data.message || "Failed to load home data");
      }
    } catch (err: any) {
      console.log("fetchHome error:", err);
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

  // ─── FORMAT EARNING ───
  const formatEarning = (n: number) => {
    if (!n) return "₹0";
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${n}`;
  };

  // ─── ACTION BUTTON ───
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
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHome();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Action failed");
    }
  };

  // ─── RENDER JOB CARD (animated) ───
  const renderJobCard = ({ item, index }: { item: any; index: number }) => (
    <AnimatedJobCard
      item={item}
      index={index}
      onAction={() => handleActionTap(item)}
      onCall={() => {}}
      navigate={() =>
        navigation.navigate("JobDetailsScreen", { jobId: item.jobId })
      }
    />
  );

  // ─── HEADER ───
  const renderHeader = () => (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerAnim }],
        },
      ]}
    >
      {/* LOCATION + POINTS */}
      <View style={styles.topRow}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={18} />
          <Text style={styles.pinText}>{homeData?.meta?.zipcode || "--"}</Text>
        </View>

        <LinearGradient
          colors={["#729869", "#729869"]}
          style={styles.pointsBox}
        >
          <Text style={{ color: "#fff", fontSize: 12 }}>POINTS</Text>
          <Text style={styles.pointsText}>0</Text>
        </LinearGradient>
      </View>

      {/* ANIMATED STATS */}
      <Animated.View
        style={[
          styles.statsContainer,
          {
            opacity: statsOpacity,
            transform: [{ scale: statsScale }],
          },
        ]}
      >
        {/*
          Pass animatedTotal/animatedActive/animatedEarnings into HomeBox.
          If HomeBox only accepts `count` as string, format here.
          Adjust based on your HomeBox props signature.
        */}
        <HomeBox title="Total" count={animatedTotal} boxColor="#FFEAD7" />
        <HomeBox title="Active" count={animatedActive} />
        <HomeBox title="Earnings" count={formatEarning(animatedEarnings)} />
      </Animated.View>

      {/* TODAY HEADER */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          <Text style={{ marginTop: 6, fontSize: 12 }}>
            {homeData?.meta?.date}
          </Text>
          ({homeData?.todayJobs?.count || 0})
        </Text>
      </View>
    </Animated.View>
  );

  // ─── EMPTY STATE ───
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="calendar-check" size={60} color="#ccc" />
      <Text>No jobs for today</Text>
    </View>
  );

  // ─── DELAYED SECTION ───
  const renderDelayedSection = () => {
    if (!homeData?.delayedGroups?.length) return null;

    return (
      <View style={styles.delayedContainer}>
        {homeData.delayedGroups.map((group: any, gIndex: number) => (
          <View key={gIndex} style={styles.delayedGroup}>
            {/* Pulsing "Delayed" label */}
            <Animated.Text
              style={[
                styles.delayedTitle,
                // { transform: [{ scale: delayedPulse }] },
              ]}
            >
              Delayed - {group.dateLabel}
            </Animated.Text>

            {group.jobs.map((job: any, jIndex: number) => (
              <AnimatedJobCard
                key={job.jobId}
                item={job}
                index={jIndex}
                onAction={() => handleActionTap(job)}
                onCall={() => {}}
                navigate={() =>
                  navigation.navigate("JobDetailsScreen", { jobId: job.jobId })
                }
              />
            ))}
          </View>
        ))}
      </View>
    );
  };

  // ─── LOADING ───
  if (loading) return <SkeletonScreen />;

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
          contentContainerStyle={{ paddingBottom: verticalScale(100) }}
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
    marginTop: 6,
  },
  delayedGroup: {
    marginBottom: 20,
  },
  delayedTitle: {
    color: "red",
    fontWeight: "bold",
    marginBottom: 0,
    marginLeft: 11,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
    // borderWidth : 1
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
