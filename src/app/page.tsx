import { SimulatorApp } from "@/components/simulator-app";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <SimulatorApp />
      </main>
      <Footer />
    </div>
  );
}
