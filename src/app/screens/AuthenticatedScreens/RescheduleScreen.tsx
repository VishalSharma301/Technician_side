// src/app/screens/AuthenticatedScreens/RescheduleScreen.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { scale, verticalScale, moderateScale } from "../../../util/scaling";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useContext } from "react";
import { AuthContext } from "../../../store/AuthContext";
import { useJobs } from "../../../store/JobContext";
import { Job, JobStatus } from "../../../constants/jobTypes";
import {
  handleRescheduleJob,
  RescheduleType,
} from "../../../util/resheduleHandler";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY_COLOR = "#864C2D";
const SECONDARY_COLOR = "#936140";
const BG_COLOR = "#FFF5EB";
const CARD_BG = "#F5F9FF";
const BORDER_COLOR = "#F5F9FF";
const ACCENT_BLUE = "#2563EB";

const TIME_SLOTS = [
  "7:00–9:00 AM",
  "9:00–11:00 AM",
  "11:00 AM–1:00 PM",
  "1:00–3:00 PM",
  "3:00–5:00 PM",
  "5:00–7:00 PM",
];

type ReasonOption = {
  key: RescheduleType | "customer_busy" | "technical_issue" | "other";
  label: string;
  emoji: string;
};

const REASON_OPTIONS: ReasonOption[] = [
  { key: "parts_pending", label: "Part not here", emoji: "🔧" },
  { key: "workshop_required", label: "Workshop needed", emoji: "🏭" },
  { key: "customer_busy", label: "Customer busy", emoji: "🔴" },
  { key: "technical_issue", label: "Technical issue", emoji: "⚠️" },
  { key: "other", label: "Other reason", emoji: "💬" },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatSlot(scheduledDate: string | undefined): string {
  if (!scheduledDate) return "Not specified";
  const date = new Date(scheduledDate);
  const start = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  date.setHours(date.getHours() + 2);
  const end = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${start} – ${end}`;
}

// ─── Step Badge ───────────────────────────────────────────────────────────────

const StepBadge = ({ number }: { number: string }) => (
  <View style={styles.stepBadge}>
    <Text style={styles.stepBadgeText}>{number}</Text>
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────

const RescheduleScreen = () => {
  const route = useRoute<any>();
  const job: Job = route.params?.job;
  const navigation = useNavigation<any>();
  const { token } = useContext(AuthContext);
  const { updateStatus } = useJobs();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [extraNote, setExtraNote] = useState("");
  const [loading, setLoading] = useState(false);

  const userName = job?.user?.name || "Customer";
  const serviceName = job?.service?.name || "Service";
  const currentSlot = formatSlot(job?.scheduledDate);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const onDateChange = (_: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) setSelectedDate(date);
  };

  const handleConfirm = useCallback(async () => {
    if (!selectedDate) {
      Alert.alert("Required", "Please pick a new date.");
      return;
    }
    if (!selectedSlot) {
      Alert.alert("Required", "Please pick a time slot.");
      return;
    }
    if (!selectedReason) {
      Alert.alert("Required", "Please select a reason.");
      return;
    }

    // Map reason to reschedule type
    const isMappedType =
      selectedReason === "parts_pending" ||
      selectedReason === "workshop_required";

    const type: RescheduleType = isMappedType
      ? (selectedReason as RescheduleType)
      : "parts_pending"; // fallback for other reasons

    try {
      setLoading(true);
      const isoDate = selectedDate.toISOString().split("T")[0];

      await handleRescheduleJob(job._id, type, {
        partName:
          selectedReason === "parts_pending" ? "Pending Part" : "Workshop Item",
        repairRequired: extraNote || "Rescheduled by technician",
        estimatedCost: "0",
        expectedReturnDate: isoDate,
        expectedReturnDateLabel: isoDate,
      });

      // Update status
      if (type === "parts_pending") {
        updateStatus(job._id, JobStatus.PARTS_PENDING);
      } else if (type === "workshop_required") {
        updateStatus(job._id, JobStatus.WORKSHOP_REQUIRED);
      }

      Alert.alert("Success", "Job rescheduled successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to reschedule job");
    } finally {
      setLoading(false);
    }
  }, [
    selectedDate,
    selectedSlot,
    selectedReason,
    extraNote,
    job,
    token,
    updateStatus,
    navigation,
  ]);


  console.log('ressssssdnjnafjndflksfkshjjsfljfjslfkjslkdflskf /n');
  
  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon
            name="chevron-left"
            size={moderateScale(22)}
            color={SECONDARY_COLOR}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{'Reschedule Job'}</Text>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>In Progress</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* TITLE */}
        <View style={styles.titleRow}>
          <Icon
            name="calendar-refresh"
            size={moderateScale(20)}
            color={PRIMARY_COLOR}
          />
          <Text style={styles.titleText}>Reschedule Job</Text>
        </View>

        {/* CUSTOMER INFO CARD */}
        <View style={styles.customerCard}>
          <Text style={styles.customerName}>{userName}</Text>
          <Text style={styles.customerSlot}>
            {serviceName} · {currentSlot}
          </Text>
        </View>

        {/* ── STEP 1: PICK DATE ── */}
        <View style={styles.sectionHeader}>
          <StepBadge number="01" />
          <Text style={styles.sectionTitle}>Pick New Date</Text>
        </View>

        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dateInputText,
              selectedDate && styles.dateInputTextFilled,
            ]}
          >
            {selectedDate ? formatDate(selectedDate) : "DD-MM-YYYY"}
          </Text>
          <Icon
            name="calendar-month-outline"
            size={moderateScale(20)}
            color={SECONDARY_COLOR}
          />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        {/* ── STEP 2: PICK TIME SLOT ── */}
        <View style={[styles.sectionHeader, { marginTop: verticalScale(16) }]}>
          <StepBadge number="02" />
          <Text style={styles.sectionTitle}>Pick Time Slot</Text>
        </View>

        <View style={styles.slotsGrid}>
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.slotItem, isSelected && styles.slotItemSelected]}
                onPress={() => setSelectedSlot(slot)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.slotText,
                    isSelected && styles.slotTextSelected,
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── STEP 3: REASON ── */}
        <View style={[styles.sectionHeader, { marginTop: verticalScale(16) }]}>
          <StepBadge number="03" />
          <Text style={styles.sectionTitle}>Reason</Text>
        </View>

        <View style={styles.reasonsContainer}>
          {REASON_OPTIONS.map((option) => {
            const isSelected = selectedReason === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.reasonItem,
                  isSelected && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(option.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.reasonEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.reasonText,
                    isSelected && styles.reasonTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* EXTRA NOTE */}
        <Text style={styles.extraNoteLabel}>Extra note (optional)</Text>
        <TextInput
          style={styles.extraNoteInput}
          placeholder="Any Details ...."
          placeholderTextColor="#C4B5A5"
          multiline
          numberOfLines={4}
          value={extraNote}
          onChangeText={setExtraNote}
          textAlignVertical="top"
        />

        {/* BOTTOM CONFIRM BUTTON */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.confirmBtnText}>Confirm Reschedule</Text>
                <Icon
                  name="calendar-check"
                  size={moderateScale(18)}
                  color="#fff"
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Spacer for bottom bar */}
        <View style={{ height: verticalScale(90) }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    backgroundColor: "#F2DDC5",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  backText: {
    fontSize: moderateScale(13),
    color: SECONDARY_COLOR,
  },
  headerTitle: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: "#1a1a1a",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: "#729869",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(4),
  },
  statusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: 99,
    backgroundColor: "#fff",
  },
  statusPillText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#fff",
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(16),
    borderWidth: 1,
    marginHorizontal: scale(9),
    marginVertical: verticalScale(20),
    borderColor: "#F2D6B5",
    borderRadius: scale(8),
    backgroundColor: "#FFFFFF",
  },

  // Title
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: verticalScale(12),
  },
  titleText: {
    fontSize: moderateScale(17),
    fontWeight: "700",
    color: "#864C2D",
  },

  // Customer card
  customerCard: {
    backgroundColor: CARD_BG,
    borderRadius: scale(10),
    borderWidth: 0.5,
    borderColor: BORDER_COLOR,
    padding: scale(14),
    marginBottom: verticalScale(16),
  },
  customerName: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#1B5678",
    marginBottom: verticalScale(3),
  },
  customerSlot: {
    fontSize: moderateScale(12),
    color: '#2b6277',
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: verticalScale(10),
  },
  stepBadge: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: 99,
    backgroundColor: SECONDARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: "700",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#864C2D",
  },

  // Date input
  dateInput: {
    backgroundColor: CARD_BG,
    borderRadius: scale(10),
    borderWidth: 0.5,
    borderColor: BORDER_COLOR,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateInputText: {
    fontSize: moderateScale(14),
    color: "#1B5678",
  },
  dateInputTextFilled: {
    color: "#1a1a1a",
    fontWeight: "600",
  },

  // Time slots grid
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },
  slotItem: {
    width: "47%",
    backgroundColor: CARD_BG,
    borderRadius: scale(8),
    borderWidth: moderateScale(1),
    borderColor: BORDER_COLOR,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(10),
    alignItems: "center",
  },
  slotItemSelected: {
    backgroundColor: "#EEF4FF",
    borderColor: ACCENT_BLUE,
    borderWidth: 1.5,
  },
  slotText: {
    fontSize: moderateScale(12),
    color: "#555",
    fontWeight: "500",
  },
  slotTextSelected: {
    color: ACCENT_BLUE,
    fontWeight: "700",
  },

  // Reasons
  reasonsContainer: {
    gap: verticalScale(8),
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    backgroundColor: CARD_BG,
    borderRadius: scale(10),
    borderWidth: 0.5,
    borderColor: BORDER_COLOR,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
  },
  reasonItemSelected: {
    backgroundColor: "#FFF5E6",
    borderColor: "#E8A254",
    borderWidth: 1.5,
  },
  reasonEmoji: {
    fontSize: moderateScale(12),
  },
  reasonText: {
    fontSize: moderateScale(13),
    color: "#555",
    fontWeight: "500",
  },
  reasonTextSelected: {
    color: PRIMARY_COLOR,
    fontWeight: "700",
  },

  // Extra note
  extraNoteLabel: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  extraNoteInput: {
    backgroundColor: CARD_BG,
    borderRadius: scale(10),
    borderWidth: 0.5,
    borderColor: BORDER_COLOR,
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(12),
    fontSize: moderateScale(13),
    color: "#1a1a1a",
    minHeight: verticalScale(100),
  },

  // Bottom bar
  bottomBar: {
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
    backgroundColor: ACCENT_BLUE,
    borderRadius: scale(12),
    paddingVertical: verticalScale(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
});

export default RescheduleScreen;
