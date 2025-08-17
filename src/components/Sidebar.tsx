'use client'

import React from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Home, FolderOpen, HardDrive, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStorageStats } from '@/hooks/useFiles';
import { formatFileSize } from '@/utils/fileUtils';
import { APPWRITE_CONFIG } from '@/config/appwrite';
import FileUpload from './FileUpload';

interface SidebarProps {
  className?: string;
  userId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className, userId }) => {
  const { stats } = useStorageStats(userId || '');
  
  // Calculate storage usage
  const usedStorage = stats ? stats.totalSize : 0;
  const totalStorage = APPWRITE_CONFIG.MAX_TOTAL_STORAGE;
  const storagePercentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;

  const formatStorage = (sizeInBytes: number) => {
    return formatFileSize(sizeInBytes);
  };

  const menuItems = [
    {
      icon: Home,
      label: 'Home',
      href: '/dashboard',
      active: true,
    },
    {
      icon: FolderOpen,
      label: 'My Files',
      href: '/dashboard/files',
      active: false,
    },
  ];

  return (
    <div className={cn('w-64 h-full bg-white border-r flex flex-col', className)}>
      {/* New Button */}
      <div className="p-4">
        <FileUpload>
          <Button className="w-full justify-start" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </FileUpload>
      </div>

      <Separator />

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Button
                variant={item.active ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  item.active && 'bg-accent text-accent-foreground'
                )}
                asChild
              >
                <a href={item.href}>
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </a>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <Separator />

      {/* Storage Section */}
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <HardDrive className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Storage</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatStorage(usedStorage)} used</span>
            <span>{formatStorage(totalStorage)} total</span>
          </div>
          
          <Progress 
            value={storagePercentage} 
            className="h-2"
          />
          
          <div className="text-xs text-muted-foreground text-center">
            {(100 - storagePercentage).toFixed(1)}% remaining
          </div>
        </div>

        {storagePercentage > 80 && (
          <div className="mt-3">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Upgrade Storage
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
