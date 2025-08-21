// components/OtpModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { scale, verticalScale, moderateScale } from '../../util/scaling';

interface OtpModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void;
  title?: string;
}

const OtpModal: React.FC<OtpModalProps> = ({
  visible,
  onClose,
  onSubmit,
  title = 'Enter OTP',
}) => {
  const [otp, setOtp] = useState('');

  // Clear OTP when modal opens/closes
  useEffect(() => {
    if (!visible) setOtp('');
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.otpModal}>
          <Text style={styles.modalTitle}>{title}</Text>

          <TextInput
            style={styles.otpInput}
            placeholder="Enter OTP"
            placeholderTextColor="#999"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.btn, styles.submitBtn]}
              onPress={() => {
                if (otp.trim()) {
                  onSubmit(otp);
                  onClose();
                }
              }}
            >
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(16),
  },
  otpModal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: scale(20),
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginBottom: verticalScale(12),
    textAlign: 'center',
    color: '#000',
  },
  otpInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(10),
    fontSize: moderateScale(16),
    marginBottom: verticalScale(18),
    textAlign: 'center',
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    gap: scale(18),
  },
  btn: {
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
  },
  submitBtn: {
    backgroundColor: '#183B8F',
  },
  cancelBtn: {
    backgroundColor: '#e0e0e0',
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  cancelText: {
    color: '#333',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
});

export default OtpModal;
