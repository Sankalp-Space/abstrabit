"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { RealtimePostgresChangesPayload, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/config";

type Bookmark = {
  id: string;
  user_id: string;
  title: string;
  url: string;
  created_at: string;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4A9.6 9.6 0 0 0 2.4 12c0 5.3 4.3 9.6 9.6 9.6 5.5 0 9.1-3.8 9.1-9.1 0-.6-.1-1-.1-1.4H12Z"
      />
      <path fill="#34A853" d="M3.5 7.5 6.7 9.9A6 6 0 0 1 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4A9.6 9.6 0 0 0 3.5 7.5Z" />
      <path fill="#FBBC05" d="M12 21.6a9.6 9.6 0 0 0 6.6-2.4l-3-2.4a6.1 6.1 0 0 1-3.6 1.1c-2.5 0-4.7-1.6-5.5-3.9l-3.2 2.5A9.6 9.6 0 0 0 12 21.6Z" />
      <path fill="#4285F4" d="M21.1 10.6H12v3.5h5.2c-.2 1.2-1 2.2-2 2.9l3 2.4c1.8-1.7 2.9-4.1 2.9-6.8 0-.8-.1-1.4-.2-2Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="currentColor"
        d="M10.6 13.4a1 1 0 0 1 0-1.4l3.2-3.2a3 3 0 1 1 4.2 4.2l-2.1 2.1a3 3 0 0 1-4.2 0 1 1 0 1 0-1.4 1.4 5 5 0 0 0 7 0l2.1-2.1a5 5 0 0 0-7-7L9.2 10.6a1 1 0 0 0 1.4 1.4Zm2.8-2.8a1 1 0 0 1 0 1.4l-3.2 3.2a3 3 0 1 1-4.2-4.2l2.1-2.1a3 3 0 0 1 4.2 0 1 1 0 1 0 1.4-1.4 5 5 0 0 0-7 0l-2.1 2.1a5 5 0 0 0 7 7l3.2-3.2a1 1 0 0 0-1.4-1.4Z"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5">
      <path
        fill="currentColor"
        d="M13.3 5.3a1 1 0 0 0 0 1.4l4.3 4.3H4a1 1 0 1 0 0 2h13.6l-4.3 4.3a1 1 0 1 0 1.4 1.4l6-6a1 1 0 0 0 0-1.4l-6-6a1 1 0 0 0-1.4 0Z"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 animate-spin">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path fill="currentColor" d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z" />
    </svg>
  );
}

function upsertById(items: Bookmark[], incoming: Bookmark): Bookmark[] {
  const exists = items.some((item) => item.id === incoming.id);
  if (!exists) {
    return [incoming, ...items];
  }

  return items.map((item) => (item.id === incoming.id ? incoming : item));
}

export function BookmarkApp() {
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(hasSupabaseEnv);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return;
    }

    const bootstrap = async () => {
      setLoading(true);
      const {
        data: { session }
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setLoading(false);
    };

    void bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return;
    }

    if (!user) {
      return;
    }

    const loadBookmarks = async (withSkeleton: boolean) => {
      if (withSkeleton) {
        setListLoading(true);
      }

      const { data, error: fetchError } = await supabase
        .from("bookmarks")
        .select("id,user_id,title,url,created_at")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setListLoading(false);
        return;
      }

      setBookmarks((data as Bookmark[]) ?? []);
      setListLoading(false);
    };

    void loadBookmarks(true);

    let fallbackSyncInterval: number | null = null;
    const startFallbackSync = () => {
      if (fallbackSyncInterval !== null) {
        return;
      }

      fallbackSyncInterval = window.setInterval(() => {
        void loadBookmarks(false);
      }, 8000);
    };

    const stopFallbackSync = () => {
      if (fallbackSyncInterval === null) {
        return;
      }

      window.clearInterval(fallbackSyncInterval);
      fallbackSyncInterval = null;
    };

    const channel = supabase
      .channel(`bookmarks-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`
        },
        (payload: RealtimePostgresChangesPayload<Bookmark>) => {
          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => upsertById(prev, payload.new as Bookmark));
          }

          if (payload.eventType === "DELETE") {
            const deleted = payload.old as Bookmark;
            setBookmarks((prev) => prev.filter((b) => b.id !== deleted.id));
          }

          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Bookmark;
            setBookmarks((prev) => upsertById(prev, updated));
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          stopFallbackSync();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          startFallbackSync();
        }
      });

    return () => {
      stopFallbackSync();
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  const signInWithGoogle = async () => {
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });

    if (signInError) {
      setError(signInError.message);
    }
  };

  const signOut = async () => {
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    }
  };

  const addBookmark = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!user) {
      setError("Please sign in again.");
      return;
    }

    if (!title.trim() || !url.trim()) {
      setError("Both title and URL are required.");
      return;
    }

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    const optimisticBookmark: Bookmark = {
      id: `temp-${crypto.randomUUID()}`,
      user_id: user.id,
      title: title.trim(),
      url: normalizedUrl,
      created_at: new Date().toISOString()
    };

    setBookmarks((prev) => upsertById(prev, optimisticBookmark));
    setTitle("");
    setUrl("");
    setSaving(true);
    const { data, error: insertError } = await supabase
      .from("bookmarks")
      .insert({
        user_id: user.id,
        title: optimisticBookmark.title,
        url: normalizedUrl
      })
      .select("id,user_id,title,url,created_at")
      .single();

    setSaving(false);

    if (insertError) {
      setBookmarks((prev) => prev.filter((item) => item.id !== optimisticBookmark.id));
      setError(insertError.message);
      return;
    }

    if (data) {
      setBookmarks((prev) => {
        const withoutTemp = prev.filter((item) => item.id !== optimisticBookmark.id);
        return upsertById(withoutTemp, data as Bookmark);
      });
    }
  };

  const deleteBookmark = async (id: string) => {
    setError(null);
    const removed = bookmarks.find((bookmark) => bookmark.id === id);
    setDeletingIds((prev) => new Set(prev).add(id));
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));

    const { error: deleteError } = await supabase.from("bookmarks").delete().eq("id", id);
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (deleteError) {
      if (removed) {
        setBookmarks((prev) => upsertById(prev, removed));
      }
      setError(deleteError.message);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/70 p-8 text-sm shadow-lg backdrop-blur-sm">
        Loading your workspace...
      </div>
    );
  }

  if (!hasSupabaseEnv) {
    return (
      <div className="rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-red-700">
          Missing Supabase environment variables. Add `NEXT_PUBLIC_SUPABASE_URL` and
          `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur-sm">
        <p className="mb-1 text-base text-slate-700">Sign in with Google to manage your private bookmarks.</p>
        <p className="mb-5 text-sm text-slate-500">No spreadsheets. No chaos. No 47 open tabs (hopefully).</p>
        <button
          onClick={signInWithGoogle}
          className="group mx-auto inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
        >
          <GoogleIcon />
          Continue with Google
          <ArrowRightIcon />
        </button>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Private by default
          </span>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
            Realtime sync
          </span>
        </div>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-xl backdrop-blur-sm sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 sm:w-auto">
          Logged in as <span className="break-all font-medium text-slate-900">{user.email}</span>
        </p>
        <button
          onClick={signOut}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm sm:w-auto"
        >
          Logout
        </button>
      </div>

      <form onSubmit={addBookmark} className="mb-6 grid gap-3 sm:grid-cols-3">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <SpinnerIcon />
              Adding...
            </>
          ) : (
            "Add Bookmark"
          )}
        </button>
      </form>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <ul className="space-y-3">
        {listLoading ? (
          <>
            <li className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 h-5 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            </li>
            <li className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 h-5 w-1/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            </li>
          </>
        ) : user && bookmarks.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No bookmarks yet. Add your first one above.
          </li>
        ) : (
          bookmarks.map((bookmark) => (
            <li
              key={bookmark.id}
              className="group flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center"
            >
              <div className="min-w-0 w-full space-y-1 sm:w-auto">
                <p className="break-words text-base font-semibold text-slate-900">{bookmark.title}</p>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1 break-all text-sm text-blue-700 transition-colors hover:text-blue-800 hover:underline"
                >
                  <LinkIcon />
                  {bookmark.url}
                </a>
              </div>
              <button
                onClick={() => deleteBookmark(bookmark.id)}
                disabled={deletingIds.has(bookmark.id)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {deletingIds.has(bookmark.id) ? (
                  <>
                    <SpinnerIcon />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

