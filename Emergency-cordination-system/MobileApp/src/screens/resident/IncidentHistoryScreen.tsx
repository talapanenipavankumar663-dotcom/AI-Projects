import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import apiClient from '../../api/apiClient';
import { Theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';

export const IncidentHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  const fetchHistory = useCallback(async () => {
    try {
      const response = await apiClient.get('/sos/');
      // Sort by newest first
      const sorted = response.data.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setIncidents(sorted);
      setFilteredIncidents(sorted);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    let result = incidents;

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (inc) =>
          inc.emergency_type.toLowerCase().includes(query) ||
          (inc.emergency_message && inc.emergency_message.toLowerCase().includes(query)) ||
          inc.flat_no.toLowerCase().includes(query) ||
          inc.block.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== 'All') {
      result = result.filter((inc) => inc.status === filterType);
    }

    setFilteredIncidents(result);
  }, [search, filterType, incidents]);

  const renderItem = ({ item }: { item: any }) => {
    const isResolved = item.status === 'Resolved' || item.status === 'Closed';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('IncidentDetail', { incidentId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.emergencyType}>{item.emergency_type}</Text>
          <View
            style={[
              styles.statusBadge,
              item.status === 'Open' && { backgroundColor: Theme.colors.emergencyCritical },
              item.status === 'Assigned' && { backgroundColor: Theme.colors.emergencyWarning },
              isResolved && { backgroundColor: Theme.colors.success },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.locationText}>
          📍 Flat {item.flat_no}, Block {item.block}, {item.society}
        </Text>
        {item.emergency_message && (
          <Text style={styles.messageText} numberOfLines={2}>
            "{item.emergency_message}"
          </Text>
        )}
        <Text style={styles.timeText}>
          {new Date(item.created_at).toLocaleDateString()} at{' '}
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('incidentHistory')}</Text>
      <Text style={styles.subtitle}>Track and review all community emergency activations</Text>

      {/* Search & Filters */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by category, message, flat..."
          placeholderTextColor={Theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {['All', 'Open', 'Assigned', 'Resolved'].map((tab) => {
          const isActive = filterType === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => setFilterType(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredIncidents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No emergency incidents found matching criteria.</Text>
            </View>
          }
          onRefresh={fetchHistory}
          refreshing={loading}
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
  title: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
  },
  subtitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  searchBarContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.sm,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#384252',
    marginBottom: Theme.spacing.sm,
  },
  searchInput: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    paddingVertical: Theme.spacing.sm,
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
    fontWeight: Theme.typography.weights.medium,
    fontSize: 12,
  },
  activeTabText: {
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
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  emergencyType: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold,
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  locationText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
    marginBottom: Theme.spacing.xs,
  },
  messageText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    fontStyle: 'italic',
    backgroundColor: Theme.colors.surfaceLight,
    padding: Theme.spacing.sm,
    borderRadius: Theme.roundness.sm,
    marginVertical: Theme.spacing.xs,
  },
  timeText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: Theme.spacing.xs,
    textAlign: 'right',
  },
  emptyContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
  },
});
