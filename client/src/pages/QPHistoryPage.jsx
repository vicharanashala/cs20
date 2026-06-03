import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import qpService from '../services/qp.service';
import { useAuth } from '../context/AuthContext';
import { useQP } from '../context/QPContext';
import QPBadge from '../components/QPBadge';
import Breadcrumb from '../components/Breadcrumb';
import { timeAgo } from '../utils/helpers';
import { TrendingUp, TrendingDown, History, Shield } from 'lucide-react';

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
      <Breadcrumb items={[{ label: 'QP History' }]} />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <History className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">QP History</h1>
            <p className="text-sm text-muted">Your quality points ledger</p>
          </div>
        </div>
        <div className="text-right">
          <QPBadge qp={qp || user?.qp || 0} />
          <p className="text-xs text-muted mt-1">Current balance</p>
        </div>
      </div>

      {history.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card-padded text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted font-medium">Total Earned</span>
            </div>
            <div className="text-xl font-bold text-green-600">+{earnedTotal}</div>
          </div>
          <div className="card-padded text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted font-medium">Total Deducted</span>
            </div>
            <div className="text-xl font-bold text-red-500">-{deductedTotal}</div>
          </div>
          <div className="card-padded text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted font-medium">Net Change</span>
            </div>
            <div className="text-xl font-bold text-primary">{earnedTotal - deductedTotal}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-primary">Transaction Ledger</h2>
          <span className="text-xs text-muted">{total} total transactions</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted">Loading...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-muted">No QP transactions yet.</div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {history.map(tx => (
                <div key={tx._id} className="flex items-center justify-between px-4 py-3 hover:bg-surface/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary leading-snug pr-4">{tx.reason}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted">{timeAgo(tx.createdAt)}</span>
                      {tx.referenceId && (
                        <span className="text-xs text-muted">· ref: {tx.referenceId.toString().slice(-6)}</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${
                    tx.type === 'earn' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                  </span>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 p-4 border-t border-border bg-surface/30">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs text-muted">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        <div className="px-4 py-3 border-t border-border bg-slate-50/50">
          <p className="text-xs text-muted text-center">
            QP history is immutable and cannot be edited or deleted.
          </p>
        </div>
      </div>
    </div>
  );
}