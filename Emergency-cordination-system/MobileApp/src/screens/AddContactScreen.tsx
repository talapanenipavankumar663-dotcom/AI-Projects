import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../theme/theme';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { createContact } from '../services/api';

export const AddContactScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter emergency contact name.');
      return false;
    }
    if (!relationship.trim()) {
      Alert.alert('Validation Error', 'Please enter relationship (e.g., Parent, Spouse, Sibling).');
      return false;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number.');
      return false;
    }
    
    // Check phone number format (at least 7 digits)
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 7) {
      Alert.alert('Validation Error', 'Please enter a valid phone number (at least 7 digits).');
      return false;
    }
    return true;
  };

  const handleSaveContact = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      // Formats phone number ensuring + prefix if needed
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
      }

      const created = await createContact({
        name: name.trim(),
        relationship: relationship.trim(),
        phone_number: formattedPhone,
      });

      setLoading(false);

      // Navigate to OTP Verification screen with params
      navigation.navigate('OtpVerification', {
        contactId: created.id,
        phoneNumber: created.phone_number,
        contactName: created.name,
        relationship: created.relationship,
      });
    } catch (error: any) {
      setLoading(false);
      const errMsg =
        error?.response?.data?.detail ||
        error?.message ||
        'Failed to save emergency contact. Please try again.';
      Alert.alert('Error', errMsg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Emergency Contact</Text>
          <Text style={styles.headerSubtitle}>
            Emergency contacts are immediately notified via SMS & push alerts during an SOS.
          </Text>
        </View>

        <View style={styles.card}>
          {/* Contact Name */}
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Sarah Jenkins"
            placeholderTextColor={Theme.colors.textSecondary}
          />

          {/* Relationship */}
          <Text style={styles.label}>Relationship *</Text>
          <TextInput
            style={styles.input}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="e.g. Spouse, Brother, Parent"
            placeholderTextColor={Theme.colors.textSecondary}
          />

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="e.g. +1234567890"
            placeholderTextColor={Theme.colors.textSecondary}
            keyboardType="phone-pad"
          />
          <Text style={styles.hintText}>
            Include country code (e.g., +1 for US/CA, +91 for IN, +44 for UK).
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Save Contact"
            onPress={handleSaveContact}
            loading={loading}
            icon="💾"
          />
        </View>
      </ScrollView>

      <Loading visible={loading} message="Saving Emergency Contact..." overlay />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.md,
  },
  header: {
    marginBottom: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
  },
  headerTitle: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
    marginTop: Theme.spacing.sm,
  },
  input: {
    backgroundColor: Theme.colors.surfaceLight,
    color: Theme.colors.text,
    borderRadius: Theme.roundness.sm,
    padding: Theme.spacing.md,
    fontSize: Theme.typography.sizes.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hintText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: Theme.spacing.sm,
  },
});
