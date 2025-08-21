import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { fetchAssignedServices } from "../../../util/servicesApi";
import { AuthContext } from "../../../store/AuthContext";
import { Job, JobStatus } from "../../../constants/jobTypes";
import { moderateScale, scale, verticalScale } from "../../../util/scaling";
import ScreenHeader from "../../components/ScreenHeader";
import { useJobs } from "../../../store/JobContext";
import { useNavigation } from "@react-navigation/native";
// import { AssignedService } from '../util/ApiService';  // if you have the type
// src/types/AssignedService.ts

export interface User {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
}

export interface Provider {
  _id: string;
  companyName: string;
  phoneNumber: string;
}

export interface ServiceInfo {
  _id: string;
  name: string;
  category: string;
  basePrice: number;
}

export type AssignedStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "deadline_alert";
// add other statuses if your backend uses them

export default function MessageScreen() {
  
  const [completedJobs, setCompletedJobs] = useState<boolean>(true);
  const {jobs} = useJobs()
  const navigation = useNavigation<any>()

  

  return (
    <View style={styles.root}>
      <ScreenHeader name="Completed Job"/>
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, completedJobs && styles.activeTab]}
          onPress={() => setCompletedJobs(true)}
        >
          <Text  style={[styles.text, completedJobs && styles.activeText]} >Completed</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, !completedJobs && styles.activeTab]}
          onPress={() => setCompletedJobs(false)}
        >
          <Text  style={[styles.text, !completedJobs && styles.activeText]}>Cancelled</Text>
        </Pressable>
      </View>
      <FlatList
        data={jobs.filter(job => completedJobs ? job.status === JobStatus.COMPLETED : job.status == JobStatus.CANCELLED)}
        keyExtractor={(item) => item._id}
        // contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable
          onPress={completedJobs ? (() => navigation.navigate('JobDetailsScreen', { job: item })) : undefined}
            style={({pressed}) => ({
              marginBottom: verticalScale(12),
              padding: scale(12),
              borderWidth: 1,
              borderRadius: moderateScale(8),
              backgroundColor: "#fff",
              borderColor: completedJobs ? "#4CAF50" : "#F44336",
              opacity: pressed && completedJobs ? 0.5 : 1,
            })}
          >
            <Text style={{ fontWeight: "bold" }}>{item.service.name}</Text>
            <Text>Category: {item.service.category}</Text>
            <Text>
              Scheduled: {new Date(item.scheduledDate).toLocaleString()}
            </Text>
            <Text>Status: {item.status}</Text>
            <Text>Notes: {item.notes}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text>No assigned services found.</Text>}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: scale(24),
    backgroundColor: "#EFF4FF",
  },
  tabContainer: {
  flexDirection: "row",
  backgroundColor: "#e4eefe",
  borderRadius: scale(10),
  marginBottom: verticalScale(15),
  marginTop: verticalScale(6),
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#B7C8B6", // keep border only on parent
},
tab: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: verticalScale(8),
  backgroundColor: "#F1F6F0",
},
activeTab: {
  backgroundColor: "#153B93",
},
  text : {
    color: "#000",
    fontSize: moderateScale(14),
    fontWeight: "500",
  },
  activeText: {
    color: "#fff",
  },
});
