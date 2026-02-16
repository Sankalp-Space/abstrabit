import { BookmarkApp } from "@/components/bookmark-app";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center py-10 sm:py-14">
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="mb-8 text-center sm:mb-10">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Smart Bookmark App
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Save links before your brain tabs crash.
          </p>
        </div>
        <BookmarkApp />
      </div>
    </main>
  );
}
