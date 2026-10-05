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

export const ManageSocietiesScreen: React.FC<{ navigation: any }> = () => {
  const [societies, setSocieties] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Societies' | 'Blocks' | 'Flats'>('Societies');

  // Creation state
  const [modalVisible, setModalVisible] = useState(false);
  const [socName, setSocName] = useState('');
  const [socAddress, setSocAddress] = useState('');
  const [socCity, setSocCity] = useState('');
  const [socState, setSocState] = useState('');
  const [socPincode, setSocPincode] = useState('');

  const [blockName, setBlockName] = useState('');
  const [blockDesc, setBlockDesc] = useState('');
  const [blockSocId, setBlockSocId] = useState('');

  const [flatNumber, setFlatNumber] = useState('');
  const [flatFloor, setFlatFloor] = useState('');
  const [flatBlockId, setFlatBlockId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const socRes = await apiClient.get('/societies/');
      setSocieties(socRes.data);

      const blockRes = await apiClient.get('/blocks/');
      setBlocks(blockRes.data);

      const flatRes = await apiClient.get('/flats/');
      setFlats(flatRes.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load society records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSociety = async () => {
    if (!socName.trim() || !socAddress.trim() || !socCity.trim() || !socState.trim() || !socPincode.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    try {
      await apiClient.post('/societies/', {
        society_name: socName.trim(),
        address: socAddress.trim(),
        city: socCity.trim(),
        state: socState.trim(),
        pincode: socPincode.trim(),
      });
      Alert.alert('Success', 'Society created successfully.');
      setModalVisible(false);
      loadData();
    } catch {
      Alert.alert('Error', 'Failed to create society.');
    }
  };

  const handleCreateBlock = async () => {
    const socId = parseInt(blockSocId, 10);
    if (!blockName.trim() || isNaN(socId)) {
      Alert.alert('Error', 'Please enter block name and select a society.');
      return;
    }
    try {
      await apiClient.post('/blocks/', {
        society_id: socId,
        block_name: blockName.trim(),
        description: blockDesc.trim() || 'No description',
      });
      Alert.alert('Success', 'Block created successfully.');
      setModalVisible(false);
      loadData();
    } catch {
      Alert.alert('Error', 'Failed to create block.');
    }
  };

  const handleCreateFlat = async () => {
    const blockId = parseInt(flatBlockId, 10);
    const floor = parseInt(flatFloor, 10);
    if (!flatNumber.trim() || isNaN(blockId) || isNaN(floor)) {
      Alert.alert('Error', 'Please enter flat number, floor, and block.');
      return;
    }
    try {
      await apiClient.post('/flats/', {
        block_id: blockId,
        flat_number: flatNumber.trim(),
        floor_number: floor,
      });
      Alert.alert('Success', 'Flat created successfully.');
      setModalVisible(false);
      loadData();
    } catch {
      Alert.alert('Error', 'Failed to create flat.');
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'Societies') {
      return (
        <FlatList
          data={societies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.itemTitle}>{item.society_name}</Text>
              <Text style={styles.itemSubtitle}>
                📍 {item.address}, {item.city}, {item.state} - {item.pincode}
              </Text>
              <Text style={styles.itemTag}>Status: {item.status}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No societies registered.</Text>}
        />
      );
    } else if (activeTab === 'Blocks') {
      return (
        <FlatList
          data={blocks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const soc = societies.find((s) => s.id === item.society_id);
            return (
              <View style={styles.listItem}>
                <Text style={styles.itemTitle}>{item.block_name}</Text>
                <Text style={styles.itemSubtitle}>
                  Society: {soc?.society_name || `ID ${item.society_id}`}
                </Text>
                <Text style={styles.itemSubtitle}>Desc: {item.description}</Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No blocks registered.</Text>}
        />
      );
    } else {
      return (
        <FlatList
          data={flats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const block = blocks.find((b) => b.id === item.block_id);
            return (
              <View style={styles.listItem}>
                <Text style={styles.itemTitle}>Flat {item.flat_number}</Text>
                <Text style={styles.itemSubtitle}>Floor: {item.floor_number}</Text>
                <Text style={styles.itemSubtitle}>
                  Block: {block?.block_name || `ID ${item.block_id}`}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No flats registered.</Text>}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Society Management</Text>
          <Text style={styles.subtitle}>Configure societies, blocks, and flats</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(['Societies', 'Blocks', 'Flats'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.spinner} />
      ) : (
        renderTabContent()
      )}

      {/* Creation Modals */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New {activeTab.slice(0, -1)}</Text>
            
            <ScrollView>
              {activeTab === 'Societies' && (
                <>
                  <Text style={styles.fieldLabel}>Society Name</Text>
                  <TextInput style={styles.input} value={socName} onChangeText={setSocName} placeholder="e.g. Garden Heights" placeholderTextColor="#64748B" />
                  <Text style={styles.fieldLabel}>Address</Text>
                  <TextInput style={styles.input} value={socAddress} onChangeText={setSocAddress} placeholder="e.g. 45 Park Ave" placeholderTextColor="#64748B" />
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput style={styles.input} value={socCity} onChangeText={setSocCity} placeholder="Metropolis" placeholderTextColor="#64748B" />
                  <Text style={styles.fieldLabel}>State</Text>
                  <TextInput style={styles.input} value={socState} onChangeText={setSocState} placeholder="NY" placeholderTextColor="#64748B" />
                  <Text style={styles.fieldLabel}>Pincode</Text>
                  <TextInput style={styles.input} value={socPincode} onChangeText={setSocPincode} placeholder="10001" placeholderTextColor="#64748B" keyboardType="number-pad" />
                </>
              )}

              {activeTab === 'Blocks' && (
                <>
                  <Text style={styles.fieldLabel}>Block Name</Text>
                  <TextInput style={styles.input} value={blockName} onChangeText={setBlockName} placeholder="e.g. Block A" placeholderTextColor="#64748B" />
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput style={styles.input} value={blockDesc} onChangeText={setBlockDesc} placeholder="Optional notes" placeholderTextColor="#64748B" />
                  <Text style={styles.fieldLabel}>Society ID Selector (Enter ID Number)</Text>
                  <TextInput style={styles.input} value={blockSocId} onChangeText={setBlockSocId} placeholder="e.g. 1" placeholderTextColor="#64748B" keyboardType="number-pad" />
                  
                  <Text style={styles.availableHeading}>Available Societies:</Text>
                  {societies.map((s) => (
                    <Text key={s.id} style={styles.availableItem}>• ID {s.id}: {s.society_name}</Text>
                  ))}
                </>
              )}

              {activeTab === 'Flats' && (
                <>
                  <Text style={styles.fieldLabel}>Flat Number</Text>
                  <TextInput style={styles.input} value={flatNumber} onChangeText={setFlatNumber} placeholder="e.g. A-102" placeholderTextColor="#64748B" />
                  <Text style={styles.fieldLabel}>Floor</Text>
                  <TextInput style={styles.input} value={flatFloor} onChangeText={setFlatFloor} placeholder="e.g. 1" placeholderTextColor="#64748B" keyboardType="number-pad" />
                  <Text style={styles.fieldLabel}>Block ID Selector (Enter ID Number)</Text>
                  <TextInput style={styles.input} value={flatBlockId} onChangeText={setFlatBlockId} placeholder="e.g. 1" placeholderTextColor="#64748B" keyboardType="number-pad" />

                  <Text style={styles.availableHeading}>Available Blocks:</Text>
                  {blocks.map((b) => (
                    <Text key={b.id} style={styles.availableItem}>• ID {b.id}: {b.block_name} (Soc ID: {b.society_id})</Text>
                  ))}
                </>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={() => {
                  if (activeTab === 'Societies') handleCreateSociety();
                  else if (activeTab === 'Blocks') handleCreateBlock();
                  else handleCreateFlat();
                }}
              >
                <Text style={styles.modalSaveText}>Save</Text>
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
  tabsRow: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.md,
  },
  tabButton: {
    backgroundColor: Theme.colors.surface,
    paddingVertical: 6,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: 20,
    marginRight: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#384252',
  },
  activeTabButton: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  tabText: {
    color: Theme.colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  activeTabText: {
    color: '#FFF',
  },
  listItem: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  itemTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  itemTag: {
    color: Theme.colors.primaryLight,
    fontSize: 11,
    marginTop: 4,
    fontWeight: 'bold',
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Theme.spacing.lg,
  },
  spinner: {
    marginTop: Theme.spacing.xl,
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
    maxHeight: '80%',
    borderColor: '#384252',
    borderWidth: 1,
  },
  modalTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.lg,
    fontWeight: 'bold',
    marginBottom: Theme.spacing.md,
  },
  fieldLabel: {
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Theme.spacing.lg,
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
  availableHeading: {
    color: Theme.colors.primaryLight,
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: Theme.spacing.md,
    marginBottom: 4,
  },
  availableItem: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
});
