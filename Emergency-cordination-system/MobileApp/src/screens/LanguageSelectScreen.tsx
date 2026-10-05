import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLanguage, AVAILABLE_LANGUAGES, Language } from '../context/LanguageContext';
import { Theme } from '../theme/theme';

export const LanguageSelectScreen: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🌐</Text>
        <Text style={styles.title}>{t('languageTitle')}</Text>
        <Text style={styles.subtitle}>{t('languageSubtitle')}</Text>
      </View>

      {/* Language Options Grid */}
      <View style={styles.langList}>
        {AVAILABLE_LANGUAGES.map((langItem) => {
          const isSelected = language === langItem.code;
          return (
            <TouchableOpacity
              key={langItem.code}
              style={[styles.langCard, isSelected && styles.langCardSelected]}
              onPress={() => setLanguage(langItem.code as Language)}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.flagIcon}>{langItem.flag}</Text>
                <View style={styles.textContainer}>
                  <Text style={[styles.langName, isSelected && styles.langNameSelected]}>
                    {langItem.nativeLabel}
                  </Text>
                  <Text style={styles.langSub}>{langItem.label}</Text>
                </View>
              </View>

              {/* Selection Checkmark Badge */}
              <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                {isSelected && <Text style={styles.checkmarkText}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active Language Status Banner */}
      <View style={styles.statusFooter}>
        <Text style={styles.statusText}>
          Active Language: <Text style={styles.statusHighlight}>{AVAILABLE_LANGUAGES.find(l => l.code === language)?.nativeLabel}</Text>
        </Text>
      </View>
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
  header: {
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: Theme.spacing.xs,
  },
  title: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  langList: {
    gap: 12,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  langCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flagIcon: {
    fontSize: 32,
  },
  textContainer: {
    justifyContent: 'center',
  },
  langName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  langNameSelected: {
    color: Theme.colors.primaryLight,
  },
  langSub: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  statusFooter: {
    marginTop: Theme.spacing.xl,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
  },
  statusText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
  },
  statusHighlight: {
    color: Theme.colors.primaryLight,
    fontWeight: '700',
  },
});
