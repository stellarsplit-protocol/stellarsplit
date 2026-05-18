import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  rpc as StellarRpc,
  xdr,
  nativeToScVal,
  scValToNative,
  Address,
} from "@stellar/stellar-sdk";
import {
  getAddress,
  signTransaction,
  isConnected,
  requestAccess,
} from "@stellar/freighter-api";

export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";

const server = new StellarRpc.Server(RPC_URL);

// ---------- Wallet ----------

export async function connectWallet(): Promise<string> {
  const connected = await isConnected();
  if (!connected) {
    throw new Error(
      "Freighter wallet not found. Install it from freighter.app"
    );
  }
  // requestAccess prompts the user to grant permission
  await requestAccess();
  const result = await getAddress();
  if (!result || !result.address) {
    throw new Error("Could not get address from Freighter");
  }
  return result.address;
}

// ---------- Read (simulation) ----------

async function simulateCall(
  method: string,
  args: xdr.ScVal[]
): Promise<xdr.ScVal> {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(
    "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN"
  );
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const result = await server.simulateTransaction(tx);
  if (StellarRpc.Api.isSimulationError(result)) {
    throw new Error((result as any).error);
  }
  return (result as any).result!.retval;
}

export async function getSplitCount(): Promise<number> {
  try {
    const val = await simulateCall("split_count", []);
    return Number(scValToNative(val));
  } catch {
    return 0;
  }
}

export async function getSplit(splitId: number): Promise<SplitData | null> {
  try {
    const val = await simulateCall("get_split", [
      nativeToScVal(splitId, { type: "u64" }),
    ]);
    return parseSplit(scValToNative(val));
  } catch {
    return null;
  }
}

export async function getAllSplits(): Promise<SplitData[]> {
  const count = await getSplitCount();
  const splits: SplitData[] = [];
  for (let i = 1; i <= count; i++) {
    const split = await getSplit(i);
    if (split) splits.push(split);
  }
  return splits;
}

// ---------- Write (sign + submit) ----------

async function buildAndSend(
  publicKey: string,
  method: string,
  args: xdr.ScVal[]
): Promise<string> {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(publicKey);
  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (StellarRpc.Api.isSimulationError(simResult)) {
    throw new Error(simResult.error);
  }
  tx = StellarRpc.assembleTransaction(tx, simResult as any).build();

  const signedXdr = await signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const xdrString =
    typeof signedXdr === "string" ? signedXdr : (signedXdr as { signedTxXdr: string }).signedTxXdr;

  const submitted = await server.sendTransaction(
    TransactionBuilder.fromXDR(xdrString, NETWORK_PASSPHRASE)
  );

  if (submitted.status === "ERROR") {
    throw new Error("Transaction failed: " + submitted.errorResult?.toString());
  }

  // Poll until complete
  let txStatus: any = { status: "PENDING" };
  while (txStatus.status === "PENDING" || txStatus.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1000));
    txStatus = await server.getTransaction(submitted.hash);
  }

  return submitted.hash;
}

export async function createSplit(
  publicKey: string,
  description: string,
  totalAmountXlm: number,
  participants: string[]
): Promise<string> {
  // Native XLM token address on testnet
  const nativeTokenAddress = await getNativeTokenAddress();
  const stroops = Math.round(totalAmountXlm * 10_000_000);

  const args: xdr.ScVal[] = [
    nativeToScVal(publicKey, { type: "address" }),
    nativeToScVal(description, { type: "string" }),
    nativeToScVal(BigInt(stroops), { type: "i128" }),
    nativeToScVal(nativeTokenAddress, { type: "address" }),
    xdr.ScVal.scvVec(
      participants.map((p) => nativeToScVal(p, { type: "address" }))
    ),
  ];

  return buildAndSend(publicKey, "create_split", args);
}

export async function payShare(
  publicKey: string,
  splitId: number
): Promise<string> {
  const args: xdr.ScVal[] = [
    nativeToScVal(splitId, { type: "u64" }),
    nativeToScVal(publicKey, { type: "address" }),
  ];
  return buildAndSend(publicKey, "pay_share", args);
}

export async function cancelSplit(
  publicKey: string,
  splitId: number
): Promise<string> {
  const args: xdr.ScVal[] = [nativeToScVal(splitId, { type: "u64" })];
  return buildAndSend(publicKey, "cancel_split", args);
}

// ---------- Helpers ----------

async function getNativeTokenAddress(): Promise<string> {
  // On Stellar, native XLM wraps to a well-known contract address on testnet
  // stellar contract id asset --asset native --network testnet
  return process.env.NEXT_PUBLIC_NATIVE_TOKEN_ADDRESS ?? "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
}

export interface SplitData {
  id: number;
  initiator: string;
  description: string;
  total_amount: bigint;
  token: string;
  participants: string[];
  paid: Record<string, boolean>;
  paid_count: number;
  settled: boolean;
}

function parseSplit(raw: any): SplitData {
  const paid: Record<string, boolean> = {};
  if (raw.paid && typeof raw.paid === "object") {
    for (const [k, v] of Object.entries(raw.paid)) {
      paid[k] = Boolean(v);
    }
  }
  return {
    id: Number(raw.id),
    initiator: raw.initiator?.toString() ?? "",
    description: raw.description?.toString() ?? "",
    total_amount: BigInt(raw.total_amount ?? 0),
    token: raw.token?.toString() ?? "",
    participants: (raw.participants ?? []).map((p: any) => p.toString()),
    paid,
    paid_count: Number(raw.paid_count ?? 0),
    settled: Boolean(raw.settled),
  };
}

export function stroopsToXlm(stroops: bigint): string {
  return (Number(stroops) / 10_000_000).toFixed(7).replace(/\.?0+$/, "");
}

export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
