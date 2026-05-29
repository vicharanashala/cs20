// ✅ FIX #5: import useCallback
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import qpService from '../services/qp.service';

const QPContext = createContext(null);

export function QPProvider({ children }) {
  const { user } = useAuth();
  const [qp, setQP] = useState(0);
  const [loading, setLoading] = useState(false);

  // ✅ FIX #5: wrap fetchQP in useCallback so it's stable across renders
  const fetchQP = useCallback(async () => {
    setLoading(true);
    try {
      const score = await qpService.getMyScore();
      setQP(typeof score === 'number' ? score : score?.qp || 0);
    } catch (e) {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIX #5: add fetchQP to dependency array
  useEffect(() => {
    if (user) {
      fetchQP();
    } else {
      setQP(0);
    }
  }, [user?._id, fetchQP]);

  const awardQP = (amount) => setQP(prev => prev + amount);
  const deductQP = (amount) => setQP(prev => prev - Math.abs(amount));
  const syncQP = (newQP) => setQP(newQP);

  return (
    <QPContext.Provider value={{ qp, loading, fetchQP, awardQP, deductQP, refreshQP: fetchQP, syncQP }}>
      {children}
    </QPContext.Provider>
  );
}

export function useQP() {
  const context = useContext(QPContext);
  if (!context) throw new Error('useQP must be used within QPProvider');
  return context;
}
