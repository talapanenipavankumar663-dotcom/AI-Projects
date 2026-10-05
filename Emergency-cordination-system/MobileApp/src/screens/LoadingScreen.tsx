import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Theme } from '../theme/theme';

export const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.logoIcon}>🛡️</Text>
      </View>
      <Text style={styles.title}>Emergency Network</Text>
      <Text style={styles.subtitle}>Securing Community Coordination</Text>
      <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 48,
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: Theme.typography.weights.bold,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
    marginBottom: Theme.spacing.xl,
  },
  spinner: {
    marginTop: Theme.spacing.lg,
  },
});
