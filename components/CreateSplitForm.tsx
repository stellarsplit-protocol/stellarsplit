"use client";

import { useState } from "react";

export default function CreateSplitForm() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [participants, setParticipants] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    // TODO: integrate Soroban contract call here
    setTimeout(() => setStatus("done"), 1500);
  };

  return (
    <div className="card-glow rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold mb-5">Create New Split</h2>

      {status === "done" ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-green-400 font-semibold">Split Created!</p>
          <p className="text-zinc-400 text-sm mt-1">
            Contract deployed on Stellar Testnet
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 text-violet-400 text-sm hover:underline"
          >
            Create another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">
              Description
            </label>
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
            <label className="block text-sm text-zinc-400 mb-1.5">
              Total Amount (XLM)
            </label>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">
              Participant Addresses
            </label>
            <textarea
              placeholder={"G... (one address per line)"}
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              rows={3}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none resize-none"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Stellar addresses (G...) separated by new lines
            </p>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-primary w-full rounded-xl py-3 font-semibold text-white disabled:opacity-60 mt-2"
          >
            {status === "loading" ? "Deploying Contract..." : "Create Split"}
          </button>
        </form>
      )}
    </div>
  );
}
