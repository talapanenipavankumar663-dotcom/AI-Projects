import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Theme } from '../../theme/theme';
import apiClient from '../../api/apiClient';

interface GuardianEscalationProps {
  route?: any;
  navigation?: any;
}

export const GuardianEscalationScreen: React.FC<GuardianEscalationProps> = ({ route, navigation }) => {
  const incidentId = route?.params?.incidentId || 101;
  const residentName = route?.params?.residentName || 'Mary';
  const emergencyType = route?.params?.emergencyType || 'Medical Emergency';
  const locationText = route?.params?.locationText || 'Block A - Flat 101';

  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('Awaiting Response');

  const handleAccept = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/incidents/${incidentId}/accept/`);
      if (response.data?.success) {
        setStatus('Response Assigned');
        Alert.alert(
          'Emergency Accepted',
          `You have accepted the emergency alert for ${residentName}.`,
          [
            {
              text: 'View Responder Screen',
              onPress: () => navigation?.navigate('AssignedResponder', { incidentId, assignedTo: 'Guardian', status: 'Response In Progress' })
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Notice', error.response?.data?.detail || 'Incident has already been responded to.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/api/incidents/${incidentId}/reject/`);
      setStatus('Declined (Escalated)');
      Alert.alert('Alert Declined', 'Emergency request declined. System is escalating to Level 2 response.');
    } catch {
      Alert.alert('Notice', 'Request declined.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenHeader}>Guardian Response Center</Text>

      {/* Emergency Alert Card */}
      <View style={styles.alertCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.alertBadge}>🚨 EMERGENCY ALERT</Text>
          <Text style={styles.statusBadge}>{status}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.label}>Resident Name:</Text>
          <Text style={styles.value}>{residentName}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{emergencyType}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{locationText}</Text>
        </View>

        <View style={styles.rowItem}>
          <Text style={styles.label}>Escalation Level:</Text>
          <Text style={styles.escalationLevel}>Level 1 (Primary Guardian & Security)</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <Text style={styles.acceptText}>[ ACCEPT ]</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
              <Text style={styles.declineText}>[ DECLINE ]</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
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
    marginBottom: 20,
  },
  alertCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertBadge: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  value: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  escalationLevel: {
    color: '#6366F1',
    fontWeight: 'bold',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
