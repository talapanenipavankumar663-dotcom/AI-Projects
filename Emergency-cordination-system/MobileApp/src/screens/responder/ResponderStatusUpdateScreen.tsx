import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Theme } from '../../theme/theme';
import apiClient from '../../api/apiClient';

interface ResponderStatusUpdateProps {
  route?: any;
  navigation?: any;
}

export const ResponderStatusUpdateScreen: React.FC<ResponderStatusUpdateProps> = ({ route, navigation }) => {
  const incidentId = route?.params?.incidentId || 101;
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<string>(route?.params?.currentStatus || 'Assigned');

  const updateStatus = async (statusValue: string) => {
    setLoading(true);
    try {
      const response = await apiClient.patch(`/api/incidents/${incidentId}/status/`, {
        status: statusValue,
      });
      if (response.data) {
        setCurrentStatus(statusValue);
        Alert.alert('Status Updated', `Incident #${incidentId} status is now: ${statusValue}`);
        if (statusValue === 'Resolved') {
          navigation?.goBack();
        }
      }
    } catch (error: any) {
      Alert.alert('Update Failed', error.response?.data?.detail || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenHeader}>Responder Status Progress</Text>
      <Text style={styles.subHeader}>Incident #{incidentId} • Current: {currentStatus}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select Progress Milestone:</Text>

        {loading ? (
          <ActivityIndicator color={Theme.colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.buttonStack}>
            {/* REACHED LOCATION */}
            <TouchableOpacity
              style={[
                styles.statusButton,
                styles.reachedButton,
                currentStatus === 'Reached Location' && styles.activeButton,
              ]}
              onPress={() => updateStatus('Reached Location')}
            >
              <Text style={styles.buttonIcon}>📍</Text>
              <Text style={styles.buttonText}>[ Reached Location ]</Text>
            </TouchableOpacity>

            {/* ASSISTANCE STARTED */}
            <TouchableOpacity
              style={[
                styles.statusButton,
                styles.startedButton,
                currentStatus === 'Assistance Started' && styles.activeButton,
              ]}
              onPress={() => updateStatus('Assistance Started')}
            >
              <Text style={styles.buttonIcon}>⚡</Text>
              <Text style={styles.buttonText}>[ Assistance Started ]</Text>
            </TouchableOpacity>

            {/* RESOLVED */}
            <TouchableOpacity
              style={[
                styles.statusButton,
                styles.resolvedButton,
                currentStatus === 'Resolved' && styles.activeButton,
              ]}
              onPress={() => updateStatus('Resolved')}
            >
              <Text style={styles.buttonIcon}>✅</Text>
              <Text style={styles.buttonText}>[ Resolved ]</Text>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 16,
  },
  buttonStack: {
    gap: 14,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
  },
  reachedButton: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  startedButton: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  resolvedButton: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  activeButton: {
    borderWidth: 3,
    shadowColor: '#FFF',
    elevation: 4,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
});
