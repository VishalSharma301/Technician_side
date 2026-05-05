import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { moderateScale, scale, verticalScale } from "../../../util/scaling";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../../store/AuthContext"; // ← adjust path
import { fetchEarnings } from "../../../util/technicianApis"; // ← adjust path

// ── Types ─────────────────────────────────────────────────────────────────────

interface WeekDay {
  day: string;
  date: string;
  amount: number;
  jobs: number;
}

interface PayoutEntry {
  weekLabel: string;
  jobs: number;
  totalAmount: number;
  status: "pending" | "success";
}

interface Summary {
  totalEarned: number;
  thisWeek: number;
  thisMonth: number;
  avgPerJob: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatAmount = (amount: number): string => {
  if (amount >= 1000) {
    const rounded = amount / 1000;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}k`;
  }
  return String(amount);
};

const formatINR = (amount: number): string =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

// ── Sub-components ─────────────────────────────────────────────────────────────

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

const BarChart: React.FC<{ weekData: WeekDay[] }> = ({ weekData }) => {
  const maxVal   = Math.max(...weekData.map((d) => d.amount), 1);
  const maxHeight = verticalScale(80);
  // Today's abbreviated day name e.g. "Fri"
  const todayDay  = new Date()
    .toLocaleDateString("en-US", { weekday: "short" })
    .slice(0, 3);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.barsRow}>
        {weekData.map((day) => {
          const barHeight = (day.amount / maxVal) * maxHeight;
          const isHighlighted = day.day === todayDay;
          return (
            <View key={day.date} style={styles.barColumn}>
              <Text style={styles.barValue}>
                {day.amount > 0 ? formatAmount(day.amount) : ""}
              </Text>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(barHeight, verticalScale(6)) },
                  isHighlighted && styles.barHighlighted,
                ]}
              />
              <Text style={styles.barLabel}>{day.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const StatusBadge: React.FC<{ status: "pending" | "success" }> = ({ status }) => {
  const isPending = status === "pending";
  return (
    <View style={[styles.badge, isPending ? styles.badgePending : styles.badgeSuccess]}>
      <Text
        style={[
          styles.badgeText,
          isPending ? styles.badgeTextPending : styles.badgeTextSuccess,
        ]}
      >
        {isPending ? "Pending" : "Success"}
      </Text>
    </View>
  );
};

const PayoutHistoryCard: React.FC<{ history: PayoutEntry[] }> = ({ history }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Payout History</Text>
    <View style={styles.approvalSummaryBox}>
      <Text style={styles.approvalLabel}>APPROVAL SUMMARY</Text>
      {history.map((entry, index) => (
        <View key={`${entry.weekLabel}-${index}`}>
          <View style={styles.payoutRow}>
            <View style={styles.payoutLeft}>
              <Text style={styles.payoutDate}>{entry.weekLabel}</Text>
              <Text style={styles.payoutJobs}>{entry.jobs} jobs</Text>
            </View>
            <View style={styles.payoutRight}>
              <Text style={styles.payoutAmount}>{formatINR(entry.totalAmount)}</Text>
              <StatusBadge status={entry.status} />
            </View>
          </View>
          {index < history.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

const MoneyScreen: React.FC = () => {
  const { token } = useContext(AuthContext); // ← make sure token lives in AuthContext

  const [summary, setSummary]         = useState<Summary | null>(null);
  const [weekData, setWeekData]       = useState<WeekDay[]>([]);
  const [history, setHistory]         = useState<PayoutEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);
        const data = await fetchEarnings(token);
        setSummary(data.summary);
        setWeekData(data.weeklyChart);
        setHistory(data.payoutHistory);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load earnings.");
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

  // Current month label e.g. "April 2025"
  const monthLabel = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Week total shown next to "This Week" chart title
  const weekTotal = summary ? formatINR(summary.thisWeek) : "—";

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#864C2D" />
          <Text style={styles.loadingText}>Loading earnings…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error && !summary) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#EFE3D0" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor="#864C2D"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings</Text>
          <Text style={styles.headerSubtitle}>{monthLabel}</Text>

          {/* Summary Cards Grid — mapped from API */}
          <View style={styles.summaryGrid}>
            <SummaryCard
              amount={summary ? formatINR(summary.totalEarned) : "—"}
              label="Total"
              style={styles.cardTotal}
              amountStyle={styles.amountDark}
            />
            <SummaryCard
              amount={summary ? formatINR(summary.thisWeek) : "—"}
              label="This Week"
              style={styles.cardWeek}
              amountStyle={styles.amountPurple}
            />
            <SummaryCard
              amount={summary ? formatINR(summary.thisMonth) : "—"}
              label="This Month"
              style={styles.cardPaidOut}
              amountStyle={styles.amountOlive}
            />
            <SummaryCard
              amount={summary ? formatINR(summary.avgPerJob) : "—"}
              label="Avg / Job"
              style={styles.cardPending}
              amountStyle={styles.amountPink}
            />
          </View>
        </View>

        {/* This Week Bar Chart — mapped from API */}
        {weekData.length > 0 && (
          <View style={styles.section}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>This Week</Text>
              <Text style={styles.chartAmount}>{weekTotal}</Text>
            </View>
            <BarChart weekData={weekData} />
          </View>
        )}

        {/* Payout History — mapped from API */}
        {history.length > 0 && <PayoutHistoryCard history={history} />}
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles (unchanged from your original) ─────────────────────────────────────

const BROWN         = "#864C2D";
const PURPLE        = "#4338CA";
const OLIVE         = "#729869";
const PINK          = "#BA0092";
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: BROWN,
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
    backgroundColor: BROWN,
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: moderateScale(14),
  },

  // ── Header
  header: {
    paddingHorizontal: scale(9.12),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(12),
    backgroundColor: "#F2DDC5",
    marginBottom: verticalScale(16),
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
    justifyContent: "space-between",
    gap: scale(10),
    marginBottom: verticalScale(22),
    marginTop: verticalScale(18),
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

  amountDark:   { color: "#864C2D" },
  amountPurple: { color: PURPLE },
  amountOlive:  { color: OLIVE },
  amountPink:   { color: PINK },

  // ── Section wrapper
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(8),
    marginHorizontal: scale(9),
    marginBottom: verticalScale(14),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    borderWidth: 1,
    borderColor: "#E0F2FE",
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

  // ── Status Badge
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
});

export default MoneyScreen;