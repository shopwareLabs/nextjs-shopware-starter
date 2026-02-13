import type { Metadata } from "next";

import Prose from "components/prose";
import { getPage } from "lib/shopware";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cms: string }>;
}): Promise<Metadata> {
  const { cms } = await params;
  const page = await getPage(cms);

  if (!page) return notFound();

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.bodySummary,
    openGraph: {
      publishedTime: page.createdAt,
      modifiedTime: page.updatedAt,
      type: "article",
    },
  };
}

export default async function Page({ params }: { params: Promise<{ cms: string }> }) {
  const { cms } = await params;
  const page = await getPage(cms);

  if (!page) return notFound();
  let date = page.createdAt;
  if (page.updatedAt !== "") {
    date = page.updatedAt;
  }

  return (
    <>
      <h1 className="mb-8 text-5xl font-bold">{page.title}</h1>
      <Prose className="mb-8" html={page.body} />
      <p className="text-sm italic">
        {`This document was last updated on ${new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(date))}.`}
      </p>
    </>
  );
}
