import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import apiClient from '../../api/apiClient';
import { Theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const EmergencyContactsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    try {
      let data = [];
      try {
        const res = await apiClient.get('/contacts');
        data = res.data;
      } catch {
        const res = await apiClient.get('/emergency-contacts/');
        data = res.data;
      }
      const myContacts = data.filter((c: any) => (c.user_id || c.resident_id) === user?.id || !c.resident_id);
      setContacts(myContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [fetchContacts])
  );

  const handleDeleteContact = async (contactId: number) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/contacts/${contactId}`);
            } catch {
              await apiClient.delete(`/emergency-contacts/${contactId}`);
            }
            Alert.alert('Deleted', 'Contact deleted successfully.');
            fetchContacts();
          },
        },
      ]
    );
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() =>
      Alert.alert('Error', 'Calling is not supported on this device.')
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardDetails}>
        <View style={styles.nameRow}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.priorityBadge}>
            {item.priority === 1 ? 'Priority 1 (Primary)' : item.priority === 2 ? 'Priority 2 (Secondary)' : `Priority ${item.priority}`}
          </Text>
        </View>
        <Text style={styles.relationText}>
          {item.relationship} • {item.phone}
        </Text>
        {item.email && <Text style={styles.emailText}>{item.email}</Text>}
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Verification:</Text>
          <Text
            style={[
              styles.statusText,
              item.is_verified ? { color: Theme.colors.success } : { color: Theme.colors.emergencyMedium },
            ]}
          >
            {item.is_verified ? '✓ Verified (Will be notified on SOS)' : '⚠ Pending Verification'}
          </Text>
        </View>
      </View>

      <View style={styles.actionColumn}>
        <TouchableOpacity style={styles.callButton} onPress={() => handleCall(item.phone)}>
          <Text style={styles.callButtonText}>📞 Call</Text>
        </TouchableOpacity>
        
        {!item.is_verified && (
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() =>
              navigation.navigate('OtpVerification', {
                contactId: item.id,
                phoneNumber: item.phone_number || item.phone,
                contactName: item.name,
                relationship: item.relationship,
              })
            }
          >
            <Text style={styles.verifyButtonText}>Verify</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteContact(item.id)}
        >
          <Text style={styles.deleteButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{t('contactsTitle')}</Text>
          <Text style={styles.subtitle}>These contacts are notified when you raise SOS</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddContact')}
        >
          <Text style={styles.addButtonText}>+ {t('addContact')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={contacts.sort((a, b) => a.priority - b.priority)}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
            </View>
          }
        />
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
  },
  addButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.roundness.sm,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: Theme.typography.weights.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: Theme.spacing.xl,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    marginBottom: Theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardDetails: {
    flex: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold,
    marginRight: Theme.spacing.sm,
  },
  priorityBadge: {
    backgroundColor: Theme.colors.surfaceLight,
    color: Theme.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  relationText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
  },
  emailText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.xs,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  statusLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionColumn: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  callButton: {
    backgroundColor: Theme.colors.success,
    paddingVertical: 4,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.roundness.sm,
    marginBottom: 4,
    width: '100%',
    alignItems: 'center',
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  verifyButton: {
    backgroundColor: Theme.colors.emergencyMedium,
    paddingVertical: 4,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.roundness.sm,
    marginBottom: 4,
    width: '100%',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.roundness.sm,
    width: '100%',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: Theme.colors.emergencyCritical,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyText: {
    color: Theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.lg,
    width: '100%',
    borderColor: '#384252',
    borderWidth: 1,
  },
  modalTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    marginBottom: Theme.spacing.md,
  },
  inputLabel: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.xs,
    marginTop: Theme.spacing.sm,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: Theme.colors.surfaceLight,
    color: Theme.colors.text,
    borderRadius: Theme.roundness.sm,
    padding: Theme.spacing.sm,
    fontSize: Theme.typography.sizes.sm,
    borderWidth: 1,
    borderColor: '#384252',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Theme.spacing.lg,
  },
  modalCancel: {
    marginRight: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
  },
  modalCancelText: {
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  modalSave: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.sm,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  otpDescription: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
    marginBottom: Theme.spacing.md,
  },
  mockOtpText: {
    color: Theme.colors.emergencyMedium,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: 'bold',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    padding: Theme.spacing.sm,
    borderRadius: Theme.roundness.sm,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    paddingVertical: Theme.spacing.md,
  },
});
