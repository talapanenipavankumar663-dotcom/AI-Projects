import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Theme } from '../../theme/theme';

interface AssignedResponderScreenProps {
  route?: any;
  navigation?: any;
}

export const AssignedResponderScreen: React.FC<AssignedResponderScreenProps> = ({ route, navigation }) => {
  const incidentId = route?.params?.incidentId || 123;
  const assignedTo = route?.params?.assignedTo || 'John (Volunteer)';
  const status = route?.params?.status || 'Response In Progress';
  const locationText = route?.params?.locationText || 'Block A - Flat 101';

  return (
    <View style={styles.container}>
      <Text style={styles.screenHeader}>Responder Assignment Dispatch</Text>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.incidentTitle}>Incident #{incidentId}</Text>
          <Text style={styles.activePill}>ACTIVE DISPATCH</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Assigned To:</Text>
          <Text style={styles.assignedName}>{assignedTo}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Status:</Text>
          <View style={styles.statusBadgeContainer}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Target Location:</Text>
          <Text style={styles.value}>{locationText}</Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => Alert.alert('Navigating', `Starting GPS guidance to ${locationText}`)}
        >
          <Text style={styles.primaryButtonText}>📍 Open Location Directions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Alert.alert('Contact Resident', 'Calling resident phone number...')}
        >
          <Text style={styles.secondaryButtonText}>📞 Call Resident</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resolveButton}
          onPress={() => {
            Alert.alert('Resolve Incident', 'Mark emergency as successfully resolved?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Confirm Resolve', onPress: () => navigation?.goBack() },
            ]);
          }}
        >
          <Text style={styles.resolveButtonText}>✅ Mark Emergency Resolved</Text>
        </TouchableOpacity>
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
    padding: 20,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  incidentTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  activePill: {
    backgroundColor: '#064E3B',
    color: '#34D399',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
  },
  assignedName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  statusBadgeContainer: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    color: '#92400E',
    fontWeight: 'bold',
    fontSize: 13,
  },
  value: {
    fontSize: 15,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 18,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: Theme.colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  resolveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resolveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
