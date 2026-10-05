import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface PreTriggerSOSModalProps {
  visible: boolean;
  initialCategory: string;
  defaultFlat: string;
  onClose: () => void;
  onConfirm: (details: { flat_no: string; emergency_type: string; remarks: string }) => void;
}

export const PreTriggerSOSModal: React.FC<PreTriggerSOSModalProps> = ({
  visible,
  initialCategory,
  defaultFlat,
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [flatNo, setFlatNo] = useState(defaultFlat || 'Flat 302, Block A, Green Valley');
  const [category, setCategory] = useState(initialCategory || 'Medical Emergency');
  const [remarks, setRemarks] = useState('');

  if (!visible) return null;

  const categories = [
    { id: 'Medical Emergency', label: `🚑 ${t('medicalEmergency')}`, color: '#EF4444' },
    { id: 'Fall Injury', label: `🤕 ${t('fallInjury')}`, color: '#F59E0B' },
    { id: 'Fire Hazard', label: `🔥 ${t('fireSmoke')}`, color: '#DC2626' },
    { id: 'Security Threat', label: `🛡️ ${t('intruderSecurity')}`, color: '#6366F1' },
    { id: 'Natural Disaster', label: `🌊 ${t('naturalDisaster')}`, color: '#0EA5E9' },
    { id: 'General SOS', label: `⚠️ ${t('generalSOS')}`, color: '#8B5CF6' },
  ];

  const handleConfirm = () => {
    onConfirm({
      flat_no: flatNo.trim() || defaultFlat,
      emergency_type: category,
      remarks: remarks.trim(),
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>🚨</Text>
              <View>
                <Text style={styles.headerTitle}>{t('dispatchDetails')}</Text>
                <Text style={styles.headerSub}>{t('specifyLocationReason')}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Flat Location Field */}
            <Text style={styles.label}>📍 {t('flatUnitLocation')}</Text>
            <TextInput
              style={styles.input}
              value={flatNo}
              onChangeText={setFlatNo}
              placeholder="e.g. Flat 302, Block A, Green Valley"
              placeholderTextColor="#94A3B8"
            />

            {/* Category / Reason Selection */}
            <Text style={styles.label}>🩺 {t('reasonForSOS')}</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      isSelected && { borderColor: cat.color, backgroundColor: 'rgba(239, 68, 68, 0.08)' },
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={[styles.categoryText, isSelected && { color: cat.color, fontWeight: '900' }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Additional Remarks Box */}
            <Text style={styles.label}>📝 {t('additionalDetails')}</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              multiline
              numberOfLines={3}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="e.g. Elderly person collapsed in kitchen"
              placeholderTextColor="#94A3B8"
            />

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>{t('cancelSOS')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>🚨 {t('broadcastSOSNow')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    minHeight: '70%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: '#FEE2E2',
    fontSize: 10,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '800',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
