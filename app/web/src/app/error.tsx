'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="recovery">
      <h1>This page could not load</h1>
      <p>Your saved mock data remains in this browser.</p>
      <button onClick={reset}>Try again</button>
      <a href="/workspace">Back to workspace</a>
    </main>
  );
}
