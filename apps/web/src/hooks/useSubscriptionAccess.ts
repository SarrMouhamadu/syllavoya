import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { subscriptionsApi } from "../api/subscriptions";

export interface SubscriptionAccessResult {
  loading: boolean;
  hasAccess: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

export function useSubscriptionAccess(): SubscriptionAccessResult {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [checkingSub, setCheckingSub] = useState(true);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function check() {
      if (authLoading) return;

      if (!isAuthenticated || !user) {
        if (isMounted) {
          setHasActiveSub(false);
          setCheckingSub(false);
        }
        return;
      }

      if (user.role === "ADMIN") {
        if (isMounted) {
          setHasActiveSub(true);
          setCheckingSub(false);
        }
        return;
      }

      try {
        const res = await subscriptionsApi.getMySubscription();
        if (isMounted) {
          if (res.success && res.data?.subscription?.statut === "ACTIF") {
            setHasActiveSub(true);
          } else {
            setHasActiveSub(false);
          }
        }
      } catch {
        if (isMounted) {
          setHasActiveSub(false);
        }
      } finally {
        if (isMounted) {
          setCheckingSub(false);
        }
      }
    }

    check();

    return () => {
      isMounted = false;
    };
  }, [authLoading, isAuthenticated, user]);

  const loading = authLoading || checkingSub;
  const isAdmin = user?.role === "ADMIN";
  const hasAccess = isAdmin || hasActiveSub;

  return {
    loading,
    hasAccess,
    isAdmin,
    isAuthenticated,
  };
}
