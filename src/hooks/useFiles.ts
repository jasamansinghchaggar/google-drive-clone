import { useState, useEffect, useCallback } from 'react';
import { fileService } from '@/services/fileService';
import { FileItem, StorageStats, UploadProgress } from '@/types/files';

// Hook for fetching user files
export const useUserFiles = (userId: string, parentId?: string) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userFiles = await fileService.getUserFiles(userId, parentId);
      setFiles(userFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  }, [userId, parentId]);

  useEffect(() => {
    if (userId) {
      fetchFiles();
    }
  }, [userId, fetchFiles]);

  return { files, loading, error, refetch: fetchFiles };
};

// Hook for fetching recent files
export const useRecentFiles = (userId: string) => {
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const files = await fileService.getRecentFiles(userId);
      setRecentFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent files');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchRecentFiles();
    }
  }, [userId, fetchRecentFiles]);

  return { recentFiles, loading, error, refetch: fetchRecentFiles };
};

// Hook for fetching storage statistics
export const useStorageStats = (userId: string) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const storageStats = await fileService.getStorageStats(userId);
      setStats(storageStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch storage stats');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId, fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

// Hook for file upload
export const useFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async (files: File[], userId: string, parentId?: string) => {
    setIsUploading(true);
    const newProgress: UploadProgress[] = files.map(file => ({
      fileId: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));

    setUploadProgress(newProgress);

    const results = await Promise.allSettled(
      files.map(async (file, index) => {
        try {
          const result = await fileService.uploadFile(file, userId, parentId);
          
          setUploadProgress(prev => 
            prev.map((item, i) => 
              i === index 
                ? { ...item, progress: 100, status: 'completed' as const }
                : item
            )
          );
          
          return result;
        } catch (error) {
          setUploadProgress(prev => 
            prev.map((item, i) => 
              i === index 
                ? { 
                    ...item, 
                    status: 'error' as const, 
                    error: error instanceof Error ? error.message : 'Upload failed' 
                  }
                : item
            )
          );
          throw error;
        }
      })
    );

    setIsUploading(false);
    return results;
  };

  const clearProgress = () => {
    setUploadProgress([]);
  };

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    clearProgress
  };
};

// Hook for folder creation
export const useCreateFolder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFolder = async (name: string, userId: string, parentId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const folder = await fileService.createFolder(name, userId, parentId);
      return folder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { createFolder, loading, error };
};
