'use client';

import { useState } from 'react';
import { useMenuApi } from '@/hooks/use-menu-api';

export default function TestMenuApiPage() {
  const fetchAll = useMenuApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [date, setDate] = useState<string>(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await fetchAll(date);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Test Menu API Hook</h1>

      <div className="mb-6 space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-2">
            Date (YYYY-MM-DD):
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 mr-4"
          />
          <button
            onClick={handleFetch}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium px-6 py-2 rounded"
          >
            {loading ? 'Loading...' : 'Fetch Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Fetching data...</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Locations */}
          <section className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Locations</h2>
            <div className="bg-gray-50 rounded p-3 overflow-auto max-h-64">
              <pre className="text-xs">
                {JSON.stringify(data.locations, null, 2)}
              </pre>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Count: {Object.keys(data.locations || {}).length}
            </p>
          </section>

          {/* Menus */}
          <section className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Menus</h2>
            <div className="bg-gray-50 rounded p-3 overflow-auto max-h-64">
              <pre className="text-xs">
                {JSON.stringify(data.menus, null, 2)}
              </pre>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Count: {Object.keys(data.menus || {}).length}
            </p>
          </section>

          {/* Unique Menu Item IDs */}
          <section className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Unique Menu Item IDs</h2>
            <div className="bg-gray-50 rounded p-3 overflow-auto max-h-64">
              <pre className="text-xs">
                {(() => {
                  const menuString = JSON.stringify(data.menus);
                  const matches = menuString.match(/"\d{6}"/g) || [];
                  const ids = Array.from(new Set(matches.map((match) => match.replace(/"/g, '')))).sort();
                  return JSON.stringify(ids, null, 2);
                })()}
              </pre>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Count: {(() => {
                const menuString = JSON.stringify(data.menus);
                const matches = menuString.match(/"\d{6}"/g) || [];
                return new Set(matches.map((match) => match.replace(/"/g, ''))).size;
              })()}
            </p>
          </section>

          {/* Menu Items */}
          <section className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Menu Items</h2>
            <div className="bg-gray-50 rounded p-3 overflow-auto max-h-64">
              <pre className="text-xs">
                {JSON.stringify(data.menuItems, null, 2)}
              </pre>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Count: {Object.keys(data.menuItems || {}).length}
            </p>
          </section>

          {/* Interactions */}
          <section className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Interactions</h2>
            <div className="bg-gray-50 rounded p-3 overflow-auto max-h-64">
              <pre className="text-xs">
                {JSON.stringify(data.interactions, null, 2)}
              </pre>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Count: {Object.keys(data.interactions || {}).length}
            </p>
          </section>

          {/* Metrics */}
          <section className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Metrics</h2>
            <div className="bg-gray-50 rounded p-3 overflow-auto max-h-64">
              <pre className="text-xs">
                {JSON.stringify(data.metrics, null, 2)}
              </pre>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Count: {Object.keys(data.metrics || {}).length}
            </p>
          </section>

          {/* Recommendations */}
          <section className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Recommendations</h2>
            <div className="bg-gray-50 rounded p-3 overflow-auto max-h-64">
              <pre className="text-xs">
                {JSON.stringify(data.recommendations, null, 2)}
              </pre>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Count: {Object.keys(data.recommendations || {}).length}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

