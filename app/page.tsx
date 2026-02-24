export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-orange-500">🏀 HoopDraft</h1>
        <div className="flex gap-6 text-gray-300">
          <a href="#" className="hover:text-white">Home</a>
          <a href="#" className="hover:text-white">My Team</a>
          <a href="#" className="hover:text-white">Leaderboard</a>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-sm text-gray-300 hover:text-white">Log In</button>
          <button className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold">Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-28">
        <h2 className="text-6xl font-extrabold mb-6 leading-tight">
          Build Your Dream <br />
          <span className="text-orange-500">NBA Roster</span>
        </h2>
        <p className="text-xl text-gray-400 max-w-xl mb-10">
          Draft real NBA players, compete with friends, and climb the leaderboard every week.
        </p>
        <button className="px-8 py-4 bg-orange-500 hover:bg-orange-600 rounded-xl text-lg font-bold">
          Start Drafting Free →
        </button>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-16 py-20 border-t border-gray-800">
        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-xl font-bold mb-2">Weekly Competitions</h3>
          <p className="text-gray-400">New contests every week. Draft your lineup and compete for the top spot.</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-bold mb-2">Live NBA Stats</h3>
          <p className="text-gray-400">Real player stats updated live so your score reflects every game.</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-xl font-bold mb-2">Play With Friends</h3>
          <p className="text-gray-400">Create private leagues and trash talk your way to the championship.</p>
        </div>
      </section>

    </main>
  )
}