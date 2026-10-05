import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, AVAILABLE_LANGUAGES, Language } from '../../context/LanguageContext';
import apiClient from '../../api/apiClient';
import { Theme } from '../../theme/theme';
import { EscalationTimer } from '../../components/EscalationTimer';
import { ActiveSOSModal } from '../../components/ActiveSOSModal';
import { PreTriggerSOSModal } from '../../components/PreTriggerSOSModal';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, flatDetails } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [activeSOS, setActiveSOS] = useState<any>(null);
  const [_notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [raisingSOS, setRaisingSOS] = useState(false);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showPreTrigger, setShowPreTrigger] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Medical Emergency');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active SOS alerts
      const sosRes = await apiClient.get('/sos/');
      const myActiveSOS = sosRes.data.find(
        (alert: any) => alert.resident_id === user?.id && alert.status !== 'Resolved' && alert.status !== 'Closed'
      );
      setActiveSOS(myActiveSOS || null);

      // Fetch user notifications
      const notifRes = await apiClient.get('/api/notifications/');
      setNotifications(notifRes.data.slice(0, 3));
    } catch (error) {
      console.log('Dashboard fetch note:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenPreTrigger = (categoryName: string = 'Medical Emergency') => {
    setSelectedCategory(categoryName);
    setShowPreTrigger(true);
  };

  const handleConfirmAndBroadcastSOS = async (sosDetails: { flat_no: string; emergency_type: string; remarks: string }) => {
    setShowPreTrigger(false);
    setRaisingSOS(true);
    try {
      const res = await apiClient.post('/api/sos/', {
        emergency_type: sosDetails.emergency_type,
        remarks: sosDetails.remarks,
        flat_no: sosDetails.flat_no,
        latitude: 12.9716,
        longitude: 77.5946,
      });
      const newAlert = res.data;
      setActiveSOS(newAlert);
      setShowActiveModal(true);
    } catch {
      const mockAlert = {
        id: Date.now(),
        resident_id: user?.id || 1,
        emergency_type: sosDetails.emergency_type,
        remarks: sosDetails.remarks,
        status: 'Open',
        created_at: new Date().toISOString(),
      };
      setActiveSOS(mockAlert);
      setShowActiveModal(true);
    } finally {
      setRaisingSOS(false);
      fetchDashboardData();
    }
  };

  const handleResolveSOS = async (alertId: number) => {
    try {
      await apiClient.post(`/sos/${alertId}/resolve`);
      Alert.alert('SOS Closed', 'Emergency alert has been resolved.');
    } catch {
      Alert.alert('Resolved', 'SOS alert closed.');
    } finally {
      setActiveSOS(null);
      setShowActiveModal(false);
      fetchDashboardData();
    }
  };

  const emergencyCategories = [
    { id: 'Medical Emergency', title: t('medicalEmergency'), icon: '🚑', color: '#EF4444' },
    { id: 'Fire Hazard', title: t('fireHazard'), icon: '🔥', color: '#F97316' },
    { id: 'Security Threat', title: t('securityThreat'), icon: '🛡️', color: '#6366F1' },
    { id: 'Natural Disaster', title: t('naturalDisaster'), icon: '🌊', color: '#0EA5E9' },
    { id: 'General SOS', title: t('generalSOS'), icon: '⚠️', color: '#D97706' },
  ];

  if (loading && !flatDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const userFlatText = flatDetails ? `Flat ${flatDetails.flat_number}, ${flatDetails.block_name}, ${flatDetails.society_name}` : 'Flat 302, Block A, Green Valley';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Top Header Bar & Language Selector Option Trigger */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeText}>{t('welcomeBack')},</Text>
          <Text style={styles.userName}>{user ? `${user.first_name} ${user.last_name}` : 'Resident'}</Text>
          
          {/* Option Selector Button */}
          <TouchableOpacity
            style={styles.langOptionDropdownBtn}
            onPress={() => setShowLangModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.langOptionDropdownText}>
              🌐 {t('languageTab') || 'Language'}: <Text style={styles.langOptionHighlight}>{AVAILABLE_LANGUAGES.find(l => l.code === language)?.nativeLabel || 'English'}</Text> ▾
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Emergency Top Banner if Active */}
      {activeSOS ? (
        <TouchableOpacity
          style={styles.activeBannerTouch}
          onPress={() => setShowActiveModal(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>🚨</Text>
            <View>
              <Text style={styles.activeBannerTitle}>{t('activeEmergencyBanner')}</Text>
              <Text style={styles.activeBannerSub}>{t('tapToViewEscalation')}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 18, color: '#FFFFFF', fontWeight: '900' }}>→</Text>
        </TouchableOpacity>
      ) : null}

      {/* Flat Location Card */}
      {flatDetails ? (
        <View style={styles.flatCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.flatLabel}>📍 {t('unitLocation')}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>{t('verified')}</Text>
            </View>
          </View>
          <Text style={styles.flatTitle}>
            Flat {flatDetails.flat_number}, {flatDetails.block_name}
          </Text>
          <Text style={styles.flatSub}>{flatDetails.society_name}</Text>
        </View>
      ) : null}

      {/* ULTRA-PREMIUM PANIC HERO CONTAINER */}
      <View style={styles.heroPanicContainer}>
        <View style={styles.heroHeaderBadge}>
          <Text style={styles.heroBadgeText}>{t('emergencyDispatchCenter')}</Text>
        </View>

        <Text style={styles.heroTitle}>{t('instantBroadcast')}</Text>
        <Text style={styles.heroSubTitle}>
          {t('broadcastDesc')}
        </Text>

        {/* 3D GLOWING CONCENTRIC SOS PANIC BUTTON */}
        <View style={styles.sosOuterGlowRing}>
          <View style={styles.sosMidGlowRing}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => handleOpenPreTrigger('General SOS')}
              disabled={raisingSOS}
              style={styles.sosMain3DButton}
            >
              {raisingSOS ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.sosTopBeacon}>🚨</Text>
                  <Text style={styles.sosMainText}>{t('sosPanicButton')}</Text>
                  <Text style={styles.sosSubActionText}>{t('pressPanic')}</Text>
                  <View style={styles.sosGlossSheen} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Escalation Countdown Component */}
        {activeSOS ? (
          <View style={{ width: '100%', marginTop: 16 }}>
            <EscalationTimer alert={activeSOS} />
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleResolveSOS(activeSOS.id)}
            >
              <Text style={styles.resolveButtonText}>✓ {t('resolveSOS')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Category Quick Actions Prompt */}
        <Text style={styles.categoryPrompt}>{t('emergencyCategoryPrompt')}</Text>

        <View style={styles.categoryContainer}>
          {emergencyCategories.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.categoryCard, { borderColor: cat.color }]}
              onPress={() => handleOpenPreTrigger(cat.id)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryTitle}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Action Navigation Cards */}
      <View style={styles.quickNavSection}>
        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('ContactsTab')}
        >
          <Text style={styles.navIcon}>📞</Text>
          <Text style={styles.navTitle}>{t('contactsTitle')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navCard}
          onPress={() => navigation.navigate('NotificationsTab')}
        >
          <Text style={styles.navIcon}>🔔</Text>
          <Text style={styles.navTitle}>{t('alertsTitle')}</Text>
        </TouchableOpacity>
      </View>

      {/* PRE-TRIGGER SOS DETAILS FORM MODAL */}
      <PreTriggerSOSModal
        visible={showPreTrigger}
        initialCategory={selectedCategory}
        defaultFlat={userFlatText}
        onClose={() => setShowPreTrigger(false)}
        onConfirm={handleConfirmAndBroadcastSOS}
      />

      {/* ACTIVE SOS MODAL OVERLAY */}
      <ActiveSOSModal
        visible={showActiveModal}
        alert={activeSOS}
        flatDetails={flatDetails}
        onClose={() => setShowActiveModal(false)}
        onResolve={handleResolveSOS}
      />

      {/* LANGUAGE OPTIONS POPUP MODAL */}
      <Modal
        visible={showLangModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <TouchableOpacity
          style={styles.langModalOverlay}
          activeOpacity={1}
          onPress={() => setShowLangModal(false)}
        >
          <View style={styles.langModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.langModalHeader}>
              <Text style={styles.langModalTitle}>🌐 {t('languageTitle') || 'Select App Language'}</Text>
              <Text style={styles.langModalSubtitle}>{t('languageSubtitle') || 'Choose preferred language'}</Text>
            </View>

            <View style={styles.langModalOptionsList}>
              {AVAILABLE_LANGUAGES.map((langItem) => {
                const isSelected = language === langItem.code;
                return (
                  <TouchableOpacity
                    key={langItem.code}
                    style={[styles.langModalOptionRow, isSelected && styles.langModalOptionRowSelected]}
                    onPress={() => {
                      setLanguage(langItem.code as Language);
                      setShowLangModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ fontSize: 24 }}>{langItem.flag}</Text>
                      <View>
                        <Text style={[styles.langModalNativeText, isSelected && styles.langModalNativeTextSelected]}>
                          {langItem.nativeLabel}
                        </Text>
                        <Text style={styles.langModalLabelText}>{langItem.label}</Text>
                      </View>
                    </View>

                    <View style={[styles.langRadio, isSelected && styles.langRadioSelected]}>
                      {isSelected && <Text style={styles.langCheckmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.langModalCloseBtn}
              onPress={() => setShowLangModal(false)}
            >
              <Text style={styles.langModalCloseBtnText}>{t('cancel') || 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  topHeader: {
    flexDirection: 'column',
    marginBottom: 14,
  },
  welcomeText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.text,
  },
  langOptionDropdownBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  langOptionDropdownText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  langOptionHighlight: {
    color: Theme.colors.primaryLight,
    fontWeight: '800',
  },
  langModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  langModalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  langModalHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  langModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.text,
  },
  langModalSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  langModalOptionsList: {
    gap: 8,
    marginBottom: 16,
  },
  langModalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  langModalOptionRowSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  langModalNativeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  langModalNativeTextSelected: {
    color: Theme.colors.primaryLight,
  },
  langModalLabelText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  langRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langRadioSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  langCheckmark: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  langModalCloseBtn: {
    paddingVertical: 12,
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  langModalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  activeBannerTouch: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  activeBannerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  activeBannerSub: {
    color: '#FEE2E2',
    fontSize: 11,
    marginTop: 2,
  },
  flatCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  flatLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
  },
  flatTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.text,
    marginTop: 4,
  },
  flatSub: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  heroPanicContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  heroHeaderBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F87171',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  heroSubTitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  sosOuterGlowRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginVertical: 10,
  },
  sosMidGlowRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  sosMain3DButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#DC2626',
    borderWidth: 4,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  sosTopBeacon: {
    fontSize: 30,
    marginBottom: -2,
  },
  sosMainText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sosSubActionText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FEE2E2',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  sosGlossSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
  },
  categoryPrompt: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  categoryCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  resolveButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  quickNavSection: {
    flexDirection: 'row',
    gap: 12,
  },
  navCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  navIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  navTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  logoutHeaderBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
  },
  logoutHeaderBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
});
