"use client";

import Link from "next/link";
import WalletConnect from "@/components/WalletConnect";
import { useWallet } from "@/lib/WalletContext";

export default function Navbar() {
  const { publicKey, setPublicKey } = useWallet();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#0d0f1a]/80 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2 font-bold text-lg">
        <span className="text-2xl">✦</span>
        <span className="gradient-text">StellarSplit</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
        <Link href="/app" className="hover:text-white transition-colors">
          App
        </Link>
        <a
          href="https://github.com/stellarsplit-protocol/stellarsplit"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          GitHub
        </a>
        <a
          href="https://github.com/stellarsplit-protocol/stellarsplit/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          Contribute
        </a>
      </div>

      <WalletConnect
        publicKey={publicKey}
        onConnect={setPublicKey}
        onDisconnect={() => setPublicKey(null)}
      />
    </nav>
  );
}
