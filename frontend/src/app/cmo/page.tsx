import Link from "next/link";

export default function CMOPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Growth</h1>
      <p className="text-gray-600 mb-8">Marketing strategy and optimization for your business.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/cmo/diagnostic"
          className="block p-6 border border-gray-300 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Run Diagnostic</h2>
          <p className="text-gray-600">Assess your marketing strategy</p>
        </Link>
        
        <Link
          href="/cmo/chat"
          className="block p-6 border border-gray-300 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Growth Chat</h2>
          <p className="text-gray-600">Ask marketing questions</p>
        </Link>
        
        <Link
          href="/cmo/analysis"
          className="block p-6 border border-gray-300 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">View Analyses</h2>
          <p className="text-gray-600">See past analyses</p>
        </Link>
      </div>
    </div>
  );
}

