// src/app/screens/AuthenticatedScreens/AddPartScreen.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { getInventory, addUsedParts } from "../../../api/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryPart {
  _id: string;
  productName: string;
  price: number;
  warrantyMonths?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AddPartScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { job } = route.params;

  const [inventory, setInventory] = useState<InventoryPart[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [qty, setQty] = useState(1);
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch inventory ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getInventory();
        setInventory(res.items || []);
      } catch (e) {
        Alert.alert("Error", "Failed to load inventory");
      } finally {
        setLoadingInventory(false);
      }
    })();
  }, []);

  const filtered = inventory.filter((p) =>
    p.productName.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Select a part → open qty modal ──────────────────────────────────────────
  const handleSelectPart = (part: InventoryPart) => {
    setSelectedPart(part);
    setQty(1);
    setQtyModalVisible(true);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleAddToList = useCallback(async () => {
    if (!selectedPart) return;
    try {
      setSubmitting(true);
      await addUsedParts(job._id, [
        { inventoryItemId: selectedPart._id, quantity: qty },
      ]);
      setQtyModalVisible(false);
      Alert.alert(
        "Added!",
        `${selectedPart.productName} ×${qty} added successfully.`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to add part",
      );
    } finally {
      setSubmitting(false);
    }
  }, [selectedPart, qty, job._id, navigation]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="chevron-left" size={moderateScale(22)} color={BROWN} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Icon name="puzzle-outline" size={moderateScale(16)} color={BROWN} />
          <Text style={styles.headerTitle}>Add Part</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>In Progress</Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: scale(9),
          marginTop: verticalScale(22),
          alignItems: "center",
          gap: scale(6),
        }}
      >
        <Icon name="puzzle-outline" size={moderateScale(20)} color={BROWN} />
        <Text
          style={[
            styles.headerTitle,
            { color: BROWN, fontSize: moderateScale(16), fontWeight: "600" },
          ]}
        >
          Add Parts
        </Text>
      </View>
      {/* ── CONTENT CARD ── */}
      <View style={styles.card}>
      <View style={styles.searchBox}>
        {/* Search */}
        <View style={styles.searchBox2}>
          <Icon name="magnify" size={moderateScale(18)} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search from list"
            placeholderTextColor="#bbb"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        </View>

        {loadingInventory ? (
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
            {filtered.map((part) => (
              <TouchableOpacity
                key={part._id}
                style={styles.partTile}
                onPress={() => handleSelectPart(part)}
                activeOpacity={0.75}
              >
                <Text style={styles.partName}>{part.productName}</Text>
                <Text style={styles.partPrice}>
                  ₹{part.price.toLocaleString("en-IN")}
                </Text>
              </TouchableOpacity>
            ))}

            {filtered.length === 0 && (
              <Text style={styles.emptyText}>No parts found.</Text>
            )}
          </ScrollView>
        )}

        {/* Next / CTA */}
        <TouchableOpacity
          style={[styles.nextBtn, !selectedPart && { opacity: 0.5 }]}
          disabled={!selectedPart}
          onPress={() => selectedPart && setQtyModalVisible(true)}
        >
          <Text style={styles.nextBtnText}>Next</Text>
          <Icon name="arrow-right" size={moderateScale(16)} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── QUANTITY MODAL ── */}
      <Modal
        visible={qtyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQtyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Icon
                name="puzzle-outline"
                size={moderateScale(18)}
                color={BROWN}
              />
              <Text style={styles.modalTitle}>Add Part</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setQtyModalVisible(false)}
              >
                <Icon name="close" size={moderateScale(18)} color="#059669" />
              </TouchableOpacity>
            </View>

            {/* Selected Part Info */}
            {selectedPart && (
              <View style={styles.selectedPartBox}>
                <Text style={styles.selectedPartName}>
                  {selectedPart?.productName || 'part'}
                </Text>
                <Text style={styles.selectedPartUnit}>
                  {selectedPart?.price.toLocaleString("en-IN") || '0'} / unit
                </Text>
              </View>
            )}

            {/* Qty label */}
            <Text style={styles.qtyLabel}>Quantity needed</Text>

            {/* Qty Stepper */}
            <View style={styles.qtyStepper}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Icon name="minus" size={moderateScale(18)} color={NAVY} />
              </TouchableOpacity>

              <View style={styles.qtyDisplay}>
                <Text style={styles.qtyValue}>
                  {qty.toString().padStart(2, "0")}
                </Text>
                <Text style={styles.qtyUnit}>Units</Text>
              </View>

              <TouchableOpacity
                style={[styles.qtyBtn, styles.qtyBtnPlus]}
                onPress={() => setQty((q) => q + 1)}
              >
                <Icon name="plus" size={moderateScale(18)} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Total Row */}
            {selectedPart && (
              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>TOTAL</Text>
                  <Text style={styles.totalCalc}>
                    {qty}×{selectedPart.price.toLocaleString("en-IN")}
                  </Text>
                </View>
                <Text style={styles.totalAmount}>
                  ₹{(selectedPart.price * qty).toLocaleString("en-IN")}
                </Text>
              </View>
            )}

            {/* CTA Buttons */}
            <TouchableOpacity
              style={[styles.addToListBtn, submitting && { opacity: 0.7 }]}
              onPress={handleAddToList}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.addToListText}>Send for Approval</Text>
                  <Icon
                    name="send-outline"
                    size={moderateScale(18)}
                    color="#fff"
                  />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changePartBtn}
              onPress={() => setQtyModalVisible(false)}
            >
              <Text style={styles.changePartText}>Change part</Text>
              <Icon name="cog-outline" size={moderateScale(16)} color="#555" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Colors ───────────────────────────────────────────────────────────────────

const BROWN = "#864C2D";
const NAVY = "#004DBD";
const BG = "#FFF5EB";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
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
    color: "#936140",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  headerTitle: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: "#864C2D",
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

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: scale(14),
    borderWidth: 0.5,
    borderColor: "#F2D6B5",
    margin: scale(14),
    padding: scale(14),
    flex: 1,
  },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "#FEEDDC",
    borderRadius: scale(8),
    borderWidth: moderateScale(1),
    borderColor: "#F2D6B5",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    marginBottom: verticalScale(14),
  },
  searchBox2: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "#fff",
    borderRadius: scale(4),
    borderWidth: moderateScale(1),
    borderColor: "#F2D6B5",
    paddingHorizontal: scale(12),
    // minHeight: verticalScale(34),
    // height: verticalScale(34),
    width: "100%",
    // paddingVertical: verticalScale(10),
    // marginBottom: verticalScale(14),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(11),
    color: "#1a1a1a",
    backgroundColor  :'#fff',
    // borderWidth : 1,
    borderColor : '#DEC5AD',
    // borderRadius : scale(4),
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(10),
    paddingBottom: verticalScale(16),
  },
  partTile: {
    width: "47%",
    backgroundColor: "#FFF8F3",
    borderRadius: scale(10),
    borderWidth: 0.5,
    borderColor: "#F2D6B5",
    padding: scale(14),
    gap: verticalScale(6),
  },
  partName: {
    fontSize: moderateScale(13),
    fontWeight: "500",
    color: BROWN,
  },
  partPrice: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#B45309",
  },
  emptyText: {
    fontSize: moderateScale(13),
    color: "#aaa",
    textAlign: "center",
    paddingVertical: verticalScale(20),
    width: "100%",
  },

  // Next button
  nextBtn: {
    backgroundColor: BROWN,
    borderRadius: scale(10),
    paddingVertical: verticalScale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    marginTop: verticalScale(10),
  },
  nextBtnText: {
    color: "#fff",
    fontSize: moderateScale(15),
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(20),
    paddingBottom: verticalScale(36),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: verticalScale(16),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#864C2D",
    flex: 1,
  },
  modalCloseBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: "#EDF8F4",
    alignItems: "center",
    borderColor : '#CEEBE1',
    borderWidth : 1,
    justifyContent: "center",
  },

  // Selected part info
  selectedPartBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: scale(10),
    padding: scale(14),
    marginBottom: verticalScale(16),
    borderWidth: 0.5,
    borderColor: "#BFDBFE",
  },
  selectedPartName: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: "#1e3a5f",
  },
  selectedPartUnit: {
    fontSize: moderateScale(12),
    color: "#D97706",
    marginTop: verticalScale(2),
  },

  // Qty
  qtyLabel: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    color: "#555",
    marginBottom: verticalScale(16),
  },
  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(28),
    marginBottom: verticalScale(20),
  },
  qtyBtn: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(12),
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnPlus: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  qtyDisplay: {
    alignItems: "center",
  },
  qtyValue: {
    fontSize: moderateScale(40),
    fontWeight: "700",
    color: "#1a1a1a",
    lineHeight: moderateScale(44),
  },
  qtyUnit: {
    fontSize: moderateScale(11),
    color: "#aaa",
    marginTop: verticalScale(2),
  },

  // Total
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: scale(10),
    padding: scale(14),
    borderWidth: 0.5,
    borderColor: "#FDE68A",
    marginBottom: verticalScale(16),
  },
  totalLabel: {
    fontSize: moderateScale(10),
    fontWeight: "700",
    color: "#B45309",
    letterSpacing: 0.8,
  },
  totalCalc: {
    fontSize: moderateScale(11),
    color: "#888",
    marginTop: verticalScale(2),
  },
  totalAmount: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    color: "#B45309",
  },

  // CTA Buttons
  addToListBtn: {
    backgroundColor: BROWN,
    borderRadius: scale(10),
    paddingVertical: verticalScale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    marginBottom: verticalScale(10),
  },
  addToListText: {
    color: "#fff",
    fontSize: moderateScale(15),
    fontWeight: "600",
  },
  changePartBtn: {
    borderRadius: scale(10),
    paddingVertical: verticalScale(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  changePartText: {
    color: "#555",
    fontSize: moderateScale(14),
    fontWeight: "500",
  },
});

export default AddPartScreen;
