import { useState, useEffect } from 'react';
import { Prescription } from '../lib/types';

// useAIChat manages the AI chat state for a specific prescription.
export function useAIChat(prescription: Prescription | null | undefined) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chat history for this prescription
  useEffect(() => {
    if (!prescription?.id) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch('/api/chat/history')
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        // Filter messages for this prescription
        setMessages(data.filter((msg: any) => msg.prescriptionId === prescription.id));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch chat history');
        setLoading(false);
      });
  }, [prescription?.id]);

  // Send a new message to the AI
  const sendMessage = async (message: string) => {
    if (!prescription?.id) return;
    setLoading(true);
    setError(null);
    // Optimistically add user message
    setMessages(prev => [...prev, { message, isUserMessage: true }]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, prescriptionId: prescription.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages(prev => [...prev, { message: data.response, isUserMessage: false }]);
    } catch (err) {
      setError((err as Error).message || 'Failed to send message');
    }
    setLoading(false);
  };

  return { messages, loading, error, sendMessage };
}
