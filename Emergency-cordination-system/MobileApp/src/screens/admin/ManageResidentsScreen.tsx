import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import apiClient from '../../api/apiClient';
import { Theme } from '../../theme/theme';

const normalizeRole = (r: any): string => {
  if (!r) return 'Unassigned';
  const str = String(r).trim().toLowerCase();
  if (str.includes('admin')) return 'Admin';
  if (str.includes('sec') || str.includes('guard')) return 'Security';
  if (str.includes('vol')) return 'Volunteer';
  if (str.includes('res')) return 'Resident';
  return 'Unassigned';
};

export const ManageResidentsScreen: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [societies, setSocieties] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('All');

  // Role Assignment Modal
  const [roleModalUser, setRoleModalUser] = useState<any | null>(null);

  // Flat Mapping Modal
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [selectedSocId, setSelectedSocId] = useState('');
  const [residentType, setResidentType] = useState('Owner');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch live user accounts from backend
      const usersRes = await apiClient.get('/users/');
      const rawUsers = usersRes.data || [];

      const formatted = rawUsers.map((u: any) => {
        const rawRoleStr = u.role || (u.roles && u.roles.length > 0 ? u.roles[0] : 'Unassigned');
        return {
          ...u,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email?.split('@')[0] || 'User',
          role: normalizeRole(rawRoleStr),
        };
      });

      setUsers(formatted);

      // 2. Fetch societies & flats
      try {
        const socRes = await apiClient.get('/societies/');
        setSocieties(socRes.data || []);
      } catch {}

      try {
        const flatRes = await apiClient.get('/flats/');
        setFlats(flatRes.data || []);
      } catch {}

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to fetch user accounts. Please verify Admin session.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateRole = async (userId: number, newRole: string) => {
    try {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      await apiClient.put(`/users/${userId}`, { role: newRole });
      Alert.alert('Success', `Role updated to '${newRole}' successfully.`);
      setRoleModalUser(null);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to update role.';
      Alert.alert('Error', msg);
    }
  };

  const handleAssignResidentFlat = async () => {
    const userId = parseInt(selectedUserId, 10);
    const flatId = parseInt(selectedFlatId, 10);
    const socId = parseInt(selectedSocId, 10);

    if (isNaN(userId) || isNaN(flatId) || isNaN(socId)) {
      Alert.alert('Error', 'Please enter valid numerical IDs for User, Society, and Flat.');
      return;
    }

    try {
      await apiClient.post('/resident-profiles/', {
        user_id: userId,
        flat_id: flatId,
        society_id: socId,
        resident_type: residentType,
      });

      Alert.alert('Success', 'Resident mapped to flat successfully.');
      setMapModalVisible(false);
      setSelectedUserId('');
      setSelectedFlatId('');
      setSelectedSocId('');
      loadData();
    } catch (error: any) {
      const errMsg = error?.response?.data?.detail || 'Failed to map resident.';
      Alert.alert('Error', errMsg);
    }
  };

  const filteredUsers = users.filter((u) => filterRole === 'All' || u.role === filterRole);

  const renderUserItem = ({ item }: { item: any }) => {
    const isPlain = item.role === 'Unassigned';

    return (
      <View style={[styles.card, isPlain && styles.plainCard]}>
        <View style={styles.details}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{item.name}</Text>
            <View style={[styles.roleTag, isPlain ? styles.plainTag : styles.activeTag]}>
              <Text style={[styles.roleTagText, isPlain && styles.plainTagText]}>
                {isPlain ? '⏳ Plain (Pending Role)' : item.role}
              </Text>
            </View>
          </View>

          <Text style={styles.subText}>✉️ {item.email}</Text>
          <Text style={styles.subText}>📞 {item.phone || 'No phone'}</Text>
        </View>

        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => setRoleModalUser(item)}
        >
          <Text style={styles.assignButtonText}>Assign Role</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Resident & Role Governance</Text>
          <Text style={styles.subtitle}>Assign roles to plain unassigned accounts</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setMapModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Map Flat</Text>
        </TouchableOpacity>
      </View>

      {/* Role Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['All', 'Unassigned', 'Resident', 'Security', 'Volunteer', 'Admin'].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterChip, filterRole === r && styles.activeFilterChip]}
            onPress={() => setFilterRole(r)}
          >
            <Text style={[styles.filterChipText, filterRole === r && styles.activeFilterChipText]}>
              {r === 'Unassigned' ? 'Plain / Pending' : r} ({users.filter((u) => r === 'All' || u.role === r).length})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No user accounts found under '{filterRole}'.</Text>
          }
        />
      )}

      {/* Role Assignment Modal */}
      {roleModalUser && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Assign Role to {roleModalUser.name}</Text>
              <Text style={styles.subtitle}>Select role to assign to {roleModalUser.email}:</Text>

              <View style={styles.roleOptionsGrid}>
                {[
                  { role: 'Resident', label: '🏠 Resident', color: '#4F46E5' },
                  { role: 'Security', label: '🛡️ Security Guard', color: '#EF4444' },
                  { role: 'Volunteer', label: '🤝 Volunteer', color: '#10B981' },
                  { role: 'Admin', label: '📊 Admin', color: '#F59E0B' },
                  { role: 'Unassigned', label: '❓ Plain (Unassigned)', color: '#64748B' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.role}
                    style={[
                      styles.roleOptionBtn,
                      roleModalUser.role === opt.role && { borderColor: opt.color, backgroundColor: `${opt.color}15` },
                    ]}
                    onPress={() => handleUpdateRole(roleModalUser.id, opt.role)}
                  >
                    <Text style={{ fontSize: 16, marginRight: 8 }}>{opt.label.split(' ')[0]}</Text>
                    <Text style={[styles.roleOptionText, { color: opt.color }]}>{opt.label.slice(2)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setRoleModalUser(null)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Flat Mapping Modal */}
      <Modal visible={mapModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Map User to Society Flat</Text>

            <ScrollView style={{ maxHeight: 350 }}>
              <Text style={styles.label}>User ID *</Text>
              <TextInput
                style={styles.input}
                value={selectedUserId}
                onChangeText={setSelectedUserId}
                keyboardType="number-pad"
                placeholder="e.g. 2"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.label}>Society ID *</Text>
              <TextInput
                style={styles.input}
                value={selectedSocId}
                onChangeText={setSelectedSocId}
                keyboardType="number-pad"
                placeholder="e.g. 1"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.label}>Flat ID *</Text>
              <TextInput
                style={styles.input}
                value={selectedFlatId}
                onChangeText={setSelectedFlatId}
                keyboardType="number-pad"
                placeholder="e.g. 1"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.label}>Resident Ownership *</Text>
              <View style={styles.typeRow}>
                {['Owner', 'Tenant', 'Family'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeButton, residentType === t && styles.activeTypeButton]}
                    onPress={() => setResidentType(t)}
                  >
                    <Text style={[styles.typeBtnText, residentType === t && styles.activeTypeBtnText]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setMapModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAssignResidentFlat}>
                <Text style={styles.modalSaveText}>Assign Flat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  title: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
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
    fontWeight: 'bold',
    fontSize: 12,
  },
  filterScroll: {
    maxHeight: 40,
    marginBottom: Theme.spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 6,
    backgroundColor: '#0F172A',
  },
  activeFilterChip: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    marginBottom: Theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  plainCard: {
    borderColor: '#F59E0B',
    backgroundColor: '#1E1B11',
  },
  details: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  nameText: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
  },
  roleTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  plainTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  activeTag: {},
  roleTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Theme.colors.primaryLight,
  },
  plainTagText: {
    color: '#F59E0B',
  },
  subText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  assignButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Theme.roundness.sm,
  },
  assignButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Theme.spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleOptionsGrid: {
    marginVertical: Theme.spacing.md,
  },
  roleOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
    backgroundColor: '#0F172A',
  },
  roleOptionText: {
    fontWeight: '700',
    fontSize: 13,
  },
  modalCloseBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCloseText: {
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  label: {
    color: Theme.colors.text,
    fontSize: 12,
    marginTop: Theme.spacing.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Theme.colors.surfaceLight,
    color: Theme.colors.text,
    borderRadius: Theme.roundness.sm,
    padding: Theme.spacing.sm,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#384252',
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: Theme.spacing.md,
  },
  typeButton: {
    backgroundColor: Theme.colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#384252',
  },
  activeTypeButton: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  typeBtnText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeTypeBtnText: {
    color: '#FFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Theme.spacing.md,
  },
  modalCancel: {
    marginRight: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
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
});
