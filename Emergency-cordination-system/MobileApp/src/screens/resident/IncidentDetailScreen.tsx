import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import apiClient from '../../api/apiClient';
import { Theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';

export const IncidentDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { incidentId } = route.params;
  const { role } = useAuth();
  const [incident, setIncident] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidentDetails = useCallback(async () => {
    try {
      const isPrivileged = role === 'Admin' || role === 'Security';
      const endpoint = isPrivileged ? `/api/incidents/${incidentId}/` : `/sos/${incidentId}`;
      const response = await apiClient.get(endpoint);
      setIncident(response.data);

      // Fetch Timeline
      try {
        const timelineRes = await apiClient.get(`/api/incidents/${incidentId}/timeline/`);
        setTimeline(timelineRes.data || []);
      } catch (err) {
        console.log('Timeline fetch notice:', err);
      }
    } catch (error) {
      console.error('Error fetching incident details:', error);
    } finally {
      setLoading(false);
    }
  }, [incidentId, role]);

  useEffect(() => {
    fetchIncidentDetails();
    const interval = setInterval(fetchIncidentDetails, 10000);
    return () => clearInterval(interval);
  }, [fetchIncidentDetails]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (!incident) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Incident details could not be retrieved.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const incidentLat = incident.latitude || 40.7128;
  const incidentLng = incident.longitude || -74.0060;

  return (
    <ScrollView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: incidentLat,
            longitude: incidentLng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <Marker
            coordinate={{ latitude: incidentLat, longitude: incidentLng }}
            title={`SOS: ${incident.emergency_type}`}
            description={incident.emergency_message || 'Emergency signal'}
            pinColor="red"
          />
        </MapView>
      </View>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        <View style={styles.headerRow}>
          <Text style={styles.emergencyType}>{incident.emergency_type}</Text>
          <View
            style={[
              styles.statusBadge,
              incident.status === 'Open' && { backgroundColor: Theme.colors.emergencyCritical },
              incident.status === 'Assigned' && { backgroundColor: Theme.colors.emergencyWarning },
              incident.status === 'In Progress' && { backgroundColor: '#38BDF8' },
              incident.status === 'Resolved' && { backgroundColor: Theme.colors.success },
              incident.status === 'Closed' && { backgroundColor: '#64748B' },
            ]}
          >
            <Text style={styles.statusText}>{incident.status}</Text>
          </View>
        </View>

        <Text style={styles.label}>Resident & Location</Text>
        <Text style={styles.infoText}>
          {incident.resident ? `${incident.resident.first_name} ${incident.resident.last_name}` : 'Resident'}
        </Text>
        <Text style={styles.infoSubtext}>
          📍 {incident.society}, Block {incident.block}, Flat {incident.flat_no}
        </Text>

        {incident.emergency_message && (
          <>
            <Text style={styles.label}>Emergency Message</Text>
            <Text style={styles.infoText}>"{incident.emergency_message}"</Text>
          </>
        )}

        {/* Assigned Responder */}
        {incident.assigned_responder && (
          <View style={styles.responderContainer}>
            <Text style={styles.label}>Assigned Responder</Text>
            <Text style={styles.responderText}>
              👤 {incident.assigned_responder.first_name} {incident.assigned_responder.last_name} ({incident.assigned_responder_role || 'Responder'})
            </Text>
            <Text style={styles.responderText}>📞 {incident.assigned_responder.phone}</Text>
          </View>
        )}

        {/* Closure Documentation (If Closed) */}
        {incident.status === 'Closed' && incident.resolution_summary && (
          <View style={styles.closureBox}>
            <Text style={styles.closureTitle}>📋 Incident Closure Documentation</Text>
            <Text style={styles.closureText}><Text style={{ fontWeight: 'bold' }}>Resolution Summary:</Text> {incident.resolution_summary}</Text>
            {incident.remarks && <Text style={styles.closureText}><Text style={{ fontWeight: 'bold' }}>Remarks:</Text> {incident.remarks}</Text>}
            <Text style={styles.closureText}><Text style={{ fontWeight: 'bold' }}>Closed By:</Text> {incident.closed_by_name || 'Admin'}</Text>
          </View>
        )}

        {/* Incident Timeline */}
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionHeaderTitle}>🕒 Incident Timeline Feed</Text>

          {timeline && timeline.length > 0 ? (
            timeline.map((event: any, index: number) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineAction}>{event.action}</Text>
                  <Text style={styles.timelineMeta}>
                    By {event.performed_by} • {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: Theme.colors.textSecondary, fontSize: 13 }}>Timeline logging active...</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          {/* Responder Status Update Button */}
          {incident.status !== 'Closed' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('ResponderStatusUpdate', { incidentId, currentStatus: incident.status })}
            >
              <Text style={styles.buttonText}>⚡ Update Responder Status</Text>
            </TouchableOpacity>
          )}

          {/* Security / Admin Close Button */}
          {(role === 'Admin' || role === 'Security') && incident.status !== 'Closed' && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.navigate('IncidentClosure', { incidentId })}
            >
              <Text style={styles.buttonText}>🔒 Close Incident & Document Summary</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.lg,
  },
  errorText: {
    color: Theme.colors.emergencyCritical,
    fontSize: Theme.typography.sizes.md,
    marginBottom: Theme.spacing.md,
  },
  mapContainer: {
    height: 240,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  detailsCard: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.roundness.lg,
    borderTopRightRadius: Theme.roundness.lg,
    marginTop: -20,
    padding: Theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  emergencyType: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  label: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium,
    textTransform: 'uppercase',
    marginTop: Theme.spacing.md,
    marginBottom: 4,
  },
  infoText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  infoSubtext: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
    marginTop: 2,
  },
  responderContainer: {
    marginTop: Theme.spacing.md,
    padding: Theme.spacing.md,
    backgroundColor: '#0F172A',
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  responderText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    marginBottom: 4,
  },
  closureBox: {
    marginTop: Theme.spacing.md,
    padding: Theme.spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  closureTitle: {
    color: '#EF4444',
    fontSize: Theme.typography.sizes.sm,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  closureText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    marginBottom: 4,
  },
  timelineContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
    marginTop: 5,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineAction: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  timelineMeta: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  actionContainer: {
    marginTop: Theme.spacing.xl,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.roundness.sm,
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  closeButton: {
    backgroundColor: '#EF4444',
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.roundness.sm,
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  backButton: {
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.md,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: Theme.typography.weights.bold,
    fontSize: Theme.typography.sizes.md,
  },
});
