import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Theme } from '../../theme/theme';
import apiClient from '../../api/apiClient';

interface VolunteerEmergencyRequestProps {
  route?: any;
  navigation?: any;
}

export const VolunteerEmergencyRequestScreen: React.FC<VolunteerEmergencyRequestProps> = ({ route, navigation }) => {
  const incidentId = route?.params?.incidentId || 123;
  const emergencyType = route?.params?.emergencyType || 'Medical Emergency';
  const locationText = route?.params?.locationText || 'Block A - Flat 101';
  const residentName = route?.params?.residentName || 'Mary';

  const [loading, setLoading] = useState<boolean>(false);

  const handleAcceptRequest = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/api/incidents/${incidentId}/accept/`);
      if (response.data?.success) {
        Alert.alert(
          'Request Accepted',
          `You have accepted emergency request #${incidentId}.`,
          [
            {
              text: 'View Assigned Responder Status',
              onPress: () =>
                navigation?.navigate('AssignedResponder', {
                  incidentId,
                  assignedTo: 'John (Volunteer)',
                  status: 'Response In Progress',
                }),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Assignment Blocked',
        error.response?.data?.detail || 'This request has already been accepted by another responder.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/api/incidents/${incidentId}/reject/`);
      Alert.alert('Declined', 'Emergency request declined.');
      navigation?.goBack();
    } catch {
      navigation?.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenHeader}>Volunteer Dispatch Alert</Text>

      <View style={styles.card}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{emergencyType}</Text>
          <Text style={styles.liveBadge}>LIVE ALERT</Text>
        </View>

        <Text style={styles.locationText}>{locationText}</Text>
        <Text style={styles.residentText}>Resident: {residentName}</Text>

        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator color={Theme.colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptRequest}>
              <Text style={styles.acceptButtonText}>[ ACCEPT REQUEST ]</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
              <Text style={styles.declineButtonText}>[ DECLINE ]</Text>
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
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 18,
    padding: 22,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  liveBadge: {
    backgroundColor: '#EF4444',
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 6,
  },
  residentText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
