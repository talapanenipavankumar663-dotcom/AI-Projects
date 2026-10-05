import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, AVAILABLE_LANGUAGES } from '../../context/LanguageContext';
import { Theme } from '../../theme/theme';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const languagesList = AVAILABLE_LANGUAGES;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(35)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const btnScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for logo badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.14,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(btnScaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const handleLoginDirect = async (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setIsSubmitting(true);
    try {
      await login(userEmail.toLowerCase(), userPass);
    } catch (error: any) {
      let errMsg = 'Invalid email or password. Please try again.';
      if (error?.response) {
        errMsg = error.response.data?.detail || errMsg;
      } else if (error?.request) {
        errMsg = 'Could not connect to the server. Please ensure the backend is running and reachable.';
      }
      Alert.alert('Login Failed', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    await handleLoginDirect(email.trim(), password.trim());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.backToOverviewBtn}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={styles.backToOverviewText}>← About EmergX App</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoWrapper}>
            <Animated.View style={[styles.logoPulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.logoBadge}>
              <Text style={styles.logo}>🚨</Text>
            </View>
          </View>
          <Text style={styles.brandTitle}>Emerg<Text style={styles.accentText}>X</Text></Text>
          <Text style={styles.subtitle}>24/7 Citizen Emergency Coordination Network</Text>

          {/* Language Selector Pills on Login Screen */}
          <View style={styles.langRow}>
            {languagesList.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.langChip,
                  language === item.code && styles.langChipActive,
                ]}
                onPress={() => setLanguage(item.code)}
              >
                <Text style={styles.langFlag}>{item.flag}</Text>
                <Text
                  style={[
                    styles.langText,
                    language === item.code && styles.langTextActive,
                  ]}
                >
                  {item.nativeLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.label}>{t('emailAddress')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. resident@test.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>{t('password')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={{ transform: [{ scale: btnScaleAnim }] }}>
            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isSubmitting}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? t('loggingIn') : t('login')}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('dontHaveAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>{t('signUp')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.seedHintContainer}>
            <Text style={styles.seedHintTitle}>{t('oneTapDemo')}</Text>
            <TouchableOpacity 
              style={styles.demoCard}
              onPress={() => handleLoginDirect('resident@test.com', 'Resident@123')}
              activeOpacity={0.7}
            >
              <View style={[styles.demoCardIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Text style={styles.demoCardIcon}>⚡</Text>
              </View>
              <View style={styles.demoCardInfo}>
                <Text style={styles.demoCardRole}>Resident Portal Demo</Text>
                <Text style={styles.demoCardEmail}>resident@test.com</Text>
              </View>
              <Text style={styles.demoCardArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.demoCard}
              onPress={() => handleLoginDirect('security@test.com', 'Security@123')}
              activeOpacity={0.7}
            >
              <View style={[styles.demoCardIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Text style={styles.demoCardIcon}>🛡️</Text>
              </View>
              <View style={styles.demoCardInfo}>
                <Text style={styles.demoCardRole}>Security Guard Demo</Text>
                <Text style={styles.demoCardEmail}>security@test.com</Text>
              </View>
              <Text style={styles.demoCardArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.demoCard}
              onPress={() => handleLoginDirect('volunteer@test.com', 'Volunteer@123')}
              activeOpacity={0.7}
            >
              <View style={[styles.demoCardIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Text style={styles.demoCardIcon}>🤝</Text>
              </View>
              <View style={styles.demoCardInfo}>
                <Text style={styles.demoCardRole}>Volunteer CPR Responder</Text>
                <Text style={styles.demoCardEmail}>volunteer@test.com</Text>
              </View>
              <Text style={styles.demoCardArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  backToOverviewBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 20,
  },
  backToOverviewText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoPulseRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  logoBadge: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logo: {
    fontSize: 36,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  accentText: {
    color: '#EF4444',
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  langChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  langFlag: {
    fontSize: 13,
    marginRight: 6,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  langTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleButton: {
    paddingHorizontal: 16,
  },
  toggleText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  link: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 14,
  },
  seedHintContainer: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  seedHintTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  demoCardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  demoCardIcon: {
    fontSize: 16,
  },
  demoCardInfo: {
    flex: 1,
  },
  demoCardRole: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  demoCardEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  demoCardArrow: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '800',
  },
});
