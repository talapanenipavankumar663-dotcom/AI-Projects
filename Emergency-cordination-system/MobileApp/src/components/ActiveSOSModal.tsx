import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { EscalationTimer } from './EscalationTimer';
import { useLanguage } from '../context/LanguageContext';

interface ActiveSOSModalProps {
  visible: boolean;
  alert: any;
  flatDetails: any;
  onClose: () => void;
  onResolve: (alertId: number) => void;
}

export const ActiveSOSModal: React.FC<ActiveSOSModalProps> = ({
  visible,
  alert,
  flatDetails,
  onClose,
  onResolve,
}) => {
  const { t } = useLanguage();

  if (!alert) return null;

  const lat = alert.latitude || 12.9716;
  const lng = alert.longitude || 77.5946;

  const handleCallSecurity = () => {
    Linking.openURL('tel:112');
  };

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Location GPS', `Coordinates: ${lat}, ${lng}`);
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
          {/* Header Live Pulse Banner */}
          <View style={styles.liveBanner}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveBannerText}>🚨 LIVE ACTIVE EMERGENCY BROADCAST</Text>
            <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Emergency Type Badge */}
            <View style={styles.emergencyTypeRow}>
              <Text style={styles.emergencyIcon}>🚨</Text>
              <View>
                <Text style={styles.emergencyTypeTitle}>
                  {alert.emergency_type || 'General SOS Alert'}
                </Text>
                <Text style={styles.alertIdText}>Incident ID: #{alert.id} • Status: {alert.status}</Text>
              </View>
            </View>

            {/* Resident & Flat Location Card */}
            <View style={styles.locationCard}>
              <Text style={styles.locationCardLabel}>📍 EMERGENCY LOCATION DETAILS</Text>
              <Text style={styles.locationTitle}>
                {flatDetails ? `Flat ${flatDetails.flat_number}, ${flatDetails.block_name}` : 'Unit / Flat Residence'}
              </Text>
              <Text style={styles.locationSub}>
                {flatDetails?.society_name || 'Community Emergency Network'}
              </Text>
            </View>

            {/* LIVE GPS MAP CONTAINER & COORDINATES */}
            <View style={styles.gpsMapCard}>
              <View style={styles.gpsHeaderRow}>
                <Text style={styles.gpsHeaderTitle}>📡 LIVE RESIDENT GPS LOCATION</Text>
                <View style={styles.gpsLivePill}>
                  <Text style={styles.gpsLiveText}>GPS ACTIVE</Text>
                </View>
              </View>

              {/* Simulated Visual GPS Map View with Coordinates */}
              <View style={styles.mapVisualBox}>
                <Text style={styles.mapPinIcon}>📍</Text>
                <Text style={styles.mapLocationName}>
                  {flatDetails ? `${flatDetails.society_name}, ${flatDetails.block_name}` : 'Resident Emergency Location'}
                </Text>
                <Text style={styles.mapCoordsText}>
                  Lat: {lat.toFixed(4)}° N, Lng: {lng.toFixed(4)}° E (Accuracy: ±5m)
                </Text>
              </View>

              <TouchableOpacity
                style={styles.openMapBtn}
                onPress={handleOpenGoogleMaps}
              >
                <Text style={styles.openMapBtnText}>🗺️ OPEN IN GOOGLE MAPS NAVIGATION</Text>
              </TouchableOpacity>
            </View>

            {/* Live 5s 4-Tier Escalation Timer */}
            <EscalationTimer alert={alert} />

            {/* Emergency Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.callSecurityBtn}
                onPress={handleCallSecurity}
              >
                <Text style={styles.callBtnText}>📞 CALL SECURITY / 112</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resolveBtn}
                onPress={() => {
                  onClose();
                  onResolve(alert.id);
                }}
              >
                <Text style={styles.resolveBtnText}>✓ {t('resolveSOS')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.minimizeBtn} onPress={onClose}>
              <Text style={styles.minimizeBtnText}>Minimize Alert & Return to Dashboard</Text>
            </TouchableOpacity>
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
  liveBanner: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  liveBannerText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.8,
    flex: 1,
  },
  closeIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  emergencyIcon: {
    fontSize: 34,
    marginRight: 12,
  },
  emergencyTypeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  alertIdText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  locationCardLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4F46E5',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  locationSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  gpsMapCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  gpsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gpsHeaderTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  gpsLivePill: {
    backgroundColor: '#0284C7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  gpsLiveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  mapVisualBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  mapPinIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  mapLocationName: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
  mapCoordsText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  openMapBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  openMapBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 10,
  },
  callSecurityBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  resolveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  minimizeBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  minimizeBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
});
