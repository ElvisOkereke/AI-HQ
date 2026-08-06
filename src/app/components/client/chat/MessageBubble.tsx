import { useRef, useState } from 'react';
import { Building2, User, Copy, Check, MoreHorizontal, RefreshCw, GitBranch, Download, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chat, Message } from '../../../types/types';
import { MessageContent } from '../MessageFormatting';
import { MediaDisplay } from '../MediaDisplay';
import { getMessageMedia } from '../../../utils/mediaUtils';

const IMAGE_DATA_URL_RE = /^data:image\/[a-zA-Z]+;base64,/;

function MessageMenu({
  message,
  onCopy,
  onRegenerate,
  onBranch,
  onDelete,
  onDownload,
  onEdit,
}: {
  message: Message;
  onCopy: () => void;
  onRegenerate?: () => void;
  onBranch?: () => void;
  onDelete: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isImage = IMAGE_DATA_URL_RE.test(message.content);
  const isUserMessage = message.role === 'user';

  return (
    <div
      className="relative"
      ref={menuRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-600 transition-all duration-200 text-gray-400 hover:text-white">
        <MoreHorizontal className="w-4 h-4" />
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className={`absolute ${isUserMessage ? 'bottom-0 right-10' : 'bottom-0 left-10'} mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-1 z-10 min-w-[140px]`}
          >
            <button
              onClick={handleCopy}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            {isUserMessage && onEdit && (
              <button
                onClick={() => onEdit()}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}

            {!isUserMessage && onRegenerate && (
              <button
                onClick={() => onRegenerate()}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            )}

            {!isUserMessage && onBranch && (
              <button
                onClick={() => onBranch()}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Branch Chat
              </button>
            )}

            {isImage && onDownload && (
              <button
                onClick={() => onDownload()}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}

            <button
              onClick={() => onDelete()}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type MessageBubbleProps = {
  message: Message;
  activeChat: Chat;
  onCopy: (content: string) => void;
  onRegenerate: (messageId: number) => void;
  onBranch: (messageId: number) => void;
  onDelete: (messageId: number) => void;
  onDownload: (content: string) => void;
  onEdit: (messageId: number, content: string) => void;
};

export function MessageBubble({ message: msg, activeChat, onCopy, onRegenerate, onBranch, onDelete, onDownload, onEdit }: MessageBubbleProps) {
  const isImage = IMAGE_DATA_URL_RE.test(msg.content);

  return (
    <div className={`flex items-start gap-4 group ${msg.role === 'user' ? 'justify-end' : ''}`}>
      {msg.role === 'model' && (
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 rounded-full">
          <Building2 className="w-6 h-6 text-white" />
        </div>
      )}
      <div className={`relative max-w-xl p-4 rounded-xl ${
        msg.role === 'user'
          ? 'bg-blue-600 rounded-br-none'
          : 'bg-gray-700 rounded-bl-none'
      }`}>
        {isImage ? (
          <img
            src={msg.content}
            alt="Generated image"
            className="max-w-xs max-h-64 rounded-lg border border-gray-600"
          />
        ) : (
          <div>
            <MessageContent content={msg.content} />
            <MediaDisplay mediaItems={getMessageMedia(activeChat, msg.id)} />
            {msg.isStreaming && <span className="inline-block w-2 h-4 bg-white ml-2 animate-pulse rounded-full" />}
          </div>
        )}
        <div className={`absolute ${msg.role === 'user' ? 'bottom-2 left-2' : 'bottom-2 right-2'}`}>
          <MessageMenu
            message={msg}
            onCopy={() => onCopy(msg.content)}
            onRegenerate={msg.role !== 'user' ? () => onRegenerate(msg.id) : undefined}
            onBranch={msg.role !== 'user' ? () => onBranch(msg.id) : undefined}
            onDelete={() => onDelete(msg.id)}
            onDownload={isImage ? () => onDownload(msg.content) : undefined}
            onEdit={msg.role === 'user' ? () => onEdit(msg.id, msg.content) : undefined}
          />
        </div>
      </div>
      {msg.role === 'user' && (
        <div className="mt-4 w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-600 rounded-full">
          <User className="w-6 h-6 text-gray-300" />
        </div>
      )}
    </div>
  );
}
