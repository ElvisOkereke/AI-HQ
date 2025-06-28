'use client';
import React from 'react';
import { MediaItem } from '../../types/types';
import { Image, FileText, Download } from 'lucide-react';

interface MediaDisplayProps {
  mediaItems: MediaItem[];
  onDownload?: (mediaItem: MediaItem) => void;
}

export function MediaDisplay({ mediaItems, onDownload }: MediaDisplayProps) {
  if (mediaItems.length === 0) return null;

  const handleDownload = (mediaItem: MediaItem) => {
    if (onDownload) {
      onDownload(mediaItem);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = `data:${mediaItem.fileType};base64,${mediaItem.fileData}`;
      link.download = mediaItem.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {mediaItems.map((mediaItem) => (
        <div key={mediaItem.id} className="media-item">
          {mediaItem.mediaType === 'image' ? (
            <div className="relative group">
              <img
                src={`data:${mediaItem.fileType};base64,${mediaItem.fileData}`}
                alt={mediaItem.fileName}
                className="max-w-xs max-h-64 rounded-lg border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleDownload(mediaItem)}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(mediaItem);
                  }}
                  className="p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                  title="Download image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg border border-gray-600 max-w-xs">
              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-sm text-gray-300 truncate flex-1">{mediaItem.fileName}</span>
              <button
                onClick={() => handleDownload(mediaItem)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                title="Download file"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface MediaPreviewProps {
  mediaItems: MediaItem[];
  onRemove: (id: number) => void;
}

export function MediaPreview({ mediaItems, onRemove }: MediaPreviewProps) {
  if (mediaItems.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {mediaItems.map((mediaItem) => (
        <div
          key={mediaItem.id}
          className="flex items-center gap-2 bg-gray-700 rounded-lg p-2 border border-gray-600 max-w-xs"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {mediaItem.mediaType === 'image' ? (
              <Image className="w-4 h-4 text-blue-400 flex-shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-green-400 flex-shrink-0" />
            )}
            <span className="text-sm text-gray-300 truncate">{mediaItem.fileName}</span>
          </div>
          <button
            onClick={() => onRemove(mediaItem.id)}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Remove attachment"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
