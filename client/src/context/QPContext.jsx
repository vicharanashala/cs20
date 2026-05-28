import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import qpService from '../services/qp.service';

const QPContext = createContext(null);

export function QPProvider({ children }) {
  const { user } = useAuth();
  const [qp, setQP] = useState(0);
  const [loading, setLoading] = useState(false);

  // FIX #14: Fetch QP on mount and whenever the auth user changes
  useEffect(() => {
    if (user) {
      fetchQP();
    } else {
      setQP(0);
    }
  }, [user?._id]);

  const fetchQP = async () => {
    setLoading(true);
    try {
      const score = await qpService.getMyScore();
      setQP(typeof score === 'number' ? score : score?.qp || 0);
    } catch (e) {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const awardQP = (amount) => setQP(prev => prev + amount);
  const deductQP = (amount) => setQP(prev => prev - Math.abs(amount));

  return (
    <QPContext.Provider value={{ qp, loading, fetchQP, awardQP, deductQP }}>
      {children}
    </QPContext.Provider>
  );
}

export function useQP() {
  const context = useContext(QPContext);
  if (!context) throw new Error('useQP must be used within QPProvider');
  return context;
}
