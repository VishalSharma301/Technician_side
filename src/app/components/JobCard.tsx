// src/components/JobCard.tsx
import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from "../../util/scaling";
import { Job, JobStatus } from "../../constants/jobTypes";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../store/AuthContext";
import { updateRequestStatus } from "../../util/servicesApi";
import { useJobs } from "../../store/JobContext";

type Props = {
  job: Job;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onAlert: (id: string) => void;
  /*  Navigate to details when the whole card is pressed */
  navigate: (job: Job) => void;
};

const JobCard: React.FC<Props> = ({
  job,
  onStart,
  onComplete,
  onAlert,
  navigate,
}) => {
  const statusColour = {
    [JobStatus.PENDING]: "#165297", // red progress bar
    [JobStatus.DEADLINE_ALERT]: "#E5403E", // same red
    [JobStatus.ONGOING]: "#F8B53C",
    [JobStatus.COMPLETED]: "#00BF10",
    [JobStatus.CANCELLED]: "#d62000ff",
  }[job.status];
const {token} = useContext(AuthContext)
const {updateStatus} = useJobs()
  const navigation = useNavigation<any>();
  // const progressWidth = `${job.progress ?? 75}%`; // fallback 75 %
  // const progressWidth = `${75}%`; // fallback 75 %
  const progressWidth =  job.status == JobStatus.COMPLETED || job.status == JobStatus.CANCELLED ? "100%" : job.status == JobStatus.PENDING ? `${5}%` : job.status == JobStatus.ONGOING ? "50%" : "75%" // fallback 75 %

  async function updateJobStatus( status : JobStatus){
    try{
     const response = await updateRequestStatus(job._id,status,token)
    
        // console.log("ress :", response);
        
    }catch(err){
      console.error("error :", err);
      
    }
     updateStatus(job._id, status)
  }

  return (
    <Pressable
      onPress={() => navigation.navigate("JobDetailsScreen", { job: job })}
      style={styles.pressable}
    >
      <View style={styles.card}>
        {/* line 1: name + type */}
        <View style={styles.rowBetween}>
          <Text style={styles.name}>{job.user.name || "User"}</Text>
          <Text style={styles.typeText}>{job.service.name}</Text>
        </View>

        {/* address */}
        <Text style={styles.address}>{job.zipcode}</Text>

        <View style={{flexDirection : 'row',
          // justifyContent : 'space-between'
          }}>
        {/* tag row */}
        <View style={styles.tagRow}>
          <View style={{borderWidth : 1 ,borderRadius : scale(6), width : moderateScale(32), aspectRatio : 1, backgroundColor : '#FFF3DD', borderColor : '#F8B53C',  alignItems : 'center', justifyContent : 'center' }}>
          <Icon name={"pipe-valve" } size={moderateScale(24)} color={'#F8B53C'}/>

          </View>
          <Text style={styles.tagText}>{job.service.category}</Text>
        </View>

        {/* deadline + progress */}
        <View style={styles.deadlineRow}>
          <Text style={styles.deadlineTxt}>{job.status}</Text>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                { width: progressWidth, backgroundColor: statusColour },
              ]}
            />
          </View>
        </View>
        </View>

        {/* action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => onStart(job._id)}
            // onPress={() => updateJobStatus(JobStatus.ONGOING)}
          >
            <Text style={{fontSize : scale(14), color : 'white' }}>  ▶</Text>
            <Text style={styles.startTxt}>  Start Job</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.completeBtn}
            // onPress={() => onComplete(job._id)}
            onPress={() => onComplete(job._id)}
          //  onPress={() => updateJobStatus(JobStatus.COMPLETED)}
          >
            <Text style={styles.completeTxt}>Mark Complete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alertBtn, {borderColor : statusColour}]}
            onPress={() => onAlert(job._id)}
            // onPress={() => updateJobStatus(JobStatus.CANCELLED)}
          >
            <Text style={[styles.alertTxt, { color: statusColour }]}>!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
};

export default JobCard;

/* ------------------------------------------------------------------- */
/*                               Styles                                */
/* ------------------------------------------------------------------- */
const styles = StyleSheet.create({
  pressable: { marginBottom: verticalScale(14) },
  card: {
    backgroundColor: "#fff",
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#EEE",
    padding: scale(16),
    height : verticalScale(193)
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: moderateScale(20), fontWeight: "600" },
  typeText: { fontSize: moderateScale(20), fontWeight: "600" },
  address: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(16),
    fontWeight : '400',
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(6),
    flex : 1
  },
  tagText: {
    marginLeft: scale(6),
    fontSize: moderateScale(16),
    fontWeight : '400'
  },
  deadlineRow: { marginTop: verticalScale(6), flex : 1 },
  deadlineTxt: { fontWeight: "600", marginBottom: verticalScale(4), fontSize : moderateScale(20) },
  barBg: {
    width: "100%",
    height: verticalScale(10),
    backgroundColor: "#F5DCDC",
    borderRadius: scale(6),
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: scale(6) },
  /* buttons */
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(12),
  },
  startBtn: {
    backgroundColor: "#153B93",
    // paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
    borderRadius: scale(10),
    height : verticalScale(41),
    alignItems : 'center',
    // justifyContent : 'center',
    width : scale(100),
    flexDirection : 'row'
  },
  startTxt: { color: "#fff", fontSize: moderateScale(12), fontWeight : '500' },
  completeBtn: {
    borderWidth: 1,
    borderColor: "#153B93",
    // paddingVertical: verticalScale(6),
    // paddingHorizontal: scale(14),
    borderRadius: scale(10),
     height : verticalScale(41),
    alignItems : 'center',
    justifyContent : 'center',
    width : scale(141)
  },
  completeTxt: { color: "#153B93", fontSize: moderateScale(13) },
  alertBtn: {
    borderWidth: 1,
    // borderColor: "#C03B3B",
    // paddingVertical: verticalScale(6),
    // paddingHorizontal: scale(10),
    borderRadius: scale(10),
     height : verticalScale(41),
    alignItems : 'center',
    justifyContent : 'center',
    width : scale(43)
  },
  alertTxt: {
    fontWeight: "bold",
    fontSize: moderateScale(25),
    
  },
});
