import { Databases, Storage, Query, Permission, Role } from 'appwrite';
import { APPWRITE_CONFIG } from '@/config/appwrite';
import { FileItem, CreateFileData, StorageStats } from '@/types/files';
import client from '@/lib/appwrite';

class FileService {
  private databases: Databases;
  private storage: Storage;

  constructor() {
    this.databases = new Databases(client);
    this.storage = new Storage(client);
  }

  // Ensure the client has a valid session before making requests
  private async ensureAuthenticated(): Promise<void> {
    try {
      const { account } = await import('@/lib/appwrite');
      await account.get(); // This will throw if not authenticated
    } catch {
      throw new Error('User not authenticated. Please sign in again.');
    }
  }

  // Get all files for a user
  async getUserFiles(userId: string, parentId?: string): Promise<FileItem[]> {
    try {
      await this.ensureAuthenticated();
      
      const queries = [
        Query.equal('userId', userId),
        Query.orderDesc('$updatedAt')
      ];

      if (parentId) {
        queries.push(Query.equal('parentId', parentId));
      } else {
        queries.push(Query.isNull('parentId'));
      }

      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.FILES_COLLECTION_ID,
        queries
      );

      return response.documents as unknown as FileItem[];
    } catch (error) {
      console.error('Error fetching user files:', error);
      throw new Error('Failed to fetch files');
    }
  }

  // Get recent files (last 10)
  async getRecentFiles(userId: string): Promise<FileItem[]> {
    try {
      await this.ensureAuthenticated();
      
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.FILES_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('type', 'file'),
          Query.orderDesc('$updatedAt'),
          Query.limit(10)
        ]
      );

      return response.documents as unknown as FileItem[];
    } catch (error) {
      console.error('Error fetching recent files:', error);
      throw new Error('Failed to fetch recent files');
    }
  }

  // Get storage statistics for a user
  async getStorageStats(userId: string): Promise<StorageStats> {
    try {
      await this.ensureAuthenticated();
      
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.FILES_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('type', 'file'),
          Query.limit(1000) // Adjust based on your needs
        ]
      );

      const files = response.documents as unknown as FileItem[];
      
      const stats: StorageStats = {
        totalFiles: files.length,
        totalSize: 0,
        documents: { count: 0, size: 0 },
        images: { count: 0, size: 0 },
        videos: { count: 0, size: 0 },
        others: { count: 0, size: 0 }
      };

      files.forEach(file => {
        stats.totalSize += file.size;
        
        if (file.mimeType) {
          const category = this.getFileCategory(file.mimeType);
          stats[category].count++;
          stats[category].size += file.size;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      throw new Error('Failed to fetch storage statistics');
    }
  }

  // Create a new file or folder
  async createFile(data: CreateFileData, userId: string): Promise<FileItem> {
    try {
      const response = await this.databases.createDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.FILES_COLLECTION_ID,
        'unique()',
        {
          ...data,
          userId,
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );

      return response as unknown as FileItem;
    } catch (error) {
      console.error('Error creating file:', error);
      throw new Error('Failed to create file');
    }
  }

  // Upload file to storage
  async uploadFile(file: File, userId: string, parentId?: string): Promise<FileItem> {
    try {
      // Ensure user is authenticated
      await this.ensureAuthenticated();

      // Check file size
      if (file.size > APPWRITE_CONFIG.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum limit of ${APPWRITE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      // Check total storage usage
      const stats = await this.getStorageStats(userId);
      if (stats.totalSize + file.size > APPWRITE_CONFIG.MAX_TOTAL_STORAGE) {
        throw new Error('Storage limit exceeded');
      }

      // Upload to storage - Don't specify permissions, let bucket permissions handle it
      const storageFile = await this.storage.createFile(
        APPWRITE_CONFIG.STORAGE_BUCKET_ID,
        'unique()',
        file
      );

      // Create database record
      const fileData: CreateFileData = {
        name: file.name,
        type: 'file',
        mimeType: file.type,
        size: file.size,
        parentId,
        bucketFileId: storageFile.$id
      };

      return await this.createFile(fileData, userId);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Create a new folder
  async createFolder(name: string, userId: string, parentId?: string): Promise<FileItem> {
    try {
      const folderData: CreateFileData = {
        name,
        type: 'folder',
        size: 0,
        parentId
      };

      return await this.createFile(folderData, userId);
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  // Delete a file or folder
  async deleteFile(fileId: string): Promise<void> {
    try {
      // Get file details
      const file = await this.databases.getDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.FILES_COLLECTION_ID,
        fileId
      ) as unknown as FileItem;

      // If it's a file with storage, delete from storage first
      if (file.type === 'file' && file.bucketFileId) {
        await this.storage.deleteFile(
          APPWRITE_CONFIG.STORAGE_BUCKET_ID,
          file.bucketFileId
        );
      }

      // Delete database record
      await this.databases.deleteDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.FILES_COLLECTION_ID,
        fileId
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Get file download URL
  getFilePreview(bucketFileId: string): string {
    return this.storage.getFilePreview(
      APPWRITE_CONFIG.STORAGE_BUCKET_ID,
      bucketFileId
    ).toString();
  }

  // Get file download URL
  getFileDownload(bucketFileId: string): string {
    return this.storage.getFileDownload(
      APPWRITE_CONFIG.STORAGE_BUCKET_ID,
      bucketFileId
    ).toString();
  }

  private getFileCategory(mimeType: string): 'documents' | 'images' | 'videos' | 'others' {
    if (APPWRITE_CONFIG.SUPPORTED_FILE_TYPES.documents.includes(mimeType)) {
      return 'documents';
    }
    if (APPWRITE_CONFIG.SUPPORTED_FILE_TYPES.images.includes(mimeType)) {
      return 'images';
    }
    if (APPWRITE_CONFIG.SUPPORTED_FILE_TYPES.videos.includes(mimeType)) {
      return 'videos';
    }
    return 'others';
  }
}

export const fileService = new FileService();
