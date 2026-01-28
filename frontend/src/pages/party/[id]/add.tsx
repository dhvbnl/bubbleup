import { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';

export default function AddPage() {
  const router = useRouter();
  const { id } = router.query;
  const partyId = useMemo(() => typeof id === 'string' ? parseInt(id) : 0, [id]);

  const [wordInput, setWordInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput.trim() || !partyId) return;

    try {
      setSubmitting(true);
      setError('');
      await api.addWord(partyId, wordInput.trim());
      setSuccess(true);
      setWordInput('');
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to add word. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [wordInput, partyId]);

  return (
    <>
      <Head>
        <title>Add Word - Party #{partyId}</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-700 mb-2">
              Add Your Word
            </h1>
            <p className="text-gray-600">
              Party #{partyId}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="word" className="block text-sm font-medium text-gray-700 mb-2">
                Your Word
              </label>
              <input
                id="word"
                type="text"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder="Enter a word or phrase..."
                maxLength={50}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition"
                disabled={submitting}
              />
              <p className="mt-2 text-sm text-gray-500">
                {wordInput.length}/50 characters
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl font-semibold">
                ✓ Word added successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !wordInput.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {submitting ? 'Adding...' : 'Add Word'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Your word will appear on the display screen in real-time
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
