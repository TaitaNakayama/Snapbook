import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrapbookView } from "@/components/ScrapbookView";
import type { Metadata } from "next";
import type { Scrapbook, MemoryWithPhotos } from "@/lib/types/database";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getSharedScrapbook = cache(async (token: string) => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_scrapbook", { token });
  if (!data || (Array.isArray(data) && data.length === 0)) return null;
  return (Array.isArray(data) ? data[0] : data) as Scrapbook;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  if (!UUID_REGEX.test(token)) {
    return { title: "Not Found" };
  }

  const scrapbook = await getSharedScrapbook(token);

  if (!scrapbook) {
    return { title: "Not Found" };
  }

  return {
    title: `${scrapbook.name_a} & ${scrapbook.name_b} — Snapbook`,
    description: `A love story between ${scrapbook.name_a} and ${scrapbook.name_b}`,
    openGraph: {
      title: `${scrapbook.name_a} & ${scrapbook.name_b}`,
      description: `A love story between ${scrapbook.name_a} and ${scrapbook.name_b}`,
      type: "website",
    },
  };
}

export default async function SharedScrapbookPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!UUID_REGEX.test(token)) {
    notFound();
  }

  const scrapbook = await getSharedScrapbook(token);

  if (!scrapbook) {
    notFound();
  }

  const supabase = await createClient();
  const { data: memories } = await supabase.rpc("get_shared_memories", {
    token,
  });

  const memoriesList: MemoryWithPhotos[] = Array.isArray(memories)
    ? (memories as MemoryWithPhotos[])
    : [];

  return (
    <ScrapbookView scrapbook={scrapbook} memories={memoriesList} isSharedView />
  );
}
