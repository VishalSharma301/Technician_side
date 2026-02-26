import { useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useReducer, useState } from "react";
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
  total: number;

  // Signature
  customerSigned: boolean;
  techConfirmed: boolean;

  // Timer
  timerSeconds: number;
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
  const [state, dispatch] = useReducer(reducer, {
    step: "arrival",
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
    total: job.finalPrice,
    customerSigned: false,
    techConfirmed: false,
    timerSeconds: 0,
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
        {state.step === "arrival" && (
          <ArrivalStep state={state} dispatch={dispatch} jobId={job._id} />
        )}

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

function ArrivalStep({ state, dispatch, jobId }: ApprovalScreenProps) {
  const handleStatusChange = async (
    newStatus: any,
    type: "EN_ROUTE" | "ARRIVED",
  ) => {
    try {
      const response = await updateJobStatus(
        jobId,
        newStatus, // backend enum
        undefined,
        `Status changed to ${newStatus}`,
      );

      if (response?.success) {
        dispatch({ type: type });
        Alert.alert("Success", `Job set to ${newStatus}`);
      } else {
        Alert.alert("Error", "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    }
  };
  return (
    <>
      <StepHeader
        title="Job Progress"
        canGoBack={state.history.length > 0}
        onBack={() => dispatch({ type: "GO_BACK" })}
      />

      <View style={styles.card}>
        <TouchableOpacity
          style={[styles.stepItem, state.called && styles.stepCompleted]}
          onPress={() => dispatch({ type: "CALL_CUSTOMER" })}
        >
          <Text>{state.called ? "✅ " : "📞 "} Call Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepItem, state.enRoute && styles.stepCompleted]}
          // onPress={() => }
          onPress={() => handleStatusChange("on_way", "EN_ROUTE")}
        >
          <Text>{state.enRoute ? "✅ " : "🚗 "} En Route</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepItem, state.arrived && styles.stepCompleted]}
          onPress={() => handleStatusChange("in_progress", "ARRIVED")}
        >
          <Text>{state.arrived ? "✅ " : "📍 "} Arrived</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.buttonPrimary, !state.arrived && styles.buttonDisabled]}
        disabled={!state.arrived}
        onPress={() => dispatch({ type: "SET_STEP", payload: "photos" })}
      >
        <Text style={styles.buttonText}>Start Work</Text>
      </TouchableOpacity>
    </>
  );
}

function PhotosStep({ state, dispatch }: StepProps) {
  const allTaken = state.photos.every((p) => p);

  return (
    <>
      <StepHeader
        title="Take Photos"
        canGoBack={state.history.length > 0}
        onBack={() => dispatch({ type: "GO_BACK" })}
      />

      <View style={styles.card}>
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
      </View>

      <TouchableOpacity
        style={[styles.buttonPrimary, !allTaken && styles.buttonDisabled]}
        disabled={!allTaken}
        onPress={() => dispatch({ type: "SET_STEP", payload: "inspection" })}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </>
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
          {state.issue.toUpperCase()}
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
    <>
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
    </>
  );
}
function PartsScreen({ state, dispatch, inventory, jobId }: PartsScreenProps) {
  const [selectedParts, setSelectedParts] = React.useState<
    Record<string, number>
  >({});

  function changeQty(id: string, delta: number) {
    setSelectedParts((prev) => {
      const current = prev[id] || 0;
      const newQty = Math.max(0, current + delta);

      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }

      return { ...prev, [id]: newQty };
    });
  }

  async function addToJob() {
    try {
      const payload = Object.entries(selectedParts).map(
        ([inventoryItemId, quantity]) => ({
          inventoryItemId,
          quantity,
        }),
      );
      console.log("selectedParts:", selectedParts);
      console.log("payload:", payload);
      if (!payload.length) return;

      await addUsedParts(jobId, payload);

      // Update reducer
      inventory.forEach((item) => {
        const qty = selectedParts[item._id];
        if (qty) {
          dispatch({
            type: "ADD_ITEM",
            payload: {
              _id: item._id,
              name: item.productName,
              price: item.price,
              qty,
            },
          });
        }
      });

      setSelectedParts({});
      dispatch({ type: "SET_STEP", payload: "service" });
    } catch (error: any) {
      console.log("ADD PARTS ERROR →", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to add parts",
      );
    }
  }

  return (
    <>
      <StepHeader
        title="Add Part"
        canGoBack
        onBack={() => dispatch({ type: "GO_BACK" })}
      />

      {inventory.map((p) => {
        const qty = selectedParts[p._id] || 0;

        return (
          <View key={p._id} style={styles.card}>
            <Text style={{ fontWeight: "600" }}>{p.productName}</Text>

            <Text>₹{p.price}</Text>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <TouchableOpacity onPress={() => changeQty(p._id, -1)}>
                <Text style={{ fontSize: 20 }}>➖</Text>
              </TouchableOpacity>

              <Text style={{ marginHorizontal: 15 }}>{qty}</Text>

              <TouchableOpacity onPress={() => changeQty(p._id, 1)}>
                <Text style={{ fontSize: 20 }}>➕</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={styles.buttonPrimary} onPress={addToJob}>
        <Text style={styles.buttonText}>ADD TO JOB</Text>
      </TouchableOpacity>
    </>
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
    <>
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
    </>
  );
}
function CustomServiceScreen({ dispatch }: StepProps) {
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");

  return (
    <>
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
    </>
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
    <>
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
    </>
  );
}
function SignatureStep({ state, dispatch, jobId }: ApprovalScreenProps) {
  const [pinModalVisible, setPinModalVisible] = useState(false);

  const handleVerifyPin = async (pin: string) => {
    if (!jobId) return;

    try {
      // setPinLoading(true);
      // const response = await verifyCompletionPin(selectedJobId, pin);
      const response = await updateJobStatus(
        jobId,
        "completed",
        pin,
        "Job completed",
      );

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
    <>
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
    </>
  );
}

function ApprovalStep({ state, dispatch, jobId }: ApprovalScreenProps) {
  const [loading, setLoading] = useState(false);

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
          expectedReturnDate,
          notes: "",
        });
      }

      Alert.alert("Success", "Sent for user approval");
      dispatch({ type: "SET_STEP", payload: "service" });
    } catch (e: any) {
      console.log("FINAL APPROVAL ERROR →", e?.response?.data);
      Alert.alert("Error", "Failed to send approval");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
          <Text style={styles.totalText}>Total: ₹{state.total}</Text>
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
    </>
  );
}

function InvoiceStep({ state, dispatch }: StepProps) {
  return (
    <>
      <StepHeader
        title="Invoice"
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
            marginTop: 12,
            borderTopWidth: 1,
            paddingTop: 10,
          }}
        >
          <Text style={styles.totalText}>Total: ₹{state.total}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => dispatch({ type: "SET_STEP", payload: "signature" })}
      >
        <Text style={styles.buttonText}>Add Customer Signature</Text>
      </TouchableOpacity>
    </>
  );
}

function CompleteStep({ state }: StepProps) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 20,
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
