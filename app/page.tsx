import Link from "next/link";
import Navbar from "@/components/Navbar";
import FeatureCard from "@/components/FeatureCard";
import HowItWorks from "@/components/HowItWorks";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.15)_0%,_transparent_70%)] pointer-events-none" />

        <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          Built on Stellar · Powered by Soroban
        </span>

        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
          Split Bills{" "}
          <span className="gradient-text">Trustlessly</span>
          <br />
          on Stellar
        </h1>

        <p className="mt-6 max-w-xl text-lg text-zinc-400 leading-relaxed">
          StellarSplit lets groups split expenses and settle payments using
          Soroban smart contracts — no middlemen, no disputes, instant finality.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/app"
            className="btn-primary inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold text-white"
          >
            Launch App
          </Link>
          <a
            href="https://github.com/daniella-techie/stellarsplit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/50 px-8 py-3.5 text-base font-semibold text-zinc-200 hover:bg-zinc-700/50 transition-colors"
          >
            View on GitHub
          </a>
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          Open source · Free to use · Contribute on Drips Wave
        </p>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <h2 className="text-center text-3xl font-bold mb-12">
          Why StellarSplit?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon="⚡"
            title="Instant Settlement"
            description="Payments settle in 3–5 seconds on the Stellar network. No waiting days for bank transfers."
          />
          <FeatureCard
            icon="🔒"
            title="Trustless Contracts"
            description="Soroban smart contracts hold funds and auto-release when all parties confirm — no trust required."
          />
          <FeatureCard
            icon="💸"
            title="Near-Zero Fees"
            description="Stellar transactions cost fractions of a cent, making small group payments finally practical."
          />
          <FeatureCard
            icon="🌍"
            title="Cross-Border"
            description="Anyone with a Stellar wallet can participate — no bank account or local currency needed."
          />
          <FeatureCard
            icon="👥"
            title="Group Splits"
            description="Create a split, invite participants, and let the contract handle the math and settlement."
          />
          <FeatureCard
            icon="📖"
            title="Fully Open Source"
            description="Audit the contracts, contribute features, or fork it. 100% transparent and community-driven."
          />
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto rounded-2xl border border-violet-500/20 bg-violet-500/5 p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to split?</h2>
          <p className="text-zinc-400 mb-8">
            Connect your Stellar wallet and create your first group split in seconds.
          </p>
          <Link
            href="/app"
            className="btn-primary inline-flex items-center justify-center rounded-xl px-10 py-3.5 text-base font-semibold text-white"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-sm text-zinc-500">
        <p>
          StellarSplit is open source.{" "}
          <a
            href="https://github.com/daniella-techie/stellarsplit"
            className="text-violet-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contribute on GitHub
          </a>{" "}
          · Built for the Stellar Wave Program on Drips
        </p>
      </footer>
    </>
  );
}
