import { useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { usePartyWebSocket } from '@/lib/useWebSocket';

export default function DisplayPage() {
  const router = useRouter();
  const { id } = router.query;
  const partyId = useMemo(() => typeof id === 'string' ? parseInt(id) : 0, [id]);

  const wsUrl = useMemo(() => partyId ? api.getWebSocketUrl(partyId) : '', [partyId]);
  const { party, connected } = usePartyWebSocket(partyId, wsUrl);

  const addUrl = useMemo(() => {
    if (typeof window !== 'undefined' && partyId) {
      return `${window.location.origin}/party/${partyId}/add`;
    }
    return '';
  }, [partyId]);

  const isDisplayMode = useMemo(() => party?.status === 'display', [party]);

  if (!party) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Loading party...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Party #{partyId} Display - BubbleUp</title>
      </Head>

      <div className="min-h-screen p-4 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            BubbleUp Party #{partyId}
          </h1>
          <div className={`inline-block px-6 py-2 rounded-full font-semibold ${
            isDisplayMode 
              ? 'bg-green-400 text-green-900' 
              : 'bg-yellow-400 text-yellow-900'
          }`}>
            {isDisplayMode ? '✨ Displaying Words' : '📝 Add Your Words'}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          {isDisplayMode ? (
            /* Display Mode - Show Words */
            <div className="w-full max-w-6xl">
              {party.words.length === 0 ? (
                <div className="text-center">
                  <p className="text-white text-3xl font-semibold">
                    Waiting for words to appear...
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 justify-center items-center">
                  {party.words.map((word, index) => (
                    <div
                      key={word.id}
                      className="animate-fade-in animate-float bg-white text-purple-700 px-8 py-4 rounded-full font-bold text-2xl shadow-2xl"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        animationDuration: `${3 + (index % 3)}s`,
                      }}
                    >
                      {word.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Add Mode - Show Instructions */
            <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
              <h2 className="text-4xl font-bold text-purple-700 mb-6">
                Add Your Word!
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Scan the QR code or visit:
              </p>
              <div className="bg-gray-100 rounded-xl p-6 mb-8">
                <p className="text-lg font-mono break-all text-gray-800">
                  {addUrl}
                </p>
              </div>
              <p className="text-gray-500">
                {party.words.length} {party.words.length === 1 ? 'word' : 'words'} collected
              </p>
            </div>
          )}
        </div>

        {/* Connection Indicator */}
        <div className="text-center mt-4">
          <div className="inline-flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-white text-sm">
              {connected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
