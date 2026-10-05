import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../../api/apiClient';
import { Theme } from '../../theme/theme';
import { useLanguage } from '../../context/LanguageContext';

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await apiClient.patch(`/api/notifications/${notificationId}/read/`, {});
      // Refresh notifications list locally
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, status: 'Read' } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isUnread = item.status === 'Pending';
    return (
      <TouchableOpacity
        style={[styles.card, isUnread && styles.unreadCard]}
        onPress={() => {
          if (isUnread) handleMarkAsRead(item.id);
          navigation.navigate('IncidentDetail', { incidentId: item.sos_alert_id });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            {isUnread && <View style={styles.unreadDot} />}
            <Text style={[styles.notifTitle, isUnread && styles.unreadText]}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.notifTime}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.notifMsg}>{item.message}</Text>
        
        {isUnread && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={() => handleMarkAsRead(item.id)}
          >
            <Text style={styles.markReadText}>Mark as Read</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('alertsTitle')}</Text>
      <Text style={styles.subtitle}>Important safety and response updates regarding your society</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No emergency alerts or notifications logged.</Text>
            </View>
          }
          onRefresh={fetchNotifications}
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
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  unreadCard: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#1E294A', // Tinted color for unread items
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primaryLight,
    marginRight: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    color: Theme.colors.textSecondary,
    fontWeight: Theme.typography.weights.medium,
    fontSize: Theme.typography.sizes.sm,
  },
  unreadText: {
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.bold,
  },
  notifTime: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
  },
  notifMsg: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  markReadButton: {
    marginTop: Theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  markReadText: {
    color: Theme.colors.primaryLight,
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyText: {
    color: Theme.colors.textSecondary,
  },
});
