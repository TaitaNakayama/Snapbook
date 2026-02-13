"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Scrapbook } from "@/lib/types/database";
import { type User } from "@supabase/supabase-js";

export function DashboardClient({
  user,
  scrapbooks: initialScrapbooks,
}: {
  user: User;
  scrapbooks: Scrapbook[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [scrapbooks, setScrapbooks] = useState(initialScrapbooks);
  const [showForm, setShowForm] = useState(false);
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameA.trim() || !nameB.trim()) return;

    setCreating(true);
    const title = `${nameA.trim()} + ${nameB.trim()}`;
    const { data, error } = await supabase
      .from("scrapbooks")
      .insert({
        user_id: user.id,
        title,
        name_a: nameA.trim(),
        name_b: nameB.trim(),
      } as never)
      .select()
      .single()
      .returns<Scrapbook>();

    if (data && !error) {
      setScrapbooks([data, ...scrapbooks]);
      setNameA("");
      setNameB("");
      setShowForm(false);
      router.push(`/scrapbook/${data.id}/edit`);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scrapbook and all its memories?")) return;
    const { error } = await supabase.from("scrapbooks").delete().eq("id", id);
    if (!error) {
      setScrapbooks(scrapbooks.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="scrapbook-bg min-h-screen">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-sm border-b border-parchment-dark/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-brown-deep">
            Snapbook
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-brown-deep/60">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-brown-deep/60 hover:text-brown-deep transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-semibold text-brown-deep">
            Your Snapbooks
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-brown-deep hover:bg-brown-deep/90 text-white rounded-lg px-5 py-2.5 font-medium transition-colors cursor-pointer"
          >
            + New Snapbook
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-sm border border-parchment-dark/20"
          >
            <h3 className="font-handwritten text-2xl text-brown-deep mb-4">
              Create a new snapbook
            </h3>
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-medium text-brown-deep/70 mb-1">
                  First name
                </label>
                <input
                  type="text"
                  value={nameA}
                  onChange={(e) => setNameA(e.target.value)}
                  placeholder="Taita"
                  className="w-full rounded-md border border-parchment-dark/30 px-3 py-2 text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
                  required
                />
              </div>
              <span className="font-handwritten text-2xl text-brown-warm pb-1">
                +
              </span>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-medium text-brown-deep/70 mb-1">
                  Second name
                </label>
                <input
                  type="text"
                  value={nameB}
                  onChange={(e) => setNameB(e.target.value)}
                  placeholder="Vienna"
                  className="w-full rounded-md border border-parchment-dark/30 px-3 py-2 text-brown-deep bg-white focus:outline-none focus:ring-2 focus:ring-brown-warm/30"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="bg-brown-warm hover:bg-brown-warm/90 text-white rounded-md px-5 py-2 font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        )}

        {/* Scrapbook list */}
        {scrapbooks.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-handwritten text-3xl text-brown-deep/40 mb-2">
              No snapbooks yet
            </p>
            <p className="text-brown-deep/50">
              Create your first one to start saving memories.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {scrapbooks.map((scrapbook) => (
              <div
                key={scrapbook.id}
                className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-parchment-dark/20 hover:shadow-md transition-shadow"
              >
                <h3 className="font-handwritten text-2xl text-brown-deep mb-1">
                  {scrapbook.title}
                </h3>
                <p className="text-sm text-brown-deep/50 mb-4">
                  Created{" "}
                  {new Date(scrapbook.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      router.push(`/scrapbook/${scrapbook.id}/edit`)
                    }
                    className="text-sm bg-brown-warm/10 hover:bg-brown-warm/20 text-brown-deep rounded-md px-3 py-1.5 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => router.push(`/scrapbook/${scrapbook.id}`)}
                    className="text-sm bg-brown-deep/10 hover:bg-brown-deep/20 text-brown-deep rounded-md px-3 py-1.5 transition-colors cursor-pointer"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(scrapbook.id)}
                    className="text-sm text-red-400 hover:text-red-600 ml-auto transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
