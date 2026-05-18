"use client";

import { useState } from "react";
import { createSplit, CONTRACT_ID } from "@/lib/stellar";
import { useWallet } from "@/lib/WalletContext";

export default function CreateSplitForm() {
  const { publicKey } = useWallet();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [participants, setParticipants] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    const parsedParticipants = participants
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    if (parsedParticipants.length === 0) {
      setErrorMsg("Add at least one participant address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const hash = await createSplit(
        publicKey,
        description,
        parseFloat(amount),
        parsedParticipants
      );
      setTxHash(hash);
      setStatus("done");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Transaction failed");
      setStatus("error");
    }
  };

  if (!publicKey) {
    return (
      <div className="card-glow rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col items-center justify-center gap-3 min-h-[280px]">
        <span className="text-4xl">✦</span>
        <p className="text-zinc-400 text-sm text-center">
          Connect your Freighter wallet to create a split.
        </p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="card-glow rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold mb-5">Create New Split</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-green-400 font-semibold">Split Created!</p>
          <p className="text-zinc-400 text-sm mt-1">Transaction confirmed on Stellar Testnet</p>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-xs text-violet-400 font-mono hover:underline break-all"
          >
            {txHash}
          </a>
          <button
            onClick={() => {
              setStatus("idle");
              setDescription("");
              setAmount("");
              setParticipants("");
              setTxHash("");
            }}
            className="mt-5 text-violet-400 text-sm hover:underline"
          >
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glow rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold mb-5">Create New Split</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Description</label>
          <input
            type="text"
            placeholder="e.g. Dinner at Nobu"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Total Amount (XLM)</label>
          <input
            type="number"
            placeholder="0.00"
            min="0.0000001"
            step="0.0000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Participant Addresses</label>
          <textarea
            placeholder={"G... (one address per line)"}
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            rows={3}
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none resize-none"
          />
          <p className="text-xs text-zinc-500 mt-1">Stellar addresses (G...) — one per line</p>
        </div>

        {status === "error" && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary w-full rounded-xl py-3 font-semibold text-white disabled:opacity-60 mt-2"
        >
          {status === "loading" ? "Waiting for signature..." : "Create Split"}
        </button>

        {!CONTRACT_ID && (
          <p className="text-xs text-yellow-400 text-center">
            Set NEXT_PUBLIC_CONTRACT_ID in .env.local to enable on-chain calls.
          </p>
        )}
      </form>
    </div>
  );
}
