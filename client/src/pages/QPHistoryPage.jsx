import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import qpService from '../services/qp.service';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import QPBadge from '../components/QPBadge';
import Breadcrumb from '../components/Breadcrumb';
import { timeAgo } from '../utils/helpers';
import { TrendingUp, TrendingDown, History, Shield, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

export default function QPHistoryPage() {
  const { user } = useAuth();
  const { qp } = useQP();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await qpService.getHistory({ page, limit });
      const items = Array.isArray(res) ? res : (res.data || []);
      setHistory(items);
      if (res.pagination) setTotal(res.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);
  const earnedTotal = history.reduce((s, tx) => tx.type === 'earn' ? s + tx.amount : s, 0);
  const deductedTotal = history.reduce((s, tx) => tx.type === 'deduct' ? s + tx.amount : s, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: 'Profile', to: '/profile' }, { label: 'QP History' }]} />
      
      {/* Header section */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-100">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">QP Ledger</h1>
            <p className="text-sm text-muted">A timeline of your Quality Points transactions</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4 border-l-4 border-l-emerald-500 bg-emerald-50/10 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Total Earned</p>
              <p className="text-xl font-black text-emerald-600">+{earnedTotal} QP</p>
            </div>
          </div>
          
          <div className="card p-4 border-l-4 border-l-rose-500 bg-rose-50/10 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Total Deducted</p>
              <p className="text-xl font-black text-rose-500">-{deductedTotal} QP</p>
            </div>
          </div>
          
          <div className="card p-4 border-l-4 border-l-accent bg-accent-50/10 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Net Standing</p>
              <p className="text-xl font-black text-primary">{(earnedTotal - deductedTotal) >= 0 ? '+' : ''}{earnedTotal - deductedTotal} QP</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Ledger Card */}
      <div className="card shadow-md overflow-hidden bg-white/80 backdrop-blur-lg border border-white/40">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/40">
          <div>
            <h2 className="text-sm font-bold text-primary">Transaction History</h2>
            <p className="text-[10px] text-muted">Ledger records are digitally signed and cryptographically stored</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-semibold">{total} total</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted">Retrieving ledger entries...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <History className="w-12 h-12 mx-auto mb-3 text-muted/30" />
            <p className="text-sm font-medium">No QP transactions yet.</p>
            <p className="text-xs text-muted/60 mt-1">Start contributing questions or answers to earn Quality Points.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {history.map(tx => (
                <div key={tx._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-all duration-150">
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    {/* Transaction Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'earn' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-rose-50 text-rose-600 border border-rose-100/50'
                    }`}>
                      {tx.type === 'earn' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{tx.reason}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted flex-wrap">
                        <span>{timeAgo(tx.createdAt)}</span>
                        {tx.referenceId && (
                          <>
                            <span>&middot;</span>
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">REF-{tx.referenceId.toString().slice(-6).toUpperCase()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border shrink-0 shadow-sm ${
                    tx.type === 'earn' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.amount} QP
                  </span>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-4 border-t border-slate-100 bg-slate-50/20">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-outline-sm disabled:opacity-40 disabled:hover:bg-white"
                >
                  Previous
                </button>
                <span className="text-xs text-muted font-medium">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-outline-sm disabled:opacity-40 disabled:hover:bg-white"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex items-center gap-2 text-xs text-muted justify-center">
          <Info className="w-3.5 h-3.5 text-muted/60" />
          <span>QP ledger history is immutable and cryptographically audited.</span>
        </div>
      </div>
    </div>
  );
}