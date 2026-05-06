/**
 * Hooks for managing dashboard data across multiple portals
 * This enables real-time synchronization between student, staff, and bank dashboards
 */

import { useCallback, useEffect, useState } from 'react';
import { staffProfileApi } from '@/lib/api';

export interface DocumentTransferData {
  studentId: string;
  studentName: string;
  profileId: string;
  documents: Array<{
    id: string;
    type: string;
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'shared';
    uploadedAt: Date;
  }>;
  targetBank: string;
  loanType: string;
  bankStatus: string;
  lastUpdated: Date;
}

/**
 * Hook for fetching and monitoring profile document transfers
 */
export function useProfileDocumentTransfer(profileId?: string) {
  const [data, setData] = useState<DocumentTransferData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!profileId) return;

    setLoading(true);
    try {
      const res: any = await staffProfileApi.get(profileId);
      const profile = res.data || res;

      setData({
        studentId: profile.linkedUserId,
        studentName: `${profile.linkedUser?.firstName || ''} ${profile.linkedUser?.lastName || ''}`,
        profileId: profile.id,
        documents: profile.documents || [],
        targetBank: profile.targetBank,
        loanType: profile.loanType,
        bankStatus: profile.bankStatus,
        lastUpdated: new Date()
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId) {
      refresh();
      // Poll for updates every 30 seconds
      const interval = setInterval(refresh, 30000);
      return () => clearInterval(interval);
    }
  }, [profileId, refresh]);

  return { data, loading, error, refresh };
}

/**
 * Hook for tracking document share distribution
 */
export function useDocumentShareTracking(profileId?: string) {
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadShares = useCallback(async () => {
    if (!profileId) return;

    setLoading(true);
    try {
      const res: any = await staffProfileApi.getShares(profileId);
      setShares(res.data || []);
    } catch (error) {
      console.error('Failed to load shares:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId) {
      loadShares();
      const interval = setInterval(loadShares, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [profileId, loadShares]);

  return { shares, loading, refresh: loadShares };
}

/**
 * Hook for bulk document operations
 */
export function useBulkDocumentOps(profileId?: string) {
  const [loading, setLoading] = useState(false);

  const shareMultiple = useCallback(
    async (documentIds: string[], bankData: any) => {
      if (!profileId || documentIds.length === 0) return;

      setLoading(true);
      try {
        const result: any = await staffProfileApi.shareWithBank(profileId, {
          doc_ids: documentIds,
          ...bankData
        });
        return result;
      } finally {
        setLoading(false);
      }
    },
    [profileId]
  );

  const updateMultipleStatus = useCallback(
    async (documentIds: string[], newStatus: string) => {
      if (!profileId) return;

      setLoading(true);
      try {
        const results = await Promise.all(
          documentIds.map(docId =>
            staffProfileApi.updateDocumentStatus(profileId, docId, newStatus)
          )
        );
        return results;
      } finally {
        setLoading(false);
      }
    },
    [profileId]
  );

  const removeMultiple = useCallback(
    async (documentIds: string[]) => {
      if (!profileId) return;

      setLoading(true);
      try {
        const results = await Promise.all(
          documentIds.map(docId =>
            staffProfileApi.removeDocument(profileId, docId)
          )
        );
        return results;
      } finally {
        setLoading(false);
      }
    },
    [profileId]
  );

  return {
    shareMultiple,
    updateMultipleStatus,
    removeMultiple,
    loading
  };
}

/**
 * Hook for real-time dashboard updates
 */
export function useDashboardSync(enabled: boolean = true) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const sync = async () => {
      setSyncStatus('syncing');
      try {
        // Sync logic would go here
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        setLastSync(new Date());
        setSyncStatus('idle');
      } catch (error) {
        setSyncStatus('error');
      }
    };

    // Sync every 20 seconds
    const interval = setInterval(sync, 20000);
    return () => clearInterval(interval);
  }, [enabled]);

  return { syncStatus, lastSync };
}
