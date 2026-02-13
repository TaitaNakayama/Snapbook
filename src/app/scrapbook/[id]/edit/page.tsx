import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrapbookEditor } from "@/components/ScrapbookEditor";
import type { Scrapbook, MemoryWithPhotos } from "@/lib/types/database";

export default async function EditScrapbookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: scrapbook } = await supabase
    .from("scrapbooks")
    .select("*")
    .eq("id", id)
    .single()
    .returns<Scrapbook>();

  if (!scrapbook) redirect("/dashboard");

  const { data: memories } = await supabase
    .from("memories")
    .select("*, memory_photos(*)")
    .eq("scrapbook_id", id)
    .order("date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .returns<MemoryWithPhotos[]>();

  return (
    <ScrapbookEditor
      scrapbook={scrapbook}
      initialMemories={memories ?? []}
      userId={user.id}
    />
  );
}
