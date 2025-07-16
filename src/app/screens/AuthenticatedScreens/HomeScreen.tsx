import React from "react";
import {
  View,
  Text,
  StyleSheet,
  
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { scale, verticalScale, moderateScale } from "../../../util/scaling";
import {MaterialCommunityIcons as Icon} from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "../../components/ScreenHeader";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
        <ScreenHeader backButton={false} name="Welcome User" style={{paddingHorizontal : scale(22)}}/>

      <ScrollView contentContainerStyle={styles.container}>

 {/* Profile Picture */}
        <View style={styles.profileSection}>
          <View style={styles.imageSection}>
          <Image
            source={{ uri: 'https://picsum.photos/200/300.jpg ' }}
            style={styles.avatar}
          />
            <LinearGradient
        // Background Linear Gradient
        colors={['#DB9F00', '#FFB800']}
        style={styles.background}
      />
          
          </View>
          {/* <TouchableOpacity style={styles.editAvatar}>
            <Icon name="pencil" size={16} color="#FFB800" />
          </TouchableOpacity> */}
          <Text style={styles.name}>Alex Carter</Text>
          <Text style={styles.role}>HVAC Technician</Text>
        </View>

        {/* Stats */}
        <View style={styles.gridRow}>
          <View style={[styles.statCard, { backgroundColor: "#658CB226" }]}>
            <Text style={styles.statLabel}>Pending Jobs</Text>
            <Text style={styles.statValue}>25</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#CCE4D6" }]}>
            <Text style={styles.statLabel}>Completed Jobs</Text>
            <Text style={styles.statValue}>120+</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={[styles.statCard, { backgroundColor: "#DDE8F7" }]}>
            <Text style={styles.statLabel}>On Going Jobs</Text>
            <Text style={styles.statValue}>10</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#CD9E5126" }]}>
            <Text style={styles.statLabel}>Deadline Alert</Text>
            <Text style={styles.statValue}>2 urgent</Text>
          </View>
        </View>

        {/* Upcoming Jobs */}
        <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
        <Text style={styles.subText}>96h Deadline</Text>

        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobName}>John D.</Text>
            <Text style={styles.jobType}>AC repair</Text>
          </View>
          <Text style={styles.jobAddress}>12 Park St, Apt03</Text>

          <View style={styles.jobTagRow}>
            <Icon name="fan" size={moderateScale(16)} />
            <Text style={styles.jobTagText}>AC Repair</Text>
          </View>

          <View style={styles.deadlineRow}>
            <Text style={styles.deadlineText}>Due in 12h 45min</Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: "75%", backgroundColor: "#C03B3B" }]} />
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.startBtn}>
              <Text style={styles.startBtnText}>Start Job</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.markBtn}>
              <Text style={styles.markBtnText}>Mark Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertBtn}>
              <Text style={styles.alertBtnText}>!</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.jobCard, { borderColor: "#F8DFA9" }]}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobName}>sarah</Text>
            <Text style={styles.jobType}>Plumbing</Text>
          </View>
          <Text style={styles.jobAddress}>375 Khanna Nagar</Text>

          <View style={styles.jobTagRow}>
            <Icon name="wrench-outline" size={moderateScale(16)} />
            <Text style={styles.jobTagText}>Plumbing</Text>
          </View>

          <View style={styles.deadlineRow}>
            <Text style={styles.deadlineText}>Due in 12h 45min</Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: "75%", backgroundColor: "#F1B401" }]} />
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.startBtn}>
              <Text style={styles.startBtnText}>Start Job</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.markBtn}>
              <Text style={styles.markBtnText}>Mark Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.alertBtn, { borderColor: "#F1B401" }]}>
              <Text style={[styles.alertBtnText, { color: "#F1B401" }]}>!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

 
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F4FF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: scale(16),
    alignItems: "center",
    backgroundColor: "#fff",
  },
  backText: {
    fontSize: moderateScale(14),
    color: "#007bff",
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
  },
  container: {
    padding: scale(16),
    paddingBottom: verticalScale(120),
  },
   profileSection: {
    alignItems: 'center',
    // justifyContent : 'center',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(16),
    
    // elevation : 500,
    // zIndex : 1200,
    // overflow : 'hidden'
  },
  imageSection : {
     height: scale(105),
    width : scale(105),
    borderRadius : scale(105/2),
    overflow : 'hidden',
    // zIndex : -1
    // borderWidth : 1,
    alignItems : 'center',
    justifyContent : 'center',
  },
  avatar: {
    width: scale(104),
    height: scale(104),
    borderRadius: scale(104/2),
    elevation : 10,
    zIndex : 1
    // borderWidth : 1,
    // backgroundColor : 'red',
    
  },
   background: {
    position: 'static',
    left: 0,
    right: 0,
    top: 0,
   
  },
  editAvatar: {
    backgroundColor: '#153B93',
    borderRadius: scale(12),
    padding: scale(4),
    position: 'absolute',
    right: scale(130),
    top: verticalScale(80),
    zIndex : 33
  },
  name: {
    marginTop: verticalScale(7),
    fontSize: moderateScale(24),
    fontWeight: '600',
    // borderWidth : 1,
    lineHeight : verticalScale(33.6)

  },
  role: {
    fontSize: moderateScale(12),
    fontWeight : "500",
    color: '#666',
    marginTop: verticalScale(3)
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },
  statCard: {
    width: "48%",
    // aspectRatio : 169/97,
    // height : moderateScale(97),
    // width: scale(169),
    padding: scale(14),
    borderRadius: scale(12),
  },
  statLabel: {
    fontSize: moderateScale(18),
    fontWeight : '600',
    color: "#000",
  },
  statValue: {
    fontWeight: "600",
    fontSize: moderateScale(28),
    marginTop: verticalScale(6),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    marginTop: verticalScale(6),
  },
  subText: {
    fontSize: moderateScale(16),
    fontWeight : '400',
    color: "#888",
    marginBottom: verticalScale(13),
  },
  jobCard: {
    backgroundColor: "#fff",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#EEE",
    padding: scale(16),
    marginBottom: verticalScale(14),
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  jobName: {
    fontWeight: "bold",
    fontSize: moderateScale(15),
  },
  jobType: {
    fontWeight: "bold",
    fontSize: moderateScale(15),
  },
  jobAddress: {
    color: "#666",
    fontSize: moderateScale(13),
    marginTop: verticalScale(4),
  },
  jobTagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(6),
  },
  jobTagText: {
    marginLeft: scale(6),
    fontSize: moderateScale(13),
  },
  deadlineRow: {
    marginTop: verticalScale(6),
  },
  deadlineText: {
    fontWeight: "600",
    marginBottom: verticalScale(4),
  },
  progressBarBackground: {
    width: "100%",
    height: verticalScale(6),
    backgroundColor: "#F5DCDC",
    borderRadius: scale(6),
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: scale(6),
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(12),
  },
  startBtn: {
    backgroundColor: "#153B93",
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(14),
    borderRadius: scale(6),
  },
  startBtnText: {
    color: "#fff",
    fontSize: moderateScale(13),
  },
  markBtn: {
    borderWidth: 1,
    borderColor: "#153B93",
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(14),
    borderRadius: scale(6),
  },
  markBtnText: {
    color: "#153B93",
    fontSize: moderateScale(13),
  },
  alertBtn: {
    borderWidth: 1,
    borderColor: "#C03B3B",
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
    borderRadius: scale(6),
  },
  alertBtnText: {
    color: "#C03B3B",
    fontWeight: "bold",
    fontSize: moderateScale(14),
  },
  
});
