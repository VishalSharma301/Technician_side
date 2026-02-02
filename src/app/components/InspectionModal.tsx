import React from "react";
import { Modal, View, StyleSheet } from "react-native";
import InspectionComponent from "./InspectionComponent";

type Props = {
  visible: boolean;
  jobId: string;
  onClose: () => void;
  onInspectionCompleted?: () => void;
};

export default function InspectionModal({
  visible,
  jobId,
  onClose,
  onInspectionCompleted,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <InspectionComponent
            jobId={jobId}
            onClose={onClose}
            onInspectionCompleted={onInspectionCompleted}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
  },
});
