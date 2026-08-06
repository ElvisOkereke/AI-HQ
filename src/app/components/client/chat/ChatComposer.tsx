import { RefObject } from 'react';
import { CornerDownLeft, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MediaItem } from '../../../types/types';
import { FileUploadButton } from '../FileUpload';
import { MediaPreview } from '../MediaDisplay';

type ChatComposerProps = {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isSending: boolean;
  pendingMedia: MediaItem[];
  onRemovePendingMedia: (id: number) => void;
  onFileUpload: (fileData: string, fileType: string, fileName: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function ChatComposer({
  input,
  onInputChange,
  onSend,
  onKeyDown,
  isSending,
  pendingMedia,
  onRemovePendingMedia,
  onFileUpload,
  textareaRef,
}: ChatComposerProps) {
  return (
    <footer className="p-2 sm:p-4">
      <div className="max-w-3xl mx-auto">
        {/* Attachments Preview */}
        <AnimatePresence>
          {pendingMedia.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <MediaPreview
                mediaItems={pendingMedia}
                onRemove={onRemovePendingMedia}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Container */}
        <div className="relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg p-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything..."
            className="w-full bg-transparent p-2 sm:p-3 pr-16 sm:pr-20 text-gray-100 placeholder-gray-400 focus:outline-none resize-none text-sm sm:text-base"
            rows={1}
            disabled={isSending}
          />
          <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 flex items-center gap-1 sm:gap-2">
            <FileUploadButton onFileUpload={onFileUpload} />
            <button
              onClick={onSend}
              className={`p-2 sm:p-3 rounded-full transition-colors ${
                !input.trim() || isSending
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500'
              } text-white`}
              disabled={!input.trim() || isSending}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <CornerDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-center text-gray-500 mt-2">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </footer>
  );
}
