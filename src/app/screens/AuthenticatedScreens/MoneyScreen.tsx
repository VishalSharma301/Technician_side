    import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { moderateScale, scale, verticalScale } from "../../../util/scaling";

// ── Types ────────────────────────────────────────────────────────────────────

interface PayoutEntry {
  date: string;
  jobs: number;
  jobAmount: number;
  payoutAmount: number;
  status: "Pending" | "Success";
}

interface WeekDay {
  label: string;
  value: number;
  isHighlighted?: boolean;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const WEEK_DATA: WeekDay[] = [
  { label: "Mon", value: 1200 },
  { label: "Tue", value: 800 },
  { label: "Wed", value: 2200 },
  { label: "Thu", value: 1800 },
  { label: "Fri", value: 3800, isHighlighted: true },
  { label: "Sat", value: 900 },
  { label: "Sun", value: 20000 },
];

const PAYOUT_HISTORY: PayoutEntry[] = [
  {
    date: "Apr 5",
    jobs: 3,
    jobAmount: 4200,
    payoutAmount: 3276,
    status: "Pending",
  },
  {
    date: "Mar 29",
    jobs: 5,
    jobAmount: 8640,
    payoutAmount: 6739,
    status: "Success",
  },
  {
    date: "Mar 22",
    jobs: 4,
    jobAmount: 6100,
    payoutAmount: 4758,
    status: "Success",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatAmount = (amount: number): string => {
  if (amount >= 1000) {
    const rounded = amount / 1000;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}k`;
  }
  return String(amount);
};

const MAX_BAR_VALUE = Math.max(...WEEK_DATA.map((d) => d.value));
const BAR_MAX_HEIGHT = verticalScale(80);

// ── Sub-components ────────────────────────────────────────────────────────────

const SummaryCard: React.FC<{
  amount: string;
  label: string;
  style?: object;
  amountStyle?: object;
}> = ({ amount, label, style, amountStyle }) => (
  <View style={[styles.summaryCard, style]}>
    <Text style={[styles.summaryAmount, amountStyle]}>{amount}</Text>
    <Text style={[styles.summaryLabel, amountStyle]}>{label}</Text>
  </View>
);

const BarChart: React.FC = () => {
  return (
    <View style={styles.chartContainer}>
      <View style={styles.barsRow}>
        {WEEK_DATA.map((day) => {
          const barHeight = (day.value / MAX_BAR_VALUE) * BAR_MAX_HEIGHT;
          return (
            <View key={day.label} style={styles.barColumn}>
              <Text style={styles.barValue}>{formatAmount(day.value)}</Text>
              <View
                style={[
                  styles.bar,
                  { height: barHeight },
                  day.isHighlighted && styles.barHighlighted,
                ]}
              />
              <Text style={styles.barLabel}>{day.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const StatusBadge: React.FC<{ status: "Pending" | "Success" }> = ({
  status,
}) => {
  const isPending = status === "Pending";
  return (
    <View
      style={[
        styles.badge,
        isPending ? styles.badgePending : styles.badgeSuccess,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          isPending ? styles.badgeTextPending : styles.badgeTextSuccess,
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

const PayoutHistoryCard: React.FC = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Payout History</Text>
    <View style={styles.approvalSummaryBox}>
      <Text style={styles.approvalLabel}>APPROVAL SUMMARY</Text>
      {PAYOUT_HISTORY.map((entry, index) => (
        <View key={entry.date}>
          <View style={styles.payoutRow}>
            <View style={styles.payoutLeft}>
              <Text style={styles.payoutDate}>{entry.date}</Text>
              <Text style={styles.payoutJobs}>
                {entry.jobs} jobs · ₹{entry.jobAmount.toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={styles.payoutRight}>
              <Text style={styles.payoutAmount}>
                ₹{entry.payoutAmount.toLocaleString("en-IN")}
              </Text>
              <StatusBadge status={entry.status} />
            </View>
          </View>
          {index < PAYOUT_HISTORY.length - 1 && (
            <View style={styles.divider} />
          )}
        </View>
      ))}
    </View>
  </View>
);

// ── Tab Bar ───────────────────────────────────────────────────────────────────

const TAB_ITEMS = [
  { label: "Money", icon: "₹", isActive: true },
  { label: "History", icon: "≡", isActive: false },
  { label: "", icon: "💼", isCenter: true },
  { label: "Alerts", icon: "🔔", isActive: false },
  { label: "Profile", icon: "👤", isActive: false },
];

const TabBar: React.FC = () => (
  <View style={styles.tabBar}>
    {TAB_ITEMS.map((tab, index) => {
      if (tab.isCenter) {
        return (
          <TouchableOpacity key={index} style={styles.tabCenterButton}>
            <Text style={styles.tabCenterIcon}>💼</Text>
          </TouchableOpacity>
        );
      }
      return (
        <TouchableOpacity key={index} style={styles.tabItem}>
          <Text style={[styles.tabIcon, tab.isActive && styles.tabIconActive]}>
            {tab.icon}
          </Text>
          <Text
            style={[styles.tabLabel, tab.isActive && styles.tabLabelActive]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

const MoneyScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#EFE3D0" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings</Text>
          <Text style={styles.headerSubtitle}>April 2025</Text>
       

        {/* Summary Cards Grid */}
        <View style={styles.summaryGrid}>
          <SummaryCard
            amount="₹16,040"
            label="Total"
            style={styles.cardTotal}
            amountStyle={styles.amountDark}
          />
          <SummaryCard
            amount="₹12,000"
            label="This Week"
            style={styles.cardWeek}
            amountStyle={styles.amountPurple}
          />
          <SummaryCard
            amount="₹12,840"
            label="Paid Out"
            style={styles.cardPaidOut}
            amountStyle={styles.amountOlive}
          />
          <SummaryCard
            amount="₹3,200"
            label="Pending"
            style={styles.cardPending}
            amountStyle={styles.amountPink}
          />
        </View>
 </View>
        {/* This Week Bar Chart */}
        <View style={styles.section}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>This Week</Text>
            <Text style={styles.chartAmount}>₹1,200</Text>
          </View>
          <BarChart />
        </View>

        {/* Payout History */}
        <PayoutHistoryCard />
      </ScrollView>

      {/* Bottom Tab Bar */}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const BROWN = "#864C2D";
const PURPLE = "#4338CA";
const OLIVE = "#729869";
const PINK = "#BA0092";
const HIGHLIGHT_BLUE = "#2A7FC1";
const BAR_BLUE_LIGHT = "#C5DCF0";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF5EB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(120),
    
  },

  // ── Header
  header: {
    paddingHorizontal: scale(9.12),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(12),
    backgroundColor : '#F2DDC5',
    marginBottom : verticalScale(16),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: BROWN,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: moderateScale(13),
    color: BROWN,
    marginTop: verticalScale(2),
    opacity: 0.75,
  },

  // ── Summary Grid
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent : 'space-between',
    // paddingHorizontal: scale(16),
    gap: scale(10),
    marginBottom: verticalScale(22),
    marginTop : verticalScale(18)
  },
  summaryCard: {
    width: "48%",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
  },
  summaryAmount: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    marginBottom: verticalScale(2),
  },
  summaryLabel: {
    fontSize: moderateScale(12),
    color: "#666",
    fontWeight: "500",
  },

  // Card variants
  cardTotal: {
    backgroundColor: "#FFF5EB",
    borderWidth: 1.5,
    borderColor: "#864C2D",
  },
  cardWeek: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1.5,
    borderColor: "#4338CA",
  },
  cardPaidOut: {
    backgroundColor: "#72986924",
    borderWidth: 1.5,
    borderColor: "#729869",
  },
  cardPending: {
    backgroundColor: "#FAE8F1",
    borderWidth: 1.5,
    borderColor: "#BA0092",
  },

  amountDark: { color: "#864C2D" },
  amountPurple: { color: PURPLE },
  amountOlive: { color: OLIVE },
  amountPink: { color: PINK },

  // ── Section wrapper (white card)
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(8),
    marginHorizontal: scale(9),
    marginBottom: verticalScale(14),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    borderWidth : 1,
    borderColor : '#E0F2FE',
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.06,
    // shadowRadius: 6,
    // elevation: 2,
  },

  // ── Chart
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(14),
  },
  chartTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#2A7FC1",
  },
  chartAmount: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#2A7FC1",
  },
  chartContainer: {
    flexDirection: "column",
  },
  barsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: verticalScale(120),
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barValue: {
    fontSize: moderateScale(9),
    color: "#5B8AB8",
    marginBottom: verticalScale(3),
    fontWeight: "600",
  },
  bar: {
    width: scale(28),
    backgroundColor: BAR_BLUE_LIGHT,
    borderRadius: moderateScale(5),
    minHeight: verticalScale(6),
  },
  barHighlighted: {
    backgroundColor: HIGHLIGHT_BLUE,
  },
  barLabel: {
    fontSize: moderateScale(10),
    color: "#6B8DAA",
    marginTop: verticalScale(5),
    fontWeight: "500",
  },

  // ── Payout History
  sectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: BROWN,
    marginBottom: verticalScale(14),
  },
  approvalSummaryBox: {
    borderWidth: 1,
    borderColor: "#B3D7E9",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
  },
  approvalLabel: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#0EA5E9",
    letterSpacing: 0.8,
    marginBottom: verticalScale(10),
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: verticalScale(8),
  },
  payoutLeft: {
    flex: 1,
  },
  payoutDate: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: verticalScale(3),
  },
  payoutJobs: {
    fontSize: moderateScale(12),
    color: "#0EA5E9",
    fontWeight: "500",
  },
  payoutRight: {
    alignItems: "flex-end",
    gap: verticalScale(4),
  },
  payoutAmount: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#1A1A1A",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0EBF8",
    marginVertical: verticalScale(2),
  },

  // ── Badge
  badge: {
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(3),
  },
  badgePending: {
    backgroundColor: "#FFF7ED",
  },
  badgeSuccess: {
    backgroundColor: "#ECFDF5",
  },
  badgeText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  badgeTextPending: {
    color: "#EA580C",
  },
  badgeTextSuccess: {
    color: "#05A0A8",
  },

  // ── Tab Bar
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(24),
    marginHorizontal: scale(16),
    marginBottom: verticalScale(16),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E8D8C4",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    fontSize: moderateScale(18),
    color: "#999",
    marginBottom: verticalScale(2),
  },
  tabIconActive: {
    color: BROWN,
  },
  tabLabel: {
    fontSize: moderateScale(10),
    color: "#999",
    fontWeight: "500",
  },
  tabLabelActive: {
    color: BROWN,
    fontWeight: "700",
  },
  tabCenterButton: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -verticalScale(18),
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  tabCenterIcon: {
    fontSize: moderateScale(22),
  },
});

export default MoneyScreen;