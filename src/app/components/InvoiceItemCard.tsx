import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { JobStatus } from "../../constants/jobTypes";
import {Ionicons} from "@expo/vector-icons"

type Props = {
  title: string;
  quantity?: number;
  price: number;
  type: "part" | "additional" | "custom";
  status: boolean;
  onDelete : () => void;
  deleteDisabled?: boolean;
};

const InvoiceItemCard = ({ title, quantity, price, type, status, onDelete, deleteDisabled }: Props) => {
  const config = getConfig(type, status);

  return (
    <View style={[styles.card, config.container]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {title} {quantity ? `×${quantity}` : ""}
        </Text>

        <Text style={[styles.subtitle, config.subtitle]}>
          {config.label} |{" "}
          {status === true ? "Approved ✓" : "Pending Approval ⏳"}
        </Text>
      </View>
      <View>
        <Text style={[styles.price, config.price]}>
          ₹{price.toLocaleString("en-IN")}
        </Text>

      {!deleteDisabled && <TouchableOpacity 
        style={{ marginTop: 8, alignSelf : 'flex-end' }} 
        onPress={onDelete}
        disabled={deleteDisabled}
      >
      <Ionicons name="trash-bin-outline" size={18}/>
      </TouchableOpacity>}
      </View>
    </View>
  );
};

export default InvoiceItemCard;

const getConfig = (type: string, status: boolean) => {
  if (type === "part" && status === false) {
    return {
      container: { backgroundColor: "#FFFBEB", borderColor: "#F7E1BD" },
      subtitle: { color: "#D97C0B" },
      price: { color: "#D97C0B" },
      label: "Part",
    };
  }

  if (type === "custom") {
    return {
      container: { backgroundColor: "#F2F1FB", borderColor: "#DAD7F4" },
      subtitle: { color: "#6138CD" },
      price: { color: "#6138CD" },
      label: "Custom Service",
    };
  }

  if (type === "additional") {
    return {
      container: { backgroundColor: "#EEF2FF", borderColor: "#C7D2FE" },
      subtitle: { color: "#4F46E5" },
      price: { color: "#4F46E5" },
      label: "Additional Service",
    };
  }

  if (type === "part" && status === true) {
    return {
      container: { backgroundColor: "#E6F4EA", borderColor: "#A7E0B3" },
      subtitle: { color: "#059669" },
      price: { color: "#059669" },
      label: "Part",
    };
  }

  return {};
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },

  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },

  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },

  price: {
    fontSize: 15,
    fontWeight: "700",
  },
});
