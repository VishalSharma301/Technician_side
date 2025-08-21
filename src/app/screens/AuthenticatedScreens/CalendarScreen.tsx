// CalendarScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { scale, verticalScale, moderateScale } from '../../../util/scaling';
import ScreenHeader from '../../components/ScreenHeader';

const CalendarScreen = () => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; // e.g., "2025-08-10"
  const currentMonthString = todayString.substring(0, 7); // e.g., "2025-08"

  const [selectedDate, setSelectedDate] = useState(todayString);
  const [isMonthly, setIsMonthly] = useState(true);
  const [availabilityEnabled, setAvailabilityEnabled] = useState(true);
  const [selectedTime, setSelectedTime] = useState('07:00 AM');
  const [currentMonth, setCurrentMonth] = useState(currentMonthString);

  const timeSlots = ['07:00 AM', '11:00 AM', '12:00 AM'];

  const jobSummaryData = [
    {
      id: 1,
      type: 'Installation',
      time: '09:00AM',
      icon: 'build',
    },
    {
      id: 2,
      type: 'Repair',
      time: '09:00AM',
      icon: 'handyman',
    },
    {
      id: 3,
      type: 'Maintenance',
      time: '02:00 PM',
      icon: 'settings',
    },
  ];

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: '#F8B53C',
      selectedTextColor: 'white',
    },
    [todayString]: {
      marked: true,
      dotColor: '#FF9500',
      // Only show today's styling if it's not the selected date
      ...(selectedDate !== todayString && {
        textColor: '#FF9500',
      }),
    },
  };

  const getMonthYearDisplay = (dateString: string) => {
    const date = new Date(dateString + '-01');
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <ScreenHeader name='' style={{marginHorizontal : scale(16)}}/>

      {/* Title */}
      <View style={styles.topContainer}>
        <Text style={styles.title}>Calendar</Text>

        <View style={styles.headerRight}>
          <Text style={styles.availabilityText}>Availability</Text>
          <Switch
            value={availabilityEnabled}
            onValueChange={setAvailabilityEnabled}
            trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
            thumbColor="white"
            style={styles.switch}
          />
        </View>
      </View>

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, isMonthly && styles.toggleButtonActive]}
          onPress={() => setIsMonthly(true)}
        >
          <Text style={[styles.toggleText, isMonthly && styles.toggleTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !isMonthly && styles.toggleButtonActive]}
          onPress={() => setIsMonthly(false)}
        >
          <Text style={[styles.toggleText, !isMonthly && styles.toggleTextActive]}>
            Weekly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <Calendar
        
          current={todayString} // Set to today's date
          onDayPress={(day) => {setSelectedDate(day.dateString); console.log("day : ", day);
           } }
          markedDates={markedDates}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#000000ff',
            selectedDayBackgroundColor: '#F8B53C',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#FF9500',
            dayTextColor: 'black',
            textDisabledColor: '#d9e1e8',
            dotColor: '#FF9500',
            selectedDotColor: '#ffffff',
            arrowColor: '#F8B53C',
            disabledArrowColor: 'grey',
            monthTextColor: 'black',
            indicatorColor: 'black',
            textDayFontWeight: '400',
            textMonthFontWeight: '600',
            textDayHeaderFontWeight: '600',
            textDayFontSize: moderateScale(16),
            textMonthFontSize: moderateScale(16),
            textDayHeaderFontSize: moderateScale(13),
          }}
          hideArrows={false}
          hideExtraDays={true}
          disableMonthChange={false} // Allow month navigation
          firstDay={1}
          style={styles.calendar}
          onMonthChange={(month) => {
            setCurrentMonth(`${month.year}-${String(month.month).padStart(2, '0')}`);
            console.log('month :', month);
            
          }}
        
        />

      </View>

      <View style={styles.jobList}>
        {/* Pick Time Section */}
        <View style={styles.timeSection}>
          <Text style={styles.sectionTitle}>Pick time</Text>
          <View style={styles.timeSlots}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.timeSlotActive,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    selectedTime === time && styles.timeSlotTextActive,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Job Summary Section */}
        <View style={styles.jobSection}>
          <Text style={styles.sectionTitle}>Job Summary</Text>
          
          {jobSummaryData.map((job) => (
            <View key={job.id} style={styles.jobItem}>
              <View style={styles.jobLeft}>
                <View style={styles.iconContainer}>
                  <Icon name={job.icon as any} size={moderateScale(20)} color="#666666" />
                </View>
                <Text style={styles.jobType}>{job.type}</Text>
              </View>
              <Text style={styles.jobTime}>{job.time}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

// Keep your existing styles...
const styles = StyleSheet.create({
  // ... your existing styles remain the same
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop : verticalScale(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(20),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#007AFF',
    fontSize: moderateScale(16),
    marginLeft: scale(-20),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topContainer : {
    flexDirection : 'row',
    alignItems: 'center',
    justifyContent : 'space-between',
    marginHorizontal : scale(20),
    height : verticalScale(26),
    marginBottom : verticalScale(23),
    marginTop : verticalScale(20)
  },
  availabilityText: {
    fontSize: moderateScale(16),
    color: '#000',
  },
  switch: {
    transform: [{ scaleX: moderateScale(1) }, { scaleY: moderateScale(1) }],
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#000',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAE5E5',
    borderRadius: moderateScale(25),
    marginHorizontal: scale(20),
    marginBottom: verticalScale(30),
    width : scale(229),
    height : verticalScale(46),
    alignSelf : 'center'
  },
  toggleButton: {
    flex: 1,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    borderRadius: moderateScale(21),
  },
  toggleButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  toggleText: {
    fontSize: moderateScale(16),
    color: '#666',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: 'white',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  navButton: {
    padding: scale(8),
  },
  monthYear: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    color: '#000',
    marginHorizontal: scale(40),
  },
  calendarContainer: {
    backgroundColor: 'white',
    marginHorizontal: scale(20),
    borderRadius: moderateScale(12),
    padding: scale(10),
    marginBottom: verticalScale(30),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(3),
    elevation: 3,
  },
  calendar: {
    borderRadius: moderateScale(12),
  },
  timeSection: {
    marginBottom: verticalScale(30),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#000',
    marginBottom: verticalScale(15),
  },
  timeSlots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap : scale(10)
  },
  timeSlot: {
    flex: 1,
    backgroundColor: '#E8E8E8',
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    borderRadius: moderateScale(8),
  },
  timeSlotActive: {
    backgroundColor: '#1E3A8A',
  },
  timeSlotText: {
    fontSize: moderateScale(14),
    color: '#666',
    fontWeight: '500',
  },
  timeSlotTextActive: {
    color: 'white',
  },
  jobSection: {
  },
  jobList: {
    backgroundColor: 'white',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
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
    marginHorizontal : scale(20),
    paddingHorizontal : scale(14.5),
    paddingVertical : verticalScale(23),
    marginBottom : 20,
    paddingBottom : 0
  },
  jobItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height : verticalScale(32),
    borderBottomColor: '#F0F0F0',
    marginBottom : verticalScale(12),
    paddingRight : scale(23)
  },
  jobLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  jobType: {
    fontSize: moderateScale(16),
    color: '#000',
    fontWeight: '500',
  },
  jobTime: {
    fontSize: moderateScale(14),
    color: '#666',
    fontWeight: '500',
  },
});

export default CalendarScreen;
