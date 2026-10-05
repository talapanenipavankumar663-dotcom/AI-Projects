import apiClient from '../api/apiClient';

export interface EmergencyContactData {
  id?: number;
  name: string;
  relationship: string;
  phone_number: string;
  email?: string;
  priority?: number;
  is_verified?: boolean;
  verified_at?: string | null;
  verification_method?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VerifyContactResponse {
  success: boolean;
  message: string;
}

/**
 * Creates a new emergency contact in the backend.
 * Endpoint: POST /contacts
 */
export const createContact = async (data: {
  name: string;
  relationship: string;
  phone_number: string;
  email?: string;
  priority?: number;
}): Promise<EmergencyContactData> => {
  const response = await apiClient.post('/contacts', {
    name: data.name,
    relationship: data.relationship,
    phone_number: data.phone_number,
    email: data.email,
    priority: data.priority,
  });
  return response.data;
};

/**
 * Retrieves all emergency contacts for the authenticated user.
 * Endpoint: GET /contacts
 */
export const getContacts = async (): Promise<EmergencyContactData[]> => {
  const response = await apiClient.get('/contacts');
  return response.data;
};

/**
 * Verifies emergency contact using Firebase ID Token.
 * Endpoint: POST /contacts/{contact_id}/verify
 */
export const verifyContact = async (
  contactId: number,
  firebaseIdToken: string
): Promise<VerifyContactResponse> => {
  const response = await apiClient.post(`/contacts/${contactId}/verify`, {
    firebase_id_token: firebaseIdToken,
  });
  return response.data;
};

export default {
  createContact,
  getContacts,
  verifyContact,
};
