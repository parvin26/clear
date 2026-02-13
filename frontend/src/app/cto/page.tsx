import Link from "next/link";

export default function CTOPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Tech</h1>
      <p className="text-gray-600 mb-8">Technology strategy and infrastructure for your business.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/cto/diagnostic"
          className="block p-6 border border-gray-300 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Run Diagnostic</h2>
          <p className="text-gray-600">Assess your technology infrastructure</p>
        </Link>
        
        <Link
          href="/cto/chat"
          className="block p-6 border border-gray-300 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Tech Chat</h2>
          <p className="text-gray-600">Ask technology questions</p>
        </Link>
        
        <Link
          href="/cto/analysis"
          className="block p-6 border border-gray-300 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">View Analyses</h2>
          <p className="text-gray-600">See past analyses</p>
        </Link>
      </div>
    </div>
  );
}

