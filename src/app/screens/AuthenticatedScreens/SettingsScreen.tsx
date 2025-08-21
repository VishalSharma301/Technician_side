// SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../../../util/scaling';
import ScreenHeader from '../../components/ScreenHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const settingsItems = [
    {
      id: 'account',
      title: 'Account',
      icon: 'person',
      iconColor: '#FF9500',
      iconBgColor: '#FFF3E6',
      hasSwitch: false,
      hasArrow: true,
      onPress: () => console.log('Account pressed'),
    },
    {
      id: 'language',
      title: 'Language',
      icon: 'language',
      iconColor: '#007AFF',
      iconBgColor: '#E6F2FF',
      hasSwitch: false,
      hasArrow: true,
      onPress: () => console.log('Language pressed'),
    },
    {
      id: 'password',
      title: 'Change Password',
      icon: 'lock',
      iconColor: '#007AFF',
      iconBgColor: '#E6F2FF',
      hasSwitch: false,
      hasArrow: true,
      onPress: () => console.log('Change Password pressed'),
    },
    {
      id: 'notification',
      title: 'Notification',
      icon: 'notifications',
      iconColor: '#8E8E93',
      iconBgColor: '#F2F2F7',
      hasSwitch: true,
      hasArrow: false,
      switchValue: notificationsEnabled,
      onSwitchChange: setNotificationsEnabled,
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: 'shield',
      iconColor: '#34C759',
      iconBgColor: '#E8F8EA',
      hasSwitch: false,
      hasArrow: true,
      onPress: () => console.log('Privacy pressed'),
    },
    {
      id: 'support',
      title: 'Help/Support/Contact Admin',
      icon: 'help',
      iconColor: '#007AFF',
      iconBgColor: '#E6F2FF',
      hasSwitch: false,
      hasArrow: true,
      onPress: () => console.log('Help/Support pressed'),
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'logout',
      iconColor: '#007AFF',
      iconBgColor: '#E6F2FF',
      hasSwitch: false,
      hasArrow: true,
      onPress: () => console.log('Logout pressed'),
    },
  ];

  const renderSettingItem = (item : any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
      activeOpacity={item.hasSwitch ? 1 : 0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: '#7494CE1A' }]}>
          <Icon name={item.icon} size={moderateScale(20)} color={item.iconColor} />
        </View>
        <Text style={styles.settingTitle}>{item.title}</Text>
      </View>

      <View style={styles.rightSection}>
        {item.hasSwitch ? (
          <Switch
            value={item.switchValue}
            onValueChange={item.onSwitchChange}
            trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
            thumbColor="white"
            style={styles.switch}
          />
        ) : item.hasArrow ? (
          <Icon name="chevron-right" size={moderateScale(20)} color="#C7C7CC" />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1,  backgroundColor: '#fff'}}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <ScreenHeader name="" style={{ marginHorizontal: scale(16) }} />

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Settings List */}
      <View style={styles.settingsList}>
        {settingsItems.map(renderSettingItem)}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //,
  },
  titleContainer: {
    marginHorizontal: scale(20),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(30),
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '600',
    color: '#000',
  },
  settingsList: {
    marginHorizontal: scale(20),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(4),
    elevation: 1,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    height : verticalScale(60)
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
    borderWidth : moderateScale(1),
    borderColor : '#576F9B47'
  },
  settingTitle: {
    fontSize: moderateScale(16),
    fontWeight: '400',
    color: '#000',
    flex: 1,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  switch: {
    // transform: [{ scaleX: moderateScale(1) }, { scaleY: moderateScale(1) }],
    borderWidth : 1,
    borderColor : '#ccc',
    // backgroundColor : 'red',
    alignSelf : 'center',
    height : verticalScale(30)
  },
});

export default SettingsScreen;
