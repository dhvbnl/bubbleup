import { useEffect, useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { QRCodeSVG } from 'qrcode.react';
import { api, PartyWithLinks } from '@/lib/api';
import { usePartyWebSocket } from '@/lib/useWebSocket';

export default function ManagePage() {
  const router = useRouter();
  const { id } = router.query;
  const partyId = useMemo(() => typeof id === 'string' ? parseInt(id) : 0, [id]);

  const [partyData, setPartyData] = useState<PartyWithLinks | null>(null);
  const [wordInput, setWordInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const wsUrl = useMemo(() => partyId ? api.getWebSocketUrl(partyId) : '', [partyId]);
  const { party, connected } = usePartyWebSocket(partyId, wsUrl);

  useEffect(() => {
    if (partyId) {
      api.getPartyWithLinks(partyId)
        .then(setPartyData)
        .catch(() => setError('Party not found'))
        .finally(() => setLoading(false));
    }
  }, [partyId]);

  const handleAddWord = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput.trim() || !partyId) return;

    try {
      setSubmitting(true);
      setError('');
      await api.addWord(partyId, wordInput.trim());
      setWordInput('');
    } catch (err) {
      setError('Failed to add word');
    } finally {
      setSubmitting(false);
    }
  }, [wordInput, partyId]);

  const handleStatusChange = useCallback(async (status: 'add' | 'display') => {
    if (!partyId) return;
    try {
      setError('');
      await api.updateStatus(partyId, status);
    } catch (err) {
      setError('Failed to update status');
    }
  }, [partyId]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      setError('Failed to copy to clipboard');
    });
  }, []);

  const currentStatus = useMemo(() => party?.status || partyData?.status || 'add', [party, partyData]);
  const currentWords = useMemo(() => party?.words || partyData?.words || [], [party, partyData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error || !partyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md">
          <div className="text-red-600 text-xl text-center">{error || 'Party not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Party #{partyId} - BubbleUp</title>
      </Head>

      <div className="min-h-screen p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-purple-700">
                Party #{partyId} - Manager
              </h1>
              <div className={`px-4 py-2 rounded-full font-semibold ${
                currentStatus === 'display' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {currentStatus === 'display' ? 'Displaying' : 'Collecting Words'}
              </div>
            </div>

            {/* Connection Status */}
            <div className="mb-6 flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* QR Code and Links */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">QR Code</h2>
                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <QRCodeSVG value={partyData.add_url} size={200} />
                </div>
                <p className="text-sm text-gray-600 text-center mt-4">
                  Scan to add words
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Display URL</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={partyData.display_url}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(partyData.display_url)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Add Words URL</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={partyData.add_url}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(partyData.add_url)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mb-8 flex flex-wrap gap-4">
              <button
                onClick={() => handleStatusChange('add')}
                disabled={currentStatus === 'add'}
                className="flex-1 min-w-[200px] bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-xl transition"
              >
                Collect Words
              </button>
              <button
                onClick={() => handleStatusChange('display')}
                disabled={currentStatus === 'display'}
                className="flex-1 min-w-[200px] bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-xl transition"
              >
                Display Words
              </button>
            </div>

            {/* Add Word Form */}
            <form onSubmit={handleAddWord} className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Add Your Own Word</h2>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Enter a word..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500"
                  maxLength={50}
                />
                <button
                  type="submit"
                  disabled={submitting || !wordInput.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-xl transition"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Words Display */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Words Collected ({currentWords.length})
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 min-h-[200px] flex flex-wrap gap-3 items-center justify-center">
                {currentWords.length === 0 ? (
                  <p className="text-gray-400 italic">No words yet...</p>
                ) : (
                  currentWords.map((word) => (
                    <span
                      key={word.id}
                      className="inline-block bg-gradient-to-r from-purple-500 to-purple-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg animate-fade-in"
                    >
                      {word.text}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
