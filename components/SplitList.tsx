"use client";

const mockSplits = [
  {
    id: "1",
    description: "Team lunch",
    total: 120,
    paid: 80,
    participants: 4,
    status: "pending",
  },
  {
    id: "2",
    description: "Airbnb deposit",
    total: 500,
    paid: 500,
    participants: 5,
    status: "settled",
  },
  {
    id: "3",
    description: "Conference tickets",
    total: 300,
    paid: 100,
    participants: 3,
    status: "pending",
  },
];

export default function SplitList() {
  return (
    <div className="card-glow rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold mb-5">Recent Splits</h2>

      <div className="flex flex-col gap-4">
        {mockSplits.map((split) => {
          const progress = Math.round((split.paid / split.total) * 100);
          return (
            <div
              key={split.id}
              className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{split.description}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {split.participants} participants
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    split.status === "settled"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-yellow-500/15 text-yellow-400"
                  }`}
                >
                  {split.status === "settled" ? "Settled" : "Pending"}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400 shrink-0">
                  {split.paid}/{split.total} XLM
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500 mt-5 text-center">
        Connect wallet to see your real splits
      </p>
    </div>
  );
}
