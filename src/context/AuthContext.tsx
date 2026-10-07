import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../firebase';
import { flushSyncQueue, getSyncQueue } from '../services/taskService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnline: boolean;
  isOfflineSimulated: boolean;
  isEffectivelyOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  accessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  toggleOfflineSimulation: () => void;
  syncNow: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
}

// In-memory token storage (never localStorage per security rules)
let inMemoryAccessToken: string | null = null;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(() => {
    return localStorage.getItem('todo_simulated_offline') === 'true';
  });
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const isEffectivelyOnline = isOnline && !isOfflineSimulated;

  // Track browser online / offline state
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOfflineSinSafe(false);

    function setIsOfflineSinSafe(val: boolean) {
      setIsOnline(val);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (!firebaseUser) {
        inMemoryAccessToken = null;
        setAccessToken(null);
        const queue = getSyncQueue('guest');
        setPendingSyncCount(queue.length);
        return;
      }

      const queue = getSyncQueue(firebaseUser.uid);
      setPendingSyncCount(queue.length);

      if (isEffectivelyOnline) {
        const profilePath = `users/${firebaseUser.uid}/profile/info`;
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid, 'profile', 'info'), {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn('Could not save user profile:', err);
          handleFirestoreError(err, OperationType.WRITE, profilePath);
        }
      }
    });

    return () => unsubscribe();
  }, [isEffectivelyOnline]);

  // Auto-sync whenever back online
  useEffect(() => {
    if (isEffectivelyOnline && user) {
      syncNow();
    }
  }, [isEffectivelyOnline, user]);

  const syncNow = async () => {
    if (!user || !isEffectivelyOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await flushSyncQueue(user.uid, (remaining) => {
        setPendingSyncCount(remaining);
      });
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Failed to sync queue:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleOfflineSimulation = () => {
    setIsOfflineSimulated((prev) => {
      const next = !prev;
      localStorage.setItem('todo_simulated_offline', String(next));
      return next;
    });
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        inMemoryAccessToken = credential.accessToken;
        setAccessToken(credential.accessToken);
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      throw err;
    }
  };

  const getValidAccessToken = async (): Promise<string | null> => {
    if (inMemoryAccessToken) return inMemoryAccessToken;
    if (auth.currentUser) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          inMemoryAccessToken = credential.accessToken;
          setAccessToken(credential.accessToken);
          return credential.accessToken;
        }
      } catch (err) {
        console.warn('Could not acquire access token:', err);
      }
    }
    return null;
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      inMemoryAccessToken = null;
      setAccessToken(null);
    } catch (err) {
      console.error('Sign-out error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOnline,
        isOfflineSimulated,
        isEffectivelyOnline,
        pendingSyncCount,
        isSyncing,
        lastSyncedAt,
        accessToken,
        signInWithGoogle,
        signOut,
        toggleOfflineSimulation,
        syncNow,
        getValidAccessToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
