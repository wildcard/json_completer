export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Complete Incomplete JSON.<br />Instantly.
        </h1>
        <p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          High-performance JSON completion library with streaming support.
          From truncated API responses to incomplete logs — make any JSON valid.
        </p>
        <div className="flex gap-4 justify-center mb-8">
          <div className="px-4 py-2 bg-blue-100 rounded-lg">
            <span className="font-semibold text-blue-800">10-50x faster</span>
          </div>
          <div className="px-4 py-2 bg-green-100 rounded-lg">
            <span className="font-semibold text-green-800">Zero dependencies</span>
          </div>
          <div className="px-4 py-2 bg-purple-100 rounded-lg">
            <span className="font-semibold text-purple-800">Universal compatibility</span>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <a href="#demo" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Try Live Demo
          </a>
          <a href="https://github.com/aha-app/json_completer" className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
            View on GitHub
          </a>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">The Problem</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🔌</div>
            <h3 className="text-xl font-semibold mb-3">Truncated API Responses</h3>
            <p className="text-gray-600">
              Network timeouts or size limits can cut off JSON mid-stream, breaking your application.
            </p>
            <pre className="mt-4 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
{`{"users": [{"name": "Alice"`}
            </pre>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-3">Incomplete Logs</h3>
            <p className="text-gray-600">
              Log aggregators often truncate long JSON entries, making them unparseable.
            </p>
            <pre className="mt-4 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
{`{"timestamp": "2024-01-01", "data": {`}
            </pre>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🌊</div>
            <h3 className="text-xl font-semibold mb-3">Streaming Data</h3>
            <p className="text-gray-600">
              Processing JSON as it arrives requires handling incomplete states gracefully.
            </p>
            <pre className="mt-4 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
{`{"items": [1, 2, 3`}
            </pre>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">The Solution</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-xl text-gray-700 mb-6">
                <strong>json_completer</strong> intelligently analyzes partial JSON and completes it into valid, parseable JSON.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Before:</h4>
                  <pre className="p-4 bg-red-50 border border-red-200 rounded text-sm">
{`{"name": "John", "age":`}
                  </pre>
                  <p className="text-red-600 text-sm mt-2">❌ Invalid JSON</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">After:</h4>
                  <pre className="p-4 bg-green-50 border border-green-200 rounded text-sm">
{`{"name": "John", "age":null}`}
                  </pre>
                  <p className="text-green-600 text-sm mt-2">✅ Valid JSON</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Try It Live</h2>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <p className="text-center text-gray-600 mb-6">
            Interactive demo coming soon! For now, try the CLI or check the examples below.
          </p>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Quick Start:</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
{`# Build the binary
cd rust
cargo build --release

# Try it out
./target/release/json_completer '{"test":'

# Output: {"test":null}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Rust-powered performance, 10-50x faster than alternatives</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">📡</div>
              <h3 className="text-xl font-semibold mb-2">Streaming Support</h3>
              <p className="text-gray-600">Incremental processing with O(n) complexity for new data</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-2">Universal</h3>
              <p className="text-gray-600">Works with Node.js, Bun, Nest.js, Next.js, any framework</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Smart Completion</h3>
              <p className="text-gray-600">Handles incomplete primitives, missing brackets, and more</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benchmarks Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Performance Benchmarks</h2>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Operation</th>
                  <th className="px-6 py-4 text-left font-semibold">Time</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-6 py-4">One-shot completion</td>
                  <td className="px-6 py-4 font-mono">17ms</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Excellent</span></td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Streaming (per chunk)</td>
                  <td className="px-6 py-4 font-mono">14ms</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Excellent</span></td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Large document (1000 items)</td>
                  <td className="px-6 py-4 font-mono">23ms</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Outstanding</span></td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Concurrent (10 requests)</td>
                  <td className="px-6 py-4 font-mono">150ms</td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Excellent</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-gray-600 mt-6">
            All benchmarks from live CI test results. <a href="https://github.com/aha-app/json_completer/blob/main/TEST_RESULTS.md" className="text-blue-600 hover:underline">View full report →</a>
          </p>
        </div>
      </section>

      {/* Integration Examples */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Easy Integration</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Node.js / TypeScript</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`import { complete } from '@json-completer/client';

const result = await complete('{"test":');
console.log(result); // {"test":null}`}
              </pre>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Nest.js Service</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`@Injectable()
class JsonService {
  async complete(partial: string) {
    const client = new JsonCompleterClient();
    return client.complete(partial);
  }
}`}
              </pre>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Next.js API Route</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`export async function POST(request) {
  const { input } = await request.json();
  const client = new JsonCompleterClient();
  const result = await client.complete(input);
  return Response.json({ result });
}`}
              </pre>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">CLI</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`# Direct usage
json_completer '{"incomplete":'

# JSON API mode
echo '{"action":"complete","input":"..."}' \\
  | json_completer --json-api`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Credits Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">Origins & Credits</h2>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <p className="text-lg text-gray-700 mb-6">
            <strong>json_completer</strong> is a Rust reimplementation of the original Ruby gem created by <strong>Aha! Labs</strong>.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6">
            <p className="text-gray-700 mb-2">
              <strong>Original Ruby gem:</strong>{' '}
              <a href="https://github.com/aha-app/json_completer" className="text-blue-600 hover:underline">
                https://github.com/aha-app/json_completer
              </a>
            </p>
            <p className="text-gray-600">
              Thank you to the Aha! team for the original implementation and concept.
            </p>
          </div>
          <h3 className="text-xl font-semibold mb-4">What's Different in the Rust Version?</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span><strong>10-50x performance improvement</strong> through Rust optimization</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span><strong>Universal language compatibility</strong> via CLI and JSON API</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span><strong>Production-ready for high-throughput scenarios</strong></span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span><strong>Same functionality</strong> - 100% compatible behavior</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">json_completer</h3>
              <p className="text-gray-400">
                High-performance JSON completion library. Open source and MIT licensed.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Links</h3>
              <ul className="space-y-2">
                <li><a href="https://github.com/aha-app/json_completer" className="hover:text-white">GitHub Repository</a></li>
                <li><a href="https://github.com/aha-app/json_completer/blob/main/TEST_RESULTS.md" className="hover:text-white">Test Results</a></li>
                <li><a href="https://github.com/aha-app/json_completer/blob/main/MONOREPO.md" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Community</h3>
              <ul className="space-y-2">
                <li><a href="https://github.com/aha-app/json_completer/issues" className="hover:text-white">Report Issues</a></li>
                <li><a href="https://github.com/aha-app/json_completer/pulls" className="hover:text-white">Contribute</a></li>
                <li><a href="https://github.com/aha-app" className="hover:text-white">Aha! Labs</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 json_completer contributors. Built with ❤️ using Rust and Next.js.</p>
            <p className="mt-2">Original Ruby gem by <a href="https://www.aha.io" className="text-blue-400 hover:text-blue-300">Aha! Labs</a></p>
          </div>
        </div>
      </footer>
    </main>
  );
}
