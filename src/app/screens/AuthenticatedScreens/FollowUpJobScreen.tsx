import React, { useCallback, useContext, useReducer, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

import { AuthContext } from "../../../store/AuthContext";
import { useJobs } from "../../../store/JobContext";
import { JobStatus } from "../../../constants/jobTypes";
import {
  confirmSchedule,
  markArrived,
  markOnWay,
  completeJob,
} from "../../../util/jobHandlingApis";
import OtpModal from "../../components/OtpModal";
import { JobType } from "../../../constants/job";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
  | "detail"
  | "arrival"
  | "work"
  | "invoice"
  | "signature"
  | "complete";

interface WorkflowState {
  step: Step;
  history: Step[];

  // Arrival
  customerCalledTime: string | null;
  enRouteTime: string | null;
  arrivedTime: string | null;

  // Work checklist
  checklist: boolean[]; // [removeOld, installNew, testSystem, verifyOp]
  photoDone: boolean;

  // Signature
  customerSigned: boolean;
  techConfirmed: boolean;
}

type Action =
  | { type: "SET_STEP"; payload: Step }
  | { type: "GO_BACK" }
  | { type: "CALL_CUSTOMER" }
  | { type: "EN_ROUTE" }
  | { type: "ARRIVED" }
  | { type: "TOGGLE_CHECK"; index: number }
  | { type: "PHOTO_DONE" }
  | { type: "SIGN_CUSTOMER" }
  | { type: "SIGN_TECH" };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: WorkflowState, action: Action): WorkflowState {
  switch (action.type) {
    case "SET_STEP":
      return {
        ...state,
        history: [...state.history, state.step],
        step: action.payload,
      };

    case "GO_BACK":
      if (state.history.length === 0) return state;
      return {
        ...state,
        step: state.history[state.history.length - 1],
        history: state.history.slice(0, -1),
      };

    case "CALL_CUSTOMER":
      return {
        ...state,
        customerCalledTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      };

    case "EN_ROUTE":
      return {
        ...state,
        enRouteTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      };

    case "ARRIVED":
      return {
        ...state,
        arrivedTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      };

    case "TOGGLE_CHECK": {
      const updated = [...state.checklist];
      updated[action.index] = !updated[action.index];
      return { ...state, checklist: updated };
    }

    case "PHOTO_DONE":
      return { ...state, photoDone: true };

    case "SIGN_CUSTOMER":
      return { ...state, customerSigned: true };

    case "SIGN_TECH":
      if (!state.customerSigned) return state;
      return { ...state, techConfirmed: true };

    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StepHeader({
  title,
  canGoBack,
  onBack,
  badge,
}: {
  title: string;
  canGoBack: boolean;
  onBack: () => void;
  badge?: string;
}) {
  return (
    <View style={headerStyles.container}>
      {canGoBack ? (
        <TouchableOpacity style={headerStyles.backBtn} onPress={onBack}>
          <Icon name="arrow-left" size={20} color="#1f4970" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text style={headerStyles.title}>{title}</Text>
        {badge ? (
          <View style={headerStyles.badge}>
            <Text style={headerStyles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ width: 40 }} />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Screen Components ────────────────────────────────────────────────────────

// 1. DETAIL SCREEN — job summary before starting
function DetailScreen({
  state,
  dispatch,
  job,
}: {
  state: WorkflowState;
  dispatch: React.Dispatch<Action>;
  job: JobType;
}) {
  const isPartsPending = job?.status === "parts_pending";
  const typeLabel = isPartsPending
    ? "🔧 PART PENDING INSTALLATION"
    : "🔧 WORKSHOP RETURN INSTALLATION";

  const partsPending = job?.inspection.partsPending;
  const requiredPart = partsPending?.requiredParts?.[0];

  const partName = requiredPart?.partName || "—";
  const estimatedCost = requiredPart?.estimatedCost
    ? `₹${requiredPart.estimatedCost}`
    : "—";
  const expectedDate = partsPending?.expectedReturnDate
    ? new Date(partsPending.expectedReturnDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
  const notes = requiredPart?.notes || "No notes from previous visit.";

  const customerName = job?.user?.name || "Customer";
  const city = job?.address?.city || "";
  const state_ = job?.address?.state || "";
  const originalService = job?.service?.name || "Service";

  return (
    <>
      <StepHeader
        title="Follow-up Job"
        canGoBack={false}
        onBack={() => {}}
        badge={typeLabel}
      />

      {/* Customer & address */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.subText}>
              {city} {state_}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {isPartsPending ? "Part Pending" : "Workshop Return"}
            </Text>
          </View>
        </View>
      </View>

      {/* Job details */}
      <View style={[styles.card, { backgroundColor: "#EBF3FF" }]}>
        <InfoRow label="Original Service" value={originalService} />
        <View style={styles.divider} />
        <InfoRow
          label="Follow-up Reason"
          value={
            isPartsPending ? `Part pending · ${partName}` : "Workshop return"
          }
        />
        <InfoRow label="Part / Item" value={partName} />
        <InfoRow label="Estimated Cost" value={estimatedCost} />
        <InfoRow label="Expected Return" value={expectedDate} />
        <View style={styles.divider} />
        <View style={styles.partStatusRow}>
          <Text style={styles.infoLabel}>Part Status</Text>
          <View style={styles.arrivedBadge}>
            <Icon name="check-circle" size={14} color="#1d7a2b" />
            <Text style={styles.arrivedBadgeText}>
              {isPartsPending ? "Arrived" : "Repaired"}
            </Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📝 Notes from previous visit</Text>
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>{notes}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.btnSuccess}
        onPress={() => dispatch({ type: "SET_STEP", payload: "arrival" })}
      >
        <Text style={styles.btnText}>▶ START FOLLOW-UP JOB</Text>
      </TouchableOpacity>
    </>
  );
}

// 2. ARRIVAL SCREEN — Call → En Route → Arrived (same APIs as JobCard)
function ArrivalScreen({
  state,
  dispatch,
  job,
  token,
}: {
  state: WorkflowState;
  dispatch: React.Dispatch<Action>;
  job: any;
  token: string;
}) {
  const [loading, setLoading] = useState(false);

  const isPartsPending = job?.status === "parts_pending";
  const partsPending = job?.partsPending;
  const requiredPart = partsPending?.requiredParts?.[0];
  const partName = requiredPart?.partName || "Part";
  const qty = requiredPart?.quantity ?? 1;

  const customerName = job?.user?.name || "Customer";
  const city = job?.address?.city || "";
  const state_ = job?.address?.state || "";

  const canEnRoute = !!state.customerCalledTime;
  const canArrived = !!state.enRouteTime;
  const canContinue = !!state.arrivedTime;

  async function handleCall() {
    if (state.customerCalledTime) return;
    try {
      setLoading(true);
      await confirmSchedule(job._id, token);
      dispatch({ type: "CALL_CUSTOMER" });
    } catch {
      Alert.alert("Error", "Failed to confirm schedule");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnRoute() {
    if (state.enRouteTime) return;
    if (!state.customerCalledTime) {
      Alert.alert("Step Required", "Please call the customer first.");
      return;
    }
    try {
      setLoading(true);
      await markOnWay(job._id, token);
      dispatch({ type: "EN_ROUTE" });
    } catch {
      Alert.alert("Error", "Failed to mark en route");
    } finally {
      setLoading(false);
    }
  }

  async function handleArrived() {
    if (state.arrivedTime) return;
    if (!state.enRouteTime) {
      Alert.alert("Step Required", "Please mark En Route first.");
      return;
    }
    try {
      setLoading(true);
      await markArrived(job._id, token);
      dispatch({ type: "ARRIVED" });
    } catch {
      Alert.alert("Error", "Failed to mark arrived");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <StepHeader
        title="Follow-up Arrival"
        canGoBack={state.history.length > 0}
        onBack={() => dispatch({ type: "GO_BACK" })}
        badge={
          isPartsPending
            ? "PART PENDING INSTALLATION"
            : "WORKSHOP RETURN INSTALLATION"
        }
      />

      {/* Customer card */}
      <View style={styles.card}>
        <Text style={styles.customerName}>{customerName}</Text>
        <View style={styles.locationRow}>
          <Icon name="map-marker" size={15} color="#4A6CF7" />
          <Text style={styles.subText}>
            {" "}
            {city} {state_}
          </Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📍 Follow-up Status</Text>

        {/* Call Customer */}
        <TouchableOpacity
          style={[
            styles.checkItem,
            state.customerCalledTime ? styles.checkItemDone : null,
          ]}
          onPress={handleCall}
          disabled={!!state.customerCalledTime || loading}
        >
          <Icon
            name={state.customerCalledTime ? "check-circle" : "phone"}
            size={20}
            color={state.customerCalledTime ? "#1d7a2b" : "#027CC7"}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.checkLabel}>
              📞 Call Customer (confirm arrival)
            </Text>
            {state.customerCalledTime ? (
              <Text style={styles.checkTime}>
                Called at: {state.customerCalledTime}
              </Text>
            ) : null}
          </View>
          {!state.customerCalledTime &&
            (loading ? (
              <ActivityIndicator size="small" color="#027CC7" />
            ) : (
              <View style={styles.startBtn}>
                <Text style={styles.startBtnText}>Tap</Text>
              </View>
            ))}
        </TouchableOpacity>

        {/* En Route */}
        <TouchableOpacity
          style={[
            styles.checkItem,
            state.enRouteTime ? styles.checkItemDone : null,
            !canEnRoute ? styles.checkItemDisabled : null,
          ]}
          onPress={handleEnRoute}
          disabled={!!state.enRouteTime || !canEnRoute || loading}
        >
          <Icon
            name={state.enRouteTime ? "check-circle" : "motorbike"}
            size={20}
            color={state.enRouteTime ? "#1d7a2b" : "#027CC7"}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.checkLabel}>🚗 En Route</Text>
            {state.enRouteTime ? (
              <Text style={styles.checkTime}>
                Started at: {state.enRouteTime}
              </Text>
            ) : null}
          </View>
          {!state.enRouteTime &&
            canEnRoute &&
            (loading ? (
              <ActivityIndicator size="small" color="#027CC7" />
            ) : (
              <View style={styles.startBtn}>
                <Text style={styles.startBtnText}>Tap</Text>
              </View>
            ))}
        </TouchableOpacity>

        {/* Arrived */}
        <TouchableOpacity
          style={[
            styles.checkItem,
            state.arrivedTime ? styles.checkItemDone : null,
            !canArrived ? styles.checkItemDisabled : null,
          ]}
          onPress={handleArrived}
          disabled={!!state.arrivedTime || !canArrived || loading}
        >
          <Icon
            name={state.arrivedTime ? "check-circle" : "map-marker"}
            size={20}
            color={state.arrivedTime ? "#1d7a2b" : "#027CC7"}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.checkLabel}>📍 Arrived at Location</Text>
            {state.arrivedTime ? (
              <Text style={styles.checkTime}>
                Arrived at: {state.arrivedTime}
              </Text>
            ) : null}
          </View>
          {!state.arrivedTime &&
            canArrived &&
            (loading ? (
              <ActivityIndicator size="small" color="#027CC7" />
            ) : (
              <View style={styles.startBtn}>
                <Text style={styles.startBtnText}>Tap</Text>
              </View>
            ))}
        </TouchableOpacity>
      </View>

      {/* Part info card */}
      <View style={[styles.card, { backgroundColor: "#EBF3FF" }]}>
        <InfoRow label="Part to Install" value={partName} />
        <InfoRow label="Quantity" value={String(qty)} />
        <InfoRow label="Location" value="In van ✓" />
      </View>

      <TouchableOpacity
        style={[styles.btnPrimary, !canContinue && styles.btnDisabled]}
        disabled={!canContinue}
        onPress={() => dispatch({ type: "SET_STEP", payload: "work" })}
      >
        <Text style={styles.btnText}>→ START INSTALLATION</Text>
      </TouchableOpacity>
    </>
  );
}

// 3. WORK SCREEN — checklist + photo
function WorkScreen({
  state,
  dispatch,
  job,
}: {
  state: WorkflowState;
  dispatch: React.Dispatch<Action>;
  job: any;
}) {
  const partsPending = job?.partsPending;
  const requiredPart = partsPending?.requiredParts?.[0];
  const partName = requiredPart?.partName || "Part";
  const qty = requiredPart?.quantity ?? 1;
  const customerName = job?.user?.name || "Customer";
  const city = job?.address?.city || "";

  const CHECKLIST = [
    "Remove old part",
    "Install new part",
    "Test system",
    "Verify operation",
  ];

  const allChecked = state.checklist.every(Boolean);
  const canComplete = allChecked && state.photoDone;

  return (
    <>
      <StepHeader
        title="Install Part"
        canGoBack={state.history.length > 0}
        onBack={() => dispatch({ type: "GO_BACK" })}
        badge="⚡ PART INSTALLATION"
      />

      {/* Customer */}
      <View style={styles.card}>
        <Text style={styles.customerName}>{customerName}</Text>
        <View style={styles.locationRow}>
          <Icon name="map-marker" size={15} color="#4A6CF7" />
          <Text style={styles.subText}> {city}</Text>
        </View>
      </View>

      {/* Part to install */}
      <View style={[styles.card, { backgroundColor: "#EBF3FF" }]}>
        <Text style={styles.sectionTitle}>📦 Part to Install</Text>
        <View style={styles.partRow}>
          <View>
            <Text style={styles.partName}>{partName}</Text>
            <Text style={styles.subText}>Quantity: {qty}</Text>
          </View>
          <View style={styles.arrivedBadge}>
            <Text style={styles.arrivedBadgeText}>In van</Text>
          </View>
        </View>
      </View>

      {/* Installation checklist */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>✅ Installation Checklist</Text>
        {CHECKLIST.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.checkItem,
              state.checklist[i] ? styles.checkItemDone : null,
            ]}
            onPress={() => dispatch({ type: "TOGGLE_CHECK", index: i })}
          >
            <Icon
              name={state.checklist[i] ? "check-circle" : "circle-outline"}
              size={22}
              color={state.checklist[i] ? "#1d7a2b" : "#92ACC8"}
            />
            <Text style={[styles.checkLabel, { marginLeft: 12 }]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Installation photo */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📸 Installation Photo</Text>
        <TouchableOpacity
          style={[
            styles.photoBox,
            state.photoDone ? styles.photoBoxDone : null,
          ]}
          onPress={() => dispatch({ type: "PHOTO_DONE" })}
        >
          {state.photoDone ? (
            <>
              <Icon name="check-circle" size={36} color="#1d7a2b" />
              <Text style={[styles.photoLabel, { color: "#1d7a2b" }]}>
                Done
              </Text>
            </>
          ) : (
            <>
              <Icon name="camera" size={36} color="#1d5385" />
              <Text style={styles.photoLabel}>After</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.btnSuccess, !canComplete && styles.btnDisabled]}
        disabled={!canComplete}
        onPress={() => dispatch({ type: "SET_STEP", payload: "invoice" })}
      >
        <Text style={styles.btnText}>✓ COMPLETE INSTALLATION</Text>
      </TouchableOpacity>
    </>
  );
}

// 4. INVOICE SCREEN
function InvoiceScreen({
  state,
  dispatch,
  job,
}: {
  state: WorkflowState;
  dispatch: React.Dispatch<Action>;
  job: any;
}) {
  const partsPending = job?.partsPending;
  const requiredPart = partsPending?.requiredParts?.[0];
  const partCost = requiredPart?.estimatedCost ?? 0;
  const basePrice = job?.finalPrice ?? 0;
  const total = basePrice + partCost;

  return (
    <>
      <StepHeader
        title="Invoice"
        canGoBack={state.history.length > 0}
        onBack={() => dispatch({ type: "GO_BACK" })}
      />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🧾 Follow-up Invoice</Text>

        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Base Service</Text>
          <Text style={styles.invoiceValue}>₹{basePrice}</Text>
        </View>

        {partCost > 0 && (
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>
              Part: {requiredPart?.partName || ""}
            </Text>
            <Text style={styles.invoiceValue}>₹{partCost}</Text>
          </View>
        )}

        <View style={[styles.divider, { marginVertical: 12 }]} />

        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceTotal}>Total</Text>
          <Text style={styles.invoiceTotal}>₹{total}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => dispatch({ type: "SET_STEP", payload: "signature" })}
      >
        <Text style={styles.btnText}>Add Customer Signature</Text>
      </TouchableOpacity>
    </>
  );
}

// 5. SIGNATURE SCREEN — customer approval + technician confirm + OTP PIN
function SignatureScreen({
  state,
  dispatch,
  job,
  token,
  onUpdateStatus,
}: {
  state: WorkflowState;
  dispatch: React.Dispatch<Action>;
  job: any;
  token: string;
  onUpdateStatus: (id: string, status: JobStatus) => void;
}) {
  const [pinModalVisible, setPinModalVisible] = useState(false);

 const handleVerifyPin = async (pin: string) => {
  try {
    if (!job?._id) {
      Alert.alert("Error", "Invalid job. Please refresh.");
      return;
    }

    if (!pin || pin.length < 4) {
      Alert.alert("Error", "Please enter a valid PIN");
      return;
    }

    const response = await completeJob(job._id, token, pin);

    if (response?.success) {
      onUpdateStatus(job._id, JobStatus.COMPLETED);
      setPinModalVisible(false);
      Alert.alert("Success", "Job completed and PIN verified!");
      dispatch({ type: "SET_STEP", payload: "complete" });
    } else {
      Alert.alert("Error", response?.message || "Invalid PIN");
    }
  } catch (error: any) {
    console.log("Verify PIN Error:", error);

    // 🔥 Handle specific cases
    if (error?.message === "Job not found") {
      Alert.alert("Error", "This job no longer exists. Please refresh.");
    } else if (error?.status === 401) {
      Alert.alert("Session Expired", "Please login again.");
    } else if (error?.status === 400) {
      Alert.alert("Invalid PIN", error?.message || "Incorrect PIN");
    } else if (error?.status === 500) {
      Alert.alert("Server Error", "Please try again later.");
    } else {
      Alert.alert("Error", error?.message || "Failed to verify PIN");
    }
  }
};

  return (
    <>
      <StepHeader
        title="Confirmation"
        canGoBack={state.history.length > 0}
        onBack={() => dispatch({ type: "GO_BACK" })}
      />

      <View style={styles.card}>
        <TouchableOpacity
          style={[
            styles.checkItem,
            state.customerSigned ? styles.checkItemDone : null,
          ]}
          onPress={() => dispatch({ type: "SIGN_CUSTOMER" })}
        >
          <Icon
            name={state.customerSigned ? "check-circle" : "circle-outline"}
            size={22}
            color={state.customerSigned ? "#1d7a2b" : "#92ACC8"}
          />
          <Text style={[styles.checkLabel, { marginLeft: 12 }]}>
            Customer Approval
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.checkItem,
            state.techConfirmed ? styles.checkItemDone : null,
            !state.customerSigned ? styles.checkItemDisabled : null,
          ]}
          onPress={() => dispatch({ type: "SIGN_TECH" })}
          disabled={!state.customerSigned}
        >
          <Icon
            name={state.techConfirmed ? "check-circle" : "circle-outline"}
            size={22}
            color={state.techConfirmed ? "#1d7a2b" : "#92ACC8"}
          />
          <Text style={[styles.checkLabel, { marginLeft: 12 }]}>
            Technician Witness
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.btnSuccess, !state.techConfirmed && styles.btnDisabled]}
        disabled={!state.techConfirmed}
        onPress={() => setPinModalVisible(true)}
      >
        <Text style={styles.btnText}>Complete Job</Text>
      </TouchableOpacity>

      <OtpModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        onSubmit={handleVerifyPin}
        title="Enter Completion PIN"
      />
    </>
  );
}

// 6. COMPLETE SCREEN
function CompleteScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.completeContainer}>
      <View style={styles.card}>
        <Text style={styles.completeEmoji}>✅</Text>
        <Text style={styles.completeTitle}>Follow-up Complete!</Text>
        <Text style={styles.completeDate}>{new Date().toLocaleString()}</Text>
      </View>

      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.btnText}>Back to Jobs</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FollowUpJobScreen() {
  const route = useRoute<any>();
  const { job } = route.params;
  const { token } = useContext(AuthContext);
  const { updateStatus } = useJobs();

    console.log('Current job : ', job);
    

  const [state, dispatch] = useReducer(reducer, {
    step: "detail",
    history: [],
    customerCalledTime: null,
    enRouteTime: null,
    arrivedTime: null,
    checklist: [false, false, false, false],
    photoDone: false,
    customerSigned: false,
    techConfirmed: false,
  });

  const handleUpdateStatus = useCallback(
    (id: string, status: JobStatus) => {
      updateStatus(id, status);
    },
    [updateStatus],
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {state.step === "detail" && (
        <DetailScreen state={state} dispatch={dispatch} job={job} />
      )}

      {state.step === "arrival" && (
        <ArrivalScreen
          state={state}
          dispatch={dispatch}
          job={job}
          token={token}
        />
      )}

      {state.step === "work" && (
        <WorkScreen state={state} dispatch={dispatch} job={job} />
      )}

      {state.step === "invoice" && (
        <InvoiceScreen state={state} dispatch={dispatch} job={job} />
      )}

      {state.step === "signature" && (
        <SignatureScreen
          state={state}
          dispatch={dispatch}
          job={job}
          token={token}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {state.step === "complete" && <CompleteScreen />}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBdAE9",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0b2a44",
    textAlign: "center",
  },
  badge: {
    marginTop: 4,
    backgroundColor: "#F0B245",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#DEEcF8",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  customerName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0b2a44",
  },

  subText: {
    fontSize: 13,
    color: "#777",
    marginTop: 3,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  statusPill: {
    backgroundColor: "#FFF1CF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9e6d0b",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },

  infoLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a2a44",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },

  partStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },

  arrivedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DFF0D8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },

  arrivedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1d7a2b",
  },

  divider: {
    height: 1,
    backgroundColor: "#DEEcF8",
    marginVertical: 6,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a2a44",
    marginBottom: 12,
  },

  notesBox: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 12,
  },

  notesText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
  },

  // Checklist items
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5FAFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: "#CBDDF2",
    marginBottom: 10,
  },

  checkItemDone: {
    backgroundColor: "#E3F5E1",
    borderColor: "#1d7a2b",
  },

  checkItemDisabled: {
    opacity: 0.4,
  },

  checkLabel: {
    fontSize: 15,
    color: "#1a2a44",
    fontWeight: "500",
  },

  checkTime: {
    fontSize: 12,
    color: "#1f6eb0",
    marginTop: 2,
  },

  startBtn: {
    backgroundColor: "#027CC7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },

  startBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // Part row in work screen
  partRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  partName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a2a44",
  },

  // Photo box
  photoBox: {
    alignSelf: "center",
    width: 110,
    height: 110,
    borderRadius: 20,
    backgroundColor: "#E1EFFA",
    borderWidth: 2,
    borderColor: "#87B2DC",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  photoBoxDone: {
    backgroundColor: "#C8E6C8",
    borderColor: "#2E7D32",
    borderStyle: "solid",
  },

  photoLabel: {
    marginTop: 6,
    fontSize: 13,
    color: "#1d5385",
    fontWeight: "600",
  },

  // Invoice
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  invoiceLabel: {
    fontSize: 14,
    color: "#555",
  },

  invoiceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a2a44",
  },

  invoiceTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0b2a44",
  },

  // Buttons
  btnPrimary: {
    backgroundColor: "#165297",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 10,
  },

  btnSuccess: {
    backgroundColor: "#1d7a2b",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 10,
  },

  btnDisabled: {
    opacity: 0.4,
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Complete screen
  completeContainer: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 60,
  },

  completeEmoji: {
    fontSize: 64,
    textAlign: "center",
  },

  completeTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
    color: "#0b2a44",
  },

  completeDate: {
    textAlign: "center",
    color: "#777",
    marginTop: 8,
    fontSize: 13,
  },
});
