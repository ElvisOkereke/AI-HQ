'use client';
import React from 'react'
import { useState, useRef } from 'react';
import { Paperclip, CheckCircle, Loader2 } from 'lucide-react';
import { motion} from 'motion/react';



export function FileUploadButton({ onFileUpload }: { onFileUpload: (fileData: string, fileType: string, fileName: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(false);

    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onFileUpload(reader.result, file.type, file.name);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 2000);
          }
          setUploading(false);
        };
        reader.onerror = () => {
          setUploading(false);
          alert('Error reading image file.');
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onFileUpload(reader.result, file.type, file.name);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 2000);
          }
          setUploading(false);
        };
        reader.onerror = () => {
          setUploading(false);
          alert('Error reading text file.');
        };
        reader.readAsText(file);
      } else {
        alert('Only image or .txt files are supported.');
        setUploading(false);
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Error uploading file.');
      setUploading(false);
    }
    
    e.target.value = '';
  };

  return (
    <>
      <button
        type="button"
        className={`p-2 rounded-full transition-all duration-200 relative ${
          uploading 
            ? 'text-blue-400 bg-blue-500/20' 
            : uploadSuccess 
              ? 'text-green-400 bg-green-500/20' 
              : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        onClick={handleButtonClick}
        title="Attach file"
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : uploadSuccess ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
        
        {/* Status indicator dot */}
        {uploading && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
        )}
        {uploadSuccess && !uploading && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500"
          />
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.txt"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}