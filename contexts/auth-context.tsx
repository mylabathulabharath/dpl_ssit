import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type UserRole = 'student' | 'tutor' | 'admin';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  university_id?: string;
  college_id?: string;
  branch_id?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, tutorCode?: string, universityId?: string, collegeId?: string, branchId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: user.uid,
          email: user.email,
          displayName: data.displayName || user.displayName,
          role: data.role || 'student',
          university_id: data.university_id,
          college_id: data.college_id,
          branch_id: data.branch_id,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Don't override admin mode if it's active
      if (isAdminMode) {
        setLoading(false);
        return;
      }

      if (user) {
        setUser(user);
        const profile = await fetchUserProfile(user);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isAdminMode]);

  const signIn = async (email: string, password: string) => {
    try {
      // Admin login check (username: "admin", password: "admin")
      if (email.toLowerCase().trim() === 'admin' && password === 'admin') {
        // Create a mock admin user profile
        const adminProfile: UserProfile = {
          uid: 'admin-user',
          email: 'admin@cohortlaunchpad.com',
          displayName: 'Admin',
          role: 'admin',
        };
        setIsAdminMode(true);
        setUserProfile(adminProfile);
        // Set a mock user object
        setUser({
          uid: 'admin-user',
          email: 'admin@cohortlaunchpad.com',
        } as any);
        setLoading(false);
        return;
      }

      // Regular Firebase authentication
      setIsAdminMode(false);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    tutorCode?: string,
    universityId?: string,
    collegeId?: string,
    branchId?: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine role based on tutor code
      const role: UserRole = tutorCode === 'TUTOR' ? 'tutor' : 'student';

      // Create user profile in Firestore
      const profileData: any = {
        email: user.email,
        displayName: name,
        role,
        createdAt: new Date().toISOString(),
      };

      // Only add university/college/branch for students
      if (role === 'student' && universityId && collegeId && branchId) {
        profileData.university_id = universityId;
        profileData.college_id = collegeId;
        profileData.branch_id = branchId;
      }

      await setDoc(doc(db, 'users', user.uid), profileData);

      // Update user profile state
      setUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: name,
        role,
        university_id: role === 'student' ? universityId : undefined,
        college_id: role === 'student' ? collegeId : undefined,
        branch_id: role === 'student' ? branchId : undefined,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const logout = async () => {
    try {
      if (isAdminMode) {
        // Clear admin mode
        setIsAdminMode(false);
        setUser(null);
        setUserProfile(null);
      } else {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

