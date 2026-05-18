"use client";

import { useEffect, useState } from "react";
import { getAllSplits, payShare, cancelSplit, stroopsToXlm, truncateAddress, SplitData, CONTRACT_ID } from "@/lib/stellar";
import { useWallet } from "@/lib/WalletContext";

export default function SplitList() {
  const { publicKey } = useWallet();
  const [splits, setSplits] = useState<SplitData[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchSplits = async () => {
    if (!CONTRACT_ID) return;
    setLoading(true);
    try {
      const data = await getAllSplits();
      // Show only splits where the connected wallet is initiator or participant
      if (publicKey) {
        setSplits(
          data.filter(
            (s) =>
              s.initiator === publicKey ||
              s.participants.includes(publicKey)
          )
        );
      } else {
        setSplits(data.slice(0, 5)); // Show latest 5 when not connected
      }
    } catch (err: any) {
      setError("Failed to load splits from chain.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSplits();
  }, [publicKey]);

  const handlePayShare = async (splitId: number) => {
    if (!publicKey) return;
    setActionLoading(splitId);
    try {
      await payShare(publicKey, splitId);
      await fetchSplits();
    } catch (err: any) {
      setError(err.message ?? "Transaction failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (splitId: number) => {
    if (!publicKey) return;
    setActionLoading(splitId);
    try {
      await cancelSplit(publicKey, splitId);
      await fetchSplits();
    } catch (err: any) {
      setError(err.message ?? "Transaction failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="card-glow rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Your Splits</h2>
        {CONTRACT_ID && (
          <button
            onClick={fetchSplits}
            disabled={loading}
            className="text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 mb-4">{error}</p>
      )}

      {!CONTRACT_ID ? (
        <p className="text-zinc-500 text-sm text-center py-8">
          Set NEXT_PUBLIC_CONTRACT_ID in .env.local to view on-chain splits.
        </p>
      ) : loading && splits.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      ) : splits.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-8">
          {publicKey ? "No splits found for your wallet." : "Connect wallet to see your splits."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {splits.map((split) => {
            const progress = split.participants.length > 0
              ? Math.round((split.paid_count / split.participants.length) * 100)
              : 0;
            const isInitiator = split.initiator === publicKey;
            const hasPaid = publicKey ? split.paid[publicKey] ?? false : false;
            const isParticipant = publicKey ? split.participants.includes(publicKey) : false;
            const isActing = actionLoading === split.id;

            return (
              <div key={split.id} className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{split.description}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {split.participants.length} participant{split.participants.length !== 1 ? "s" : ""} ·{" "}
                      {stroopsToXlm(split.total_amount)} XLM total
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5 font-mono">
                      Initiator: {truncateAddress(split.initiator)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      split.settled
                        ? "bg-green-500/15 text-green-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    {split.settled ? "Settled" : "Pending"}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {split.paid_count}/{split.participants.length} paid
                  </span>
                </div>

                {publicKey && !split.settled && (
                  <div className="flex gap-2 mt-3">
                    {isParticipant && !hasPaid && (
                      <button
                        onClick={() => handlePayShare(split.id)}
                        disabled={isActing}
                        className="btn-primary text-xs rounded-lg px-3 py-1.5 font-semibold text-white disabled:opacity-60"
                      >
                        {isActing ? "Processing..." : "Pay My Share"}
                      </button>
                    )}
                    {isParticipant && hasPaid && (
                      <span className="text-xs text-green-400 px-3 py-1.5">
                        ✓ You paid
                      </span>
                    )}
                    {isInitiator && (
                      <button
                        onClick={() => handleCancel(split.id)}
                        disabled={isActing}
                        className="text-xs rounded-lg px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-60"
                      >
                        {isActing ? "Processing..." : "Cancel Split"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
