import React, { useReducer, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import OtpModal from "../../components/OtpModal";
import { Address } from "../../../constants/types";
import { JobType } from "../../../constants/job";

type Step = "detail" | "arrival" | "work" | "signature" | "complete";

interface FollowUpJob {
  _id: string;
  customerName: string;
  address: Address;
  phone: string;
  type: "parts_pending" | "workshop_return";
  originalIssue: string;
  reason: string;
  scheduledDate: string;
  partName: string;
  quantity: number;
  notes?: string;
}

interface State {
  step: Step;
  called: boolean;
  enRoute: boolean;
  arrived: boolean;
  callTime?: string;
  arrivedTime?: string;
  checklist: boolean[];
  photoTaken: boolean;
  customerSigned: boolean;
  techConfirmed: boolean;
}

function reducer(state: State, action: any): State {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };

    case "CALL":
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

    case "TOGGLE_CHECK":
      const updated = [...state.checklist];
      updated[action.index] = !updated[action.index];
      return { ...state, checklist: updated };

    case "PHOTO":
      return { ...state, photoTaken: true };

    case "SIGN_CUSTOMER":
      return { ...state, customerSigned: true };

    case "SIGN_TECH":
      if (!state.customerSigned) return state;
      return { ...state, techConfirmed: true };

    default:
      return state;
  }
}

export default function FollowUpWorkflowScreen() {
  const route = useRoute<any>();
  const { followupJob } = route.params as { followupJob: JobType };
  console.log(followupJob);

  const [state, dispatch] = useReducer(reducer, {
    step: "detail",
    called: false,
    enRoute: false,
    arrived: false,
    checklist: [false, false, false, false],
    photoTaken: false,
    customerSigned: false,
    techConfirmed: false,
  });

  const [pinModalVisible, setPinModalVisible] = useState(false);

  // ===== COMPLETE FOLLOWUP =====
  function completeFollowup() {
    const allDone = state.checklist.every(Boolean) && state.photoTaken;

    if (!allDone) {
      Alert.alert("Complete all steps", "Checklist & photo required");
      return;
    }

    dispatch({ type: "SET_STEP", payload: "signature" });
  }

  // ===== VERIFY PIN =====
  function handleVerifyPin(pin: string) {
    if (!state.techConfirmed) {
      Alert.alert("Technician confirmation required");
      return;
    }

    // 🔥 TODO: call backend updateFollowupStatus here

    setPinModalVisible(false);
    dispatch({ type: "SET_STEP", payload: "complete" });
  }

  return (
    <ScrollView style={styles.screen}>
      {state.step === "detail" && (
        <>
          <Text style={styles.header}>🔄 Follow-up Job</Text>

          <View style={styles.card}>
            <Text style={styles.name}>{followupJob.user.name}</Text>
            <Text>{followupJob.address.city}</Text>
            <Text>{followupJob.user.phoneNumber}</Text>

            <View style={styles.infoBox}>
              <Text>
                Original Issue:{''}
                {followupJob.inspection.workshopDetails?.itemDescription}
              </Text>
              <Text>
                Reason:{" "}
                {followupJob.inspection.completionType}
              </Text>
              <Text>
                Scheduled:{" "}
                {followupJob.inspection.workshopDetails?.expectedReturnDate || followupJob.inspection.partsPending?.expectedReturnDate }
              </Text>
            </View>

            <Text style={{ marginTop: 10 }}>Notes: {followupJob.notes}</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => dispatch({ type: "SET_STEP", payload: "arrival" })}
          >
            <Text style={styles.btnText}>START FOLLOW-UP</Text>
          </TouchableOpacity>
        </>
      )}

      {state.step === "arrival" && (
        <>
          <Text style={styles.header}>🚗 Arrival</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.stepItem, state.called && styles.completed]}
              onPress={() => dispatch({ type: "CALL" })}
            >
              <Text>📞 Call Customer</Text>
            </TouchableOpacity>

            {state.callTime && (
              <Text style={styles.time}>Called at: {state.callTime}</Text>
            )}

            <TouchableOpacity
              style={[styles.stepItem, state.enRoute && styles.completed]}
              onPress={() => {
                if (!state.called) return Alert.alert("Call customer first");
                dispatch({ type: "EN_ROUTE" });
              }}
            >
              <Text>🚗 En Route</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stepItem, state.arrived && styles.completed]}
              onPress={() => {
                if (!state.enRoute) return Alert.alert("Mark En Route first");
                dispatch({ type: "ARRIVED" });
              }}
            >
              <Text>📍 Arrived</Text>
            </TouchableOpacity>

            {state.arrivedTime && (
              <Text style={styles.time}>Arrived at: {state.arrivedTime}</Text>
            )}
          </View>

          <TouchableOpacity
            disabled={!state.arrived}
            style={[styles.primaryBtn, !state.arrived && styles.disabled]}
            onPress={() => dispatch({ type: "SET_STEP", payload: "work" })}
          >
            <Text style={styles.btnText}>START INSTALLATION</Text>
          </TouchableOpacity>
        </>
      )}

      {state.step === "work" && (
        <>
          <Text style={styles.header}>
            🔧 Install {followupJob.inspection.workshopDetails?.itemDescription}
          </Text>

          <View style={styles.card}>
            {[
              "Remove old part",
              "Install new part",
              "Test system",
              "Verify operation",
            ].map((label, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.stepItem,
                  state.checklist[i] && styles.completed,
                ]}
                onPress={() => dispatch({ type: "TOGGLE_CHECK", index: i })}
              >
                <Text>
                  {state.checklist[i] ? "✅ " : "⬜ "} {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.photoBox, state.photoTaken && styles.photoTaken]}
              onPress={() => dispatch({ type: "PHOTO" })}
            >
              <Text>
                {state.photoTaken ? "✅ Photo Taken" : "📸 Take After Photo"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.successBtn}
            onPress={completeFollowup}
          >
            <Text style={styles.btnText}>COMPLETE INSTALLATION</Text>
          </TouchableOpacity>
        </>
      )}

      {state.step === "signature" && (
        <>
          <Text style={styles.header}>✍️ Confirmation</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={[
                styles.stepItem,
                state.customerSigned && styles.completed,
              ]}
              onPress={() => dispatch({ type: "SIGN_CUSTOMER" })}
            >
              <Text>Customer Approval</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stepItem, state.techConfirmed && styles.completed]}
              onPress={() => dispatch({ type: "SIGN_TECH" })}
            >
              <Text>Technician Witness</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => setPinModalVisible(true)}
          >
            <Text style={styles.btnText}>COMPLETE FOLLOW-UP</Text>
          </TouchableOpacity>

          <OtpModal
            visible={pinModalVisible}
            onClose={() => setPinModalVisible(false)}
            onSubmit={handleVerifyPin}
            title="Enter Completion PIN"
          />
        </>
      )}

      {state.step === "complete" && (
        <View style={styles.completeContainer}>
          <Text style={styles.completeIcon}>✅</Text>
          <Text style={styles.completeText}>Follow-up Completed!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  infoBox: {
    marginTop: 10,
    backgroundColor: "#EAF3FF",
    padding: 10,
    borderRadius: 12,
  },
  stepItem: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#EEF3FB",
    marginBottom: 10,
  },
  completed: {
    backgroundColor: "#D4F4DD",
  },
  primaryBtn: {
    backgroundColor: "#165297",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  successBtn: {
    backgroundColor: "#34C759",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.4,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
  photoBox: {
    padding: 30,
    borderRadius: 16,
    backgroundColor: "#E1EFFA",
    alignItems: "center",
  },
  photoTaken: {
    backgroundColor: "#C8E6C8",
  },
  time: {
    fontSize: 12,
    color: "#1f6eb0",
    marginBottom: 8,
  },
  completeContainer: {
    marginTop: 100,
    alignItems: "center",
  },
  completeIcon: {
    fontSize: 60,
  },
  completeText: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
  },
});
