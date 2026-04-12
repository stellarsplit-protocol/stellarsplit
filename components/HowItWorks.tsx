const steps = [
  {
    number: "01",
    title: "Connect Your Wallet",
    description:
      "Connect any Stellar-compatible wallet (Freighter, LOBSTR, xBull) to get started.",
  },
  {
    number: "02",
    title: "Create a Split",
    description:
      "Add the total amount, describe the expense, and invite participants by their Stellar address.",
  },
  {
    number: "03",
    title: "Contract Holds Funds",
    description:
      "A Soroban smart contract is deployed on-chain to hold and manage the split fairly.",
  },
  {
    number: "04",
    title: "Participants Pay",
    description:
      "Each participant pays their share directly to the contract — no one person collects.",
  },
  {
    number: "05",
    title: "Auto Settlement",
    description:
      "Once all shares are paid, the contract releases funds to the initiator instantly.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-6 py-24 max-w-4xl mx-auto">
      <h2 className="text-center text-3xl font-bold mb-16">How It Works</h2>
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-zinc-800 hidden md:block" />
        <div className="flex flex-col gap-10">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6 items-start">
              <div className="relative flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full border border-violet-500/40 bg-violet-500/10 text-violet-400 font-bold text-sm z-10">
                {step.number}
              </div>
              <div className="pt-3">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
