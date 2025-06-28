import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import type { ChatMessage, ChatResponse } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface ChatSidebarProps {
  selectedPrescriptionId?: string;
}

export function ChatSidebar({ selectedPrescriptionId }: ChatSidebarProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: chatHistory, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/history'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; prescriptionId?: string }): Promise<ChatResponse> => {
      const response = await apiRequest('POST', '/api/chat', data);
      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      setIsTyping(false);
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Chat Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      message: message.trim(),
      prescriptionId: selectedPrescriptionId
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuery = (query: string) => {
    sendMessageMutation.mutate({
      message: query,
      prescriptionId: selectedPrescriptionId
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[700px] flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white"></i>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">MedGenie AI Assistant</h3>
            <p className="text-xs text-slate-500">Powered by GPT-4o • Always consult your doctor</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!selectedPrescriptionId && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-4 text-center">
            <i className="fas fa-info-circle mr-2"></i>
            Please select a prescription from the list to chat with the AI about its details.
          </div>
        )}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Welcome Message */}
            {(!chatHistory || chatHistory.length === 0) && (
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-robot text-primary text-sm"></i>
                </div>
                <div className="flex-1">
                  <div className="bg-slate-100 rounded-lg rounded-tl-none p-3">
                    <p className="text-sm text-slate-700">
                      Hello! I'm your MedGenie AI assistant. I can help you understand your prescriptions, 
                      explain medication instructions, and answer questions about your medical history. 
                      How can I assist you today?
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Just now</p>
                </div>
              </div>
            )}

            {/* Chat History */}
            {chatHistory && chatHistory.slice().reverse().map((msg) => (
              <div key={msg.id} className={`flex space-x-3 ${msg.isUserMessage ? 'justify-end' : ''}`}>
                {msg.isUserMessage ? (
                  <>
                    <div className="flex-1 text-right">
                      <div className="bg-primary text-white rounded-lg rounded-tr-none p-3 inline-block max-w-xs">
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{formatTime(msg.createdAt)}</p>
                    </div>
                    <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-slate-700">JD</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-robot text-primary text-sm"></i>
                    </div>
                    <div className="flex-1">
                      <div className="bg-slate-100 rounded-lg rounded-tl-none p-3 max-w-xs">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{formatTime(msg.createdAt)}</p>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-robot text-primary text-sm"></i>
                </div>
                <div className="flex-1">
                  <div className="bg-slate-100 rounded-lg rounded-tl-none p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-slate-200">
        {/* Medical Safety Warning */}
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <i className="fas fa-exclamation-triangle text-red-600 text-sm"></i>
            <p className="text-xs text-red-700">For emergencies, contact your doctor or call 911. This AI provides information only.</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Ask about your prescriptions, medications, or dosage instructions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending}
              className="text-sm"
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => handleQuickQuery('Explain side effects of my medications')}
            className="text-xs"
            disabled={sendMessageMutation.isPending}
          >
            Explain side effects
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => handleQuickQuery('Check for drug interactions in my prescriptions')}
            className="text-xs"
            disabled={sendMessageMutation.isPending}
          >
            Drug interactions
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => handleQuickQuery('Help me understand dosage timing for my medications')}
            className="text-xs"
            disabled={sendMessageMutation.isPending}
          >
            Dosage timing
          </Button>
        </div>
      </div>
    </div>
  );
}
