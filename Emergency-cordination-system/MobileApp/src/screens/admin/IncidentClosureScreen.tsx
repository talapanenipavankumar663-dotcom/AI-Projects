import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Theme } from '../../theme/theme';
import apiClient from '../../api/apiClient';

interface IncidentClosureProps {
  route?: any;
  navigation?: any;
}

export const IncidentClosureScreen: React.FC<IncidentClosureProps> = ({ route, navigation }) => {
  const incidentId = route?.params?.incidentId || 101;
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleCloseIncident = async () => {
    if (!resolutionSummary.trim()) {
      Alert.alert('Required Field', 'Please enter a resolution summary before closing the incident.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post(`/api/incidents/${incidentId}/close/`, {
        resolution_summary: resolutionSummary.trim(),
        remarks: remarks.trim() || undefined,
      });

      if (response.data?.success) {
        Alert.alert(
          'Incident Closed',
          `Incident #${incidentId} has been successfully closed and documented.`,
          [
            {
              text: 'OK',
              onPress: () => navigation?.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Closure Failed', error.response?.data?.detail || 'Failed to close incident.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.screenHeader}>Incident Closure & Documentation</Text>
      <Text style={styles.subHeader}>Incident #{incidentId}</Text>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>RESOLUTION SUMMARY *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="e.g. First aid administered on site. Resident safely resting."
          placeholderTextColor="#64748B"
          multiline
          numberOfLines={4}
          value={resolutionSummary}
          onChangeText={setResolutionSummary}
        />

        <Text style={styles.inputLabel}>OPTIONAL REMARKS / NOTES</Text>
        <TextInput
          style={styles.textAreaSmall}
          placeholder="e.g. No further police or hospital escalation required."
          placeholderTextColor="#64748B"
          multiline
          numberOfLines={2}
          value={remarks}
          onChangeText={setRemarks}
        />

        {loading ? (
          <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseIncident}>
            <Text style={styles.closeButtonText}>🔒 [ CLOSE INCIDENT ]</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: 20,
  },
  screenHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  subHeader: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 20,
    marginTop: 4,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  textArea: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    color: Theme.colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
    height: 110,
    marginBottom: 18,
  },
  textAreaSmall: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    color: Theme.colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
    height: 75,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
