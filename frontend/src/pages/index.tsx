import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createParty = async () => {
    try {
      setLoading(true);
      setError('');
      const party = await api.createParty();
      router.push(`/party/${party.id}/manage`);
    } catch (err) {
      setError('Failed to create party. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>BubbleUp - Live Word Bubbles</title>
        <meta name="description" content="Create interactive word bubble parties" />
      </Head>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800 mb-4">
              BubbleUp
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Create interactive word bubble parties that come alive in real-time!
            </p>

            <div className="space-y-6 text-left mb-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Create a Party</h3>
                  <p className="text-gray-600">Start a new word bubble session</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Share the Link</h3>
                  <p className="text-gray-600">Get a QR code or link for participants</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Watch Words Appear</h3>
                  <p className="text-gray-600">See bubbles float in real-time on the display</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={createParty}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Creating Party...' : 'Create Party'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
