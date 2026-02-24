import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomView from "./CustomView";
import { scale, verticalScale } from "../../util/scaling";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
};

const OptionGroup = ({
  title,
  options,
  selected,
  onSelect,
}: any) => (
  <View style={styles.groupContainer}>
    <Text style={styles.groupTitle}>{title}</Text>

    <View style={styles.optionRow}>
      {options.map((item: string) => (
        <TouchableOpacity
          key={item}
          style={styles.optionItem}
          onPress={() => onSelect(item)}
        >
          <View style={styles.radioOuter}>
            {selected === item && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.optionText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
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

export default function ReviewModal({
  visible,
  onClose,
  onSubmit,
}: Props) {
  const [payment, setPayment] = useState("Paid on time");
  const [punctuality, setPunctuality] = useState("On time");
  const [communication, setCommunication] = useState("Clear");
  const [behavior, setBehavior] = useState("Polite");
  const [problem, setProblem] = useState("Accurate");
  const [workAgain, setWorkAgain] = useState("Yes");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    const reviewData = {
      payment,
      punctuality,
      communication,
      behavior,
      problem,
      workAgain,
      feedback,
    };

    onSubmit?.(reviewData);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={styles.modalContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Job Card */}
          <CCView>
          <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <Ionicons name="star" size={16} color="#F4B400" />
              <Text style={styles.jobTitle}>
                {" "}Job #123 - AC Service
              </Text>
            </View>

            <Text style={styles.jobInfo}>
              Customer: Vishal Sharma
            </Text>
            <Text style={styles.jobInfo}>
              Date: Today, 5:30 PM
            </Text>
          </View>
          </CCView>

          {/* Experience */}
          <CCView>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              How was your experience?
            </Text>

            <OptionGroup
              title="Payment Behavior"
              options={["Paid on time", "Late", "Disputed"]}
              selected={payment}
              onSelect={setPayment}
            />

            <OptionGroup
              title="Punctuality"
              options={["On time", "15 min late", "No-show"]}
              selected={punctuality}
              onSelect={setPunctuality}
            />

            <OptionGroup
              title="Communication"
              options={["Clear", "Average", "Confusing"]}
              selected={communication}
              onSelect={setCommunication}
            />

            <OptionGroup
              title="Respect & Behavior"
              options={["Polite", "Neutral", "Rude"]}
              selected={behavior}
              onSelect={setBehavior}
            />

            <OptionGroup
              title="Problem Description"
              options={["Accurate", "Partial", "Wrong"]}
              selected={problem}
              onSelect={setProblem}
            />
          </View>
          </CCView>

          {/* Additional Feedback */}
          <CCView>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Additional Feedback (Optional)
            </Text>

            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Write your feedback..."
              multiline
              style={styles.textArea}
            />
          </View>
          </CCView>

          {/* Work Again */}
          <CCView>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Would you work with them again?
            </Text>

            <OptionGroup
              title=""
              options={["Yes", "Maybe", "No"]}
              selected={workAgain}
              onSelect={setWorkAgain}
            />
          </View>
          </CCView>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitText}>
              Submit Rating
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalContainer: {
    // position: "absolute",
    // bottom: 0,
    // left: 0,
    // right: 0,
    // height: "85%",
    backgroundColor: "#F4F6FA",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },

  jobCard: {
    // backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    // marginBottom: 14,
  },

  jobHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  jobTitle: {
    fontWeight: "600",
    fontSize: 14,
  },

  jobInfo: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },

  card: {
    // backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    // marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },

  groupContainer: {
    marginBottom: 12,
  },

  groupTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
  },

  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },

  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#1e3661",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1d3054",
  },

  optionText: {
    fontSize: 12,
  },

  textArea: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    minHeight: 70,
    padding: 10,
    textAlignVertical: "top",
  },

  submitButton: {
    backgroundColor: "#1c325b",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },

  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});