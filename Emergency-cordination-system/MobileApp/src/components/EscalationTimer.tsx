import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';

interface EscalationTimerProps {
  alert: {
    id: number;
    created_at?: string;
    status: string;
    assigned_responder?: any;
  } | null;
  onTimeout?: (level: number) => void;
}

export const EscalationTimer: React.FC<EscalationTimerProps> = ({ alert, onTimeout: _onTimeout }) => {
  const { t } = useLanguage();
  const timeoutPerStep = 30; // 30 seconds per escalation step (synced with backend & web app)

  const escalationTiers = [
    { level: 1, name: t('tier1'), shortName: t('tier1Short'), icon: '🚨', color: '#F59E0B' },
    { level: 2, name: t('tier2'), shortName: t('tier2Short'), icon: '🤝', color: '#10B981' },
    { level: 3, name: t('tier3'), shortName: t('tier3Short'), icon: '📞', color: '#EC4899' },
    { level: 4, name: t('tier4'), shortName: t('tier4Short'), icon: '🛡️', color: '#6366F1' },
  ];

  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timerState, setTimerState] = useState({ level: 1, remaining: timeoutPerStep });

  const alertId = alert?.id;
  const alertCreatedAt = alert?.created_at;
  const alertStatus = alert?.status;

  useEffect(() => {
    if (!alertId) return;
    const alertKey = `sos_mobile_start_${alertId}`;
    AsyncStorage.getItem(alertKey).then((saved) => {
      let ts = Date.now();
      if (saved) {
        ts = parseInt(saved, 10);
      } else {
        const parsed = alertCreatedAt ? new Date(alertCreatedAt).getTime() : Date.now();
        ts = isNaN(parsed) || parsed > Date.now() ? Date.now() : parsed;
        AsyncStorage.setItem(alertKey, ts.toString());
      }
      setStartTime(ts);
    });
  }, [alertId, alertCreatedAt]);

  useEffect(() => {
    if (!alertId || alertStatus === 'Assigned' || alertStatus === 'Resolved' || alertStatus === 'Closed') {
      return;
    }

    const calculateTimer = () => {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      const level = Math.min(4, Math.floor(elapsedSeconds / timeoutPerStep) + 1);
      const secondsInCurrentStep = elapsedSeconds % timeoutPerStep;
      const remaining = (level >= 4 && elapsedSeconds >= 4 * timeoutPerStep)
        ? 0
        : Math.max(0, timeoutPerStep - secondsInCurrentStep);

      setTimerState(prev => {
        if (prev.level === level && prev.remaining === remaining) return prev;
        return { level, remaining };
      });
    };

    calculateTimer();
    const interval = setInterval(calculateTimer, 1000);

    return () => clearInterval(interval);
  }, [alertId, alertStatus, startTime]);

  if (!alert || alert.status !== 'Open') {
    return (
      <View style={styles.stoppedContainer}>
        <Text style={{ fontSize: 24, marginRight: 10 }}>✅</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.stoppedTitle}>
            {alert?.status === 'Assigned' ? t('acceptedByResponder') : t('emergencyResolved')}
          </Text>
          <Text style={styles.stoppedSub}>
            {alert?.assigned_responder ? `Assigned to ${alert.assigned_responder.first_name}` : 'Emergency escalation inactive.'}
          </Text>
        </View>
      </View>
    );
  }

  const currentLevel = timerState.level;
  const timeLeft = timerState.remaining;
  const activeTier = escalationTiers.find((tier) => tier.level === currentLevel) || escalationTiers[0];
  const progressPercent = ((timeoutPerStep - timeLeft) / timeoutPerStep) * 100;

  return (
    <View style={styles.timerCard}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.liveTitle}>⏱️ {t('liveCountdownTitle')}</Text>
          <Text style={styles.activeTierText}>
            {t('tierLevelHeader')} {currentLevel} {t('ofFour')} {activeTier.icon} {activeTier.name}
          </Text>
        </View>

        {/* Digital Clock Badge */}
        <View style={styles.clockBadge}>
          <Text style={styles.clockText}>
            00:{timeLeft.toString().padStart(2, '0')}
          </Text>
          <Text style={styles.clockSubText}>{t('secsToNextTier')}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${100 - progressPercent}%` }]} />
      </View>

      {/* Tier Stepper Line */}
      <View style={styles.stepperRow}>
        {escalationTiers.map((tier) => {
          const isPassed = tier.level < currentLevel;
          const isCurrent = tier.level === currentLevel;

          return (
            <View key={tier.level} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isPassed && styles.stepCirclePassed,
                  isCurrent && styles.stepCircleCurrent,
                ]}
              >
                <Text style={styles.stepIcon}>{isPassed ? '✓' : tier.icon}</Text>
              </View>
              <Text
                style={[
                  styles.stepName,
                  isCurrent && styles.stepNameCurrent,
                  isPassed && styles.stepNamePassed,
                ]}
                numberOfLines={1}
              >
                {tier.shortName}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timerCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 16,
    padding: 16,
    marginVertical: 14,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  activeTierText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  clockBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  clockText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
    lineHeight: 22,
  },
  clockSubText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#FCA5A5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCirclePassed: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepCircleCurrent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  stepIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNameCurrent: {
    fontWeight: '800',
    color: '#EF4444',
  },
  stepNamePassed: {
    color: '#10B981',
  },
  stoppedContainer: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  stoppedTitle: {
    fontWeight: '800',
    color: '#10B981',
    fontSize: 14,
  },
  stoppedSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
