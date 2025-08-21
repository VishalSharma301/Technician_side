// src/screens/ActiveJobsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { 
  RouteProp,
  useNavigation,
} from '@react-navigation/native';
import {
  StackScreenProps,
} from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { TabBar, TabView, SceneMap } from 'react-native-tab-view';

import { RootStackParamList } from '../../navigation/types';
import { useJobs } from '../../../store/JobContext';
import { Job, JobStatus } from '../../../constants/jobTypes';
import JobCard from '../../components/JobCard';
import { scale, verticalScale, moderateScale } from '../../../util/scaling';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';

// 1. Use NativeStackScreenProps to type props
type Props = StackScreenProps<RootStackParamList, 'JobsScreen'>;

export default function JobsScreen({ route, navigation  }: any) {
  const { jobs } = useJobs();

  const routes = [
    { key: 'today', title: 'Today' },
    { key: 'tomorrow', title: 'Tomorrow' },
    { key: 'map', title: 'Map' },
  ];
  const [index, setIndex] = React.useState(0);

  const filterByStatus = (s: JobStatus) =>
    jobs.filter(j => j.status === s);

  const list = (items: Job[]) => (
    <FlatList
      data={items}
      keyExtractor={item => item._id}
      contentContainerStyle={{ padding: scale(16) }}
      renderItem={({ item }) => (
        <JobCard
          job={item}
          onStart={() => {}}
          onComplete={() => {}}
          onAlert={() => {}}
          navigate={job => navigation.navigate('JobDetails', { job })}
        />
      )}
      ListEmptyComponent={<Text style={styles.empty}>No jobs</Text>}
    />
  );

  // 2. Pull the defaultStatus from params, which now matches the type
  const defaultStatus = route.params.defaultStatus;
  const [statusFilter, setStatusFilter] = React.useState<JobStatus>(defaultStatus);

  const statusChips: { label: string; status: JobStatus }[] = [
    { label: 'Pending',        status: JobStatus.PENDING },
    { label: 'In Progress',    status: JobStatus.ONGOING },
    { label: 'Completed',      status: JobStatus.COMPLETED },
    { label: 'Deadline Alert', status: JobStatus.DEADLINE_ALERT },
  ];

  const Scene = () => list(filterByStatus(statusFilter));

  const renderScene = SceneMap({
    today: Scene,
    tomorrow: Scene,
    map: Scene,
  });

  return (
    <SafeAreaView style={{flex : 1}}>
    <View style={styles.flex}>

        <ScreenHeader name='Active Jobs'  style={{marginHorizontal : scale(10)}}/>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#153B93', width : "20%" }}
            style={{ backgroundColor: '#153B93' }}
            
          />
        )}
      />

      <View style={styles.chipRow}>
        {statusChips.map(chip => (
          <Pressable
            key={chip.status}
            onPress={() => setStatusFilter(chip.status)}
            style={[
              styles.chip,
              chip.status === statusFilter && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipTxt,
                chip.status === statusFilter && styles.chipTxtActive,
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F0F4FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    backgroundColor: '#fff',
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginLeft: scale(12),
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: verticalScale(8),
    backgroundColor: '#F0F4FF',
  },
  chip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(16),
    backgroundColor: '#E0E0E0',
  },
  chipActive: { backgroundColor: '#153B93' },
  chipTxt: { fontSize: moderateScale(12), color: '#000' },
  chipTxtActive: { color: '#fff' },
  empty: { textAlign: 'center', marginTop: verticalScale(24), color: '#666' },
});
