'use client'

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFiles';
import { useAuth } from '@/contexts/AuthContext';
import { formatFileSize } from '@/utils/fileUtils';

interface FileUploadProps {
  children: React.ReactNode;
  onUploadComplete?: () => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  id: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ children, onUploadComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { uploadFiles } = useFileUpload();

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !user) return;

    const fileArray = Array.from(files);
    const newFiles: UploadFile[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setFileList(prev => [...prev, ...newFiles]);

    // Use the real upload service
    uploadRealFiles(fileArray);
  };

  const uploadRealFiles = async (files: File[]) => {
    if (!user) return;

    try {
      await uploadFiles(files, user.$id);
      
      // Update status based on results
      setFileList(prev => prev.map(uploadFile => {
        const fileIndex = files.findIndex(f => f.name === uploadFile.file.name);
        if (fileIndex !== -1) {
          return {
            ...uploadFile,
            progress: 100,
            status: 'completed' as const
          };
        }
        return uploadFile;
      }));

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setFileList(prev => prev.map(uploadFile => ({
        ...uploadFile,
        status: 'error' as const
      })));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (fileId: string) => {
    setFileList(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Choose files to upload to your drive
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-brand bg-brand-muted' 
                : 'border-border hover:border-muted-foreground'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop files here, or click to select
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
              accept="*/*"
            />
          </div>

          {/* Upload Progress */}
          {fileList.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <h4 className="text-sm font-medium">Uploading Files</h4>
              {fileList.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="mt-1 h-1" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadFile.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                console.log('Files uploaded successfully');
                setIsOpen(false);
                setFileList([]);
              }}
              disabled={fileList.length === 0 || fileList.some(f => f.status === 'uploading')}
            >
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUpload;
