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

export const SecurityDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLangModal, setShowLangModal] = useState(false);

  const fetchSecurityDashboard = useCallback(async () => {
    try {
      // Security role gets active incidents
      const activeRes = await apiClient.get('/api/incidents/active/');
      setActiveAlerts(activeRes.data);
    } catch (e) {
      console.error(e);
      // Fallback in case of endpoint prefix difference for Security
      try {
        const fallbackRes = await apiClient.get('/sos/active');
        setActiveAlerts(fallbackRes.data);
      } catch (err) {
        console.error('Fallback active alerts failed:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityDashboard();
    const interval = setInterval(fetchSecurityDashboard, 8000);
    return () => clearInterval(interval);
  }, [fetchSecurityDashboard]);

  if (loading && activeAlerts.length === 0) {
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
          <Text style={styles.title}>{t('guardsPortal')}</Text>
          <Text style={styles.sub}>Guard Name: {user?.first_name} {user?.last_name}</Text>
          
          {/* Language Option Selector Button */}
          <TouchableOpacity
            style={styles.langOptionDropdownBtn}
            onPress={() => setShowLangModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.langOptionDropdownText}>
              🌐 Language: <Text style={styles.langOptionHighlight}>{AVAILABLE_LANGUAGES.find(l => l.code === language)?.nativeLabel || 'English'}</Text> ▾
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>⚠️ Urgent SOS Alerts ({activeAlerts.length})</Text>

      {activeAlerts.length > 0 ? (
        activeAlerts.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={styles.card}
            onPress={() => navigation.navigate('IncidentDetail', { incidentId: alert.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.alertType}>{alert.emergency_type}</Text>
              <Text style={styles.badge}>{alert.status}</Text>
            </View>
            <Text style={styles.location}>
              📍 Flat {alert.flat_no}, Block {alert.block}, {alert.society}
            </Text>
            {alert.emergency_message && (
              <Text style={styles.msg}>"{alert.emergency_message}"</Text>
            )}
            <Text style={styles.time}>
              Raised at: {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
  },
  sub: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
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
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.md,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    borderColor: Theme.colors.emergencyCritical,
    borderWidth: 1,
    marginBottom: Theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertType: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: Theme.colors.emergencyCritical,
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  location: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
  },
  msg: {
    color: Theme.colors.text,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: Theme.spacing.xs,
  },
  time: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    textAlign: 'right',
    marginTop: Theme.spacing.xs,
  },
  emptyCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: Theme.colors.success,
    borderWidth: 1,
  },
  emptyText: {
    color: Theme.colors.success,
    fontWeight: 'bold',
  },
});
