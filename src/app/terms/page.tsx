import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const dynamic = "force-dynamic";

type TermsDetail = {
  title: string;
  version: string;
  content: string;
};

async function getTermsOfService() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/terms/terms-of-service-kr-v1`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("이용약관을 불러오지 못했습니다.");
  }

  return response.json() as Promise<TermsDetail>;
}

export default async function TermsPage() {
  const terms = await getTermsOfService();

  return (
    <main className="min-h-dvh bg-[#f5f5f7] px-4 py-8 text-[#1d1d1f] sm:px-5 sm:py-10">
      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-sm text-[#7a7a7a]">버전 {terms.version}</p>
          <h1 className="mt-2 text-4xl font-semibold">{terms.title}</h1>
        </header>
        <div className="prose prose-neutral max-w-none rounded-lg bg-white p-6 shadow-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{terms.content}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
