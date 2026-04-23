import React, { useContext } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { moderateScale, scale, verticalScale } from "../../../util/scaling";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../../store/AuthContext";
import { ProfileContext } from "../../../store/ProfileContext";
import BookNowButton from "../../../ui/BookNowButton";

// ─── Rating Bar ───────────────────────────────────────────────────────────────
function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  return (
    <View style={ratingStyles.row}>
      <Text style={ratingStyles.label}>{label}</Text>
      <View style={ratingStyles.track}>
        <View style={[ratingStyles.fill, { width: `${pct}%` as any }]} />
      </View>
      <Text style={ratingStyles.value}>{value.toFixed(1)}</Text>
    </View>
  );
}

const ratingStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(14),
    borderBottomWidth : 1,
    paddingBottom : verticalScale(10),
    borderColor : '#D2EEFC'
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
  title: string;
  earned: boolean;
};

function BadgeCard({ item }: { item: BadgeItem }) {
  return (
    <View style={[badgeStyles.card, item.earned && badgeStyles.earnedCard]}>
      <Text style={badgeStyles.emoji}>{item.emoji}</Text>
      <Text style={[badgeStyles.title, item.earned && badgeStyles.earnedTitle]}>
        {item.title}
      </Text>
      {item.earned && (
        <View style={badgeStyles.earnedRow}>
          <Icon name="check" size={12} color="#864C2D" />
          <Text style={badgeStyles.earnedText}> Earned</Text>
        </View>
      )}
      {!item.earned && <Text style={badgeStyles.lockedText}>{item.title}</Text>}
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
    borderColor : '#F2D6B5',
    borderWidth : moderateScale(0.7)
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
    fontSize: moderateScale(11),
    color: "#864C2D",
    fontWeight: "600",
  },
  lockedText: {
    fontSize: moderateScale(11),
    color: "#864C2D",
    fontWeight : '600'
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const RATINGS = [
  { label: "Punctuality", value: 4.7 },
  { label: "Skill", value: 4.8 },
  { label: "Behaviour", value: 4.9 },
  { label: "Cleanliness", value: 4.5 },
];

const BADGES: BadgeItem[] = [
  { emoji: "👑", title: "5 Star Streak", earned: true },
  { emoji: "⚡", title: "Speed Demon", earned: false },
  { emoji: "🏆", title: "Pro Tech 50", earned: false },
  { emoji: "🎸", title: "5 Star Streak", earned: false },
  { emoji: "🇪🇸", title: "Early Bird", earned: false },
  { emoji: "💯", title: "Century Club", earned: false },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useContext(AuthContext);
  const { firstName, lastName, phoneNumber, picture } =
    useContext(ProfileContext);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header ── */}
        <View style={{backgroundColor : '#F2DDC5', paddingBottom : verticalScale(14)}}>
        <View style={styles.header}>
          <Image source={{ uri: picture }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{firstName} {lastName}</Text>
            <Text style={styles.phone}>{phoneNumber}</Text>
            {/* Skill Tags */}
            <View style={styles.tagsRow}>
              {["AC", "Chimney", "Plumbing"].map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.statsCard}>
          {[
            { value: "87", label: "Jobs" },
            { value: "4.8", label: "Rating" },
            { value: "₹18k", label: "Month" },
            { value: "2024", label: "Year" },
          ].map((s, i, arr) => (
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

        {/* ── Stats Row ── */}
        

        {/* ── Ratings ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>RATINGS</Text>
          {RATINGS.map((r) => (
            <RatingBar key={r.label} label={r.label} value={r.value} />
          ))}
        </View>

        {/* ── Badges ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>BADGES</Text>
          <View style={styles.badgesGrid}>
            {BADGES.map((b, i) => (
              <BadgeCard key={i} item={b} />
            ))}
          </View>
        </View>

        <BookNowButton
              text="Logout"
              style={{ height: verticalScale(45) }}
              onPress={logout}
            />
      </ScrollView>

    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFF5EB",
  },
  scroll: {
    // paddingHorizontal: scale(16),
    paddingBottom: verticalScale(200),
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(20),
    backgroundColor : '#F2DDC5',
     paddingHorizontal: scale(10),
  },
  avatar: {
    width: scale(83),
    height: scale(83),
    borderRadius: scale(23),
    marginRight: scale(14),
    borderWidth : 1,
    borderColor : '#864C2D'
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
    fontWeight : '500'
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
    // backgroundColor: "#fff",
    // borderRadius: scale(14),
    flexDirection: "row",
    // paddingVertical: verticalScale(16),
    // marginBottom: verticalScale(14),
    // elevation: 1,
    // shadowColor: "#C0A882",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.12,
    // shadowRadius: 4,
    marginHorizontal : scale(10),
    gap: scale(6),
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    borderWidth : moderateScale(0.7),
     borderColor : '#DFCEBB',
     backgroundColor : '#FEEEDD',
     borderRadius : scale(12),
     paddingVertical : verticalScale(10)
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
    marginHorizontal  : scale(10),
    padding: scale(16),
    marginTop: verticalScale(14),
    // elevation: 1,
    // shadowColor: "#C0A882",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.12,
    // shadowRadius: 4,
    borderColor : '#B3D7E9',
    borderWidth : moderateScale(0.7)
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
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(10),
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: verticalScale(3),
  },
  tabActivePill: {
    backgroundColor: "#C47F00",
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(-18),
    elevation: 4,
    shadowColor: "#C47F00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: moderateScale(10),
    color: "#666",
  },
});