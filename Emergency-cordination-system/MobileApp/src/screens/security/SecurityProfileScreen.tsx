import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, AVAILABLE_LANGUAGES, Language } from '../../context/LanguageContext';
import { Theme } from '../../theme/theme';

export const SecurityProfileScreen: React.FC<{ navigation?: any }> = ({ navigation: _navigation }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showLangModal, setShowLangModal] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Guard Badge & Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>🛡️</Text>
        </View>
        <Text style={styles.guardName}>
          {user ? `${user.first_name} ${user.last_name}` : 'Security Guard'}
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>ON DUTY SECURITY GUARD</Text>
        </View>
        <Text style={styles.emailText}>{user?.email || 'guard@test.com'}</Text>
      </View>

      {/* Language Selector Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>🌐 App Language / भाषा</Text>
        <Text style={styles.sectionSubtitle}>
          Select interface language for Security Patrol & Dispatch alerts
        </Text>

        <TouchableOpacity
          style={styles.langSelectorBtn}
          onPress={() => setShowLangModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.langSelectorBtnText}>
            Current Language: <Text style={styles.langHighlight}>{AVAILABLE_LANGUAGES.find(l => l.code === language)?.nativeLabel || 'English'}</Text> ▾
          </Text>
        </TouchableOpacity>
      </View>

      {/* Duty Assignment Details */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>🏢 Guard House & Patrol Post</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Duty Gate Post:</Text>
          <Text style={styles.infoValue}>Gate 1 Main Guard Station</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Sector:</Text>
          <Text style={styles.infoValue}>Block A & Block B Residential Towers</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone Number:</Text>
          <Text style={styles.infoValue}>{user?.phone || user?.phone_number || '+1 555-0981'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Shift Status:</Text>
          <Text style={[styles.infoValue, { color: Theme.colors.success, fontWeight: 'bold' }]}>🟢 Active Patrol On Duty</Text>
        </View>
      </View>

      {/* Logout Action Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>🚪 {t('logout')}</Text>
      </TouchableOpacity>

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
  profileCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  avatarText: {
    fontSize: 32,
  },
  guardName: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: Theme.colors.emergencyCritical,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  emailText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  sectionHeaderTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    marginBottom: 10,
  },
  langSelectorBtn: {
    backgroundColor: Theme.colors.background,
    borderColor: Theme.colors.border,
    borderWidth: 1.5,
    borderRadius: Theme.roundness.sm,
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  langSelectorBtnText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  langHighlight: {
    color: Theme.colors.primaryLight,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  infoLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1.5,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
    marginTop: Theme.spacing.md,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: Theme.typography.sizes.md,
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
