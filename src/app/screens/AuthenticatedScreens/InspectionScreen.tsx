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
} from "../../../api/inspection";
import {
  addUsedParts,
  getInventory,
  removeUsedPart,
} from "../../../api/inventory";
import {
  addAdditionalService,
  addCustomParts,
  addCustomServices,
  createPartsPending,
  createWorkshop,
  getProviderServices,
  PartsPendingRequiredPart,
  removeAdditionalService,
  requestVerification,
} from "../../../api/services";
import { Ionicons } from "@expo/vector-icons";
import { InventoryPart } from "../../../constants/types";
import { useNavigation, useRoute } from "@react-navigation/native";

interface SelectedInventoryPart extends InventoryPart {
  quantity: number;
}

type CompletionType =
  | "normal"
  | "verification"
  | "parts_pending"
  | "workshop_required";

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

export default function InspectionScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const jobId = route.params?.jobId;
  type Step = 0 | 1 | 2 | 3;

  const [step, setStep] = useState<Step | number>(0);
  const goNext = () => setStep((s) => Math.min(3, (s + 1) as Step));
  const goBack = () => setStep((s) => Math.max(0, (s - 1) as Step));

  const [loading, setLoading] = useState(false);
  const [inspectionStarted, setInspectionStarted] = useState(false);

  const [findings, setFindings] = useState("");
  const [isServiceCorrect, setIsServiceCorrect] = useState(true);

  const [inventory, setInventory] = useState<InventoryPart[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [selectedParts, setSelectedParts] = useState<
    Record<string, SelectedInventoryPart>
  >({});

  const [selectedServices, setSelectedServices] = useState<Record<string, any>>(
    {},
  );

  const [addedParts, setAddedParts] = useState<any[]>([]);
  const [addedServices, setAddedServices] = useState<any[]>([]);

  const [otp, setOtp] = useState<boolean>(false);

  const [completionType, setCompletionType] =
    useState<CompletionType>("normal");

  const [partsPending, setPartsPending] = useState({
    expectedReturnDate: "",
    notes: "",
  });

  const [workshop, setWorkshop] = useState({
    itemDescription: "",
    repairRequired: "",
    estimatedCost: "",
    estimatedCompletionTime: "3-5_days" as const,
    expectedReturnDate: "",
    notes: "",
  });

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

  const [pendingPartsForm, setPendingPartsForm] = useState({
    partName: "",
    quantity: "1",
    estimatedCost: "",
    expectedReturnDate: "",
    notes: "",
  });

  const hasAddedAnything = addedServices.length > 0 || addedParts.length > 0;

  useEffect(() => {
    if (hasAddedAnything && completionType === "normal") {
      setCompletionType("verification");
    }

    if (!hasAddedAnything && completionType === "verification") {
      setCompletionType("normal");
    }
  }, [hasAddedAnything]);

  useEffect(() => {
    initInspection();
  }, []);

  // console.log('inventory ; ', inventory);
  // console.log('services ; ', services);

  async function initInspection() {
    if (jobId) {
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
        // Alert.alert("Error", "Failed to start inspection");
        // navigation.goBack();
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert("NO JOB ID");
    }
  }

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

  async function addCustomService() {
    if (!customService.name || !customService.price) {
      Alert.alert("Validation", "Service name and price required");
      return;
    }

    try {
      setLoading(true);

      const res = await addCustomServices(jobId, {
        serviceName: customService.name,
        quantity: 1,
        unitPrice: Number(customService.price),
        description: customService.brand,
        notes: customService.discount,
      });

      const latestService =
        res.additionalServices[res.additionalServices.length - 1];
      const normalizedService = {
        _id: latestService._id,
        service: {
          name: latestService.serviceName,
          basePrice: latestService.unitPrice,
        },
        isCustom: true,
      };

      setAddedServices((prev) => [...prev, normalizedService]);

      setCustomService({ name: "", brand: "", price: "", discount: "" });

      Alert.alert("Success", "Custom service added");
    } catch (error: any) {
      console.log("ADD CUSTOM SERVICE ERROR →", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to add custom service",
      );
    } finally {
      setLoading(false);
    }
  }

  async function addCustomPart() {
    if (!customPart.name || !customPart.price) {
      Alert.alert("Validation", "Part name and price required");
      return;
    }

    try {
      setLoading(true);

      const res = await addCustomParts(jobId, {
        productName: customPart.name,
        productCode: customPart.brand || undefined,
        quantity: 1,
        unitPrice: Number(customPart.price),
        gst: 18,
        description: customPart.discount,
      });

      const latestPart = res.usedParts[res.usedParts.length - 1];

      const normalizedPart = {
        _id: latestPart._id,
        productName: latestPart.productName,
        price: latestPart.unitPrice,
        isCustom: true,
      };

      setAddedParts((prev) => [...prev, normalizedPart]);

      setCustomPart({ name: "", brand: "", price: "", discount: "" });

      Alert.alert("Success", "Custom part added");
    } catch (error: any) {
      console.log("ADD CUSTOM PART ERROR →", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to add custom service",
      );
    } finally {
      setLoading(false);
    }
  }

  function onClose() {
    navigation.goBack()
  }
  function onInspectionCompleted() {}
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
  function buildRequiredParts(): PartsPendingRequiredPart[] {
    return addedParts.map((p: any) => ({
      partName: p.productName || p.name,
      description: p.description || "",
      estimatedCost: p.price || p.unitPrice,
      quantity: p.quantity ?? 1,
      supplier: "Technician will procure",
      notes: "Part not available during visit",
    }));
  }
  async function handlePrimaryAction() {
    if (!findings.trim()) {
      Alert.alert("Validation", "Please enter inspection findings");
      return;
    }

    try {
      setLoading(true);

      switch (completionType) {
        case "normal": {
          await completeInspection(jobId, findings, isServiceCorrect);
          onInspectionCompleted?.();
          break;
        }

        case "verification": {
          await requestVerification(jobId);
          setOtp(true);
          break;
        }

        case "parts_pending": {
          const {
            partName,
            quantity,
            estimatedCost,
            expectedReturnDate,
            notes,
          } = pendingPartsForm;

          if (!partName || !expectedReturnDate) {
            Alert.alert("Missing details", "Please fill all required fields.");
            return;
          }

          await createPartsPending(jobId, {
            requiredParts: [
              {
                partName,
                quantity: Number(quantity || 1),
                estimatedCost: Number(estimatedCost || 9999),
                supplier: "Technician will procure",
                notes,
              },
            ],
            estimatedAvailability: "within_week",
            expectedReturnDate,
          });

          Alert.alert(
            "Parts Pending",
            "User approval requested. Job will be rescheduled.",
          );

          break;
        }

        case "workshop_required": {
          if (
            !workshop.itemDescription ||
            !workshop.repairRequired ||
            !workshop.estimatedCost ||
            !workshop.expectedReturnDate
          ) {
            Alert.alert("Missing details", "Please fill all workshop details.");
            return;
          }

          await createWorkshop(jobId, {
            itemDescription: workshop.itemDescription,
            repairRequired: workshop.repairRequired,
            estimatedCost: Number(workshop.estimatedCost),
            estimatedCompletionTime: workshop.estimatedCompletionTime,
            expectedReturnDate: workshop.expectedReturnDate,
            notes: workshop.notes,
          });

          Alert.alert(
            "Sent to Workshop",
            "User approval requested. Job will be rescheduled.",
          );

          break;
        }
      }

      onClose();
    } catch (e) {
      console.log("error", e);

      Alert.alert("Error", "Action failed");
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

  function ReviewRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", marginBottom: 6 }}>
      <Text style={{ fontWeight: "600", width: 140 }}>{label}</Text>
      <Text style={{ flex: 1 }}>{value}</Text>
    </View>
  );
}


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <>
      <View style={styles.header}>
        <Text style={styles.title}>AC Service Inspection</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>🏆 100</Text>
        </View>
      </View>
      {completionType !== "normal" && (
  <Text style={{ color: "#f5650b", marginBottom: 12, fontSize : 18 }}>
    ⚠ Job will be rescheduled
  </Text>
)}
      </>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        {["Covered", "Services", "Parts", "Review"].map((label, i) => (
          <View
            key={label}
            style={{
              flex: 1,
              marginHorizontal: 4,
              height: 6,
              borderRadius: 6,
              backgroundColor: step >= i ? "#2F80ED" : "#E5E7EB",
            }}
          />
        ))}
      </View>

      {/* What's Covered */}
      {step === 0 && (
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
      )}

      {/* Additional Services */}
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Additional Services</Text>

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
              onChangeText={(t) =>
                setCustomService((p) => ({ ...p, brand: t }))
              }
              style={styles.input}
            />

            <TextInput
              placeholder="Price"
              keyboardType="numeric"
              value={customService.price}
              onChangeText={(t) =>
                setCustomService((p) => ({ ...p, price: t }))
              }
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
                  <Text>{s.service?.name || s.serviceName}</Text>

                  <TouchableOpacity onPress={() => deleteService(s)}>
                    <Ionicons name="trash" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {step === 2 && (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Parts</Text>

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

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={addSelectedParts}
            >
              <Text style={styles.btnText}>Add Selected Parts</Text>
            </TouchableOpacity>

            {/* Custom Part UI unchanged */}
            {/* Added parts list unchanged */}
          </View>

          {completionType === "parts_pending" && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Parts Pending</Text>

              <TextInput
                placeholder="Part Name"
                value={pendingPartsForm.partName}
                onChangeText={(t) =>
                  setPendingPartsForm((p) => ({ ...p, partName: t }))
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Quantity"
                keyboardType="numeric"
                value={pendingPartsForm.quantity}
                onChangeText={(t) =>
                  setPendingPartsForm((p) => ({ ...p, quantity: t }))
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Estimated Cost"
                keyboardType="numeric"
                value={pendingPartsForm.estimatedCost}
                onChangeText={(t) =>
                  setPendingPartsForm((p) => ({ ...p, estimatedCost: t }))
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Expected Return Date (YYYY-MM-DD)"
                value={pendingPartsForm.expectedReturnDate}
                onChangeText={(t) =>
                  setPendingPartsForm((p) => ({ ...p, expectedReturnDate: t }))
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Notes (optional)"
                multiline
                value={pendingPartsForm.notes}
                onChangeText={(t) =>
                  setPendingPartsForm((p) => ({ ...p, notes: t }))
                }
                style={styles.input}
              />
            </View>
          )}

          {completionType === "workshop_required" && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Workshop Repair</Text>

              <TextInput
                placeholder="Item Description"
                value={workshop.itemDescription}
                onChangeText={(t) =>
                  setWorkshop((p) => ({ ...p, itemDescription: t }))
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Repair Required"
                value={workshop.repairRequired}
                onChangeText={(t) =>
                  setWorkshop((p) => ({ ...p, repairRequired: t }))
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Estimated Cost"
                keyboardType="numeric"
                value={workshop.estimatedCost}
                onChangeText={(t) =>
                  setWorkshop((p) => ({ ...p, estimatedCost: t }))
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Expected Completion Time (e.g. 3-5_days)"
                value={workshop.estimatedCompletionTime}
                onChangeText={(t) =>
                  setWorkshop((p) => ({
                    ...p,
                    estimatedCompletionTime: t as any,
                  }))
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Expected Return Date (YYYY-MM-DD)"
                value={workshop.expectedReturnDate}
                onChangeText={(t) =>
                  setWorkshop((p) => ({ ...p, expectedReturnDate: t }))
                }
                style={styles.input}
              />

              <TextInput
                placeholder="Notes (optional)"
                multiline
                value={workshop.notes}
                onChangeText={(t) => setWorkshop((p) => ({ ...p, notes: t }))}
                style={styles.input}
              />
            </View>
          )}

          {true && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: "#F59E0B" }]}
              onPress={() =>
                setCompletionType(
                  completionType !== "parts_pending"
                    ? "parts_pending"
                    : "normal",
                )
              }
            >
              <Text style={styles.btnText}>Parts Pending</Text>
            </TouchableOpacity>
          )}

          {true && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: "#7C3AED" }]}
              onPress={() =>
                setCompletionType(
                  completionType !== "workshop_required"
                    ? "workshop_required"
                    : "normal",
                )
              }
            >
              <Text style={styles.btnText}>Send to Workshop</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {step === 3 && (
  <>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Review</Text>

      {/* Services */}
      {!!addedServices.length && (
        <>
          <Text style={styles.subTitle}>Services</Text>
          {addedServices.map((s) => (
            <Text key={s._id}>• {s.service?.name || s.serviceName}</Text>
          ))}
        </>
      )}

      {/* Parts */}
      {!!addedParts.length && (
        <>
          <Text style={styles.subTitle}>Parts</Text>
          {addedParts.map((p) => (
            <Text key={p._id}>• {p.productName || p.name}</Text>
          ))}
        </>
      )}

      {/* Parts Pending Review */}
      {completionType === "parts_pending" && (
        <>
          <Text style={styles.subTitle}>Parts Pending</Text>

          <ReviewRow label="Part Name" value={pendingPartsForm.partName} />
          <ReviewRow label="Quantity" value={pendingPartsForm.quantity} />
          <ReviewRow
            label="Estimated Cost"
            value={`₹ ${pendingPartsForm.estimatedCost}`}
          />
          <ReviewRow
            label="Expected Return Date"
            value={pendingPartsForm.expectedReturnDate}
          />
          <ReviewRow label="Notes" value={pendingPartsForm.notes} />
        </>
      )}

      {/* Workshop Review */}
      {completionType === "workshop_required" && (
        <>
          <Text style={styles.subTitle}>Workshop Required</Text>

          <ReviewRow label="Item" value={workshop.itemDescription} />
          <ReviewRow label="Repair" value={workshop.repairRequired} />
          <ReviewRow
            label="Estimated Cost"
            value={`₹ ${workshop.estimatedCost}`}
          />
          <ReviewRow
            label="Completion Time"
            value={workshop.estimatedCompletionTime}
          />
          <ReviewRow
            label="Expected Return Date"
            value={workshop.expectedReturnDate}
          />
          <ReviewRow label="Notes" value={workshop.notes} />
        </>
      )}
    </View>

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
  </>
)}


      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20, alignItems : 'center' }}>
        {step > 0 && (
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1, backgroundColor: "#9CA3AF", height : 50 }]}
            onPress={goBack}
          >
            <Text style={styles.btnText}>Back</Text>
          </TouchableOpacity>
        )}

        {step < 3 ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1 }]}
            onPress={goNext}
          >
            <Text style={styles.btnText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handlePrimaryAction} style={{ flex: 1 }}>
            <LinearGradient
              colors={
                hasAddedAnything
                  ? ["#56CCF2", "#56CCF2"]
                  : ["#2F80ED", "#56CCF2"]
              }
              style={styles.approveBtn}
            >
              <Text style={styles.approveText}>
                {completionType === "normal" && "Complete Inspection"}
                {completionType === "verification" &&
                  "Request User Verification"}
                {completionType === "parts_pending" && "Send Parts Pending"}
                {completionType === "workshop_required" && "Send to Workshop"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#F4F6FB" },

  loader: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginBottom: 16,
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
