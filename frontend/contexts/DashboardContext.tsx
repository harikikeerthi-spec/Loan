import React, { createContext, useContext, useState, useCallback } from 'react';

interface DocumentShare {
  id: string;
  profileId: string;
  documentIds: string[];
  bankName: string;
  bankEmail: string;
  sharedAt: Date;
  expiresAt: Date;
  accessNote: string;
}

interface DashboardContextType {
  // Document Transfer
  sharedDocuments: DocumentShare[];
  addDocumentShare: (share: DocumentShare) => void;
  removeDocumentShare: (id: string) => void;
  updateDocumentShare: (id: string, share: Partial<DocumentShare>) => void;

  // Notifications
  notifications: any[];
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;

  // Refresh triggers
  triggerProfileRefresh: () => void;
  triggerBankRefresh: () => void;
  triggerStudentRefresh: () => void;

  // Active session tracking
  currentPortal: 'student' | 'staff' | 'bank' | 'admin';
  setCurrentPortal: (portal: 'student' | 'staff' | 'bank' | 'admin') => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [sharedDocuments, setSharedDocuments] = useState<DocumentShare[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentPortal, setCurrentPortal] = useState<'student' | 'staff' | 'bank' | 'admin'>('staff');
  const [refreshTriggers, setRefreshTriggers] = useState({
    profile: 0,
    bank: 0,
    student: 0
  });

  const addDocumentShare = useCallback((share: DocumentShare) => {
    setSharedDocuments(prev => [...prev, share]);
    
    // Auto-add notification
    addNotification({
      id: `share-${Date.now()}`,
      type: 'document_shared',
      message: `Documents shared with ${share.bankName}`,
      timestamp: new Date()
    });
  }, []);

  const removeDocumentShare = useCallback((id: string) => {
    setSharedDocuments(prev => prev.filter(share => share.id !== id));
  }, []);

  const updateDocumentShare = useCallback((id: string, share: Partial<DocumentShare>) => {
    setSharedDocuments(prev =>
      prev.map(s => s.id === id ? { ...s, ...share } : s)
    );
  }, []);

  const addNotification = useCallback((notification: any) => {
    const id = notification.id || `notif-${Date.now()}`;
    setNotifications(prev => [...prev, { ...notification, id }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const triggerProfileRefresh = useCallback(() => {
    setRefreshTriggers(prev => ({ ...prev, profile: prev.profile + 1 }));
  }, []);

  const triggerBankRefresh = useCallback(() => {
    setRefreshTriggers(prev => ({ ...prev, bank: prev.bank + 1 }));
  }, []);

  const triggerStudentRefresh = useCallback(() => {
    setRefreshTriggers(prev => ({ ...prev, student: prev.student + 1 }));
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        sharedDocuments,
        addDocumentShare,
        removeDocumentShare,
        updateDocumentShare,
        notifications,
        addNotification,
        removeNotification,
        triggerProfileRefresh,
        triggerBankRefresh,
        triggerStudentRefresh,
        currentPortal,
        setCurrentPortal
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
