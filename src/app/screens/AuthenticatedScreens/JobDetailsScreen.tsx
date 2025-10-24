// // JobDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../../../util/scaling';
import ScreenHeader from '../../components/ScreenHeader';
import { useRoute } from '@react-navigation/native';
import { Job } from '../../../constants/jobTypes';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const JobDetailsScreen = () => {
  const route = useRoute<any>() 
  const job : Job = route.params?.job
  const [jobStatus, setJobStatus] = useState<'ASSIGNED' | 'IN PROGRESS'>('ASSIGNED');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', text: 'Turn off water supply', completed: false },
    { id: '2', text: 'Remove old faucet', completed: false },
    { id: '3', text: 'Replace tap (if needed)', completed: false },
    { id: '4', text: 'Install new faucet', completed: false },
    { id: '5', text: 'Testing', completed: false },
  ]);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  useEffect(() => {
    // console.log(job);
    
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <ScreenHeader name="" style={{ marginHorizontal: scale(16) }} />

      {/* Title */}
      <Text style={styles.title}>Job Detail</Text>

      {/* Job Location Card */}
      <View style={[styles.card, { paddingVertical : verticalScale(10)}]}>
        
        <View style={[styles.locationContent]}>
          <View style={styles.locationInfo}>
            <Text style={styles.cardTitle}>Job Location</Text>
            <Text style={styles.locationName}>{job.user.name}</Text>
            <Text style={styles.locationPhone}>{job.user.phoneNumber}</Text>
            <Text style={styles.locationEmail}>{job.user.email}</Text>
          </View>
          <View style={styles.mapContainer}>
            {/* Map placeholder - you can replace with actual map */}
            <View style={styles.mapPlaceholder}>
              <Icon name="location-on" size={moderateScale(24)} color="#FF6B6B" />
              <Text style={styles.mapText}>New Delhi</Text>
              <Text style={styles.mapSubtext}>+91 Delhi</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Job Description Card */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle]}>Job Description</Text>
        <Text style={styles.jobDescription}>{job.notes}</Text>
        
        {/* Before/After Images */}
        <View style={styles.beforeAfterContainer}>
          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>BEFORE</Text>
            <View style={styles.imagePlaceholder}>
              {/* Placeholder for before image */}
              <Icon name="photo" size={moderateScale(40)} color="#ccc" />
            </View>
          </View>
          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>AFTER</Text>
            <View style={styles.imagePlaceholder}>
              {/* Placeholder for after image */}
              <Icon name="photo" size={moderateScale(40)} color="#ccc" />
            </View>
          </View>
        </View>
      </View>

      {/* Scheduled Date & Time Card */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle ,{fontSize : 18}]}>Scheduled Date & Time</Text>
        <Text style={styles.scheduledDateTime}>{job.providerAssignedAt}</Text>
        
        <Text style={styles.jobStatusLabel}>Job Status</Text>
        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              jobStatus === 'ASSIGNED' && styles.statusButtonActive
            ]}
            onPress={() => setJobStatus('ASSIGNED')}
          >
            <Text style={[
              styles.statusText,
              jobStatus === 'ASSIGNED' && styles.statusTextActive
            ]}>
              ASSIGNED
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              jobStatus === 'IN PROGRESS' && styles.statusButtonInactive
            ]}
            onPress={() => setJobStatus('IN PROGRESS')}
          >
            <Text style={[
              styles.statusText,
              jobStatus === 'IN PROGRESS' && styles.statusTextInactive
            ]}>
              IN PROGRESS
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Checklist Card */}
      <View style={[styles.card, {marginBottom : 50}]}>
        <Text style={[styles.cardTitle ,{fontSize : 18, marginBottom : 3}]}>Checklist</Text>
        {checklist.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.checklistItem}
            onPress={() => toggleChecklistItem(item.id)}
          >
            <View style={[
              styles.checkbox,
              item.completed && styles.checkboxChecked
            ]}>
              {item.completed && (
                <Icon name="check" size={moderateScale(16)} color="#fff" />
              )}
            </View>
            <Text style={[
              styles.checklistText,
              item.completed && styles.checklistTextCompleted
            ]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF4FF',
    paddingTop : verticalScale(20),
    paddingBottom : verticalScale(50),
    // marginBottom : 20
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: scale(16),
    marginBottom: verticalScale(16),
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(20),
    paddingHorizontal : scale(13),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(3),
    elevation: 3,
    borderWidth : 1,
    borderColor : '#D9D9D9',
    // justifyContent : 'center',
  },
  cardTitle: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#000',
    marginBottom: verticalScale(3),
  },
  locationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
    // borderWidth : 1,
    height : verticalScale(73),
    marginVertical :  verticalScale(4)
  },
  locationName: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#000000B2',
    marginBottom: verticalScale(3),
  },
  locationPhone: {
     fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#000000B2',
    //  marginBottom: verticalScale(3),
  },
  locationEmail: {
     fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#000000B2',
  },
  mapContainer: {
    width: scale(159),
    height: verticalScale(81),
    // marginLeft: scale(12),
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E8',
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#333',
    marginTop: verticalScale(4),
  },
  mapSubtext: {
    fontSize: moderateScale(10),
    color: '#666',
  },
  jobDescription: {
    fontSize: moderateScale(12),
    color: '#000000B2',
    fontWeight : '500',
    marginBottom: verticalScale(10),
    borderBottomWidth : 1,
    borderColor : '#D8D8D8',
    paddingBottom : verticalScale(12)
  },
  beforeAfterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageSection: {
    flex: 1,
    marginHorizontal: scale(4),
  },
  imageLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  imagePlaceholder: {
    height: verticalScale(100),
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scheduledDateTime: {
    fontSize: moderateScale(12),
    color: '#000000B2',
    fontWeight: '500',
    marginBottom: verticalScale(16),
  },
  jobStatusLabel: {
    fontSize: moderateScale(12),
    color: '#000',
    fontWeight: '600',
    marginBottom: verticalScale(8),
  },
  statusContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },
  statusButton: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(6),
    backgroundColor: '#E8E8E8',
  },
  statusButtonActive: {
    backgroundColor: '#045BD8',
  },
  statusButtonInactive: {
    backgroundColor: '#E3E3E3',
  },
  statusText: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#666',
  },
  statusTextActive: {
    color: '#fff',
  },
  statusTextInactive: {
    color: '#666',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  checkbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: moderateScale(4),
    marginRight: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checklistText: {
    fontSize: moderateScale(19),
    color: '#333',
    flex: 1,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
});

export default JobDetailsScreen;
