// src/screens/JobDetailsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../../util/scaling';
import { Job, JobStatus } from '../../../constants/jobTypes';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';



const colorFor = (s: JobStatus) =>
  ({
    pending: '#F1B401',
    in_progress: '#4CAF50',
    completed: '#2196F3',
    deadlineAlert: '#C03B3B',
  }[s]);

const JobDetailsScreen: React.FC = ({ route }: any) => {
  const job : Job = route.params.job;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.customer}>{job.user.name || "User"}</Text>
      <Text style={styles.heading}>{job.service.name}</Text>
      <Text style={styles.heading}>Rs {job.service.basePrice}</Text>


      <View style={[styles.badge, { backgroundColor: colorFor(job.status), marginTop : 20 }]}>
        <Icon name="information" size={14} color="#fff" />
        <Text style={styles.badgeTxt}>{job.status.replace('_', ' ')}</Text>
      </View>

      <Text style={styles.heading}>Address</Text>
      <Text style={styles.value}>{job.zipcode}</Text>

      <Text style={styles.heading}>Service Type</Text>
      <Text style={styles.value}>{job.service.category}</Text>

      <Text style={styles.heading}>Instructions</Text>
      <Text style={styles.value}>
        {job.notes || 'No additional instructions.'}
      </Text>

      <Text style={styles.heading}>Deadlines</Text>
      <Text style={styles.value}>
        Created : {new Date(job.createdAt).toLocaleString()}
      </Text>
      <Text style={styles.value}>
        Expires : {job.expiresAt
          ? new Date(job.expiresAt).toLocaleString()
          : '—'}
      </Text>
      {job.startedAt && (
        <Text style={styles.value}>
          Started : {new Date(job.startedAt).toLocaleString()}
        </Text>
      )}
      {job.completedAt && (
        <Text style={styles.value}>
          Completed : {new Date(job.completedAt).toLocaleString()}
        </Text>
      )}
      <Text style={styles.heading}>Inventry</Text>
    </ScrollView>
  );
};

export default JobDetailsScreen;

const styles = StyleSheet.create({
  container: { padding: scale(20) },
  customer: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    marginBottom: verticalScale(8),
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    marginBottom: verticalScale(16),
  },
  badgeTxt: {
    color: '#fff',
    marginLeft: scale(6),
    fontSize: moderateScale(12),
  },
  heading: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginTop: verticalScale(14),
  },
  value: {
    fontSize: moderateScale(14),
    color: '#333',
    marginTop: verticalScale(4),
  },
});
