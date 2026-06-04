// src/app/screens/AuthenticatedScreens/JobScreen.tsx
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons as Icon, Ionicons } from "@expo/vector-icons";
import { useJobs } from "../../../store/JobContext";
import { Job, JobStatus, getStatusText } from "../../../constants/jobTypes";
import { scale, verticalScale, moderateScale } from "../../../util/scaling";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenWrapper from "../../components/ScreenWrapper";
import CustomNavBar from "../../components/CustomNavBar";

// ============================================
// TYPES
// ============================================

type HistoryFilter = "all" | "completed" | "cancelled" | "rescheduled";

// ============================================
// HISTORY STATUS BADGE
// ============================================

function StatusBadge({ status }: { status: JobStatus }) {
  const getStatusStyle = () => {
    switch (status) {
      case JobStatus.COMPLETED:
        return {
          container: { backgroundColor: "#E8F5E9", borderColor: "#4CAF50" },
          dot: { backgroundColor: "#4CAF50" },
          text: { color: "#2E7D32" },
          label: "Completed",
        };
      case JobStatus.CANCELLED:
        return {
          container: { backgroundColor: "#FFEBEE", borderColor: "#EF5350" },
          dot: { backgroundColor: "#EF5350" },
          text: { color: "#C62828" },
          label: "Cancelled",
        };
      case JobStatus.PARTS_PENDING:
      case JobStatus.RESCHEDULED:
      case JobStatus.WORKSHOP_REQUIRED:
        return {
          container: { backgroundColor: "#FFF8E1", borderColor: "#FFB300" },
          dot: { backgroundColor: "#FFB300" },
          text: { color: "#E65100" },
          label: "Rescheduled",
        };
      default:
        return {
          container: { backgroundColor: "#F5F5F5", borderColor: "#9E9E9E" },
          dot: { backgroundColor: "#9E9E9E" },
          text: { color: "#616161" },
          label: getStatusText(status),
        };
    }
  };

  const s = getStatusStyle();

  return (
    <View style={[badgeStyles.container, s.container]}>
      <View style={[badgeStyles.dot, s.dot]} />
      <Text style={[badgeStyles.text, s.text]}>{s.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(3),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  dot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    marginRight: scale(5),
  },
  text: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
});

// ============================================
// HISTORY CARD
// ============================================

function HistoryCard({ item, onPress }: { item: Job; onPress: () => void }) {
  // Format date — replace with real date formatting from item
  const dateStr = "Apr 4";
  const invoiceNo = item._id.slice(-6).toUpperCase(); // Mock invoice number from ID
  const amount = "₹" + item.finalPrice;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={cardStyles.card}>
        {/* Top Row: Customer name + amount */}
        <View style={cardStyles.topRow}>
          <Text style={cardStyles.customerName}>
            {item.address?.city || "Customer Name"}
          </Text>
          <Text style={cardStyles.amount}>{amount}</Text>
        </View>

        {/* Middle Row: Service icon + name + date */}
        <View style={cardStyles.middleRow}>
          <View style={cardStyles.serviceRow}>
            <Icon
              name="air-conditioner"
              size={moderateScale(16)}
              color="#8B7355"
            />
            <Text style={cardStyles.serviceName}>
              {item.service?.name || "Service"}
            </Text>
          </View>
          <Text style={cardStyles.date}>{dateStr}</Text>
        </View>

        {/* Bottom Row: Status badge + invoice */}
        <View style={cardStyles.bottomRow}>
          <StatusBadge status={item.status} />
          <Text style={cardStyles.invoice}>{invoiceNo}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(12),
    marginHorizontal: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderWidth: 1,
    borderColor: "#F0E8DC",
    gap: verticalScale(8),
    shadowColor: "#C4A882",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerName: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#1A1A1A",
  },
  amount: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#1A1A1A",
  },
  middleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  serviceName: {
    fontSize: moderateScale(14),
    color: "#6B6B6B",
    fontWeight: "400",
  },
  date: {
    fontSize: moderateScale(13),
    color: "#6B6B6B",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(2),
  },
  invoice: {
    fontSize: moderateScale(13),
    color: "#6B6B6B",
  },
});

// ============================================
// MAIN HISTORY SCREEN
// ============================================

const JobScreen = () => {
  const navigation = useNavigation<any>();
  const { jobs, loading, fetchJobs } = useJobs();

  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ============================================
  // FILTER TABS
  // ============================================

  const filterTabs: { label: string; value: HistoryFilter }[] = [
    { label: "All", value: "all" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Rescheduled", value: "rescheduled" },
  ];

  // ============================================
  // FILTERED JOBS
  // ============================================

  const filteredJobs = useMemo(() => {
    let result = jobs;

    // Apply status filter
    if (activeFilter === "completed") {
      result = result.filter((j) => j.status === JobStatus.COMPLETED);
    } else if (activeFilter === "cancelled") {
      result = result.filter((j) => j.status === JobStatus.CANCELLED);
    } else if (activeFilter === "rescheduled") {
      result = result.filter(
        (j) =>
          j.status === JobStatus.PARTS_PENDING ||
          j.status === JobStatus.RESCHEDULED ||
          j.status === JobStatus.WORKSHOP_REQUIRED,
      );
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.service?.name?.toLowerCase().includes(q) ||
          j.address?.city?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [jobs, activeFilter, searchQuery]);

  // ============================================
  // NAVIGATE TO JOB DETAILS
  // ============================================

  const handleNavigateToDetails = useCallback(
    (job: Job) => {
      navigation.navigate("JobDetailsScreen", { jobId: job._id });
    },
    [navigation],
  );

  // ============================================
  // RENDER CARD
  // ============================================

  const renderCard = useCallback(
    ({ item }: { item: Job }) => (
      <HistoryCard item={item} onPress={() => handleNavigateToDetails(item)} />
    ),
    [handleNavigateToDetails],
  );

  const fetchJobss = async () => {
    try {
      await fetchJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================
  // RENDER HEADER
  // ============================================

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerSection}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={moderateScale(18)}
            color="#A09080"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search from list"
            placeholderTextColor="#B0A090"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.goButton}>
            <Text style={styles.goButtonText}>Go</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {filterTabs.map((tab) => (
            <Pressable
              key={tab.value}
              onPress={() => setActiveFilter(tab.value)}
              style={[
                styles.filterTab,
                activeFilter === tab.value && styles.filterTabActive,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === tab.value && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    ),
    [searchQuery, activeFilter],
  );

  // ============================================
  // RENDER EMPTY
  // ============================================

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Icon name="history" size={scale(50)} color="#CCC" />
        <Text style={styles.emptyText}>No history found</Text>
      </View>
    ),
    [],
  );

  // ============================================
  // RENDER
  // ============================================
  // return null
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>History</Text>
          <Text style={styles.pageSubtitle}>{filteredJobs.length} jobs</Text>
        </View>

        <FlatList
          data={filteredJobs}
          renderItem={renderCard}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!loading ? renderEmpty : null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View style={{ height: verticalScale(12) }} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchJobss();
              }}
            />
          }
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#8B5E3C" />
          </View>
        )}
        <CustomNavBar isLocal="History" />
      </View>
    </ScreenWrapper>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF5EC",
  },
  pageTitleContainer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(4),
  },
  pageTitle: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    color: "#8B5E3C",
  },
  pageSubtitle: {
    fontSize: moderateScale(13),
    color: "#A08060",
    marginTop: verticalScale(2),
  },
  headerSection: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(16),
    gap: verticalScale(14),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "#E8DDD0",
    paddingLeft: scale(12),
    height: verticalScale(46),
    marginTop: verticalScale(12),
    overflow: "hidden",
  },
  searchIcon: {
    marginRight: scale(6),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: "#1A1A1A",
    height: "100%",
  },
  goButton: {
    backgroundColor: "#7B4A2D",
    paddingHorizontal: scale(20),
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  goButtonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    gap: scale(8),
  },
  filterTab: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#E0D0C0",
    backgroundColor: "#FFFFFF",
  },
  filterTabActive: {
    backgroundColor: "#7B4A2D",
    borderColor: "#7B4A2D",
  },
  filterTabText: {
    fontSize: moderateScale(13),
    color: "#6B5040",
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: verticalScale(300),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: verticalScale(80),
    gap: verticalScale(12),
  },
  emptyText: {
    fontSize: moderateScale(15),
    color: "#999",
    fontWeight: "500",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});

export default JobScreen;
