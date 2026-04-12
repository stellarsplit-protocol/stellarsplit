import Navbar from "@/components/Navbar";
import CreateSplitForm from "@/components/CreateSplitForm";
import SplitList from "@/components/SplitList";

export default function AppPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-zinc-400">
            Create and manage your group bill splits on Stellar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CreateSplitForm />
          <SplitList />
        </div>
      </main>
    </>
  );
}
