import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Theme } from '../theme/theme';
import { Button } from '../components/Button';
import { OTPInput } from '../components/OTPInput';
import { Loading } from '../components/Loading';
import { sendPhoneOtp, confirmPhoneOtp } from '../services/firebaseAuth';
import { verifyContact } from '../services/api';

export const OtpVerificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { contactId, phoneNumber, contactName, relationship } = route.params || {};

  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] =
    useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Processing...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resend Timer State (30 seconds countdown)
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<any>(null);

  const startTimer = () => {
    setTimerSeconds(30);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 1. Send OTP Action
  const handleSendOtp = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoadingMsg('Sending OTP via Firebase...');
    setLoading(true);

    try {
      const confirmation = await sendPhoneOtp(phoneNumber || '');
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
      setLoading(false);
      setSuccessMessage(`OTP sent successfully to ${phoneNumber}`);
      startTimer();
    } catch (error: any) {
      setLoading(false);
      const msg = error?.message || 'Failed to send OTP. Please check phone number.';
      setErrorMessage(msg);
    }
  };

  // 2. Resend OTP Action
  const handleResendOtp = async () => {
    if (!canResend) return;
    setOtpCode('');
    await handleSendOtp();
  };

  // 3. Verify OTP Action
  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!otpCode || otpCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (!confirmationResult) {
      setErrorMessage('OTP session missing. Please click "Send OTP" again.');
      return;
    }

    setLoadingMsg('Verifying OTP code...');
    setLoading(true);

    try {
      // Step A: Confirm OTP code with Firebase & obtain ID Token
      const { idToken } = await confirmPhoneOtp(confirmationResult, otpCode);

      // Step B: Send Firebase ID Token to FastAPI Backend for server-side verification
      setLoadingMsg('Verifying with backend server...');
      const response = await verifyContact(contactId, idToken);

      setLoading(false);

      if (response && response.success) {
        setSuccessMessage('Emergency Contact Verified Successfully!');
        Alert.alert(
          'Verification Success',
          'This emergency contact has been verified and registered for automated emergency SOS notifications.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('ResidentHome');
              },
            },
          ]
        );
      } else {
        setErrorMessage(response?.message || 'Backend verification failed.');
      }
    } catch (error: any) {
      setLoading(false);
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        'Verification failed. Incorrect or expired OTP code.';
      setErrorMessage(msg);
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
        {/* Contact Info Header Card */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Emergency Contact Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{contactName || 'Emergency Contact'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Relationship:</Text>
            <Text style={styles.detailValue}>{relationship || 'Contact'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone Number:</Text>
            <Text style={styles.phoneHighlight}>{phoneNumber || 'N/A'}</Text>
          </View>
        </View>

        {/* Error Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        )}

        {/* Success Banner */}
        {successMessage && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ {successMessage}</Text>
          </View>
        )}

        {/* Send OTP Section */}
        {!isOtpSent ? (
          <View style={styles.sendOtpSection}>
            <Text style={styles.instructionText}>
              Click "Send OTP" to receive a 6-digit verification code on the phone number above via Firebase Authentication.
            </Text>
            <Button
              title="Send OTP"
              onPress={handleSendOtp}
              loading={loading}
              icon="📱"
            />
          </View>
        ) : (
          /* Enter OTP Section */
          <View style={styles.verifyOtpSection}>
            <Text style={styles.otpLabel}>Enter 6-Digit Verification Code</Text>
            
            <OTPInput
              code={otpCode}
              setCode={setOtpCode}
              maximumLength={6}
              disabled={loading}
            />

            <View style={styles.actionButtons}>
              <Button
                title="Verify OTP"
                onPress={handleVerifyOtp}
                loading={loading}
                disabled={otpCode.length !== 6}
                icon="🔒"
              />

              <TouchableOpacity
                style={[
                  styles.resendButton,
                  !canResend && styles.resendDisabled,
                ]}
                onPress={handleResendOtp}
                disabled={!canResend || loading}
              >
                <Text style={styles.resendText}>
                  {canResend
                    ? '🔄 Resend OTP'
                    : `Resend OTP in ${timerSeconds}s`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Loading visible={loading} message={loadingMsg} overlay />
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
  contactCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: Theme.spacing.lg,
  },
  contactTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: Theme.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailLabel: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
  },
  detailValue: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
  },
  phoneHighlight: {
    color: Theme.colors.secondary,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold,
  },
  instructionText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.sm,
    marginBottom: Theme.spacing.lg,
    lineHeight: 20,
    textAlign: 'center',
  },
  sendOtpSection: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  verifyOtpSection: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  otpLabel: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  actionButtons: {
    marginTop: Theme.spacing.md,
  },
  resendButton: {
    marginTop: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
  },
  resendDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: Theme.colors.primaryLight,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: Theme.colors.emergencyCritical,
    borderWidth: 1,
    borderRadius: Theme.roundness.sm,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  errorText: {
    color: Theme.colors.emergencyCritical,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Theme.colors.success,
    borderWidth: 1,
    borderRadius: Theme.roundness.sm,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  successText: {
    color: Theme.colors.success,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
  },
});
