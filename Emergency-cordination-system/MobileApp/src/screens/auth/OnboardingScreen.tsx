import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { useLanguage, AVAILABLE_LANGUAGES } from '../../context/LanguageContext';
import { Theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { language, setLanguage, t } = useLanguage();
  const languagesList = AVAILABLE_LANGUAGES;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const btnScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
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

  const features = [
    {
      icon: '⚡',
      title: '5-Sec 4-Tier Escalation',
      desc: 'Automated failover dispatch to security guards, CPR volunteers, primary & secondary guardians.',
      badge: 'AUTOMATED',
      badgeColor: '#EF4444',
    },
    {
      icon: '🛡️',
      title: 'Real-Time Gate & Patrol Alert',
      desc: 'GPS flat unit dispatch notifications routed straight to on-duty security guard devices.',
      badge: 'SECURITY GATE',
      badgeColor: '#3B82F6',
    },
    {
      icon: '🤝',
      title: 'Verified CPR Neighborhood Volunteer',
      desc: 'Nearby trained community volunteers receive instant rescue and first-aid alerts.',
      badge: 'FIRST-AID',
      badgeColor: '#10B981',
    },
    {
      icon: '🔒',
      title: 'Enterprise Encryption & Logs',
      desc: 'Full end-to-end encrypted dispatch audit log tracking every response millisecond.',
      badge: 'AUDITED',
      badgeColor: '#8B5CF6',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Language Selection Header Pills */}
        <Animated.View style={[styles.langHeader, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.langLabel}>SELECT LANGUAGE:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langRow}>
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
          </ScrollView>
        </Animated.View>

        {/* Hero Section */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoWrapper}>
            <Animated.View style={[styles.logoPulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🚨</Text>
              <View style={styles.pulseDot} />
            </View>
          </View>
          <Text style={styles.heroTitle}>
            Emerg<Text style={styles.heroX}>X</Text>
          </Text>
          <Text style={styles.heroTagline}>
            Next-Gen Emergency Coordination Network
          </Text>
          <Text style={styles.heroSub}>
            Connecting residents, housing security guards, verified CPR neighborhood volunteers, and family guardians in real-time emergencies.
          </Text>
        </Animated.View>

        {/* Live Metrics Row */}
        <Animated.View style={[styles.metricsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>&lt; 5s</Text>
            <Text style={styles.metricLabel}>Escalation</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>4 Tiers</Text>
            <Text style={styles.metricLabel}>Failover</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>24/7</Text>
            <Text style={styles.metricLabel}>Active Patrol</Text>
          </View>
        </Animated.View>

        {/* Feature Cards List */}
        <Animated.View style={[styles.featuresList, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionHeader}>HOW EMERGX PROTECTS YOU</Text>

          {features.map((item, idx) => (
            <View key={idx} style={styles.featureCard}>
              <View style={[styles.iconBox, { backgroundColor: item.badgeColor + '15', borderColor: item.badgeColor + '30' }]}>
                <Text style={styles.featureIcon}>{item.icon}</Text>
              </View>
              <View style={styles.featureContent}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <View style={[styles.badgePill, { backgroundColor: item.badgeColor + '18', borderColor: item.badgeColor + '40' }]}>
                    <Text style={[styles.badgeText, { color: item.badgeColor }]}>{item.badge}</Text>
                  </View>
                </View>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View style={[styles.actionContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={{ transform: [{ scale: btnScaleAnim }] }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Login')}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>CONTINUE TO LOGIN  →</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>CREATE NEW ACCOUNT</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footerNote}>
          🛡️ Enterprise Grade • End-to-End Encrypted • 24/7 Active Dispatch
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  langHeader: {
    marginBottom: 20,
  },
  langLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  langRow: {
    flexDirection: 'row',
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
    fontSize: 12,
    marginRight: 4,
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  langTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 12,
    textAlign: 'center',
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoPulseRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logoIcon: {
    fontSize: 40,
  },
  pulseDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  heroX: {
    color: '#EF4444',
  },
  heroTagline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  heroSub: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginVertical: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  metricCard: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E2E8F0',
  },
  featuresList: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    alignItems: 'flex-start',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  badgePill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  featureDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  actionContainer: {
    marginTop: 10,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerNote: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 20,
  },
});
