import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { scale, verticalScale, moderateScale } from '../../util/scaling';
import { LinearGradient } from 'expo-linear-gradient';

// ---------- Icons (inline SVG-style via react-native — using text emoji placeholders) ----------
// Replace with your actual icon library (e.g. react-native-vector-icons) as needed.

type PaymentMethod = 'cash' | 'online' | 'not_paid' | null;
type NotPaidReason = 'refused' | 'later' | 'not_home' | 'dispute' | null;

interface CollectPaymentModalProps {
  visible: boolean;
  totalAmount: number;
  onClose: () => void;
  onConfirmPayment: (method: PaymentMethod) => void;
  onFlagNotPaid: (reason: NotPaidReason) => void;
}

// ─── Screen 1: Payment Method Selection ───────────────────────────────────────
interface PaymentScreenProps {
  totalAmount: number;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
  onNotPaid: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({
  totalAmount,
  onClose,
  onConfirm,
  onNotPaid,
}) => {
  const [selected, setSelected] = useState<PaymentMethod>(null);

  const handleConfirm = () => {
    if (selected === 'not_paid') {
      onNotPaid();
    } else if (selected) {
      onConfirm(selected);
    }
  };

  const options: { key: PaymentMethod; label: string; icon: string }[] = [
    { key: 'cash', label: 'Cash Collected', icon: '💵' },
    { key: 'online', label: 'Online Paid', icon: '📲' },
    { key: 'not_paid', label: 'Not Paid Yet', icon: '🚫' },
  ];

  return (
    <View style={[styles.sheet,{ paddingHorizontal : scale(29) }]}>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🏛</Text>
          <Text style={styles.sheetTitle}>Collect Payment</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Total Due Banner */}
      <LinearGradient style={styles.totalBanner} colors={['#489CDB', '#306B9A']}>
        <Text style={styles.totalLabel}>TOTAL DUE</Text>
        <Text style={styles.totalAmount}>{totalAmount.toLocaleString('en-IN')}</Text>
      </LinearGradient>

      {/* Payment Options */}
      <Text style={styles.questionText}>How did customer pay?</Text>

      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.optionRow,
            selected === opt.key && styles.optionRowSelected,
          ]}
          onPress={() => setSelected(opt.key)}
          activeOpacity={0.75}
        >
          <View style={[styles.optionIconWrap, selected === opt.key && styles.optionIconWrapSelected]}>
            <Text style={styles.optionIcon}>{opt.icon}</Text>
          </View>
          <Text style={[styles.optionLabel, selected === opt.key && styles.optionLabelSelected]}>
            {opt.label}
          </Text>
          {selected === opt.key && (
            <View style={styles.radioSelected} />
          )}
        </TouchableOpacity>
      ))}

      {/* Confirm Button */}
      <TouchableOpacity
        style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
        onPress={handleConfirm}
        disabled={!selected}
        activeOpacity={0.85}
      >
        <Text style={styles.confirmBtnText}>Confirm  ✈</Text>
      </TouchableOpacity>

      {/* Go Back */}
      <TouchableOpacity style={styles.goBackBtn} onPress={onClose} activeOpacity={0.7}>
        <Text style={styles.goBackText}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Screen 2: Not Paid Reason Selection ──────────────────────────────────────
interface NotPaidScreenProps {
  onClose: () => void;
  onFlag: (reason: NotPaidReason) => void;
  onGoBack: () => void;
}

const NotPaidScreen: React.FC<NotPaidScreenProps> = ({ onClose, onFlag, onGoBack }) => {
  const [selected, setSelected] = useState<NotPaidReason>(null);

  const reasons: { key: NotPaidReason; label: string; icon: string }[] = [
    { key: 'refused', label: 'Customer refused to pay', icon: '🚫' },
    { key: 'later', label: 'Will Pay later', icon: '⭐' },
    { key: 'not_home', label: 'Customer not home', icon: '✔' },
    { key: 'dispute', label: 'Dispute on amount', icon: '⚙' },
  ];

  return (
    <View style={[styles.sheet,{ paddingHorizontal : scale(9) }]}>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🏛</Text>
          <Text style={styles.sheetTitle}>Collect Payment</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Warning Banner */}
      <View style={styles.warningBanner}>
        <Text style={styles.warningIcon}>💼</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.warningTitle}>Payment Not Collected</Text>
          <Text style={styles.warningSubtitle}>Provider will be notified. Please select reason.</Text>
        </View>
      </View>

      {/* Reason Options */}
      {reasons.map((r) => (
        <TouchableOpacity
          key={r.key}
          style={[
            styles.optionRow,
            selected === r.key && styles.optionRowSelected,
          ]}
          onPress={() => setSelected(r.key)}
          activeOpacity={0.75}
        >
          <View style={[styles.optionIconWrap, selected === r.key && styles.optionIconWrapSelected]}>
            <Text style={styles.optionIcon}>{r.icon}</Text>
          </View>
          <Text style={[styles.optionLabel, selected === r.key && styles.optionLabelSelected]}>
            {r.label}
          </Text>
          {selected === r.key && (
            <View style={styles.radioSelected} />
          )}
        </TouchableOpacity>
      ))}

      {/* Flag as Not Paid Button */}
      <TouchableOpacity
        style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
        onPress={() => selected && onFlag(selected)}
        disabled={!selected}
        activeOpacity={0.85}
      >
        <Text style={styles.confirmBtnText}>Flag as Not Paid  ✈</Text>
      </TouchableOpacity>

      {/* Go Back */}
      <TouchableOpacity style={styles.goBackBtn} onPress={onGoBack} activeOpacity={0.7}>
        <Text style={styles.goBackText}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main Modal Wrapper ────────────────────────────────────────────────────────
const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  visible,
  totalAmount,
  onClose,
  onConfirmPayment,
  onFlagNotPaid,
}) => {
  const [screen, setScreen] = useState<'payment' | 'notPaid'>('payment');

  // Reset to first screen whenever modal opens
  React.useEffect(() => {
    if (visible) setScreen('payment');
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {screen === 'payment' ? (
        <PaymentScreen
          totalAmount={totalAmount}
          onClose={onClose}
          onConfirm={(method) => onConfirmPayment(method)}
          onNotPaid={() => setScreen('notPaid')}
        />
      ) : (
        <NotPaidScreen
          onClose={onClose}
          onFlag={(reason) => onFlagNotPaid(reason)}
          onGoBack={() => setScreen('payment')}
        />
      )}
    </Modal>
  );
};

export default CollectPaymentModal;

// ─── Styles ───────────────────────────────────────────────────────────────────
const BROWN = '#864C2D';
const BLUE_TEAL = '#1B6B8A';
const LIGHT_BLUE_BG = '#F0F9FF';
const BANNER_BLUE_START = '#1E5F8A';
const BANNER_BLUE_END = '#2A7FAF';
const WARNING_BG = '#FDF7EE';
const WARNING_BORDER = '#F5D8C3';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // ── Bottom Sheet ──
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    // paddingHorizontal: scale(20),
    paddingTop: verticalScale(38), // we will handle top spacing via header margin
    paddingBottom: verticalScale(28),
    // Attach to bottom
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },

  // ── Header ──
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  headerIcon: {
    fontSize: moderateScale(18),
  },
  sheetTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: moderateScale(13),
    color: '#555',
    fontWeight: '600',
  },

  // ── Total Banner ──
  totalBanner: {
    backgroundColor: BANNER_BLUE_START,
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(20),
    alignItems: 'center',
    marginBottom: verticalScale(18),
    // Subtle gradient-like look via shadow
    shadowColor: BANNER_BLUE_START,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  totalLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: verticalScale(4),
  },
  totalAmount: {
    fontSize: moderateScale(36),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  // ── Question Text ──
  questionText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: verticalScale(12),
  },

  // ── Option Rows ──
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_BLUE_BG,
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    marginBottom: verticalScale(10),
    borderWidth: moderateScale(0.7),
    borderColor: '#D2EEFC',
  },
  optionRowSelected: {
    borderColor: BLUE_TEAL,
    backgroundColor: '#D6EEF7',
  },
  optionIconWrap: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    // backgroundColor: 'rgba(27,107,138,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  optionIconWrapSelected: {
    // backgroundColor: 'rgba(27,107,138,0.22)',
  },
  optionIcon: {
    fontSize: moderateScale(16),
  },
  optionLabel: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#2A2A2A',
  },
  optionLabelSelected: {
    color: BLUE_TEAL,
    fontWeight: '600',
  },
  radioSelected: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: BLUE_TEAL,
  },

  // ── Warning Banner (Screen 2) ──
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: WARNING_BG,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: WARNING_BORDER,
    padding: scale(14),
    marginBottom: verticalScale(16),
    gap: scale(10),
  },
  warningIcon: {
    fontSize: moderateScale(22),
    marginTop: verticalScale(1),
  },
  warningTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#D9622B',
    marginBottom: verticalScale(2),
  },
  warningSubtitle: {
    fontSize: moderateScale(12),
    color: '#666',
    lineHeight: moderateScale(17),
  },

  // ── Confirm / Flag Button ──
  confirmBtn: {
    backgroundColor: BROWN,
    borderRadius: moderateScale(6),
    paddingVertical: verticalScale(15),
    alignItems: 'center',
    marginTop: verticalScale(6),
    marginBottom: verticalScale(10),
    
  },
  confirmBtnDisabled: {
    backgroundColor: '#C4A090',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Go Back ──
  goBackBtn: {
    paddingVertical: verticalScale(13),
    alignItems: 'center',
    borderRadius: moderateScale(6),
    borderWidth: 1.5,
    borderColor: '#864C2D33',
  },
  goBackText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#444',
  },
});