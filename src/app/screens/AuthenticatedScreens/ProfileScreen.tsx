import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { moderateScale, scale, verticalScale } from "../../../util/scaling";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../../store/AuthContext";
import { ProfileContext } from "../../../store/ProfileContext";
import BookNowButton from "../../../ui/BookNowButton";
import { fetchProfile, formatMoney } from "../../../util/technicianApis"; // ← adjust path

// ─── Rating Bar ───────────────────────────────────────────────────────────────
function RatingBar({ label, value }: { label: string; value: number | null }) {
  const pct = value != null ? (value / 5) * 100 : 0;
  return (
    <View style={ratingStyles.row}>
      <Text style={ratingStyles.label}>{label}</Text>
      <View style={ratingStyles.track}>
        <View style={[ratingStyles.fill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={ratingStyles.value}>
        {value != null ? value.toFixed(1) : "N/A"}
      </Text>
    </View>
  );
}

const ratingStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(14),
    borderBottomWidth: 1,
    paddingBottom: verticalScale(10),
    borderColor: "#D2EEFC",
  },
  label: {
    width: scale(90),
    fontSize: moderateScale(13),
    fontWeight: "400",
    color: "#333",
  },
  track: {
    flex: 1,
    height: verticalScale(6),
    backgroundColor: "#E8E0D5",
    borderRadius: scale(3),
    overflow: "hidden",
    marginHorizontal: scale(8),
  },
  fill: {
    height: "100%",
    backgroundColor: "#FED049",
    borderRadius: scale(3),
  },
  value: {
    width: scale(28),
    fontSize: moderateScale(13),
    fontWeight: "500",
    color: "#333",
    textAlign: "right",
  },
});

// ─── Badge Card ───────────────────────────────────────────────────────────────
type BadgeItem = {
  emoji: string;
  name: string;
  description: string;
  earned: boolean;
  id : string
};

function BadgeCard({ item }: { item: BadgeItem }) {
  return (
    <View style={[badgeStyles.card, item.earned && badgeStyles.earnedCard]}>
      <Text style={badgeStyles.emoji}>{item.emoji}</Text>
      <Text style={[badgeStyles.title, item.earned && badgeStyles.earnedTitle]}>
        {item.name}
      </Text>
      {item.earned ? (
        <View style={badgeStyles.earnedRow}>
          <Icon name="check" size={12} color="#864C2D" />
          <Text style={badgeStyles.earnedText}> Earned</Text>
        </View>
      ) : (
        <Text style={badgeStyles.lockedText}>{item.description}</Text>
      )}
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: scale(10),
    padding: scale(12),
    marginBottom: verticalScale(10),
    borderColor: "#F2D6B5",
    borderWidth: moderateScale(0.7),
  },
  earnedCard: {
    backgroundColor: "#FEEDDC",
  },
  emoji: {
    fontSize: moderateScale(22),
    marginBottom: verticalScale(4),
  },
  title: {
    fontSize: moderateScale(13),
    fontWeight: "500",
    color: "#DA8456",
    marginBottom: verticalScale(4),
  },
  earnedTitle: {
    color: "#DA8456",
  },
  earnedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  earnedText: {
    fontSize: moderateScale(12),
    color: "#864C2D",
    fontWeight: "600",
  },
  lockedText: {
    fontSize: moderateScale(11),
    color: "#864C2D",
    fontWeight: "600",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { logout, token } = useContext(AuthContext); // ← make sure token is in AuthContext
  const { firstName, lastName, phoneNumber, picture } =
    useContext(ProfileContext);

  const [apiData, setApiData]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);
        const result = await fetchProfile(token);
        setApiData(result);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load profile.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived data (with safe fallbacks while loading) ──────────────────────
  const stats    = apiData?.stats    ?? {};
  const ratings  = apiData?.ratings  ?? {};
  const rawBadges: BadgeItem[] = apiData?.badges ?? [];
  const skills: string[]       = apiData?.profile?.skills ?? [];

console.log('stats : ', apiData);


  // Earned badges first, then unearned
  const sortedBadges = [...rawBadges].sort((a, b) => +b.earned - +a.earned);

  const ratingRows = [
    { label: "Punctuality", value: ratings.punctuality ?? null },
    { label: "Skill",       value: ratings.skill       ?? null },
    { label: "Behaviour",   value: ratings.behaviour   ?? null },
    { label: "Cleanliness", value: ratings.cleanliness ?? null },
  ];

  const statCards = [
    { value: stats.totalJobs         != null ? String(stats.totalJobs) : "—", label: "Jobs"   },
    { value: stats.avgRating         != null ? String(stats.avgRating) : "—", label: "Rating" },
    { value: stats.thisMonthEarnings != null ? formatMoney(stats.thisMonthEarnings) : "—",     label: "Month"  },
    { value: stats.joinedYear        != null ? String(stats.joinedYear) : "—", label: " Joined In"  },
  ];

  // ── Loading overlay (first load only) ─────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#864C2D" />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  // if (error && !apiData) {
  //   return (
  //     <SafeAreaView style={styles.safe} edges={["top"]}>
  //       <View style={styles.centered}>
  //         <Text style={styles.errorIcon}>⚠️</Text>
  //         <Text style={styles.errorText}>{error}</Text>
  //         <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
  //           <Text style={styles.retryBtnText}>Retry</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor="#864C2D"
          />
        }
      >
        {/* ── Profile Header ── */}
        <View style={{ backgroundColor: "#F2DDC5", paddingBottom: verticalScale(14) }}>
          <View style={styles.header}>
            <Image
              source={{ uri: picture ?? `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=864C2D&color=fff` }}
              style={styles.avatar}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{firstName} {lastName}</Text>
              <Text style={styles.phone}>{phoneNumber}</Text>
              {/* Skill Tags — from API */}
              <View style={styles.tagsRow}>
                {(skills.length > 0
                  ? skills
                  : ["—"]  // placeholder while loading
                ).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Stat Cards — from API ── */}
          <View style={styles.statsCard}>
            {statCards.map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Ratings — from API ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>RATINGS</Text>
          {ratings.totalReviews === 0 ? (
            <Text style={styles.emptyText}>No reviews yet</Text>
          ) : (
            ratingRows.map((r) => (
              <RatingBar key={r.label} label={r.label} value={r.value} />
            ))
          )}
        </View>

        {/* ── Badges — from API ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>BADGES</Text>
          <View style={styles.badgesGrid}>
            {sortedBadges.map((b) => (
              <BadgeCard key={b.id ?? b.name} item={b} />
            ))}
          </View>

           <TouchableOpacity
                    style={[styles.confirmBtn]}
                    onPress={()=>logout()}
                    // disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.confirmBtnText}>Logout</Text>
                        <Icon
                          name="logout"
                          size={moderateScale(18)}
                          color="#fff"
                        />
                      </>
                    )}
                  </TouchableOpacity>
        </View>

      
       
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles (unchanged from your original) ───────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFF5EB",
  },
  scroll: {
    paddingBottom: verticalScale(200),
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#864C2D",
    fontSize: moderateScale(14),
    marginTop: verticalScale(8),
  },
  errorIcon: {
    fontSize: moderateScale(36),
  },
  errorText: {
    fontSize: moderateScale(13),
    color: "#444",
    textAlign: "center",
    paddingHorizontal: scale(32),
  },
  retryBtn: {
    marginTop: verticalScale(8),
    backgroundColor: "#864C2D",
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: moderateScale(14),
  },
  emptyText: {
    fontSize: moderateScale(13),
    color: "#aaa",
    textAlign: "center",
    paddingVertical: verticalScale(8),
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(20),
    backgroundColor: "#F2DDC5",
    paddingHorizontal: scale(10),
  },
  avatar: {
    width: scale(83),
    height: scale(83),
    borderRadius: scale(23),
    marginRight: scale(14),
    borderWidth: 1,
    borderColor: "#864C2D",
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#864C2D",
  },
  phone: {
    fontSize: moderateScale(13),
    color: "#1B5678B2",
    marginTop: verticalScale(2),
    marginBottom: verticalScale(8),
    fontWeight: "500",
  },
  tagsRow: {
    flexDirection: "row",
    gap: scale(8),
  },
  tag: {
    backgroundColor: "#F2CFA8",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(3),
    borderRadius: scale(20),
  },
  tagText: {
    fontSize: moderateScale(11),
    color: "#555",
    fontWeight: "500",
  },

  // Stats
  statsCard: {
    flexDirection: "row",
    marginHorizontal: scale(10),
    gap: scale(6),
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    borderWidth: moderateScale(0.7),
    borderColor: "#DFCEBB",
    backgroundColor: "#FEEEDD",
    borderRadius: scale(12),
    paddingVertical: verticalScale(10),
  },
  statValue: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#1A1A1A",
  },
  statLabel: {
    fontSize: moderateScale(11),
    color: "#888",
    marginTop: verticalScale(2),
  },
  statDivider: {
    width: 1,
    backgroundColor: "#EDE5D8",
    marginVertical: verticalScale(4),
  },

  // Generic Card
  card: {
    backgroundColor: "#fff",
    borderRadius: scale(8),
    marginHorizontal: scale(10),
    padding: scale(16),
    marginTop: verticalScale(14),
    borderColor: "#B3D7E9",
    borderWidth: moderateScale(0.7),
  },
  sectionLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#0EA5E9",
    letterSpacing: 0.8,
    marginBottom: verticalScale(14),
  },

  // Badges
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  }, bottomBar: {
      // position: "absolute",
      // bottom: 0,
      // left: 0,
      // right: 0,
      backgroundColor: '#fff',
      // borderTopWidth: 0.5,
      // borderTopColor: BORDER_COLOR,
      paddingHorizontal: scale(14),
      paddingTop: verticalScale(12),
      paddingBottom: verticalScale(28),
      // marginTop : verticalScale(20),
    },
    confirmBtn: {
      backgroundColor: '#2563EB',
      borderRadius: scale(12),
      paddingVertical: verticalScale(15),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: scale(8),
      marginTop : verticalScale(6)
    },
    confirmBtnText: {
      color: "#fff",
      fontSize: moderateScale(14),
      fontWeight: "600",
    },
});