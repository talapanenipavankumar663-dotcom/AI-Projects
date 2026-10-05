import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../../api/apiClient';
import { Theme } from '../../theme/theme';

export const RaiseSOSScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [emergencyType, setEmergencyType] = useState('Medical Emergency');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emergencyTypes = [
    { label: '🩺 Medical Emergency', value: 'Medical Emergency', color: Theme.colors.emergencyCritical },
    { label: '🤕 Fall Accident', value: 'Fall Accident', color: Theme.colors.emergencyWarning },
    { label: '🛡️ Security Threat', value: 'Security Threat', color: Theme.colors.emergencyCritical },
    { label: '🔥 Fire Incident', value: 'Fire', color: Theme.colors.emergencyCritical },
    { label: '❓ Other Emergency', value: 'Other', color: Theme.colors.emergencyMedium },
  ];

  const handleRaiseSOS = async () => {
    setIsSubmitting(true);

    // Mock Location Coordinates for standard local testing
    // In a real device environment we would use Geolocation API
    const latitude = 40.7128 + (Math.random() - 0.5) * 0.01;
    const longitude = -74.0060 + (Math.random() - 0.5) * 0.01;

    try {
      const response = await apiClient.post('/sos/raise', {
        emergency_type: emergencyType,
        emergency_message: message.trim() || undefined,
        latitude,
        longitude,
      });

      const { alert, notified_contacts } = response.data;
      
      let contactsMsg = '';
      if (notified_contacts && notified_contacts.length > 0) {
        contactsMsg = `\n\nNotified Contacts:\n` + 
          notified_contacts.map((c: any) => `• ${c.name} (${c.phone})`).join('\n');
      }

      Alert.alert(
        'SOS ALERT TRIGGERED!',
        `Your emergency signal has been broadcasted to the society security guards, volunteers, and emergency contacts.${contactsMsg}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('IncidentDetail', { incidentId: alert.id });
            },
          },
        ]
      );
    } catch (error: any) {
      const errMsg = error?.response?.data?.detail || 'Failed to raise SOS alert. Please try again.';
      Alert.alert('SOS Trigger Failed', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>🚨 Raise SOS Alert</Text>
      <Text style={styles.subtitle}>
        Select the emergency category. Your location details and flat mapping will be attached.
      </Text>

      {/* Select Type */}
      <Text style={styles.label}>Emergency Category</Text>
      <View style={styles.typeContainer}>
        {emergencyTypes.map((type) => {
          const isSelected = emergencyType === type.value;
          return (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                isSelected && { borderColor: type.color, backgroundColor: Theme.colors.surfaceLight },
              ]}
              onPress={() => setEmergencyType(type.value)}
            >
              <Text style={[styles.typeText, isSelected && { color: type.color, fontWeight: 'bold' }]}>
                {type.label}
              </Text>
              {isSelected && <Text style={[styles.selectedCheck, { color: type.color }]}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Message */}
      <Text style={styles.label}>Additional Details (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe the situation (e.g., 'Grandfather fell down in kitchen')"
        placeholderTextColor={Theme.colors.textSecondary}
        multiline
        numberOfLines={4}
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity
        style={[styles.sosButton, isSubmitting && styles.disabledButton]}
        onPress={handleRaiseSOS}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.sosButtonText}>ACTIVATE EMERGENCY SIGNAL</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={isSubmitting}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
    lineHeight: 20,
  },
  label: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  typeContainer: {
    marginBottom: Theme.spacing.md,
  },
  typeCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: '#384252',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  typeText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.md,
  },
  selectedCheck: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: Theme.colors.surface,
    color: Theme.colors.text,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    fontSize: Theme.typography.sizes.md,
    borderWidth: 1,
    borderColor: '#384252',
    textAlignVertical: 'top',
    height: 100,
    marginBottom: Theme.spacing.xl,
  },
  sosButton: {
    backgroundColor: Theme.colors.emergencyCritical,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    shadowColor: Theme.colors.emergencyCritical,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: Theme.colors.textSecondary,
  },
  sosButtonText: {
    color: '#FFF',
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold,
  },
  cancelButton: {
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  cancelButtonText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
  },
});
