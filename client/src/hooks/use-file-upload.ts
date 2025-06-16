import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { UploadResponse } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest('POST', '/api/prescriptions/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: "Your prescription is being processed by AI. This may take a few moments.",
      });
      
      // Invalidate prescriptions to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      
      // Start polling for completion
      pollForCompletion(data.id);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }
  });

  const pollForCompletion = (prescriptionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await apiRequest('GET', `/api/prescriptions/${prescriptionId}`);
        const prescription = await response.json();
        
        if (prescription.processingStatus === 'completed') {
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
          toast({
            title: "Processing Complete",
            description: "Your prescription has been successfully analyzed!",
          });
        } else if (prescription.processingStatus === 'failed') {
          clearInterval(interval);
          toast({
            title: "Processing Failed",
            description: "Failed to analyze prescription. Please try uploading again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  };

  return {
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadProgress,
  };
}
