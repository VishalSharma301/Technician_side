import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  completeInspection,
  startInspection,
  verifyJobOtp,
} from "../../api/inspection";
import {
  addUsedParts,
  getInventory,
  removeUsedPart,
} from "../../api/inventory";
import {
  addAdditionalService,
  getProviderServices,
  removeAdditionalService,
  requestVerification,
} from "../../api/services";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  jobId: string;
  onClose: () => void;
  onInspectionCompleted?: () => void;
};

const CoveredItem = ({ label }: { label: string }) => (
  <View style={styles.coveredItem}>
    <View style={styles.iconPlaceholder} />
    <Text style={styles.coveredText}>{label}</Text>
  </View>
);

const ServiceRow = ({
  title,
  brand,
  price,
  selected,
  onToggle,
}: {
  title: string;
  brand: string;
  price: number;
  selected: boolean;
  onToggle: () => void;
}) => (
  <View style={[styles.serviceRow, selected && styles.selectedCard]}>
    <View>
      <Text style={styles.serviceTitle}>{title}</Text>
      <View style={styles.brandBadge}>
        <Text style={styles.brandText}>{brand}</Text>
      </View>
    </View>

    <View style={styles.rowRight}>
      <Text style={styles.price}>₹ {price}</Text>
      <TouchableOpacity style={styles.plusBtn} onPress={onToggle}>
        <Text style={styles.plusText}>{selected ? "✓" : "+"}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const PartCard = ({
  name,
  warranty,
  price,
  selected,
  onToggle,
}: {
  name: string;
  warranty: string;
  price: number;
  selected: boolean;
  onToggle: () => void;
}) => (
  <View style={[styles.partCard, selected && styles.selectedCard]}>
    <View>
      <Text style={styles.partTitle}>{name}</Text>
      <Text style={styles.warranty}>{warranty}</Text>
    </View>

    <View style={styles.rowRight}>
      <Text style={styles.price}>₹ {price}</Text>
      <TouchableOpacity style={styles.plusBtn} onPress={onToggle}>
        <Text style={styles.plusText}>{selected ? "✓" : "+"}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function InspectionComponent({
  jobId,
  onClose,
  onInspectionCompleted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [inspectionStarted, setInspectionStarted] = useState(false);

  const [findings, setFindings] = useState("");
  const [isServiceCorrect, setIsServiceCorrect] = useState(true);

  const [inventory, setInventory] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [selectedParts, setSelectedParts] = useState<Record<string, any>>({});
  const [selectedServices, setSelectedServices] = useState<Record<string, any>>(
    {},
  );

  const [addedParts, setAddedParts] = useState<any[]>([]);
  const [addedServices, setAddedServices] = useState<any[]>([]);

  const [otp, setOtp] = useState<boolean>(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const [customService, setCustomService] = useState({
    name: "",
    brand: "",
    price: "",
    discount: "",
  });

  const [customPart, setCustomPart] = useState({
    name: "",
    brand: "",
    price: "",
    discount: "",
  });

  useEffect(() => {
    initInspection();
  }, []);

  // console.log('inventory ; ', inventory);
  // console.log('services ; ', services);

  async function initInspection() {
    try {
      setLoading(true);
      await startInspection(jobId);
      setInspectionStarted(true);

      const [invRes, svcRes] = await Promise.all([
        getInventory(),
        getProviderServices(),
      ]);

      setInventory(invRes.items || []);
      setServices(svcRes.services || []);
    } catch {
      Alert.alert("Error", "Failed to start inspection");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  // const handleOtpVerify = async () => {
  //   if (!jobId || !enteredOtp) {
  //     Alert.alert("Missing OTP", "Please enter the OTP.");
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     const res = await verifyJobOtp(jobId, enteredOtp);

  //     if (!res?.message) {
  //       console.warn("OTP verified but no message returned", res);
  //     }

  //     setOtpVerified(true);
  //     Alert.alert("Success", res?.message || "OTP verified successfully");

  //   } catch (error: any) {
  //     console.error("OTP VERIFY ERROR:", error);

  //     // Backend responded with error
  //     if (error?.response) {
  //       const status = error.response.status;
  //       const backendMsg =
  //         error.response.data?.message ||
  //         error.response.data?.error ||
  //         "OTP verification failed";

  //       if (status === 400) {
  //         Alert.alert("Invalid OTP", backendMsg);
  //       } else if (status === 401) {
  //         Alert.alert("Unauthorized", "Technician session expired. Please login again.");
  //       } else if (status === 403) {
  //         Alert.alert("Not Allowed", backendMsg);
  //       } else if (status === 404) {
  //         Alert.alert("Job Not Found", backendMsg);
  //       } else if (status >= 500) {
  //         Alert.alert("Server Error", "Please try again later.");
  //       } else {
  //         Alert.alert("Error", backendMsg);
  //       }

  //     // Request sent but no response
  //     } else if (error?.request) {
  //       Alert.alert(
  //         "Network Error",
  //         "Unable to reach server. Check your internet connection."
  //       );

  //     // Unexpected JS error
  //     } else {
  //       Alert.alert(
  //         "Unexpected Error",
  //         error?.message || "Something went wrong"
  //       );
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  function togglePart(item: any) {
    setSelectedParts((prev) => {
      if (prev[item._id]) {
        const copy = { ...prev };
        delete copy[item._id];
        return copy;
      }
      return { ...prev, [item._id]: { ...item, quantity: 1 } };
    });
  }

  function toggleService(service: any) {
    setSelectedServices((prev) => {
      if (prev[service._id]) {
        const copy = { ...prev };
        delete copy[service._id];
        return copy;
      }
      return { ...prev, [service._id]: service };
    });
  }

  async function addSelectedParts() {
    try {
      const payload = Object.values(selectedParts).map((p: any) => ({
        inventoryItemId: p._id,
        quantity: p.quantity,
      }));

      if (!payload.length) return;

      await addUsedParts(jobId, payload);

      // ✅ THIS WAS MISSING
      setAddedParts((prev) => [...prev, ...Object.values(selectedParts)]);

      setSelectedParts({});
      Alert.alert("Success", "Parts added");
    } catch {
      Alert.alert("Error", "Failed to add parts");
    }
  }

  async function addSelectedServices() {
    try {
      await Promise.all(
        Object.values(selectedServices).map((svc: any) =>
          addAdditionalService(jobId, {
            providerOfferedServiceId: svc._id,
            quantity: 1,
          }),
        ),
      );

      // ✅ THIS WAS MISSING
      setAddedServices((prev) => [...prev, ...Object.values(selectedServices)]);

      setSelectedServices({});
      Alert.alert("Success", "Services added");
    } catch {
      Alert.alert("Error", "Failed to add services");
    }
  }

  function addCustomService() {
    if (!customService.name || !customService.price) {
      Alert.alert("Validation", "Service name and price required");
      return;
    }

    setAddedServices((prev) => [
      ...prev,
      {
        _id: Date.now().toString(),
        service: {
          name: customService.name,
          basePrice: Number(customService.price),
        },
        brand: customService.brand,
        discount: customService.discount,
        isCustom: true,
      },
    ]);

    setCustomService({ name: "", brand: "", price: "", discount: "" });
  }

  function addCustomPart() {
    if (!customPart.name || !customPart.price) {
      Alert.alert("Validation", "Part name and price required");
      return;
    }

    setAddedParts((prev) => [
      ...prev,
      {
        _id: Date.now().toString(),
        productName: customPart.name,
        price: Number(customPart.price),
        brand: customPart.brand,
        discount: customPart.discount,
        isCustom: true,
      },
    ]);

    setCustomPart({ name: "", brand: "", price: "", discount: "" });
  }

  /* -------------------- DELETE -------------------- */

  async function deletePart(part: any) {
    try {
      await removeUsedPart(jobId, part._id);
      setAddedParts((prev) => prev.filter((p) => p._id !== part._id));
    } catch {
      Alert.alert("Error", "Failed to delete part");
    }
  }

  async function deleteService(service: any) {
    try {
      await removeAdditionalService(jobId, service._id);
      setAddedServices((prev) => prev.filter((s) => s._id !== service._id));
    } catch {
      Alert.alert("Error", "Failed to delete service");
    }
  }

  async function requestUserVerification() {
    if (!findings.trim()) {
      Alert.alert("Validation", "Please enter inspection findings");
      return;
    }

    try {
      setLoading(true);
      await requestVerification(jobId);
      setOtp(true);
    } catch {
      Alert.alert("Error", "Failed to complete inspection");
    } finally {
      setLoading(false);
    }
  }
  async function handleCompleteInspection() {
    if (!findings.trim()) {
      Alert.alert("Validation", "Please enter inspection findings");
      return;
    }

    try {
      setLoading(true);
      await completeInspection(jobId, findings, isServiceCorrect);
      onInspectionCompleted?.();
      onClose();
    } catch {
      Alert.alert("Error", "Failed to complete inspection");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !inspectionStarted) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2F80ED" />
        <Text>Starting inspection...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AC Service Inspection</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>🏆 100</Text>
        </View>
      </View>

      {/* What's Covered */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>What’s Covered</Text>
        <View style={styles.coveredGrid}>
          {[
            "Inspection of AC unit",
            "Cleaning of filter and cooling coil",
            "Condenser coil cleaning",
            "Fan / blower cleaning",
            "Checking the coolant level",
            "AC gas leak inspection",
            "Checking all electrical components",
            "Checking thermostat functioning",
          ].map((item) => (
            <CoveredItem key={item} label={item} />
          ))}
        </View>
      </View>

      {/* Additional Services */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Additional Services</Text>

        {/* <View style={styles.quickAddRow}>
          <TouchableOpacity
            style={[styles.quickInput, styles.brandInput]}
            onPress={() => {
            }}
          >
            <Text style={styles.brandText}>
              {customService.brand || "Name"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickInput, styles.brandInput]}
            onPress={() => {
            }}
          >
            <Text style={styles.brandText}>
              {customService.brand || "Brand"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>

          <TextInput
            placeholder="₹ 1500"
            keyboardType="numeric"
            value={customService.price}
            onChangeText={(t) => setCustomService((p) => ({ ...p, price: t }))}
            style={[styles.quickInput, styles.priceInput]}
          />

          <TouchableOpacity
            style={styles.quickAddBtn}
            onPress={addCustomService}
          >
            <Text style={styles.quickAddText}>Add</Text>
          </TouchableOpacity>
        </View> */}

        {services.map((ser) => (
          <ServiceRow
            key={ser._id}
            title={ser.service.name}
            brand="LG"
            price={ser.service.basePrice}
            selected={!!selectedServices[ser._id]}
            onToggle={() => toggleService(ser)}
          />
        ))}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={addSelectedServices}
        >
          <Text style={styles.btnText}>Add Selected Services</Text>
        </TouchableOpacity>

        <>
          <Text style={styles.subTitle}>Add Custom Service</Text>

          <TextInput
            placeholder="Service Name"
            value={customService.name}
            onChangeText={(t) => setCustomService((p) => ({ ...p, name: t }))}
            style={styles.input}
          />

          <TextInput
            placeholder="Brand"
            value={customService.brand}
            onChangeText={(t) => setCustomService((p) => ({ ...p, brand: t }))}
            style={styles.input}
          />

          <TextInput
            placeholder="Price"
            keyboardType="numeric"
            value={customService.price}
            onChangeText={(t) => setCustomService((p) => ({ ...p, price: t }))}
            style={styles.input}
          />

          <TextInput
            placeholder="Discount"
            keyboardType="numeric"
            value={customService.discount}
            onChangeText={(t) =>
              setCustomService((p) => ({ ...p, discount: t }))
            }
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={addCustomService}
          >
            <Text style={styles.btnText}>Add Custom Service</Text>
          </TouchableOpacity>
        </>

        {!!addedServices.length && (
          <>
            <Text style={styles.subTitle}>Added Services</Text>
            {addedServices.map((s) => (
              <View key={s._id} style={styles.addedRow}>
                <Text>{s.service.name}</Text>
                <TouchableOpacity onPress={() => deleteService(s)}>
                  <Ionicons name="trash" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Parts */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Parts List</Text>

        {inventory.map((inv) => (
          <PartCard
            key={inv._id}
            name={inv.productName}
            warranty="6 Months Warranty"
            price={inv.price}
            selected={!!selectedParts[inv._id]}
            onToggle={() => togglePart(inv)}
          />
        ))}

        <TouchableOpacity style={styles.primaryBtn} onPress={addSelectedParts}>
          <Text style={styles.btnText}>Add Selected Parts</Text>
        </TouchableOpacity>

        <>
          <Text style={styles.subTitle}>Add Custom Part</Text>

          <TextInput
            placeholder="Part Name"
            value={customPart.name}
            onChangeText={(t) => setCustomPart((p) => ({ ...p, name: t }))}
            style={styles.input}
          />

          <TextInput
            placeholder="Brand"
            value={customPart.brand}
            onChangeText={(t) => setCustomPart((p) => ({ ...p, brand: t }))}
            style={styles.input}
          />

          <TextInput
            placeholder="Price"
            keyboardType="numeric"
            value={customPart.price}
            onChangeText={(t) => setCustomPart((p) => ({ ...p, price: t }))}
            style={styles.input}
          />

          <TextInput
            placeholder="Discount"
            keyboardType="numeric"
            value={customPart.discount}
            onChangeText={(t) => setCustomPart((p) => ({ ...p, discount: t }))}
            style={styles.input}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={addCustomPart}>
            <Text style={styles.btnText}>Add Custom Part</Text>
          </TouchableOpacity>
        </>

        {!!addedParts.length && (
          <>
            <Text style={styles.subTitle}>Added Parts</Text>
            {addedParts.map((p) => (
              <View key={p._id} style={styles.addedRow}>
                <Text>{p.productName}</Text>
                <TouchableOpacity onPress={() => deletePart(p)}>
                  <Ionicons name="trash" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Findings */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Inspection Findings</Text>
        <TextInput
          value={findings}
          onChangeText={setFindings}
          placeholder="Enter inspection details..."
          multiline
          style={styles.findingsInput}
        />
      </View>

      {/* Approve */}
      <TouchableOpacity onPress={requestUserVerification} disabled={otp}>
        <LinearGradient
          colors={["#56CCF2", "#56CCF2"]}
          style={styles.approveBtn}
        >
          <Text style={styles.approveText}>
            {!otp ? "Request User Verification" : "Request Send"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {false && (
        <View style={styles.otpBox}>
          {/* Technician OTP verification */}
          {!otpVerified && (
            <>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter OTP to verify job"
                keyboardType="numeric"
                value={enteredOtp}
                onChangeText={setEnteredOtp}
                maxLength={6}
              />

              <TouchableOpacity
                style={styles.verifyBtn}
                // onPress={handleOtpVerify}
              >
                <Text style={styles.verifyText}>Verify OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {otpVerified && (
            <Text style={styles.successText}>
              ✅ OTP verified successfully. Job completed.
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity onPress={handleCompleteInspection}>
        <LinearGradient
          colors={["#2F80ED", "#56CCF2"]}
          style={styles.approveBtn}
        >
          <Text style={styles.approveText}>Complete Inspection</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#F4F6FB" },

  loader: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "700" },
  pointsBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsText: { fontSize: 14, fontWeight: "500" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },

  coveredGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  coveredItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EAF0FF",
    marginRight: 8,
  },
  coveredText: { fontSize: 13, flex: 1 },
  input: {
    backgroundColor: "#F2F4F8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },

  customSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  customRow: {
    flexDirection: "row",
    gap: 8,
  },

  halfInput: {
    flex: 1,
    backgroundColor: "#F2F4F8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  verifyBtn: {
    backgroundColor: "#0a7cff",
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  verifyText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  otpBox: {
    backgroundColor: "#eaf6ff",
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
  otpLabel: {
    fontSize: 12,
    color: "#555",
  },
  otp: {
    fontSize: 28,
    fontWeight: "800",
    marginVertical: 6,
  },
  otpHint: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  partCard: {
    backgroundColor: "#F9FAFD",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: "#2F80ED",
  },

  serviceTitle: { fontWeight: "600" },
  partTitle: { fontWeight: "600" },
  warranty: { fontSize: 12, color: "#777" },

  brandBadge: {
    marginTop: 4,
    backgroundColor: "#D6E9FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  brandText: { fontSize: 12, color: "#2F80ED" },

  rowRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  price: { fontWeight: "600" },
  quickAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    width: "100%",
    textAlign: "center",
    fontSize: 16,
    letterSpacing: 4,
  },
  successText: {
    marginTop: 12,
    color: "green",
    fontWeight: "600",
    textAlign: "center",
  },

  quickInput: {
    backgroundColor: "#F5F7FB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  nameInput: {
    flex: 2.2,
  },

  brandInput: {
    flex: 1.6,
    justifyContent: "space-between",
  },

  priceInput: {
    flex: 1.2,
  },

  quickAddBtn: {
    backgroundColor: "#4DA3FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  quickAddText: {
    color: "#fff",
    fontWeight: "600",
  },

  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EAF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  plusText: { fontSize: 18, fontWeight: "700", color: "#2F80ED" },

  primaryBtn: {
    backgroundColor: "#2F80ED",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },

  findingsInput: {
    minHeight: 100,
    backgroundColor: "#F2F4F8",
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
  },

  approveBtn: {
    height: 54,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  approveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  subTitle: { marginTop: 12, fontWeight: "600" },

  row: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F2F4F8",
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  selected: {
    borderWidth: 2,
    borderColor: "#2F80ED",
  },

  addedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
});
