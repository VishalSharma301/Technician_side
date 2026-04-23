  import { useRoute } from "@react-navigation/native";
  import React, {
    useCallback,
    useContext,
    useEffect,
    useReducer,
    useState,
  } from "react";
  import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
  } from "react-native";
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
  import {
    InventoryPart,
    ServiceProviderService,
  } from "../../../constants/types";
  import { updateJobStatus } from "../../../util/servicesApi";
  import OtpModal from "../../components/OtpModal";
  import { completeJob } from "../../../util/jobHandlingApis";
  import { AuthContext } from "../../../store/AuthContext";
  import { moderateScale, scale, verticalScale } from "../../../util/scaling";
  import { LinearGradient } from "expo-linear-gradient";
  import CustomView from "../../components/CustomView";
  import {Ionicons} from '@expo/vector-icons'

  type Step =
    | "arrival"
    | "photos"
    | "inspection"
    | "discuss"
    | "service"
    | "parts"
    | "additional"
    | "custom"
    | "followup"
    | "approval"
    | "invoice"
    | "signature"
    | "complete";
  interface StepProps {
    state: WorkflowState;
    dispatch: React.Dispatch<any>;
  }
  interface PartsScreenProps extends StepProps {
    inventory: InventoryPart[];
    jobId: string;
  }
  interface Part {
    _id: string;
    productName: string;
    price: number;
    warrantyMonths?: number; // e.g. 3 → "3 Month"
  }

  interface SelectedPart extends Part {
    qty: number;
  }
  interface AdditionalServiceScreenProps extends StepProps {
    services: ServiceProviderService[];
    jobId: string;
  }
  interface ApprovalScreenProps extends StepProps {
    jobId: string;
  }

  interface WorkflowState {
    step: Step;
    history: Step[];

    // Arrival
    called: boolean;
    enRoute: boolean;
    arrived: boolean;
    callTime?: string;
    arrivedTime?: string;

    // Photos
    photos: boolean[];

    // Inspection
    issue: string;
    notes: string;

    // Service
    additionalItems: {
      name: string;
      price: number;
      qty?: number;
      note?: boolean;
    }[];

    followupData: {
      reason: string;
      part?: string;
      time: string;
      date: string;
      loaner: boolean;
    } | null;

    //Reschedule
    rescheduleType: "none" | "parts_pending" | "workshop_required";
    rescheduleData: {
      partName?: string;
      description?: string;
      repairRequired?: string;
      estimatedCost?: string;
      expectedReturnDate?: string;
      expectedReturnDateLabel: string;
    };

    // Pricing
    basePrice: number;
    technicianVisitFee: number;
    total: number;

    // Signature
    customerSigned: boolean;
    techConfirmed: boolean;

    // Timer
    timerSeconds: number;

    // Billing Type
    billingType: "full" | "visit_only";
  }

  function reducer(state: WorkflowState, action: any): WorkflowState {
    switch (action.type) {
      case "SET_STEP":
        return {
          ...state,
          history: [...state.history, state.step], // push current step
          step: action.payload,
        };
      case "GO_BACK":
        if (state.history.length === 0) return state;

        const previousStep = state.history[state.history.length - 1];

        return {
          ...state,
          step: previousStep,
          history: state.history.slice(0, -1), // remove last
        };
      case "CALL_CUSTOMER":
        return {
          ...state,
          called: true,
          callTime: new Date().toLocaleTimeString(),
        };

      case "EN_ROUTE":
        if (!state.called) return state;
        return { ...state, enRoute: true };

      case "ARRIVED":
        if (!state.enRoute) return state;
        return {
          ...state,
          arrived: true,
          arrivedTime: new Date().toLocaleTimeString(),
        };

      case "TOGGLE_PHOTO":
        const updated = [...state.photos];
        updated[action.index] = !updated[action.index];
        return { ...state, photos: updated };

      case "SET_ISSUE":
        return { ...state, issue: action.payload };

      case "ADD_ITEM":
        const items = [...state.additionalItems, action.payload];
        return {
          ...state,
          additionalItems: items,
          total:
            state.basePrice +
            state.technicianVisitFee +
            items.reduce((sum, item) => sum + item.price * (item.qty || 1), 0),
        };

      case "SET_FOLLOWUP":
        return { ...state, followupData: action.payload };
      case "SET_RESCHEDULE_TYPE":
        return { ...state, rescheduleType: action.payload };

      case "UPDATE_RESCHEDULE":
        return {
          ...state,
          rescheduleData: {
            ...state.rescheduleData,
            ...action.payload,
          },
        };
      case "SIGN_CUSTOMER":
        return { ...state, customerSigned: true };

      case "SIGN_TECH":
        if (!state.customerSigned) return state;
        return { ...state, techConfirmed: true };

      case "TICK":
        return { ...state, timerSeconds: state.timerSeconds + 1 };

      case "SET_BILLING_TYPE":
        return {
          ...state,
          billingType: action.payload,
        };

      default:
        return state;
    }
  }

  function StepHeader({
    title,
    canGoBack,
    onBack,
  }: {
    title: string;
    canGoBack: boolean;
    onBack: () => void;
  }) {
    return (
      <View style={headerStyles.container}>
        {canGoBack ? (
          <TouchableOpacity onPress={onBack}>
            <Text style={headerStyles.back}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 30 }} />
        )}

        <Text style={headerStyles.title}>{title}</Text>

        <View style={{ width: 30 }} />
      </View>
    );
  }

  export default function JobWorkflowScreen() {
    const route = useRoute<any>();
    const { job } = route.params;
    const [inventory, setInventory] = useState<any[]>([]);
    const [providerServices, setProviderServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const VISIT_FEE = 299;
    const [state, dispatch] = useReducer(reducer, {
      step: "photos",
      history: [],
      called: false,
      enRoute: false,
      arrived: false,
      photos: [false, false, false],
      issue: "compressor",
      notes: "",
      additionalItems: [],
      followupData: null,

      // 👇 ADD THESE
      rescheduleType: "none",
      rescheduleData: {
        partName: "",
        repairRequired: "",
        estimatedCost: "",
        expectedReturnDate: "",
        expectedReturnDateLabel: "",
      },

      basePrice: job.finalPrice,
      technicianVisitFee: VISIT_FEE,
      total: job.finalPrice + VISIT_FEE,
      customerSigned: false,
      techConfirmed: false,
      timerSeconds: 0,
      billingType: "full",
    });

    // Timer
    useEffect(() => {
      if (state.step === "service") {
        const interval = setInterval(() => {
          dispatch({ type: "TICK" });
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [state.step]);

    useEffect(() => {
      if (state.step === "service") {
        initInspection();
      }
    }, [state.step]);

    async function initInspection() {
      try {
        setLoading(true);

        // await startInspection(job._id);

        const [invRes, svcRes] = await Promise.all([
          getInventory(),
          getProviderServices(),
        ]);

        setInventory(invRes.items || []);
        setProviderServices(svcRes.services || []);
      } catch (e) {
        console.log("Init inspection error", e);
      } finally {
        setLoading(false);
      }
    }

    return (
      <ScrollView style={styles.screen}>
        <View style={{ flex: 1 }}>
          {/* {state.step === "arrival" && (
            <ArrivalStep state={state} dispatch={dispatch} jobId={job._id} />
          )} */}

          {state.step === "photos" && (
            <PhotosStep state={state} dispatch={dispatch} />
          )}

          {state.step === "inspection" && (
            <InspectionStep state={state} dispatch={dispatch} />
          )}

          {state.step === "discuss" && (
            <DiscussStep state={state} dispatch={dispatch} />
          )}

          {state.step === "service" && (
            <ServiceStep state={state} dispatch={dispatch} />
          )}

          {state.step === "parts" && (
            <PartsScreen
              state={state}
              dispatch={dispatch}
              inventory={inventory}
              jobId={job._id}
            />
          )}

          {state.step === "additional" && (
            <AdditionalServiceScreen
              state={state}
              dispatch={dispatch}
              services={providerServices}
              jobId={job._id}
            />
          )}

          {state.step === "custom" && (
            <CustomServiceScreen state={state} dispatch={dispatch} />
          )}

          {state.step === "followup" && (
            <RescheduleScreen state={state} dispatch={dispatch} />
          )}

          {state.step === "approval" && (
            <ApprovalStep state={state} dispatch={dispatch} jobId={job._id} />
          )}

          {state.step === "invoice" && (
            <InvoiceStep state={state} dispatch={dispatch} />
          )}

          {state.step === "signature" && (
            <SignatureStep state={state} dispatch={dispatch} jobId={job._id} />
          )}

          {state.step === "complete" && (
            <CompleteStep state={state} dispatch={dispatch} />
          )}
        </View>
      </ScrollView>
    );
  }

  // function ArrivalStep({ state, dispatch, jobId }: ApprovalScreenProps) {
  //   const handleStatusChange = async (
  //     newStatus: any,
  //     type: "EN_ROUTE" | "ARRIVED",
  //   ) => {
  //     try {
  //       const response = await updateJobStatus(
  //         jobId,
  //         newStatus, // backend enum
  //         undefined,
  //         `Status changed to ${newStatus}`,
  //       );

  //       if (response?.success) {
  //         dispatch({ type: type });
  //         Alert.alert("Success", `Job set to ${newStatus}`);
  //       } else {
  //         Alert.alert("Error", "Failed to update status");
  //       }
  //     } catch (error) {
  //       console.error(error);
  //       Alert.alert("Error", "Something went wrong");
  //     }
  //   };
  //   return (
  //     <>
  //       <StepHeader
  //         title="Job Progress"
  //         canGoBack={state.history.length > 0}
  //         onBack={() => dispatch({ type: "GO_BACK" })}
  //       />

  //       <View style={styles.card}>
  //         <TouchableOpacity
  //           style={[styles.stepItem, state.called && styles.stepCompleted]}
  //           onPress={() => dispatch({ type: "CALL_CUSTOMER" })}
  //         >
  //           <Text>{state.called ? "✅ " : "📞 "} Call Customer</Text>
  //         </TouchableOpacity>

  //         <TouchableOpacity
  //           style={[styles.stepItem, state.enRoute && styles.stepCompleted]}
  //           // onPress={() => }
  //           onPress={() => handleStatusChange("on_way", "EN_ROUTE")}
  //         >
  //           <Text>{state.enRoute ? "✅ " : "🚗 "} En Route</Text>
  //         </TouchableOpacity>

  //         <TouchableOpacity
  //           style={[styles.stepItem, state.arrived && styles.stepCompleted]}
  //           onPress={() => handleStatusChange("in_progress", "ARRIVED")}
  //         >
  //           <Text>{state.arrived ? "✅ " : "📍 "} Arrived</Text>
  //         </TouchableOpacity>
  //       </View>

  //       <TouchableOpacity
  //         style={[styles.buttonPrimary, !state.arrived && styles.buttonDisabled]}
  //         disabled={!state.arrived}
  //         onPress={() => dispatch({ type: "SET_STEP", payload: "photos" })}
  //       >
  //         <Text style={styles.buttonText}>Start Work</Text>
  //       </TouchableOpacity>
  //     </>
  //   );
  // }

  function PhotosStep({ state, dispatch }: StepProps) {
    const allTaken = state.photos.every((p) => p);

    return (
      <View style={s.root}>
        <StepHeader
          title="Take Photos"
          canGoBack={state.history.length > 0}
          onBack={() => dispatch({ type: "GO_BACK" })}
        />
        <View style={{ marginTop: 80, gap: 20 }}>
          <Text style={{ padding: 12, fontSize: 16 }}>
            * First take the product photos and send to provider through whatsapp
          </Text>
          <Text style={{ padding: 12, fontSize: 16 }}>
            * Then Verbally explain the problem to customer and ask for apporval
          </Text>
          {/* <View style={styles.card}>
          {["Unit", "Tag", "Area"].map((label, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.stepItem, state.photos[i] && styles.stepCompleted]}
              onPress={() => dispatch({ type: "TOGGLE_PHOTO", index: i })}
            >
              <Text>
                {state.photos[i] ? "✅ " : "📷 "} {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View> */}

          <TouchableOpacity
            style={[
              styles.buttonPrimary,
              {},
              // !allTaken && styles.buttonDisabled
            ]}
            // disabled={!allTaken}
            // onPress={() => dispatch({ type: "SET_STEP", payload: "discuss" })}
            onPress={() => dispatch({ type: "SET_STEP", payload: "service" })}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function InspectionStep({ state, dispatch }: StepProps) {
    const issues = [
      { key: "compressor", label: "Compressor Failed" },
      { key: "leak", label: "Refrigerant Leak" },
      { key: "capacitor", label: "Capacitor Bad" },
      { key: "fan", label: "Fan Motor Issue" },
      { key: "noissue", label: "No Issue (Maintenance)" },
    ];

    return (
      <>
        <StepHeader
          title="Inspection"
          canGoBack={state.history.length > 0}
          onBack={() => dispatch({ type: "GO_BACK" })}
        />

        <View style={styles.card}>
          {issues.map((issue) => (
            <TouchableOpacity
              key={issue.key}
              style={[
                styles.stepItem,
                state.issue === issue.key && styles.stepCompleted,
              ]}
              onPress={() => dispatch({ type: "SET_ISSUE", payload: issue.key })}
            >
              <Text>
                {state.issue === issue.key ? "✅ " : "🔍 "}
                {issue.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => dispatch({ type: "SET_STEP", payload: "discuss" })}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </>
    );
  }

  function DiscussStep({ state, dispatch }: StepProps) {
    return (
      <>
        <StepHeader
          title="Discuss With Customer"
          canGoBack={state.history.length > 0}
          onBack={() => dispatch({ type: "GO_BACK" })}
        />

        <View style={styles.card}>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>Issue Identified:</Text>

          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            {/* {state.issue.toUpperCase()} */}
            Discuss the issue with customer
          </Text>

          <Text style={{ marginTop: 10, color: "#555" }}>
            Explain repair cost and confirm approval.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.buttonSuccess}
          onPress={() => dispatch({ type: "SET_STEP", payload: "service" })}
        >
          <Text style={styles.buttonText}>Customer Approved</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonDanger}
          onPress={() => dispatch({ type: "SET_STEP", payload: "invoice" })}
        >
          <Text style={styles.buttonText}>Customer Declined</Text>
        </TouchableOpacity>
      </>
    );
  }
  function ServiceStep({ state, dispatch }: StepProps) {
    const mins = Math.floor(state.timerSeconds / 60);
    const secs = state.timerSeconds % 60;

    const additionalCost = state.additionalItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 1),
      0,
    );

    const total = state.basePrice + additionalCost;

    return (
      <View style={s.root}>
        <StepHeader
          title="Service"
          canGoBack={state.history.length > 0}
          onBack={() => dispatch({ type: "GO_BACK" })}
        />

        {/* Job Info */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontWeight: "700" }}>John Smith</Text>
            <Text>
              ⏱ {mins.toString().padStart(2, "0")}:
              {secs.toString().padStart(2, "0")}
            </Text>
          </View>
        </View>

        {/* Base Service */}
        <View style={styles.card}>
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>
            📋 Booked Service
          </Text>
          <Text>Compressor Replacement</Text>
          <Text style={{ color: "#1c4e7c", marginTop: 6 }}>
            ✓ Base price: ₹{state.basePrice}
          </Text>
        </View>

        {/* Action Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <TouchableOpacity
            style={[styles.stepItem, { flex: 1 }]}
            onPress={() => dispatch({ type: "SET_STEP", payload: "parts" })}
          >
            <Text>🔧 Add Part</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepItem, { flex: 1 }]}
            onPress={() => dispatch({ type: "SET_STEP", payload: "additional" })}
          >
            <Text>➕ Additional Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepItem, { flex: 1 }]}
            onPress={() => dispatch({ type: "SET_STEP", payload: "followup" })}
          >
            <Text>📅 Reschedule</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.stepItem, { flex: 1 }]}
            onPress={() => dispatch({ type: "SET_STEP", payload: "followup" })}
          >
            <Text>🔨 Workshop</Text>
          </TouchableOpacity> */}
        </View>

        {/* Addons Summary */}
        {(state.additionalItems.length > 0 || state.followupData) && (
          <View style={styles.card}>
            <Text style={{ fontWeight: "600", marginBottom: 10 }}>
              Added Items
            </Text>

            {state.additionalItems.map((item, i) => {
              const itemTotal = (item.price || 0) * (item.qty || 1);
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text>
                    {item.name} {item.qty ? `x${item.qty}` : ""}
                  </Text>
                  <Text>₹{itemTotal}</Text>
                </View>
              );
            })}

            <View style={{ marginTop: 10 }}>
              <Text>Additional Cost: ₹{additionalCost}</Text>
            </View>

            {state.followupData && (
              <View
                style={{
                  marginTop: 10,
                  padding: 10,
                  backgroundColor: "#e3f0ff",
                  borderRadius: 12,
                }}
              >
                <Text>
                  📅 Follow-up: {state.followupData.date} (
                  {state.followupData.time})
                </Text>
                <Text>Reason: {state.followupData.reason}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => dispatch({ type: "SET_STEP", payload: "approval" })}
        >
          <Text style={styles.buttonText}>💰 Request Approval</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSuccess}
          onPress={() => dispatch({ type: "SET_STEP", payload: "invoice" })}
        >
          <Text style={styles.buttonText}>✅ Complete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.buttonPrimary,
            { backgroundColor: "red", paddingVertical: 10, gap: 4 },
          ]}
          onPress={() => {
            dispatch({ type: "SET_BILLING_TYPE", payload: "visit_only" });
            dispatch({ type: "SET_STEP", payload: "invoice" });
          }}
        >
          <Text style={styles.buttonText}>Customer Declined Service</Text>
          <Text style={{ fontSize: 12, color: "#fff" }}>
            Only Visiting charges applicable
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  export function PartsScreen({
    state,
    dispatch,
    inventory,
    jobId,
  }: PartsScreenProps) {
    const [search, setSearch] = React.useState("");
    // map of _id → Part (so we keep full info when toggled)
    const [selected, setSelected] = React.useState<Record<string, Part>>({});

    const filtered = inventory.filter((p) =>
      p.productName.toLowerCase().includes(search.toLowerCase()),
    );

    const selectedList: Part[] = Object.values(selected);

    function togglePart(part: Part) {
      setSelected((prev) => {
        if (prev[part._id]) {
          const copy = { ...prev };
          delete copy[part._id];
          return copy;
        }
        return { ...prev, [part._id]: part };
      });
    }

    function removePart(id: string) {
      setSelected((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }

    async function handleNext() {
      try {
        if (!selectedList.length) {
          Alert.alert("No parts selected", "Please select at least one part.");
          return;
        }

        const payload = selectedList.map((p) => ({
          inventoryItemId: p._id,
          quantity: 1,
        }));

        await addUsedParts(jobId, payload); // your existing API call

        selectedList.forEach((item) => {
          dispatch({
            type: "ADD_ITEM",
            payload: {
              _id: item._id,
              name: item.productName,
              price: item.price,
              qty: 1,
            },
          });
        });

        setSelected({});
        dispatch({ type: "SET_STEP", payload: "service" });
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Failed to add parts",
        );
      }
    }
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

    // ── render ──────────────────────────────────────────────────────────────────
    return (
      <View style={s.root}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>AC Service Inspection</Text>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Parts List card ── */}
          <CCView>
            <View style={s.card}>
              {/* card header */}
              <View style={s.cardHeader}>
                <Text style={s.cardTitle}>Parts List</Text>
                <TouchableOpacity style={s.syncBtn}>
                  <Text style={s.syncIcon}>⇄ </Text>
                  <Text style={s.syncText}>Sync Data</Text>
                </TouchableOpacity>
              </View>

              {/* search */}
              {/* <View style={s.searchBox}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                placeholder="Search Parts"
                placeholderTextColor="#aaa"
                value={search}
                onChangeText={setSearch}
              />
            </View> */}

              {/* grid */}
              <View style={s.grid}>
                {filtered.map((part) => {
                  const isSelected = !!selected[part._id];
                  return (
                    <CustomView
                      radius={scale(12)}
                      gradientColors={
                        isSelected
                          ? ["#93aad3", "#878dbd"]
                          : ["#F7F6FA", "#EDEBF4"]
                      }
                      shadowStyle={{
                        width: "48%",
                        marginBottom: verticalScale(10),
                      }}
                      key={part._id}
                    >
                      <TouchableOpacity
                        key={part._id}
                        style={[s.partTile]}
                        onPress={() => togglePart(part)}
                        activeOpacity={0.75}
                      >
                        <View style={s.tileContent}>
                          <View
                            style={{
                              height: "100%",
                              width: "92%",
                              justifyContent: "space-between",
                              borderWidth: 0,
                            }}
                          >
                            <Text style={s.tileName}>{part.productName}</Text>
                            <Text style={s.tilePrice}>
                              ₹{part.price.toLocaleString("en-IN")}
                            </Text>
                          </View>
                          <View
                          // style={[s.plusCircle, isSelected && s.plusCircleSelected]}
                          >
                            <Text
                              style={[
                                s.plusText,
                                isSelected && s.plusTextSelected,
                              ]}
                            >
                              {isSelected ? "✓" : "+"}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </CustomView>
                  );
                })}
              </View>
            </View>
          </CCView>

          {/* ── Selected Parts card ── */}
          <CCView>
            <View style={[s.card, { marginTop: 0 }]}>
              <Text style={s.cardTitle}>Selected Parts</Text>

              {/* table header */}
              <View style={s.tableHeader}>
                <Text style={[s.th, { flex: 2 }]}>Part Name</Text>
                <Text style={[s.th, { flex: 1.5 }]}>Warranty</Text>
                <Text style={[s.th, { flex: 1.2 }]}>Price</Text>
                <Text style={[s.th, { flex: 0.8, textAlign: "right" }]}>
                  Action
                </Text>
              </View>

              {selectedList.length === 0 ? (
                <Text style={s.emptyText}>No parts selected yet.</Text>
              ) : (
                selectedList.map((part) => (
                  <View key={part._id} style={s.tableRow}>
                    <Text style={[s.td, { flex: 2 }]}>{part.productName}</Text>
                    <Text style={[s.td, { flex: 1.5 }]}>
                      {/* {warrantyLabel(part.warrantyMonths)} */}
                      warranty
                    </Text>
                    <Text style={[s.td, { flex: 1.2 }]}>
                      ₹ {part.price.toLocaleString("en-IN")}
                    </Text>
                    <View style={{ flex: 0.8, alignItems: "flex-end" }}>
                      <TouchableOpacity
                        onPress={() => removePart(part._id)}
                        style={s.deleteBtn}
                      >
                        {/* <Text style={s.deleteIcon}>🗑</Text> */}
                        <Ionicons name="trash" size={20} color="#FF0000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </CCView>
        </ScrollView>

        {/* ── Back / Next ── */}
        <View style={s.footer}>
          <TouchableOpacity
            style={s.btnBack}
            onPress={() => dispatch({ type: "GO_BACK" })}
          >
            <Text style={s.btnBackText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ flex: 1 }} onPress={handleNext}>
            <LinearGradient
              colors={["#027CC7", "#004DBD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.btnNext}
            >
              <Text style={s.btnNextText}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  function AdditionalServiceScreen({
    state,
    dispatch,
    services,
    jobId,
  }: AdditionalServiceScreenProps) {
    const [selectedServices, setSelectedServices] = React.useState<
      Record<string, number>
    >({});

    function toggleService(id: string) {
      setSelectedServices((prev) => {
        if (prev[id]) {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        }

        return { ...prev, [id]: 1 }; // default qty = 1
      });
    }

    async function addService() {
      try {
        const entries = Object.entries(selectedServices);

        if (!entries.length) {
          Alert.alert("Select at least one service");
          return;
        }

        for (const [id, qty] of entries) {
          await addAdditionalService(jobId, {
            providerOfferedServiceId: id,
            quantity: qty,
          });

          const svc = services.find((x) => x._id === id);

          dispatch({
            type: "ADD_ITEM",
            payload: {
              _id: id,
              name: svc?.service.name,
              price: svc?.service.basePrice,
              qty,
            },
          });
        }

        setSelectedServices({});
        dispatch({ type: "SET_STEP", payload: "service" });
      } catch (error: any) {
        console.log("ADD SERVICE ERROR →", error?.response?.data);
        Alert.alert("Error", "Failed to add services");
      }
    }

    return (
      <View style={s.root}>
        <StepHeader
          title="Additional Service"
          canGoBack
          onBack={() => dispatch({ type: "GO_BACK" })}
        />

        {services.map((s) => {
          const isSelected = !!selectedServices[s._id];

          return (
            <TouchableOpacity
              key={s._id}
              style={[styles.card, isSelected && { backgroundColor: "#D4F4DD" }]}
              onPress={() => toggleService(s._id)}
            >
              <View
                style={{ flexDirection: "row", justifyContent: "space-between" }}
              >
                <View>
                  <Text style={{ fontWeight: "600" }}>{s.service.name}</Text>
                  <Text>₹{s.service.basePrice}</Text>
                </View>

                {isSelected && <Text style={{ fontSize: 18 }}>✅</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.stepItem}
          onPress={() => dispatch({ type: "SET_STEP", payload: "custom" })}
        >
          <Text>✨ Custom Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => addService()}
        >
          <Text style={styles.buttonText}>BACK TO SERVICE</Text>
        </TouchableOpacity>
      </View>
    );
  }
  function CustomServiceScreen({ dispatch }: StepProps) {
    const [name, setName] = React.useState("");
    const [price, setPrice] = React.useState("");

    return (
      <View style={s.root}>
        <StepHeader
          title="Custom Service"
          canGoBack
          onBack={() => dispatch({ type: "GO_BACK" })}
        />

        <View style={styles.card}>
          <TextInput
            placeholder="Service Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Price"
            value={price}
            keyboardType="numeric"
            onChangeText={setPrice}
          />
        </View>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => {
            dispatch({
              type: "ADD_ITEM",
              payload: { name, price: parseFloat(price) },
            });
            dispatch({ type: "SET_STEP", payload: "service" });
          }}
        >
          <Text style={styles.buttonText}>ADD</Text>
        </TouchableOpacity>
      </View>
    );
  }
  function RescheduleScreen({ state, dispatch }: StepProps) {
    const { rescheduleType, rescheduleData } = state;

    function setDate(label: string) {
      const today = new Date();
      let date = new Date(today);

      if (label === "Tomorrow") {
        date.setDate(today.getDate() + 1);
      }

      if (label === "Within Week") {
        date.setDate(today.getDate() + 7);
      }

      dispatch({
        type: "UPDATE_RESCHEDULE",
        payload: {
          expectedReturnDate: date.toISOString().split("T")[0],
          expectedReturnDateLabel: label, // 👈 ADD THIS
        },
      });
    }

    return (
      <View style={s.root}>
        <StepHeader
          title="Reschedule"
          canGoBack
          onBack={() => dispatch({ type: "GO_BACK" })}
        />

        {/* TYPE SELECTION */}
        <View style={styles.card}>
          <TouchableOpacity
            style={[
              styles.optionRow,
              rescheduleType === "parts_pending" && styles.optionSelected,
            ]}
            onPress={() =>
              dispatch({
                type: "SET_RESCHEDULE_TYPE",
                payload: "parts_pending",
              })
            }
          >
            <Text>Parts Not Available</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionRow,
              rescheduleType === "workshop_required" && styles.optionSelected,
            ]}
            onPress={() =>
              dispatch({
                type: "SET_RESCHEDULE_TYPE",
                payload: "workshop_required",
              })
            }
          >
            <Text>Workshop Repair</Text>
          </TouchableOpacity>
        </View>

        {/* DYNAMIC FORM */}
        {(rescheduleType === "parts_pending" ||
          rescheduleType === "workshop_required") && (
          <View style={styles.card}>
            <TextInput
              placeholder={
                rescheduleType === "parts_pending" ? "Part Name" : "Description"
              }
              style={styles.input}
              value={rescheduleData.partName || ""}
              onChangeText={(t) =>
                dispatch({
                  type: "UPDATE_RESCHEDULE",
                  payload: { partName: t },
                })
              }
            />

            <TextInput
              placeholder={
                rescheduleType === "parts_pending" ? "Notes" : "Repair Required"
              }
              style={styles.input}
              value={rescheduleData.repairRequired || ""}
              onChangeText={(t) =>
                dispatch({
                  type: "UPDATE_RESCHEDULE",
                  payload: { repairRequired: t },
                })
              }
            />

            <TextInput
              placeholder="Estimated Cost"
              keyboardType="numeric"
              style={styles.input}
              value={rescheduleData.estimatedCost || ""}
              onChangeText={(t) =>
                dispatch({
                  type: "UPDATE_RESCHEDULE",
                  payload: { estimatedCost: t },
                })
              }
            />
          </View>
        )}

        {/* DATE SELECTOR */}
        <View style={styles.card}>
          <Text style={{ marginBottom: 10 }}>Reschedule Date</Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            {["Today", "Tomorrow", "Within Week"].map((label) => (
              <TouchableOpacity
                key={label}
                style={[
                  styles.dateBtn,
                  rescheduleData.expectedReturnDateLabel === label &&
                    styles.dateSelected,
                ]}
                onPress={() => setDate(label)}
              >
                <Text>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => dispatch({ type: "SET_STEP", payload: "service" })}
        >
          <Text style={styles.buttonText}>SAVE & RETURN</Text>
        </TouchableOpacity>
      </View>
    );
  }
  function SignatureStep({ state, dispatch, jobId }: ApprovalScreenProps) {
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const { token } = useContext(AuthContext);

    const handleVerifyPin = async (pin: string) => {
      if (!jobId) return;

      try {
        // setPinLoading(true);

        const response = await completeJob(jobId, token, pin);

        console.log("PIN Verification Response:", response);

        if (response && response.success) {
          // updateStatus(selectedJobId, JobStatus.COMPLETED);
          setPinModalVisible(false);
          Alert.alert("Success", "Job completed and PIN verified!");

          dispatch({ type: "SET_STEP", payload: "complete" });
          // setShowReview(true);
          // Refresh jobs to get updated stats
          // await refreshJobs();
        } else {
          Alert.alert("Error", response?.message || "Invalid PIN");
        }
      } catch (error) {
        console.error("Error verifying PIN:", error);
        Alert.alert("Error", "Failed to verify PIN");
      }
    };

    return (
      <View style={s.root}>
        <StepHeader
          title="Confirmaiton"
          canGoBack={state.history.length > 0}
          onBack={() => dispatch({ type: "GO_BACK" })}
        />

        <View style={styles.card}>
          <TouchableOpacity
            style={[
              styles.stepItem,
              state.customerSigned && styles.stepCompleted,
            ]}
            onPress={() => dispatch({ type: "SIGN_CUSTOMER" })}
          >
            <Text>{state.customerSigned ? "✅ " : ""}Customer Approval</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepItem, state.techConfirmed && styles.stepCompleted]}
            onPress={() => dispatch({ type: "SIGN_TECH" })}
          >
            <Text>{state.techConfirmed ? "✅ " : ""}Technician Witness</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.buttonSuccess,
            !state.techConfirmed && styles.buttonDisabled,
          ]}
          disabled={!state.techConfirmed}
          onPress={() => setPinModalVisible(true)}
        >
          <Text style={styles.buttonText}>Complete Job</Text>
        </TouchableOpacity>

        <OtpModal
          visible={pinModalVisible}
          onClose={() => {
            setPinModalVisible(false);
          }}
          onSubmit={handleVerifyPin}
          title="Enter Completion PIN"
          // description="Ask customer for the completion PIN to verify job completion"
          // loading={pinLoading}
        />
      </View>
    );
  }

  function ApprovalStep({ state, dispatch, jobId }: ApprovalScreenProps) {
    const [loading, setLoading] = useState(false);

    const computedTotal =
      state.billingType === "visit_only"
        ? state.technicianVisitFee
        : state.basePrice +
          // state.technicianVisitFee +
          state.additionalItems.reduce(
            (sum, item) => sum + item.price * (item.qty || 1),
            0,
          );

    async function handleFinalApproval() {
      if (!jobId) {
        Alert.alert("Job ID not available");
        return;
      }
      try {
        setLoading(true);

        const { rescheduleType, rescheduleData } = state;

        // 🔹 CASE 1 — Normal Flow
        if (rescheduleType === "none") {
          // await completeInspection(jobId, "", true);
          await requestVerification(jobId);
        }

        // 🔹 CASE 2 — Parts Pending
        if (rescheduleType === "parts_pending") {
          const { partName, repairRequired, estimatedCost, expectedReturnDate } =
            rescheduleData;

          if (!partName || !expectedReturnDate) {
            Alert.alert("Fill all feilds", "Part name of Return Date is Missing");
            return;
          }

          await createPartsPending(jobId, {
            requiredParts: [
              {
                partName,
                quantity: 1,
                estimatedCost: Number(estimatedCost),
                supplier: "Technician will procure",
                notes: repairRequired,
              },
            ],
            estimatedAvailability: "within_week",
            expectedReturnDate,
          });
          Alert.alert(
            "Parts Pending",
            "User approval requested. Job will be rescheduled.",
          );
          // await requestVerification(jobId);
        }

        // 🔹 CASE 3 — Workshop
        if (rescheduleType === "workshop_required") {
          const { partName, repairRequired, estimatedCost, expectedReturnDate } =
            rescheduleData;
          if (!partName || !expectedReturnDate) {
            Alert.alert("Fill all feilds", "Part name of Return Date is Missing");
            return;
          }

          await createWorkshop(jobId, {
            itemDescription: partName,
            repairRequired: repairRequired || "Repair Required",
            estimatedCost: Number(estimatedCost),
            estimatedCompletionTime: "3-5_days",
            expectedReturnDate: expectedReturnDate,
            notes: "Workshop Needed",
          });
          Alert.alert(
            "Workshop Repair needed",
            "User approval requested. Job will be rescheduled.",
          );
        }

        Alert.alert("Success", "Sent for user approval");
        dispatch({ type: "SET_STEP", payload: "service" });
      } catch (e: any) {
        console.log("FINAL APPROVAL ERROR →", e?.response?.data);
        Alert.alert("Error", e?.response?.data.error);
      } finally {
        setLoading(false);
      }
    }

    return (
      <View style={s.root}>
        <StepHeader
          title="Update Estimates"
          canGoBack={state.history.length > 0}
          onBack={() => dispatch({ type: "GO_BACK" })}
        />

        <View style={styles.card}>
          <Text>Base Service: ₹{state.basePrice}</Text>

          {state.additionalItems.map((item, index) => {
            const itemTotal = item.price * (item.qty || 1);
            return (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 6,
                }}
              >
                <Text>{item.name}</Text>
                <Text>₹{itemTotal}</Text>
              </View>
            );
          })}

          <View
            style={{
              marginTop: 10,
              borderTopWidth: 1,
              paddingTop: 10,
            }}
          >
            <Text style={styles.totalText}>Total: ₹{computedTotal}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.buttonSuccess, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={handleFinalApproval}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Approve</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonDanger}
          onPress={() => dispatch({ type: "SET_STEP", payload: "service" })}
        >
          <Text style={styles.buttonText}>Modify</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function InvoiceStep({ state, dispatch }: StepProps) {
    const computedTotal =
      state.billingType === "visit_only"
        ? state.technicianVisitFee
        : state.basePrice +
          // state.technicianVisitFee +
          state.additionalItems.reduce(
            (sum, item) => sum + item.price * (item.qty || 1),
            0,
          );

    console.log("computedTotal :::::", computedTotal);

    return (
      <View style={s.root}>
        <StepHeader
          title="Invoice"
          canGoBack={state.history.length > 0}
          onBack={() => dispatch({ type: "GO_BACK" })}
        />

        <View style={styles.card}>
          {state.billingType === "full" && (
            <Text>Base Service: ₹{state.basePrice}</Text>
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <Text>Technician Visit Fee</Text>
            <Text>₹{state.technicianVisitFee}</Text>
          </View>

          {state.billingType === "full" &&
            state.additionalItems.map((item, index) => {
              const itemTotal = item.price * (item.qty || 1);
              return (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 6,
                  }}
                >
                  <Text>{item.name}</Text>
                  <Text>₹{itemTotal}</Text>
                </View>
              );
            })}

          <View
            style={{
              marginTop: 12,
              borderTopWidth: 1,
              paddingTop: 10,
            }}
          >
            <Text style={styles.totalText}>Total: ₹{computedTotal}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => dispatch({ type: "SET_STEP", payload: "signature" })}
        >
          <Text style={styles.buttonText}>Add Customer Signature</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function CompleteStep({ state }: StepProps) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 9,
        }}
      >
        <View style={styles.card}>
          <Text style={{ fontSize: 60, textAlign: "center" }}>✅</Text>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              textAlign: "center",
              marginTop: 10,
            }}
          >
            Job Complete!
          </Text>

          <Text
            style={{
              marginTop: 10,
              textAlign: "center",
              fontSize: 16,
            }}
          >
            Total Collected: ₹{state.total}
          </Text>

          <Text
            style={{
              marginTop: 6,
              textAlign: "center",
              color: "#777",
            }}
          >
            {new Date().toLocaleString()}
          </Text>
        </View>
      </View>
    );
  }

  const headerStyles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    back: {
      fontSize: 22,
      color: "#165297",
      fontWeight: "600",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
    },
  });
  const BLUE = "#004DBD";
  const RED = "#E53935";

  const s = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: "#F2F4F8",
      paddingHorizontal: 9,
      paddingBottom: verticalScale(50),
    },
    scroll: { paddingTop: 14, paddingBottom: 20 },

    // header
    header: {
      // backgroundColor: "#fff",
      // paddingHorizontal: 16,
      // paddingTop: 52,
      paddingBottom: 14,
    },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#111" },

    // card
    card: {
      // backgroundColor: "#fff",
      // borderRadius: 14,
      padding: 14,
      // shadowColor: "#000",
      // shadowOpacity: 0.06,
      // shadowRadius: 6,
      // shadowOffset: { width: 0, height: 2 },
      // elevation: 3,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    cardTitle: { fontSize: 16, fontWeight: "700", color: "#111" },

    // sync button
    syncBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#33C2EF",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    syncIcon: { color: "#fff", fontSize: 13 },
    syncText: { color: "#fff", fontSize: 13, fontWeight: "600" },

    // search
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F2F4F8",
      borderRadius: 10,
      paddingHorizontal: 10,
      marginBottom: 12,
    },
    searchIcon: { fontSize: 15, marginRight: 6 },
    searchInput: { flex: 1, height: 40, fontSize: 14, color: "#222" },

    // grid
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

    partTile: {
      height: verticalScale(60),
      // width: "31%",
      // borderWidth: 1,
      // borderColor: "#E0E4ED",
      // borderRadius: 10,
      // backgroundColor: "#FAFBFF",
      padding: 8,
    },
    partTileSelected: {
      borderColor: BLUE,
      backgroundColor: "#EEF4FF",
    },
    tileContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    tileName: { fontSize: 11, color: "#000", marginBottom: 2 },
    tilePrice: { fontSize: 13, fontWeight: "700", color: "#111" },

    plusCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: BLUE,
      alignItems: "center",
      justifyContent: "center",
    },
    plusCircleSelected: { backgroundColor: BLUE },
    plusText: { fontSize: moderateScale(19), color: BLUE, lineHeight: 18 },
    plusTextSelected: { color: "#fff" },

    // table
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#E8EAEE",
      paddingBottom: 8,
      marginTop: 10,
      marginBottom: 4,
    },
    th: { fontSize: 12, fontWeight: "700", color: "#333" },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#F0F2F5",
    },
    td: { fontSize: 13, color: "#333" },
    emptyText: {
      color: "#aaa",
      textAlign: "center",
      paddingVertical: 16,
      fontSize: 13,
    },

    deleteBtn: { padding: 4 },
    deleteIcon: { fontSize: 18 },

    // footer
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      // gap: 12,
      // backgroundColor: "#fff",
      // borderTopWidth: 1,
      // borderTopColor: "#EEE",
    },
    btnBack: {
      backgroundColor: "red",
      flex: 1,
      marginRight: scale(8),
      paddingVertical: verticalScale(12),
      borderRadius: scale(8),
      alignItems: "center",
    },
    btnBackText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    btnNext: {
      flex: 1,
      backgroundColor: BLUE,
      borderRadius: scale(8),
      alignItems: "center",
      justifyContent: "center",
    },
    btnNextText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  });

  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: "#F5F7FA",
      paddingVertical: 20,
    },

    container: {
      padding: 20,
    },

    card: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    title: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 16,
      color: "#1A1A1A",
    },

    stepItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 12,
      marginBottom: 10,
      backgroundColor: "#EEF3FB",
    },
    optionRow: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: "#EEF3FB",
      marginBottom: 10,
    },

    optionSelected: {
      backgroundColor: "#D4F4DD",
    },

    input: {
      backgroundColor: "#F2F4F7",
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },

    dateBtn: {
      backgroundColor: "#F6F5F9",
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#DEDEDE",
    },

    dateSelected: {
      backgroundColor: "#D4F4DD",
    },
    stepCompleted: {
      backgroundColor: "#D4F4DD",
    },

    buttonPrimary: {
      backgroundColor: "#165297",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      marginTop: 12,
    },

    buttonSuccess: {
      backgroundColor: "#34C759",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      marginTop: 12,
    },

    buttonDanger: {
      backgroundColor: "#FF3B30",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      marginTop: 12,
    },

    buttonDisabled: {
      opacity: 0.4,
    },

    buttonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 15,
    },

    totalText: {
      fontSize: 18,
      fontWeight: "700",
      marginTop: 10,
    },

    timer: {
      fontSize: 18,
      fontWeight: "600",
      color: "#165297",
      marginBottom: 16,
    },
  });
