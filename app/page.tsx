export default function Home() {
  const nodeVersion = process.versions.node;
  
  // We'll get Next version from package.json
  const nextVersion = "14.2.0"; // This will be dynamically loaded later if needed

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold text-gray-900">
          🎯 Jotrack is running
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-3">
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-800">Environment Info</p>
          </div>
          
          <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded">
            <span className="text-gray-700 font-medium">Node.js:</span>
            <code className="text-green-600 font-mono">v{nodeVersion}</code>
          </div>
          
          <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded">
            <span className="text-gray-700 font-medium">Next.js:</span>
            <code className="text-blue-600 font-mono">v{nextVersion}</code>
          </div>
        </div>

        <p className="text-gray-600 text-sm">
          Local-first web app powered by Next.js + SQLite
        </p>
      </div>
    </main>
  );
}

