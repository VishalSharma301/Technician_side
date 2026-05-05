// src/app/screens/AuthenticatedScreens/AddServiceScreen.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { moderateScale, scale, verticalScale } from "../../../util/scaling";
import {
  addAdditionalService,
  addCustomServices,
  getProviderServices,
} from "../../../api/services";
import { ServiceProviderService } from "../../../constants/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const BROWN = "#864C2D";
const BROWN_L = "#936140";
const BG = "#FFF5EB";
const CREAM = "#F2DDC5";
const TILE = "#FFF8F3";
const BORDER = "#F2D6B5";
const GREEN = "#059669";
const GREEN_L = "#ECFDF5";
const AMBER = "#B45309";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "pick" | "confirm" | "sent";

type ChosenService =
  | { type: "preset"; _id: string; name: string; price: number }
  | { type: "custom"; name: string; price: number };

// ─── Component ────────────────────────────────────────────────────────────────

const AddServiceScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { job } = route.params;

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("pick");
  const [isCustom, setIsCustom] = useState(false);
  const progressAnim = useState(new Animated.Value(0))[0];
  // Preset
  const [services, setServices] = useState<ServiceProviderService[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Custom
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // ── Load preset services ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getProviderServices();
        setServices(res.services || []);
      } catch {
        Alert.alert("Error", "Failed to load services");
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  // ── Derived: the chosen service ready for confirmation ─────────────────────
  const chosen: ChosenService | null = (() => {
    if (isCustom) {
      const price = parseFloat(customPrice);
      if (!customName.trim() || isNaN(price) || price <= 0) return null;
      return { type: "custom", name: customName.trim(), price };
    }
    const svc = services.find((s) => s._id === selectedId);
    if (!svc) return null;
    return {
      type: "preset",
      _id: svc._id,
      name: svc.service.name,
      price: svc.service.basePrice,
    };
  })();

  const canGoNext = chosen !== null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleConfirm = useCallback(async () => {
  if (!chosen) return;
  try {
    setSubmitting(true);

    if (chosen.type === "preset") {
      await addAdditionalService(job._id, {
        providerOfferedServiceId: chosen._id,
        quantity: 1,
      });
    } else {
      await addCustomServices(job._id, {
        serviceName: chosen.name,
        unitPrice: chosen.price,
        quantity: 1,
        
      });
    }

    // ← Notify JobDetailsScreen so it can show this immediately
    const payload =
  chosen.type === "preset"
    ? {
        name: chosen.name,
        _id: chosen._id,
        price: chosen.price,
        type: chosen.type,
      }
    : {
        name: chosen.name,
        price: chosen.price,
        type: chosen.type,
      };

// route.params?.onServiceAdded?.(payload);

    setStep("sent");
    setTimeout(() => navigation.goBack(), 2200);
  } catch (error: any) {
    Alert.alert(
      "Error",
      error?.response?.data?.message || "Failed to add service",
    );
  } finally {
    setSubmitting(false);
  }
}, [chosen, job._id, navigation, route.params]);

  useEffect(() => {
    if (step === "confirm") {
      progressAnim.setValue(0);
    }
  }, [step]);

    useEffect(() => {
    if (step === "sent") {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: false,
      }).start();
    }
  }, [step]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: verticalScale(120) }}
    >
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            step === "confirm" ? setStep("pick") : navigation.goBack()
          }
          style={styles.backBtn}
        >
          <Icon name="chevron-left" size={moderateScale(22)} color={BROWN_L} />
          <Text style={styles.backText}>
            {step === "confirm" ? "Back" : "Back"}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Icon
            name="briefcase-outline"
            size={moderateScale(16)}
            color={BROWN_L}
          />
          <Text style={styles.headerTitle}>Add Service</Text>
        </View>

        {/* Step indicator pill */}
        <View style={[styles.stepPill, true && { backgroundColor: GREEN }]}>
          <Text style={styles.stepPillText}>
            In Progress
            {/* {step === "pick" ? "Step 1 / 2" : step === "confirm" ? "Step 2 / 2" : "Done ✓"} */}
          </Text>
        </View>
      </View>

      {/* ════════════════════════════════════════
          STEP 1 — PICK
      ════════════════════════════════════════ */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: scale(9),
          marginTop: verticalScale(22),
          alignItems: "center",
          gap: scale(6),
        }}
      >
        <Icon
          name="briefcase-outline"
          size={moderateScale(20)}
          color={BROWN_L}
        />
        <Text
          style={[
            styles.headerTitle,
            { color: BROWN_L, fontSize: moderateScale(16), fontWeight: "600" },
          ]}
        >
          Add Service
        </Text>
      </View>

      {step === "pick" && (
        <View style={styles.card}>
          {/* Preset / Custom toggle */}
          <View style={styles.toggleRow}>
            {(["preset", "custom"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.toggleBtn,
                  !isCustom && t === "preset" && styles.toggleBtnActive,
                  isCustom && t === "custom" && styles.toggleBtnActive,
                ]}
                onPress={() => {
                  setIsCustom(t === "custom");
                  setSelectedId(null);
                }}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    ((!isCustom && t === "preset") ||
                      (isCustom && t === "custom")) &&
                      styles.toggleBtnTextActive,
                  ]}
                >
                  {t === "preset" ? "Preset" : "Custom"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── PRESET GRID ── */}
          {!isCustom &&
            (loadingList ? (
              <ActivityIndicator
                size="large"
                color={BROWN}
                style={{ marginTop: verticalScale(40) }}
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.grid}
              >
                {services.map((svc) => {
                  const isSel = selectedId === svc._id;
                  return (
                    <TouchableOpacity
                      key={svc._id}
                      style={[
                        styles.serviceTile,
                        isSel && styles.serviceTileSelected,
                      ]}
                      onPress={() => setSelectedId(isSel ? null : svc._id)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.serviceName,
                          isSel && styles.serviceNameSelected,
                        ]}
                      >
                        {svc.service.name}
                      </Text>
                      <Text
                        style={[
                          styles.servicePrice,
                          isSel && styles.servicePriceSelected,
                        ]}
                      >
                        ₹{svc.service.basePrice.toLocaleString("en-IN")}
                      </Text>
                      {isSel && (
                        <View style={styles.checkBadge}>
                          <Icon
                            name="check"
                            size={moderateScale(12)}
                            color="#fff"
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {services.length === 0 && (
                  <Text style={styles.emptyText}>No services available.</Text>
                )}
              </ScrollView>
            ))}

          {/* ── CUSTOM INPUTS ── */}
          {isCustom && (
            <View style={styles.customForm}>
              <Text style={styles.inputLabel}>Service Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Water Tank Cleaning"
                placeholderTextColor="#C4A882"
                value={customName}
                onChangeText={setCustomName}
              />

              <Text style={styles.inputLabel}>Price (₹)</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.pricePrefix}>₹</Text>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder="0"
                  placeholderTextColor="#C4A882"
                  keyboardType="numeric"
                  value={customPrice}
                  onChangeText={setCustomPrice}
                />
              </View>
            </View>
          )}

          {/* Next button */}
          <TouchableOpacity
            style={[styles.primaryBtn, !canGoNext && styles.primaryBtnDisabled]}
            disabled={!canGoNext}
            onPress={() => {
              setStep("confirm");
              setModalVisible(true);
            }}
          >
            <Text style={styles.primaryBtnText}>Next</Text>
            <Icon name="arrow-right" size={moderateScale(18)} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* CLOSE BUTTON */}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => {
                setModalVisible(false);
                setStep("pick");
              }}
            >
              <Icon name="close" size={moderateScale(18)} color={"#059669"} />
            </TouchableOpacity>

            {/* =========================
          CONFIRM STEP
      ========================= */}
            {step === "confirm" && chosen && (
              <>
                <Text style={styles.modalTitle}>Add Service</Text>

                <View style={styles.summaryTile}>
                  <Text style={styles.summaryName}>{chosen.name}</Text>
                  <Text style={styles.summaryPrice}>
                    ₹{chosen.price.toLocaleString("en-IN")}
                  </Text>
                </View>

                <View style={styles.infoBox}>
                  <Icon
                    name="information-outline"
                    size={20}
                    color={"#0EA5E9"}
                  />
                  <Text style={styles.infoText}>
                    <Text style={styles.infoTextBold}>
                      {job?.user?.name || "Customer"}
                    </Text>{" "}
                    will approve this service before it's added to the invoice.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send for Approval</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setModalVisible(false);
                    setStep("pick");
                  }}
                >
                  <Text style={styles.secondaryBtnText}>Change Service</Text>
                </TouchableOpacity>
              </>
            )}

            {/* =========================
          SENT STEP
      ========================= */}
            {step === "sent" && (
              <View style={{ alignItems: "center", width: "100%" }}>
                <Text style={styles.sentEmoji}>📨</Text>
                <Text style={styles.sentTitle}>Request Sent!</Text>
                <Text style={styles.sentSub}>
                  Waiting for {job?.user?.name || "customer"} to approve…
                </Text>

                {/* 🔥 Animated Progress Bar */}
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    backgroundColor: CREAM,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(2),
  },
  backText: {
    fontSize: moderateScale(13),
    color: BROWN_L,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  headerTitle: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: "#1a1a1a",
  },
  stepPill: {
    backgroundColor: BROWN,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(4),
  },
  stepPillText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#fff",
  },

  // ── Card wrapper ──
  card: {
    backgroundColor: "#fff",
    borderRadius: scale(14),
    borderWidth: 0.5,
    borderColor: BORDER,
    marginVertical: verticalScale(14),
    marginHorizontal: scale(9),
    padding: scale(14),
    flex: 1,
  },

  // ── Toggle ──
  toggleRow: {
    flexDirection: "row",
    backgroundColor: BG,
    borderRadius: scale(10),
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: scale(4),
    marginBottom: verticalScale(14),
    gap: scale(4),
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: verticalScale(9),
    borderRadius: scale(7),
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: BORDER,
    // subtle shadow
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: moderateScale(13),
    fontWeight: "500",
    color: "#aaa",
  },
  toggleBtnTextActive: {
    color: BROWN,
    fontWeight: "700",
  },

  // ── Preset grid ──
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
    paddingBottom: verticalScale(16),
  },
  serviceTile: {
    width: "47%",
    backgroundColor: TILE,
    borderRadius: scale(10),
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: scale(14),
    gap: verticalScale(6),
    position: "relative",
  },
  serviceTileSelected: {
    backgroundColor: GREEN_L,
    borderColor: GREEN,
    borderWidth: 1.5,
  },
  serviceName: {
    fontSize: moderateScale(13),
    fontWeight: "500",
    color: BROWN,
  },
  serviceNameSelected: {
    color: GREEN,
  },
  servicePrice: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: AMBER,
  },
  servicePriceSelected: {
    color: GREEN,
  },
  checkBadge: {
    position: "absolute",
    top: scale(8),
    right: scale(8),
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: moderateScale(13),
    color: "#aaa",
    textAlign: "center",
    paddingVertical: verticalScale(20),
    width: "100%",
  },

  // ── Custom form ──
  customForm: {
    flex: 1,
    gap: verticalScale(4),
  },
  inputLabel: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: BROWN_L,
    marginBottom: verticalScale(4),
    marginTop: verticalScale(10),
  },
  input: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: scale(10),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(14),
    color: "#1a1a1a",
  },
  priceInputRow: {
    position: "relative",
    justifyContent: "center",
  },
  pricePrefix: {
    position: "absolute",
    left: scale(14),
    fontSize: moderateScale(14),
    color: BROWN_L,
    fontWeight: "600",
    zIndex: 1,
  },
  priceInput: {
    paddingLeft: scale(28),
  },

  // ── Primary button ──
  primaryBtn: {
    backgroundColor: BROWN,
    borderRadius: scale(10),
    paddingVertical: verticalScale(14),
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(12),
    flexDirection: "row",
    gap: scale(8),
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: moderateScale(15),
    fontWeight: "600",
  },

  // ── Confirm step ──
  summaryTile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(14),
    backgroundColor: "#ECFDF5",
    borderRadius: scale(12),
    borderWidth: 0.7,
    borderColor: "#BEE8D9",
    padding: scale(16),
    marginBottom: verticalScale(14),
    // alignSelf: "flex-end",
  },
  summaryIconWrap: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: scale(12),
    backgroundColor: CREAM,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryName: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: verticalScale(4),
  },
  summaryPrice: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#059669",
  },
  customBadge: {
    backgroundColor: CREAM,
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(4),
    alignSelf: "flex-start",
  },
  customBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: BROWN,
  },

  infoBox: {
    flexDirection: "row",
    gap: scale(10),
    backgroundColor: "#F0F9FF",
    borderRadius: scale(10),
    borderWidth: 0.7,
    borderColor: "#D2EEFC",
    padding: scale(12),
    marginBottom: verticalScale(16),
  },
  infoText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: "#666",
    lineHeight: moderateScale(19),
  },
  infoTextBold: {
    fontWeight: "700",
    color: "#1a1a1a",
  },

  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },
  confirmAmountBox: {
    backgroundColor: "#FFF5EB",
    borderRadius: scale(10),
    borderWidth: 0.5,
    borderColor: BORDER,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    alignItems: "center",
  },
  confirmAmountLabel: {
    fontSize: moderateScale(10),
    color: BROWN_L,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  confirmAmount: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: AMBER,
    marginTop: verticalScale(2),
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: scale(10),
    paddingVertical: verticalScale(12),
    alignItems: "center",
    marginTop: verticalScale(10),
  },
  secondaryBtnText: {
    fontSize: moderateScale(14),
    color: "#1B345C",
    fontWeight: "500",
  },

  // ── Sent step ──
  sentCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: verticalScale(12),
  },
  sentEmoji: {
    fontSize: moderateScale(64),
  },
  sentTitle: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    color: "#1a1a1a",
  },
  sentSub: {
    fontSize: moderateScale(14),
    color: "#888",
    textAlign: "center",
    lineHeight: moderateScale(22),
    paddingHorizontal: scale(20),
  },
  progressTrack: {
    width: "80%",
    height: verticalScale(4),
    backgroundColor: BG,
    borderRadius: 99,
    overflow: "hidden",
    marginTop: verticalScale(8),
  },
  progressBar: {
    width: "70%",
    height: "100%",
    backgroundColor: BROWN,
    borderRadius: 99,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
    padding: scale(16),
    paddingBottom: verticalScale(24),
  },

  modalClose: {
    position: "absolute",
    top: scale(10),
    right: scale(10),
    zIndex: 10,
    backgroundColor: "#E6F4EA",
    borderRadius: scale(8),
    padding: scale(6),
  },

  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    marginBottom: verticalScale(10),
    color: BROWN,
  },
});

export default AddServiceScreen;
