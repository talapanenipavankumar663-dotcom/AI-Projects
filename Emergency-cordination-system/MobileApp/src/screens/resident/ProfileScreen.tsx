import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import apiClient from '../../api/apiClient';
import { Theme } from '../../theme/theme';

export const ProfileScreen: React.FC = () => {
  const { user, role, flatDetails, refreshProfile, logout } = useAuth();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatar, setAvatar] = useState('🛡️');

  // Load standard details
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setPhone(user.phone);
      setEmail(user.email);
    }
    loadAvatar();
  }, [user]);

  const loadAvatar = async () => {
    try {
      const storedAvatar = await AsyncStorage.getItem('user_avatar');
      if (storedAvatar) setAvatar(storedAvatar);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectAvatar = async (emoji: string) => {
    try {
      setAvatar(emoji);
      await AsyncStorage.setItem('user_avatar', emoji);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'Fields cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      // Modify user profile endpoint
      await apiClient.put(`/users/${user?.id}`, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: '', // backend requires password field in update schema
      });

      await refreshProfile();
      Alert.alert('Success', 'Profile updated successfully.');
      setIsEditing(false);
    } catch (error: any) {
      const errMsg = error?.response?.data?.detail || 'Failed to update profile details.';
      Alert.alert('Error', errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>{t('profileTitle')}</Text>

      {/* Avatar Display & Mock Selection */}
      <View style={styles.avatarCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>{avatar}</Text>
        </View>
        <Text style={styles.avatarSelectionTitle}>Choose Profile Icon</Text>
        <View style={styles.avatarRow}>
          {['🛡️', '🏡', '👨', '👩', '⭐', '⚡'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.avatarOption, avatar === emoji && styles.activeAvatarOption]}
              onPress={() => handleSelectAvatar(emoji)}
            >
              <Text style={styles.avatarOptionText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* User Information Form */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t('personalDetails')}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Theme.colors.primaryLight} />
            ) : (
              <Text style={styles.editButtonText}>{isEditing ? t('save') : t('edit')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('firstName')}</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={firstName}
            onChangeText={setFirstName}
            editable={isEditing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('lastName')}</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={lastName}
            onChangeText={setLastName}
            editable={isEditing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('emailAddress')}</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={email}
            editable={false} // Email cannot be modified for security
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('phoneNumber')}</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={phone}
            onChangeText={setPhone}
            editable={isEditing}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('activeRole')}</Text>
          <Text style={styles.roleValue}>{role}</Text>
        </View>
      </View>

      {/* Flat Details Card */}
      {role === 'Resident' && flatDetails && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('societyResidenceMapping')}</Text>
          <View style={styles.flatInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Society Name</Text>
              <Text style={styles.infoValue}>{flatDetails.society_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Block Name</Text>
              <Text style={styles.infoValue}>{flatDetails.block_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Flat Number</Text>
              <Text style={styles.infoValue}>{flatDetails.flat_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Floor</Text>
              <Text style={styles.infoValue}>{flatDetails.floor_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Occupancy Type</Text>
              <Text style={styles.infoValue}>{flatDetails.profile.resident_type}</Text>
            </View>
          </View>
        </View>
      )}

      {isEditing && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            if (user) {
              setFirstName(user.first_name);
              setLastName(user.last_name);
              setPhone(user.phone);
            }
            setIsEditing(false);
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel Editing</Text>
        </TouchableOpacity>
      )}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>🚪 {t('logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  title: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  avatarCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    borderColor: Theme.colors.primary,
    borderWidth: 2,
  },
  avatarEmoji: {
    fontSize: 44,
  },
  avatarSelectionTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    marginBottom: Theme.spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  avatarOption: {
    backgroundColor: Theme.colors.surfaceLight,
    padding: 6,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeAvatarOption: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.background,
  },
  avatarOptionText: {
    fontSize: 20,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  cardTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold,
  },
  editButton: {
    backgroundColor: Theme.colors.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: 4,
  },
  editButtonText: {
    color: Theme.colors.primaryLight,
    fontWeight: 'bold',
    fontSize: 12,
  },
  field: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.xs,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Theme.colors.surfaceLight,
    color: Theme.colors.text,
    borderRadius: Theme.roundness.sm,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    fontSize: Theme.typography.sizes.sm,
    borderWidth: 1,
    borderColor: '#384252',
  },
  disabledInput: {
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    color: Theme.colors.textSecondary,
    borderColor: 'transparent',
  },
  roleValue: {
    color: Theme.colors.primaryLight,
    fontWeight: 'bold',
    fontSize: Theme.typography.sizes.md,
  },
  flatInfoContainer: {
    marginTop: Theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  infoLabel: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
  },
  infoValue: {
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.medium,
    fontSize: Theme.typography.sizes.sm,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
  },
  cancelButtonText: {
    color: Theme.colors.emergencyCritical,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: Theme.roundness.md,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
  },
});
