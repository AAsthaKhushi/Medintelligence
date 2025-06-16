import { useCallback } from 'react';
import { useFileUpload } from '@/hooks/use-file-upload';
import { Button } from '@/components/ui/button';

export function UploadSection() {
  const { upload, isUploading } = useFileUpload();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      upload(file);
    }
  }, [upload]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      upload(file);
    }
  }, [upload]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upload Prescription</h2>
          <p className="text-sm text-slate-600">AI-powered extraction supports PDF, images, and DOCX files</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-600 font-medium">GPT-4o Ready</span>
        </div>
      </div>

      <div 
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-primary transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <i className="fas fa-cloud-upload-alt text-2xl text-primary"></i>
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700">Drop your prescription files here</p>
            <p className="text-sm text-slate-500">or click to browse (PDF, JPG, PNG, DOCX)</p>
          </div>
          <div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label htmlFor="file-upload">
              <Button 
                className="bg-primary text-white hover:bg-primary/90" 
                disabled={isUploading}
                asChild
              >
                <span className="cursor-pointer">
                  {isUploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </>
                  ) : (
                    'Choose Files'
                  )}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-brain text-primary"></i>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">AI Extraction in Progress</h4>
                <p className="text-sm text-slate-600">GPT-4o Vision analyzing your prescription</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium text-primary">Processing...</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Extraction Progress</span>
              <span className="text-sm font-medium text-slate-900">Analyzing...</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
