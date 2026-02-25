import Link from "next/link";

export default function NFLPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="text-8xl mb-6">🏈</div>
        <h1 className="text-5xl font-extrabold mb-4">NFL Fantasy</h1>
        <p className="text-gray-400 text-xl mb-8">Coming soon. We're building something great.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-300 hover:border-green-500 hover:text-white transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}