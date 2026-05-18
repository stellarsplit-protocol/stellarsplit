"use client";

import { useState } from "react";
import { connectWallet, truncateAddress } from "@/lib/stellar";

interface Props {
  onConnect: (publicKey: string) => void;
  onDisconnect: () => void;
  publicKey: string | null;
}

export default function WalletConnect({ onConnect, onDisconnect, publicKey }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setLoading(true);
    setError("");
    try {
      const key = await connectWallet();
      onConnect(key);
    } catch (err: any) {
      setError(err.message ?? "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 font-mono">
          {truncateAddress(publicKey)}
        </span>
        <button
          onClick={onDisconnect}
          className="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
