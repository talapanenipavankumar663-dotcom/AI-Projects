import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_number?: string;
  is_active: boolean;
  role?: string;
  roles?: string[];
}

export interface FlatDetails {
  profile: {
    id: number;
    user_id: number;
    flat_id: number;
    society_id: number;
    resident_type: string;
    created_at: string;
  };
  flat_number: string;
  floor_number: number;
  block_name: string;
  society_name: string;
  resident_name: string;
}

export type UserRole = 'Admin' | 'Resident' | 'Security' | 'Volunteer';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  role: UserRole | null;
  token: string | null;
  flatDetails: FlatDetails | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [flatDetails, setFlatDetails] = useState<FlatDetails | null>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('jwt_token');
      const storedUser = await AsyncStorage.getItem('user_profile');
      const storedRole = await AsyncStorage.getItem('user_role');
      const storedFlat = await AsyncStorage.getItem('flat_details');

      if (storedToken && storedUser && storedRole) {
        setToken(storedToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
        setRole(storedRole as UserRole);
        setIsAuthenticated(true);
        if (storedFlat) {
          setFlatDetails(JSON.parse(storedFlat));
        }
      }
    } catch (e) {
      console.error('Failed to load auth state', e);
    } finally {
      setIsLoading(false);
    }
  };

  const detectUserRole = async (userProfile: UserProfile): Promise<UserRole> => {
    // 1. Check returned roles array from GET /users/me
    const rawRoles = userProfile.roles || [];
    const primaryRoleStr = userProfile.role || (rawRoles.length > 0 ? rawRoles[0] : '');
    const lower = String(primaryRoleStr).toLowerCase();

    if (lower.includes('admin')) return 'Admin';
    if (lower.includes('sec') || lower.includes('guard')) return 'Security';
    if (lower.includes('vol')) return 'Volunteer';
    if (lower.includes('res')) return 'Resident';

    // 2. Sequential fallback check if roles array was empty
    try {
      await apiClient.get('/users/');
      return 'Admin';
    } catch {}

    try {
      await apiClient.get('/api/incidents/summary/');
      return 'Security';
    } catch {}

    try {
      const res = await apiClient.get(`/resident-profiles/resident/${userProfile.id}`);
      if (res.data) {
        setFlatDetails(res.data);
        await AsyncStorage.setItem('flat_details', JSON.stringify(res.data));
        return 'Resident';
      }
    } catch {}

    return 'Resident';
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const payload = `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await apiClient.post('/auth/login', payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      await AsyncStorage.setItem('jwt_token', access_token);
      setToken(access_token);

      apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;

      // Fetch user profile
      const userResponse = await apiClient.get('/users/me');
      const userProfile: UserProfile = userResponse.data;

      // Detect assigned role
      const detectedRole = await detectUserRole(userProfile);

      // Save state
      setUser(userProfile);
      setRole(detectedRole);
      setIsAuthenticated(true);

      await AsyncStorage.setItem('user_profile', JSON.stringify(userProfile));
      await AsyncStorage.setItem('user_role', detectedRole);
    } catch (error) {
      await logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      // Create plain account (no default pre-assigned role)
      await apiClient.post('/users/', {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
      });

      // Automatically log in after registration
      await login(userData.email, userData.password);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user_profile');
      await AsyncStorage.removeItem('user_role');
      await AsyncStorage.removeItem('flat_details');
      delete apiClient.defaults.headers.common.Authorization;
      setToken(null);
      setUser(null);
      setRole(null);
      setFlatDetails(null);
      setIsAuthenticated(false);
    } catch (e) {
      console.error('Error during logout', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const userResponse = await apiClient.get('/users/me');
      const userProfile: UserProfile = userResponse.data;
      setUser(userProfile);
      await AsyncStorage.setItem('user_profile', JSON.stringify(userProfile));

      const updatedRole = await detectUserRole(userProfile);
      setRole(updatedRole);
      await AsyncStorage.setItem('user_role', updatedRole);
    } catch {
      console.error('Failed to refresh profile');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        role,
        token,
        flatDetails,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
