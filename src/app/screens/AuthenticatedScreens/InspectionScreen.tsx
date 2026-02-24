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
import { useJobs } from "../../../store/JobContext";
import { JobStatus } from "../../../constants/jobTypes";
import CustomView from "../../components/CustomView";
import { moderateScale, scale, verticalScale } from "../../../util/scaling";

interface SelectedInventoryPart extends InventoryPart {
  quantity: number;
}

type CompletionType =
  | "normal"
  | "verification"
  | "parts_pending"
  | "workshop_required";

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
  const { updateStatus } = useJobs();
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
    repairRequired: "",
    quantity: "1",
    estimatedCost: "",
    expectedReturnDate: "",
    expectedReturnDateLabel: "",
    notes: "",
  });

  const hasAddedAnything = addedServices.length > 0 || addedParts.length > 0;

  // useEffect(() => {
  //   if (hasAddedAnything && completionType === "normal") {
  //     setCompletionType("verification");
  //   }

  //   if (!hasAddedAnything && completionType === "verification") {
  //     setCompletionType("normal");
  //   }
  // }, [hasAddedAnything]);

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

  console.log("servicesssss : ", services);

  async function togglePart(item: any) {
    const alreadyAdded = addedParts.some((p) => p._id === item._id);

    try {
      setLoading(true);

      if (alreadyAdded) {
        // Remove part
        await removeUsedPart(jobId, item._id);

        setAddedParts((prev) => prev.filter((p) => p._id !== item._id));
      } else {
        // Add part
        await addUsedParts(jobId, [
          {
            inventoryItemId: item._id,
            quantity: 1,
          },
        ]);

        setAddedParts((prev) => [...prev, { ...item, quantity: 1 }]);
      }
    } catch {
      Alert.alert("Error", "Failed to update part");
    } finally {
      setLoading(false);
    }
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
        description: customService.brand || "",
        notes: customService.discount || "",
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
    navigation.goBack();
  }
  function onInspectionCompleted() {}
  /* -------------------- DELETE -------------------- */

  function formatDateYYYYMMDD(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

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
    // if (!findings.trim()) {
    //   Alert.alert("Validation", "Please enter inspection findings");
    //   return;
    // }

    try {
      setLoading(true);

      switch (completionType) {
        case "normal": {
          await completeInspection(jobId, findings, isServiceCorrect);
          updateStatus(jobId, JobStatus.IN_PROGRESS);
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
          updateStatus(jobId, JobStatus.PARTS_PENDING);

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
          updateStatus(jobId, JobStatus.WORKSHOP_REQUIRED);
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
  function calculateCustomServicesTotal() {
  return addedServices
    .filter((s) => s.isCustom)
    .reduce((sum, s) => {
      return (
        sum +
        Number(
          s.service?.basePrice ||
          s.unitPrice ||
          s.price ||
          0
        )
      );
    }, 0);
}

function calculatePartsTotal() {
  return addedParts.reduce((sum, part) => {
    return (
      sum +
      Number(
        part.price ||
        part.unitPrice ||
        0
      )
    );
  }, 0);
}
function calculateGrandTotal() {
  return (
    calculateCustomServicesTotal() +
    calculatePartsTotal()
  );
}



  function ReviewRow({
    label,
    value,
  }: {
    label: string;
    value?: string | number;
  }) {
    if (!value) return null;
    return (
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        <Text style={{ fontWeight: "600", width: 140 }}>{label}</Text>
        <Text style={{ flex: 1 }}>{value}</Text>
      </View>
    );
  }

  const incrementQty = (id: string) => {
    setServices((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const decrementQty = (id: string) => {
    setServices((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    );
  };

  const serviceOptions = [
    {
      id: "1",
      name: "Windows AC Services",
      brands: [
        {
          name: "Samsung",
          types: [
            { name: "Repair", price: 1500 },
            { name: "Maintenance", price: 1200 },
          ],
        },
        {
          name: "Voltas",
          types: [
            { name: "Repair", price: 1400 },
            { name: "Installation", price: 2000 },
          ],
        },
      ],
    },
    {
      id: "2",
      name: "Air Conditioning Services",
      brands: [
        {
          name: "Panasonic",
          types: [
            { name: "Repair", price: 1500 },
            { name: "Cleaning", price: 1000 },
          ],
        },
      ],
    },
  ];

  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [price, setPrice] = useState<string>("");

  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  function AddButton({ onPress }: { onPress: () => void }) {
    return (
      <TouchableOpacity onPress={onPress}>
        <LinearGradient
          colors={["#027CC7", "#004DBD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.addBtn}
        >
          <Text style={styles.addText}>ADD +</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
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
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AC Service Inspection</Text>
      </View>

      {step === 0 && (
        <View>
          <CCView>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>What's Covered?</Text>

              <View style={styles.coveredRow}>
                {[
                  "Inspection of AC Unit",
                  "Cleaning Filters",
                  "Fan Cleaning",
                  "AC Leak Inspection",
                ].map((item, index) => (
                  <View key={index} style={styles.coveredItem}>
                    <LinearGradient
                      colors={["#36DFF1", "#2764E7"]}
                      start={{ x: 0, y: 0 }} // top-left
                      end={{ x: 1, y: 1 }}
                      style={styles.checkbox}
                    >
                      <Ionicons name="checkmark" size={12} color="white" />
                    </LinearGradient>

                    <Text style={styles.coveredText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </CCView>

          <CCView>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Additional Services</Text>
                <TouchableOpacity style={styles.syncBtn}>
                  <Ionicons name="sync" size={14} color="#fff" />
                  <Text style={styles.syncText}> Sync Data</Text>
                </TouchableOpacity>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: verticalScale(12),
                }}
              >
                <View style={styles.dropRow}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowServiceDropdown(!showServiceDropdown)}
                  >
                    <Text numberOfLines={1}>
                      {selectedService ? selectedService.name : "Service Name"}
                    </Text>
                  </TouchableOpacity>

                  {showServiceDropdown && (
                    <View style={styles.dropBox}>
                      {serviceOptions.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedService(item);
                            setSelectedBrand(null);
                            setSelectedType(null);
                            setPrice("");
                            setShowServiceDropdown(false);
                          }}
                        >
                          <Text>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* BRAND DROPDOWN */}
                <View style={styles.dropRow}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() =>
                      selectedService &&
                      setShowBrandDropdown(!showBrandDropdown)
                    }
                  >
                    <Text>
                      {selectedBrand ? selectedBrand.name : "Brand Name"}
                    </Text>
                  </TouchableOpacity>

                  {showBrandDropdown && (
                    <View style={styles.dropBox}>
                      {selectedService?.brands.map(
                        (brand: any, index: number) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedBrand(brand);
                              setSelectedType(null);
                              setPrice("");
                              setShowBrandDropdown(false);
                            }}
                          >
                            <Text>{brand.name}</Text>
                          </TouchableOpacity>
                        ),
                      )}
                    </View>
                  )}
                </View>

                {/* TYPE DROPDOWN */}
                <View style={styles.dropRow}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() =>
                      selectedBrand && setShowTypeDropdown(!showTypeDropdown)
                    }
                  >
                    <Text>{selectedType ? selectedType.name : "Type"}</Text>
                  </TouchableOpacity>

                  {showTypeDropdown && (
                    <View style={styles.dropBox}>
                      {selectedBrand?.types.map((type: any, index: number) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedType(type);
                            setPrice(type.price.toString());
                            setShowTypeDropdown(false);
                          }}
                        >
                          <Text>{type.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* AUTO FILLED PRICE */}
                <View style={styles.dropRow}>
                  <Text>{price ? `₹${price}` : "₹0"}</Text>
                </View>
              </View>

              <LinearGradient
                colors={["#027CC7", "#004DBD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addBtn}
              >
                <Text style={styles.addText}>ADD +</Text>
              </LinearGradient>
            </View>
          </CCView>

          {/* CUSTOM SERVICES */}
          <CCView>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Custom Services</Text>

              <View style={styles.inputRow}>
                <TextInput
                  placeholder="Service Name"
                  style={styles.input}
                  value={customService.name}
                  onChangeText={(t) =>
                    setCustomService((prev) => ({ ...prev, name: t }))
                  }
                />

                <TextInput
                  placeholder="₹ Price"
                  style={styles.input}
                  keyboardType="numeric"
                  value={customService.price}
                  onChangeText={(t) =>
                    setCustomService((prev) => ({ ...prev, price: t }))
                  }
                />
              </View>

              <AddButton onPress={addCustomService} />

              {addedServices
                .filter((item) => item.isCustom)
                .map((item) => (
                  <View key={item._id} style={styles.customItem}>
                    <View>
                      <Text style={styles.serviceTitle}>
                        {item.service?.name}
                      </Text>

                      <Text style={styles.price}>
                        ₹ {item.service?.basePrice || item.price}
                      </Text>
                    </View>

                    <TouchableOpacity onPress={() => deleteService(item)}>
                      <Ionicons name="trash" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          </CCView>

          {/* FOOTER BUTTONS */}

          {/* <View style={{ height: 80 }} /> */}
        </View>
      )}
      {step === 1 && (
        <>
          {/* ---------------- PARTS LIST ---------------- */}
          <CCView>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Parts List</Text>
                <TouchableOpacity style={styles.syncBtn}>
                  <Ionicons name="sync" size={14} color="#fff" />
                  <Text style={styles.syncText}> Sync Data</Text>
                </TouchableOpacity>
              </View>

              {/* Search */}
              <CCView>
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={16} color="#999" />
                  <TextInput
                    placeholder="Search Parts"
                    style={{ marginLeft: 8, flex: 1 }}
                  />
                </View>
              </CCView>

              {/* Grid Parts */}
              <View style={styles.partsGrid}>
                {inventory.map((item) => {
                  const selected = addedParts.some((p) => p._id === item._id);

                  return (
                    <CustomView
                      radius={scale(12)}
                      shadowStyle={{
                        width: "48%",
                        marginBottom: verticalScale(10),
                      }}
                      key={item._id}
                    >
                      <TouchableOpacity
                        key={item._id}
                        style={[
                          styles.partGridCard,
                          selected && styles.selectedCard,
                        ]}
                        onPress={() => togglePart(item)}
                      >
                        <Text style={styles.partGridTitle}>
                          {item.productName}
                        </Text>

                        <View style={styles.plusCircle}>
                          <Text style={styles.partGridPrice}>
                            ₹{item.price}
                          </Text>
                          <Ionicons
                            name={selected ? "checkmark" : "add"}
                            size={14}
                            color="#004DBD"
                          />
                        </View>
                      </TouchableOpacity>
                    </CustomView>
                  );
                })}
              </View>
            </View>
          </CCView>

          {/* ---------------- SELECTED PARTS ---------------- */}
          {!!addedParts.length && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Selected Parts</Text>

              <View style={styles.tableHeader}>
                <Text style={styles.tableCol}>Part Name</Text>
                <Text style={styles.tableCol}>Warranty</Text>
                <Text style={styles.tableCol}>Price</Text>
                <Text style={styles.tableCol1}>Action</Text>
              </View>

              {addedParts.map((part) => (
                <View key={part._id} style={styles.tableRow}>
                  <Text style={styles.tableCol}>{part.productName}</Text>
                  <Text style={styles.tableCol}>3 Month</Text>
                  <Text style={styles.tableCol}>
                    {" "}
                    ₹ {part.price || part.unitPrice || 0}
                  </Text>

                  <TouchableOpacity onPress={() => deletePart(part)} style={{width : '13%'}}>
                    <Ionicons name="trash" size={18} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </>
      )}
      {step === 2 && (
        <CCView>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reschedule</Text>

            {/* Checkboxes */}
            <View style={{ flexDirection: "row", gap: 20, marginBottom: 16 }}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setCompletionType((prev) =>
                    prev === "parts_pending" ? "normal" : "parts_pending",
                  )
                }
              >
                <Ionicons
                  name={
                    completionType === "parts_pending"
                      ? "checkbox"
                      : "square-outline"
                  }
                  size={18}
                  color="#2F80ED"
                />
                <Text style={styles.checkboxLabel}>Parts not available</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setCompletionType((prev) =>
                    prev === "workshop_required"
                      ? "normal"
                      : "workshop_required",
                  )
                }
              >
                <Ionicons
                  name={
                    completionType === "workshop_required"
                      ? "checkbox"
                      : "square-outline"
                  }
                  size={18}
                  color="#2F80ED"
                />
                <Text style={styles.checkboxLabel}>Workshop Repair</Text>
              </TouchableOpacity>
            </View>

            {/* Parts Detail */}
            {(completionType === "parts_pending" ||
              completionType === "workshop_required") && (
              <>
                <Text style={styles.subHeading}>
                  {completionType === "parts_pending"
                    ? "Parts Detail"
                    : "Workshop Detail"}
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    placeholder={
                      completionType === "parts_pending"
                        ? "Part Name"
                        : "Description"
                    }
                    style={styles.fullInput}
                    value={pendingPartsForm.partName}
                    onChangeText={(t) =>
                      setPendingPartsForm((p) => ({ ...p, partName: t }))
                    }
                  />

                  <TextInput
                    placeholder={
                      completionType === "parts_pending"
                        ? "Warranty / Notes"
                        : "Repair Required"
                    }
                    style={styles.fullInput}
                    value={pendingPartsForm.repairRequired}
                    onChangeText={(t) =>
                      setPendingPartsForm((p) => ({
                        ...p,
                        repairRequired: t,
                      }))
                    }
                  />

                  <TextInput
                    placeholder="Estimated Cost"
                    keyboardType="numeric"
                    style={styles.fullInput}
                    value={pendingPartsForm.estimatedCost}
                    onChangeText={(t) =>
                      setPendingPartsForm((p) => ({
                        ...p,
                        estimatedCost: t,
                      }))
                    }
                  />
                </View>
              </>
            )}

          
            {/* Reschedule Date */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.subHeading}>Reschedule Date </Text>
              <Text style={{ fontSize: 11, marginTop: 10, marginBottom: 6 }}>
                (Technician Will fix this issue in given time)
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              {["Today", "Tomorrow", "Within Week"].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.dateBtn,
                    pendingPartsForm.expectedReturnDateLabel === item && {
                      backgroundColor: "#c0c7d1",
                    },
                  ]}
                  onPress={() => {
                    const today = new Date();
                    let date = new Date(today);

                    if (item === "Tomorrow") {
                      date.setDate(today.getDate() + 1);
                    }

                    if (item === "Within Week") {
                      date.setDate(today.getDate() + 7);
                    }

                    setPendingPartsForm((p) => ({
                      ...p,
                      expectedReturnDate: formatDateYYYYMMDD(date),
                      expectedReturnDateLabel: item, // optional for UI highlight
                    }));
                  }}
                >
                  <Text style={{ textAlign: "center" }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </CCView>
      )}
      {step === 3 && (
        <View>
          {/* Job Status */}
          <CCView>
            <View
              style={[
                styles.card,
                { flexDirection: "row", alignItems: "center", gap: 10 },
              ]}
            >
              <Text style={styles.rowLabel}>Job Status :</Text>
              <Text style={styles.status}>
                {completionType == "parts_pending" ||
                completionType == "workshop_required"
                  ? "On Hold"
                  : "In Progress"}
              </Text>
            </View>
          </CCView>

          {/* What's Covered */}
          <CCView>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>What's Covered?</Text>

              <View style={styles.coveredRow}>
                {[
                  "Inspection of AC Unit",
                  "Cleaning Filters",
                  "Fan Cleaning",
                  "AC Leak Inspection",
                ].map((item, index) => (
                  <View key={index} style={styles.coveredItem}>
                    <LinearGradient
                      colors={["#36DFF1", "#2764E7"]}
                      start={{ x: 0, y: 0 }} // top-left
                      end={{ x: 1, y: 1 }}
                      style={styles.checkbox}
                    >
                      <Ionicons name="checkmark" size={12} color="white" />
                    </LinearGradient>

                    <Text style={styles.coveredText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </CCView>

          {/* Additional Services */}
          <CCView>
            <View style={styles.card}>
              <View style={styles.spaceBetween}>
                <Text style={styles.cardTitle}>Additional Services</Text>
                <Text style={styles.amount}>
                  {/* ₹{jobDetails.invoice.additionalServices?.total} */}
                </Text>
              </View>

              {serviceOptions.map((item, index) => (
                <ServiceRow
                  key={index}
                  name={item.name}
                  brand={item.brands[0].name}
                  price={item.brands[0].types[0].price}
                  qty={1}
                />
              ))}
            </View>
          </CCView>

          {/* Custom Services */}
         {!!addedServices.filter(s => s.isCustom).length && (
  <CCView>
    <View style={styles.card}>
      <View style={styles.spaceBetween}>
        <Text style={styles.cardTitle}>Custom Services</Text>
        <Text style={styles.amount}>
          ₹ {calculateCustomServicesTotal()}
        </Text>
      </View>

      {addedServices
        .filter((service) => service.isCustom)
        .map((service) => {
          const name = service.service?.name || "Service";
          const price =
            service.service?.basePrice ||
            service.unitPrice ||
            service.price ||
            0;

          return (
            <PriceRow
              key={service._id}
              label={name}
              value={`₹ ${price}`}
            />
          );
        })}
    </View>
  </CCView>
)}

          {/* Parts List */}
          {!!addedParts.length && (
  <CCView>
    <View style={styles.card}>
      <View style={styles.spaceBetween}>
        <Text style={styles.cardTitle}>Parts</Text>
        <Text style={styles.amount}>
          ₹ {calculatePartsTotal()}
        </Text>
      </View>

      {addedParts.map((part) => {
        const name =
          part.productName ||
          part.name ||
          "Part";

        const price =
          part.price ||
          part.unitPrice ||
          0;

        return (
          <PriceRow
            key={part._id}
            label={name}
            value={`₹ ${price}`}
          />
        );
      })}
    </View>
  </CCView>
)}


          {/* Part Not Available / Workshop */}
          {(completionType === "parts_pending" ||
  completionType === "workshop_required") && (
  <CCView>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {completionType === "parts_pending"
          ? "Parts Not Available"
          : "Workshop Repair"}
      </Text>

      <ReviewRow
        label={
          completionType === "parts_pending"
            ? "Part Name"
            : "Description"
        }
        value={pendingPartsForm.partName}
      />

      <ReviewRow
        label={
          completionType === "parts_pending"
            ? "Notes"
            : "Repair Required"
        }
        value={pendingPartsForm.repairRequired}
      />

      <ReviewRow
        label="Estimated Cost"
        value={
          pendingPartsForm.estimatedCost
            ? `₹ ${pendingPartsForm.estimatedCost}`
            : undefined
        }
      />

      <ReviewRow
        label="Reschedule Date"
        value={pendingPartsForm.expectedReturnDate}
      />
      <View style={{ flexDirection: "row" }}>
                <Text
                  style={[
                    styles.text,
                    { fontWeight: "700", fontSize: moderateScale(12) },
                  ]}
                >
                  Reschedule Date
                </Text>
                <Text style={[styles.subText, { marginTop: 0 }]}>
                  (Technician will fix this issue in given time)
                </Text>
              </View>

              {/* <Text style={styles.link}>Today</Text> */}
    </View>
    
  </CCView>
)}


          {/* Price Summary */}
      <CCView>
  <View style={styles.card}>
    <View style={styles.spaceBetween}>
      <Text style={styles.cardTitle}>Service Detail</Text>
      <Text style={styles.cardTitle}>Price</Text>
    </View>

    {/* Custom Services */}
    {!!addedServices.filter(s => s.isCustom).length && (
      <PriceRow
        label="Custom Services"
        value={`₹ ${calculateCustomServicesTotal()}`}
      />
    )}

    {/* Parts */}
    {!!addedParts.length && (
      <PriceRow
        label="Parts"
        value={`₹ ${calculatePartsTotal()}`}
      />
    )}

    <View style={styles.divider} />

    <View style={styles.spaceBetween}>
      <Text style={styles.total}>Total Service Price</Text>
      <Text style={styles.total}>
        ₹ {calculateGrandTotal()}
      </Text>
    </View>
  </View>
</CCView>

        </View>
      )}
      {step == 3 && (
        <TouchableOpacity onPress={handlePrimaryAction}>
          <LinearGradient
            colors={["#027CC7", "#004DBD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addBtn}
          >
            <Text style={styles.addText}>Send for Approval</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => (step === 0 ? navigation.goBack() : goBack())}
        >
          <Text style={styles.footerText}>{step == 0 ? "Cancel" : "Back"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ flex: 1 }} onPress={()=>{step === 3 ? navigation.goBack() : goNext()}}>
          <LinearGradient
            colors={
              step === 3 ? ["#027CC7", "#004DBD"] : ["#027CC7", "#004DBD"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextBtn}
          >
            <Text style={styles.footerText}>
              {step == 3 ? "Cancel" : "Next"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const ServiceRow = ({ name, brand, price, qty }: any) => (
  <View style={{ marginBottom: 10 }}>
    <View style={styles.serviceTitleRow}>
      <Text style={styles.text}>{name}</Text>
      <View style={styles.brandChip}>
        <Text style={styles.brandText}>{brand}</Text>
      </View>
    </View>
    <Text style={styles.calc}>
      ₹ {price} × {qty} = ₹ {price * qty}
    </Text>
  </View>
);

const PriceRow = ({ label, value }: any) => (
  <View style={styles.spaceBetween}>
    <Text style={styles.text}>{label}</Text>
    <Text style={styles.text}>{value}</Text>
  </View>
);

const TableHeader = () => (
  <View style={styles.tableRow}>
    <Text style={styles.tableHeader}>Part Name</Text>
    <Text style={styles.tableHeader}>Warranty</Text>
    <Text style={styles.tableHeader}>Price</Text>
  </View>
);

const TableRow = ({ name, warranty, price }: any) => (
  <View style={styles.tableRow}>
    <Text style={styles.text}>{name}</Text>
    <Text style={styles.text}>{warranty}</Text>
    <Text style={styles.text}>{price}</Text>
  </View>
);
type CCViewProps = {
  children: React.ReactNode;
  style?: any;
};

function CCView({ children, style }: CCViewProps) {
  return (
    <CustomView
      radius={scale(12)}
      shadowStyle={{ marginBottom: verticalScale(14) }}
      boxStyle={style}
    >
      {children}
    </CustomView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F2F4F7",
    paddingHorizontal: scale(16),
  },

  header: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    marginTop: verticalScale(8),
  },

  title: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    marginBottom: verticalScale(16),
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    padding: scale(14),
  },

  cardTitle: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    marginBottom: verticalScale(10),
  },

  dropRow: {
    borderWidth: scale(1),
    height: verticalScale(32),
    width: "47%",
    backgroundColor: "#F6F5F9",
    borderColor: "#DEDEDE",
    justifyContent: "center",
    paddingHorizontal: scale(8),
  },
  dropdown: {},
  dropBox: {
    position: "absolute",
    top: verticalScale(50),
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: scale(1),
    borderColor: "#DEDEDE",
    zIndex: 10,
  },

  dropdownItem: {
    backgroundColor: "#fff",
    padding: scale(12),
    borderBottomWidth: scale(1),
    borderColor: "#eee",
  },

  rowLabel: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#000",
  },

  status: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#004DBD",
  },

  coveredRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: verticalScale(10),
  },

  coveredItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },

  checkbox: {
    width: scale(14),
    height: scale(14),
    borderRadius: scale(3),
    backgroundColor: "#2F80ED",
    marginRight: scale(8),
  },

  coveredText: {
    fontSize: moderateScale(13),
    fontWeight: "500",
    color: "#000",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  syncBtn: {
    flexDirection: "row",
    backgroundColor: "#33C2EF",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: scale(6),
  },

  syncText: {
    color: "#fff",
    fontSize: moderateScale(12),
  },

  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },

  input: {
    backgroundColor: "#F2F4F7",
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(8),
    width: "48%",
  },

  addBtn: {
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
    alignItems: "center",
    marginBottom: verticalScale(12),
  },

  addText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: moderateScale(14),
  },

  serviceItem: {
    paddingVertical: verticalScale(12),
    borderTopWidth: scale(1),
    borderColor: "#eee",
  },

  serviceTitle: {
    fontSize: moderateScale(14),
    fontWeight: "500",
    marginBottom: verticalScale(6),
    width: scale(300),
    // borderWidth : 1
  },

  brandBadge: {
    backgroundColor: "#E3EAFB",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(10),
  },

  brandText: {
    fontSize: moderateScale(11),
    color: "#2764E7",
  },

  price: {
    fontSize: moderateScale(14),
    fontWeight: "500",
  },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  qtyBtn: {
    backgroundColor: "#F2F4F7",
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(6),
  },

  qtyText: {
    marginHorizontal: scale(10),
    fontSize: moderateScale(14),
  },

  customItem: {
    paddingVertical: verticalScale(10),
    borderTopWidth: scale(1),
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginTop: verticalScale(10),
  },

  cancelBtn: {
    backgroundColor: "red",
    flex: 1,
    marginRight: scale(8),
    paddingVertical: verticalScale(12),
    borderRadius: scale(8),
    alignItems: "center",
  },

  nextBtn: {
    flex: 1,
    marginLeft: scale(8),
    paddingVertical: verticalScale(12),
    borderRadius: scale(8),
    alignItems: "center",
  },

  footerText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: moderateScale(14),
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
  },

  partsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  partGridCard: {
    padding: scale(10),
    borderRadius: scale(12),
  },

  selectedCard: {
    backgroundColor: "#b4c0cb",
  },

  partGridTitle: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },

  partGridPrice: {
    // marginTop: verticalScale(4),
    fontSize: moderateScale(13),
    fontWeight: "700",
  },

  plusCircle: {
    // position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // right: scale(10),
    // top: verticalScale(10),
  },

  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },

  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: verticalScale(6),
  },

  tableCol: {
    width: "29%",
    fontSize: moderateScale(12),
    // borderWidth : 1
  },
  tableCol1: {
    width: "13%",
    fontSize: moderateScale(12),
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },

  checkboxLabel: {
    fontSize: moderateScale(11),
  },

  subHeading: {
    fontWeight: "600",
    fontSize: moderateScale(15),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(6),
  },

  fullInput: {
    backgroundColor: "#F6F5F9",
    paddingVertical: scale(10),
    paddingHorizontal: scale(2),
    borderRadius: scale(8),
    marginBottom: verticalScale(12),
    borderWidth: scale(1),
    borderColor: "#DEDEDE",
    color: "#000",
    width: scale(108),
  },

  dateBtn: {
    backgroundColor: "#F6F5F9",
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(8),
    borderWidth: scale(1),
    borderColor: "#DEDEDE",
  },

  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },

  workshopSection: {
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
    flex: 1,
  },

  amount: {
    fontWeight: "700",
    fontSize: moderateScale(14),
  },

  serviceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  total: {
    fontSize: moderateScale(15),
    fontWeight: "700",
  },

  brandChip: {
    backgroundColor: "#BED2F4",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(20),
    marginLeft: scale(8),
  },

  calc: {
    fontSize: moderateScale(12),
    color: "#000",
    marginTop: verticalScale(4),
  },

  text: {
    fontSize: moderateScale(14),
    color: "#000000",
    fontWeight: "400",
  },

  subText: {
    fontSize: moderateScale(12),
    color: "#000",
    marginTop: verticalScale(8),
  },

  link: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#004DBD",
    marginTop: verticalScale(4),
  },

  divider: {
    height: verticalScale(1),
    backgroundColor: "#EEE",
    marginVertical: verticalScale(10),
  },
});
