const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Word {
  id: number;
  text: string;
  party_id: number;
}

export interface Party {
  id: number;
  status: 'add' | 'display';
  words: Word[];
}

export interface PartyWithLinks extends Party {
  manage_url: string;
  display_url: string;
  add_url: string;
  qr_code?: string;
}

export const api = {
  async createParty(): Promise<PartyWithLinks> {
    const res = await fetch(`${API_BASE_URL}/api/party/`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to create party');
    return res.json();
  },

  async getParty(id: number): Promise<Party> {
    const res = await fetch(`${API_BASE_URL}/api/party/${id}`);
    if (!res.ok) throw new Error('Party not found');
    return res.json();
  },

  async getPartyWithLinks(id: number): Promise<PartyWithLinks> {
    const res = await fetch(`${API_BASE_URL}/api/party/${id}/links`);
    if (!res.ok) throw new Error('Party not found');
    return res.json();
  },

  async addWord(partyId: number, text: string): Promise<Word> {
    const res = await fetch(`${API_BASE_URL}/api/party/${partyId}/words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to add word');
    return res.json();
  },

  async updateStatus(partyId: number, status: 'add' | 'display'): Promise<Party> {
    const res = await fetch(`${API_BASE_URL}/api/party/${partyId}/status?status=${status}`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  getWebSocketUrl(partyId: number): string {
    const wsBase = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsBase}/api/party/${partyId}/ws`;
  },
};
