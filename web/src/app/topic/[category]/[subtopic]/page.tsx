import { loadTopicIndex, loadTopicData } from "@/lib/server-data";
import TopicPractice from "./TopicPractice";

export function generateStaticParams() {
  const index = loadTopicIndex();
  return index.topics.map((topic) => ({
    category: topic.category,
    subtopic: topic.id,
  }));
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ category: string; subtopic: string }>;
}) {
  const { category, subtopic } = await params;
  const data = loadTopicData(category, subtopic);

  if (!data) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Topic not found</h1>
        <p className="text-[var(--text-secondary)]">No questions available for this topic yet.</p>
      </div>
    );
  }

  return <TopicPractice data={data} />;
}
