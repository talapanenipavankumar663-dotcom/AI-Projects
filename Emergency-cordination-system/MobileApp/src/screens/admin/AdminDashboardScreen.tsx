import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import apiClient from '../../api/apiClient';
import { Theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, AVAILABLE_LANGUAGES, Language } from '../../context/LanguageContext';

export const AdminDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { logout, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [summary, setSummary] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLangModal, setShowLangModal] = useState(false);

  const fetchAdminData = useCallback(async () => {
    try {
      const summaryRes = await apiClient.get('/api/incidents/summary/');
      setSummary(summaryRes.data);

      const activeRes = await apiClient.get('/api/incidents/active/');
      setActiveAlerts(activeRes.data);

      const analyticsRes = await apiClient.get('/api/incidents/analytics/');
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 10000); // refresh statistics every 10 seconds
    return () => clearInterval(interval);
  }, [fetchAdminData]);

  if (loading && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('adminDashboard')}</Text>
          <Text style={styles.headerSub}>Admin: {user?.first_name}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => setShowLangModal(true)}
          >
            <Text style={styles.langButtonText}>
              🌐 {AVAILABLE_LANGUAGES.find(l => l.code === language)?.flag || '🌐'} {language.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>🚪 {t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Selection Card Banner */}
      <TouchableOpacity
        style={styles.langBanner}
        onPress={() => setShowLangModal(true)}
      >
        <Text style={styles.langBannerText}>
          🌐 {t('languageTitle') || 'App Language'}: <Text style={styles.langBannerHighlight}>{AVAILABLE_LANGUAGES.find(l => l.code === language)?.nativeLabel || 'English'}</Text> ▾
        </Text>
      </TouchableOpacity>

      {/* Grid Summary Stats */}
      {summary && (
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { borderColor: Theme.colors.emergencyCritical }]}>
            <Text style={styles.statNumber}>{summary.active_incidents}</Text>
            <Text style={styles.statLabel}>Active SOS</Text>
          </View>
          <View style={[styles.statBox, { borderColor: Theme.colors.emergencyMedium }]}>
            <Text style={styles.statNumber}>{summary.pending_responses}</Text>
            <Text style={styles.statLabel}>Unassigned</Text>
          </View>
          <View style={[styles.statBox, { borderColor: Theme.colors.success }]}>
            <Text style={styles.statNumber}>{summary.resolved_incidents}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
          <View style={[styles.statBox, { borderColor: Theme.colors.info }]}>
            <Text style={styles.statNumber}>{summary.total_incidents}</Text>
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
        </View>
      )}

      {/* Analytics Card */}
      {analytics && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⏱️ Response Performance</Text>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsCol}>
              <Text style={styles.analyticsLabel}>Avg Response</Text>
              <Text style={[styles.analyticsVal, { color: Theme.colors.primaryLight }]}>
                {analytics.average_response_time_seconds}s
              </Text>
            </View>
            <View style={styles.analyticsCol}>
              <Text style={styles.analyticsLabel}>Avg Resolution</Text>
              <Text style={[styles.analyticsVal, { color: Theme.colors.success }]}>
                {Math.round(analytics.average_resolution_time_seconds / 60)}m
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Shortcuts */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Management Modules</Text>
      </View>
      <View style={styles.managementRow}>
        <TouchableOpacity
          style={styles.manageCard}
          onPress={() => navigation.navigate('ManageSocieties')}
        >
          <Text style={styles.manageCardIcon}>🏢</Text>
          <Text style={styles.manageCardTitle}>Societies & Flats</Text>
          <Text style={styles.manageCardDesc}>Create blocks, flats and locations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manageCard}
          onPress={() => navigation.navigate('ManageResidents')}
        >
          <Text style={styles.manageCardIcon}>👤</Text>
          <Text style={styles.manageCardTitle}>Residents mapping</Text>
          <Text style={styles.manageCardDesc}>Assign residents to their flat IDs</Text>
        </TouchableOpacity>
      </View>

      {/* Active Incidents Alert Feed */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Emergency Signals ({activeAlerts.length})</Text>
      </View>

      {activeAlerts.length > 0 ? (
        activeAlerts.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={styles.alertCard}
            onPress={() => navigation.navigate('IncidentDetail', { incidentId: alert.id })}
          >
            <View style={styles.alertHeader}>
              <Text style={styles.alertType}>{alert.emergency_type}</Text>
              <Text style={styles.alertStatusBadge}>{alert.status}</Text>
            </View>
            <Text style={styles.alertLocation}>
              📍 Flat {alert.flat_no}, Block {alert.block}, {alert.society}
            </Text>
            <Text style={styles.alertTime}>
              Raised at: {new Date(alert.created_at).toLocaleTimeString()}
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>✅ All emergency incidents resolved.</Text>
        </View>
      )}

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
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
  },
  headerTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
  },
  headerSub: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.xs,
  },
  logoutButton: {
    backgroundColor: Theme.colors.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.roundness.sm,
  },
  logoutText: {
    color: Theme.colors.emergencyCritical,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  statBox: {
    backgroundColor: Theme.colors.surface,
    width: '48%',
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
  },
  statNumber: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
  },
  statLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.bold,
    marginBottom: Theme.spacing.md,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsCol: {
    flex: 1,
    alignItems: 'center',
  },
  analyticsLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
  },
  analyticsVal: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold,
  },
  managementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  manageCard: {
    backgroundColor: Theme.colors.surface,
    width: '48%',
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  manageCardIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  manageCardTitle: {
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.bold,
    fontSize: 13,
  },
  manageCardDesc: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  alertCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    borderColor: Theme.colors.emergencyCritical,
    borderWidth: 1,
    marginBottom: Theme.spacing.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertType: {
    color: Theme.colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  alertStatusBadge: {
    backgroundColor: Theme.colors.emergencyCritical,
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertLocation: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
  },
  alertTime: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.success,
  },
  emptyText: {
    color: Theme.colors.success,
    fontWeight: 'bold',
  },
  langButton: {
    backgroundColor: Theme.colors.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.roundness.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  langButtonText: {
    color: Theme.colors.primaryLight,
    fontWeight: '700',
    fontSize: 11,
  },
  langBanner: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.roundness.sm,
    padding: Theme.spacing.sm,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  langBannerText: {
    fontSize: 12,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  langBannerHighlight: {
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
});

