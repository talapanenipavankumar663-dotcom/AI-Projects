import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Loading Screen
import { LoadingScreen } from '../screens/LoadingScreen';

// Auth Screens
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Resident Screens
import { DashboardScreen } from '../screens/resident/DashboardScreen';
import { RaiseSOSScreen } from '../screens/resident/RaiseSOSScreen';
import { IncidentDetailScreen } from '../screens/resident/IncidentDetailScreen';
import { IncidentHistoryScreen } from '../screens/resident/IncidentHistoryScreen';
import { EmergencyContactsScreen } from '../screens/resident/EmergencyContactsScreen';
import { AddContactScreen } from '../screens/AddContactScreen';
import { OtpVerificationScreen } from '../screens/OtpVerificationScreen';
import { ProfileScreen } from '../screens/resident/ProfileScreen';
import { NotificationsScreen } from '../screens/resident/NotificationsScreen';

// Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { ManageSocietiesScreen } from '../screens/admin/ManageSocietiesScreen';
import { ManageResidentsScreen } from '../screens/admin/ManageResidentsScreen';
import { IncidentClosureScreen } from '../screens/admin/IncidentClosureScreen';


// Security Screens
import { SecurityDashboardScreen } from '../screens/security/SecurityDashboardScreen';
import { SecurityProfileScreen } from '../screens/security/SecurityProfileScreen';

// Volunteer Screens
import { VolunteerDashboardScreen } from '../screens/volunteer/VolunteerDashboardScreen';
import { VolunteerAvailabilityScreen } from '../screens/volunteer/VolunteerAvailabilityScreen';
import { GuardianEscalationScreen } from '../screens/guardian/GuardianEscalationScreen';
import { VolunteerEmergencyRequestScreen } from '../screens/volunteer/VolunteerEmergencyRequestScreen';
import { AssignedResponderScreen } from '../screens/responder/AssignedResponderScreen';
import { ResponderStatusUpdateScreen } from '../screens/responder/ResponderStatusUpdateScreen';
import { LanguageSelectScreen } from '../screens/LanguageSelectScreen';
import { Theme } from '../theme/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HeaderLogoutButton = () => {
  const { logout } = useAuth();
  const { t } = useLanguage();
  return (
    <TouchableOpacity
      onPress={logout}
      style={{
        marginRight: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.4)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>
        🚪 {t('logout')}
      </Text>
    </TouchableOpacity>
  );
};

// --- Tab Navigators based on Roles ---

const ResidentTabNavigator = () => {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Theme.colors.surface, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
        headerTintColor: Theme.colors.text,
        headerRight: () => <HeaderLogoutButton />,
        tabBarStyle: { backgroundColor: Theme.colors.surface, borderTopColor: Theme.colors.border, elevation: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: t('home'), tabBarIcon: () => <Text style={{ fontSize: 16 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="ContactsTab"
        component={EmergencyContactsScreen}
        options={{ title: t('contacts'), tabBarIcon: () => <Text style={{ fontSize: 16 }}>📞</Text> }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ title: t('alerts'), tabBarIcon: () => <Text style={{ fontSize: 16 }}>🔔</Text> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: t('profile'), tabBarIcon: () => <Text style={{ fontSize: 16 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
};

const AdminTabNavigator = () => {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Theme.colors.surface, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
        headerTintColor: Theme.colors.text,
        headerRight: () => <HeaderLogoutButton />,
        tabBarStyle: { backgroundColor: Theme.colors.surface, borderTopColor: Theme.colors.border, elevation: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="AdminDashboardTab"
        component={AdminDashboardScreen}
        options={{ title: t('adminDashboard') || 'Admin', tabBarIcon: () => <Text style={{ fontSize: 16 }}>📊</Text> }}
      />
      <Tab.Screen
        name="ManageResidentsTab"
        component={ManageResidentsScreen}
        options={{ title: t('manageResidents') || 'Residents', tabBarIcon: () => <Text style={{ fontSize: 16 }}>👥</Text> }}
      />
      <Tab.Screen
        name="ManageSocietiesTab"
        component={ManageSocietiesScreen}
        options={{ title: t('manageSocieties') || 'Societies', tabBarIcon: () => <Text style={{ fontSize: 16 }}>🏢</Text> }}
      />
      <Tab.Screen
        name="AdminIncidentHistoryTab"
        component={IncidentHistoryScreen}
        options={{ title: t('history') || 'Logs', tabBarIcon: () => <Text style={{ fontSize: 16 }}>📜</Text> }}
      />
      <Tab.Screen
        name="AdminLanguageTab"
        component={LanguageSelectScreen}
        options={{ title: t('languageTab') || 'Language', tabBarIcon: () => <Text style={{ fontSize: 16 }}>🌐</Text> }}
      />
    </Tab.Navigator>
  );
};

const SecurityTabNavigator = () => {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Theme.colors.surface, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
        headerTintColor: Theme.colors.text,
        headerRight: () => <HeaderLogoutButton />,
        tabBarStyle: { backgroundColor: Theme.colors.surface, borderTopColor: Theme.colors.border, elevation: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
        tabBarActiveTintColor: Theme.colors.emergencyCritical,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="SecurityDashboardTab"
        component={SecurityDashboardScreen}
        options={{ title: t('guardsPortal'), tabBarIcon: () => <Text style={{ fontSize: 16 }}>🛡️</Text> }}
      />
      <Tab.Screen
        name="SecurityProfileTab"
        component={SecurityProfileScreen}
        options={{ title: t('profile'), tabBarIcon: () => <Text style={{ fontSize: 16 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
};

const VolunteerTabNavigator = () => {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Theme.colors.surface, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
        headerTintColor: Theme.colors.text,
        headerRight: () => <HeaderLogoutButton />,
        tabBarStyle: { backgroundColor: Theme.colors.surface, borderTopColor: Theme.colors.border, elevation: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="VolunteerDashboardTab"
        component={VolunteerDashboardScreen}
        options={{ title: t('volunteersPortal'), tabBarIcon: () => <Text style={{ fontSize: 16 }}>🤝</Text> }}
      />
      <Tab.Screen
        name="VolunteerAvailabilityTab"
        component={VolunteerAvailabilityScreen}
        options={{ title: t('availability'), tabBarIcon: () => <Text style={{ fontSize: 16 }}>⚙️</Text> }}
      />
      <Tab.Screen
        name="VolunteerLanguageTab"
        component={LanguageSelectScreen}
        options={{ title: t('languageTab') || 'Language', tabBarIcon: () => <Text style={{ fontSize: 16 }}>🌐</Text> }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Normalize role string case-insensitively
  let normalizedRole: 'Admin' | 'Security' | 'Volunteer' | 'Resident' = 'Resident';
  if (role) {
    const lower = String(role).toLowerCase();
    if (lower.includes('admin')) normalizedRole = 'Admin';
    else if (lower.includes('sec') || lower.includes('guard')) normalizedRole = 'Security';
    else if (lower.includes('vol')) normalizedRole = 'Volunteer';
    else if (lower.includes('res')) normalizedRole = 'Resident';
  }

  const getHomeComponent = () => {
    switch (normalizedRole) {
      case 'Admin':
        return AdminTabNavigator;
      case 'Security':
        return SecurityTabNavigator;
      case 'Volunteer':
        return VolunteerTabNavigator;
      case 'Resident':
      default:
        return ResidentTabNavigator;
    }
  };

  const HomeComponent = getHomeComponent();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Theme.colors.surface },
        headerTintColor: Theme.colors.text,
        headerTitleStyle: { fontWeight: '700', color: Theme.colors.text },
        contentStyle: { backgroundColor: Theme.colors.background },
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Create Account' }}
          />
        </>
      ) : (
        // Authenticated Stack
        <>
          <Stack.Screen
            name="MainHome"
            component={HomeComponent}
            options={{ headerShown: false }}
          />

          {/* Common Stack Screens */}
          <Stack.Screen
            name="RaiseSOS"
            component={RaiseSOSScreen}
            options={{ title: 'Raise Emergency SOS' }}
          />
          <Stack.Screen
            name="IncidentDetail"
            component={IncidentDetailScreen}
            options={{ title: 'Emergency Tracking' }}
          />
          <Stack.Screen
            name="IncidentHistory"
            component={IncidentHistoryScreen}
            options={{ title: 'Incident Log History' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: 'Alert Notifications' }}
          />
          <Stack.Screen
            name="ManageSocieties"
            component={ManageSocietiesScreen}
            options={{ title: 'Configure Societies' }}
          />
          <Stack.Screen
            name="ManageResidents"
            component={ManageResidentsScreen}
            options={{ title: 'Resident Assignment' }}
          />
          <Stack.Screen
            name="EmergencyContacts"
            component={EmergencyContactsScreen}
            options={{ title: 'Contacts' }}
          />
          <Stack.Screen
            name="AddContact"
            component={AddContactScreen}
            options={{ title: 'Add Emergency Contact' }}
          />
          <Stack.Screen
            name="OtpVerification"
            component={OtpVerificationScreen}
            options={{ title: 'Firebase OTP Verification' }}
          />
          <Stack.Screen
            name="VolunteerAvailability"
            component={VolunteerAvailabilityScreen}
            options={{ title: 'Volunteer Availability' }}
          />
          <Stack.Screen
            name="GuardianEscalation"
            component={GuardianEscalationScreen}
            options={{ title: 'Guardian Escalation Status' }}
          />
          <Stack.Screen
            name="VolunteerEmergencyRequest"
            component={VolunteerEmergencyRequestScreen}
            options={{ title: 'Volunteer Emergency Request' }}
          />
          <Stack.Screen
            name="AssignedResponder"
            component={AssignedResponderScreen}
            options={{ title: 'Assigned Responder' }}
          />
          <Stack.Screen
            name="ResponderStatusUpdate"
            component={ResponderStatusUpdateScreen}
            options={{ title: 'Update Responder Progress' }}
          />
          <Stack.Screen
            name="IncidentClosure"
            component={IncidentClosureScreen}
            options={{ title: 'Incident Closure Documentation' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
