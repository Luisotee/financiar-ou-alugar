import { SimulatorApp } from "@/components/simulator-app";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <SimulatorApp />
      </main>
      <Footer />
    </div>
  );
}
