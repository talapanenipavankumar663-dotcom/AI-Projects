import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Theme } from '../../theme/theme';
import apiClient from '../../api/apiClient';

export const VolunteerAvailabilityScreen = () => {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/volunteers/availability/');
      if (response.data) {
        setIsAvailable(response.data.is_available);
      }
    } catch (error) {
      console.log('Error fetching volunteer availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetAvailability = async (available: boolean) => {
    setUpdating(true);
    try {
      const response = await apiClient.post('/api/volunteers/availability/', {
        is_available: available,
      });
      if (response.data) {
        setIsAvailable(response.data.is_available);
        Alert.alert(
          'Status Updated',
          `Your volunteer status is now set to ${available ? 'ONLINE (Available)' : 'OFFLINE (Unavailable)'}.`
        );
      }
    } catch {
      Alert.alert('Update Failed', 'Failed to update volunteer availability status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Volunteer Availability</Text>
      <Text style={styles.headerSubtitle}>
        Manage whether you are ready to receive real-time emergency broadcast requests.
      </Text>

      {/* Current Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>
        {loading ? (
          <ActivityIndicator color={Theme.colors.primary} style={{ marginVertical: 10 }} />
        ) : (
          <View style={[styles.badge, isAvailable ? styles.onlineBadge : styles.offlineBadge]}>
            <View style={[styles.dot, isAvailable ? styles.onlineDot : styles.offlineDot]} />
            <Text style={[styles.badgeText, isAvailable ? styles.onlineText : styles.offlineText]}>
              {isAvailable ? 'ONLINE (AVAILABLE)' : 'OFFLINE (UNAVAILABLE)'}
            </Text>
          </View>
        )}
      </View>

      {/* ONLINE / OFFLINE Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.onlineButton,
            isAvailable && styles.activeOnlineButton,
            updating && { opacity: 0.7 },
          ]}
          onPress={() => handleSetAvailability(true)}
          disabled={updating}
        >
          <Text style={styles.buttonIcon}>🟢</Text>
          <Text style={styles.onlineButtonText}>[ ONLINE ]</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.offlineButton,
            !isAvailable && styles.activeOfflineButton,
            updating && { opacity: 0.7 },
          ]}
          onPress={() => handleSetAvailability(false)}
          disabled={updating}
        >
          <Text style={styles.buttonIcon}>🔴</Text>
          <Text style={styles.offlineButtonText}>[ OFFLINE ]</Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ How Volunteer Availability Works</Text>
        <Text style={styles.infoText}>
          • When set to <Text style={{ fontWeight: 'bold', color: '#10B981' }}>ONLINE</Text>, you will receive priority alerts for nearby Medical, Fire, and Security emergencies.
        </Text>
        <Text style={styles.infoText}>
          • When set to <Text style={{ fontWeight: 'bold', color: '#EF4444' }}>OFFLINE</Text>, emergency dispatch notifications will be silenced for your account.
        </Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  onlineBadge: {
    backgroundColor: '#064E3B',
  },
  offlineBadge: {
    backgroundColor: '#7F1D1D',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  onlineDot: {
    backgroundColor: '#34D399',
  },
  offlineDot: {
    backgroundColor: '#FCA5A5',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  onlineText: {
    color: '#34D399',
  },
  offlineText: {
    color: '#FCA5A5',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 2,
  },
  onlineButton: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  activeOnlineButton: {
    backgroundColor: '#10B981',
  },
  offlineButton: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  activeOfflineButton: {
    backgroundColor: '#EF4444',
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  onlineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  offlineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  infoBox: {
    backgroundColor: Theme.colors.surface,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
});
