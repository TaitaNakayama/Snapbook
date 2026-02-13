import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/DashboardClient";
import type { Scrapbook } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: scrapbooks } = await supabase
    .from("scrapbooks")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Scrapbook[]>();

  return <DashboardClient user={user} scrapbooks={scrapbooks ?? []} />;
}
