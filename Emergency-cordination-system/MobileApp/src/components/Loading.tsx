import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { Theme } from '../theme/theme';

interface LoadingProps {
  visible?: boolean;
  message?: string;
  overlay?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  visible = true,
  message = 'Processing...',
  overlay = false,
}) => {
  if (!visible) return null;

  const content = (
    <View style={overlay ? styles.overlayContainer : styles.inlineContainer}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        {message ? <Text style={styles.messageText}>{message}</Text> : null}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent animationType="fade" visible={visible}>
        {content}
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  inlineContainer: {
    padding: Theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Theme.colors.surface,
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  messageText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    marginTop: Theme.spacing.md,
    textAlign: 'center',
  },
});
