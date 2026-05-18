import { MOCK_CONFIGS } from "@/lib/mock-data";
import MockTestClient from "./MockTestClient";

export function generateStaticParams() {
  return MOCK_CONFIGS.map((mock) => ({ company: mock.id }));
}

export default function MockPage({ params }: { params: { company: string } }) {
  const config = MOCK_CONFIGS.find((m) => m.id === params.company);

  if (!config) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Mock not found</h1>
        <p className="text-[var(--text-secondary)]">This company mock does not exist.</p>
      </div>
    );
  }

  return <MockTestClient config={config} />;
}
