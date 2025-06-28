import React, { useState, useRef, useEffect } from 'react';
import { Prescription } from '../../lib/types';
import { useAIChat } from '../../hooks/useAIChat';

interface AskAIModalProps {
  prescription: Prescription | null;
  open: boolean;
  onClose: () => void;
}

const quickActions = [
  'What is the dosage timing?',
  'Are there any drug interactions?',
  'What are the side effects?',
  'Can I take this with food?',
];

// AskAIModal provides an AI chat interface specific to the prescription.
const AskAIModal: React.FC<AskAIModalProps> = ({ prescription, open, onClose }) => {
  // Always call hooks at the top level
  const { messages, loading, error, sendMessage } = useAIChat(prescription);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!open || !prescription) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput('');
  };

  const handleQuickAction = async (q: string) => {
    setInput(q);
    await sendMessage(q);
    setInput('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full relative flex flex-col h-[80vh]">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Ask AI about this Prescription</h2>
        <div className="mb-2 text-slate-600 text-sm">Doctor: <span className="font-medium">{prescription.doctorName}</span> | Patient: <span className="font-medium">{prescription.patientName}</span></div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickActions.map((q, idx) => (
            <button key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium hover:bg-primary/20" onClick={() => handleQuickAction(q)} disabled={loading}>{q}</button>
          ))}
        </div>
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-50 rounded p-3 mb-4">
          {messages.length === 0 && <div className="text-slate-400 text-center">No messages yet. Ask a question!</div>}
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-2 flex ${msg.isUserMessage ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.isUserMessage ? 'bg-primary text-white' : 'bg-slate-200 text-slate-800'}`}>{msg.message}</div>
            </div>
          ))}
          {loading && <div className="text-slate-400 text-center">AI is typing...</div>}
          <div ref={messagesEndRef} />
        </div>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {/* Input */}
        <div className="flex gap-2">
          <input
            className="flex-1 border border-slate-300 rounded px-3 py-2"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question..."
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            disabled={loading}
          />
          <button
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >Send</button>
        </div>
        <button className="absolute top-2 right-2 text-slate-400 hover:text-red-500" onClick={onClose}>X</button>
      </div>
    </div>
  );
};

export default AskAIModal;
