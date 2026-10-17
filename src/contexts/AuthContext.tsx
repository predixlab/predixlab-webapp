import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { setUserLanguage } from "@/i18n";
import { isUnauthorizedError } from "@/services/api";
import api from "@/services/apiAdapter";
import {
  User,
  UserUpdate,
  EmailLoginRequest,
  EmailLoginVerify,
  EmailRegisterCodeRequest,
  UserRegister,
} from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated(): boolean;
  // Email authentication
  requestEmailLoginCode: (data: EmailLoginRequest) => Promise<void>;
  verifyEmailLogin: (data: EmailLoginVerify) => Promise<void>;
  requestEmailRegisterCode: (data: EmailRegisterCodeRequest) => Promise<void>;
  registerUser: (data: UserRegister) => Promise<void>;
  // OAuth authentication
  getGoogleLoginUrl: (referralCode?: string) => string;
  getMicrosoftLoginUrl: (referralCode?: string) => string;
  // Legacy method for backward compatibility
  login: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  // User profile
  updateUserProfile: (data: UserUpdate) => Promise<void>;
  acceptUserNotice: (version: string) => Promise<void>;
  deleteAccount: (confirmation: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Update language when user state changes
  useEffect(() => {
    setUserLanguage(user);
  }, [user]);

  const initializeAuth = async () => {
    const storedUser = api.getCurrentUserFromStorage();

    try {
      if (api.isAuthenticated()) {
        if (storedUser) {
          setUser(storedUser);
        }
        // Verify the user is still valid by fetching current user
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await api.logout();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email authentication methods
  const requestEmailLoginCode = async (data: EmailLoginRequest) => {
    return await api.requestEmailLoginCode(data);
  };

  const verifyEmailLogin = async (data: EmailLoginVerify) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const authToken = await api.verifyEmailLogin(data);
      setUser(authToken.user);
    } catch (error) {
      throw error;
    }
  };

  const requestEmailRegisterCode = async (data: EmailRegisterCodeRequest) => {
    return await api.requestEmailRegisterCode(data);
  };

  const registerUser = async (data: UserRegister) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const authToken = await api.registerUser(data);
      setUser(authToken.user);
    } catch (error) {
      throw error;
    }
  };

  // OAuth methods
  const getGoogleLoginUrl = (referralCode?: string) => {
    return api.getGoogleLoginUrl(referralCode);
  };

  const getMicrosoftLoginUrl = (referralCode?: string) => {
    return api.getMicrosoftLoginUrl(referralCode);
  };

  // Legacy method for backward compatibility
  const login = async (email: string, code: string) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const authToken = await api.verifyEmailLogin({ email, code });
      setUser(authToken.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await logout();
      }
      throw error;
    }
  };

  const updateUserProfile = async (data: UserUpdate) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const updatedUser = await api.updateUserProfile(data);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const acceptUserNotice = async (version: string) => {
    const updatedUser = await api.acceptUserNotice({
      user_notice_version: version,
    });
    setUser(updatedUser);
  };

  const deleteAccount = async (confirmation: string) => {
    await api.deleteAccount({ confirmation });
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: api.isAuthenticated,
    requestEmailLoginCode,
    verifyEmailLogin,
    requestEmailRegisterCode,
    registerUser,
    getGoogleLoginUrl,
    getMicrosoftLoginUrl,
    login,
    logout,
    refreshUser,
    updateUserProfile,
    acceptUserNotice,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
