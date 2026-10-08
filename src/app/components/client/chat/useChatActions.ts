import { useState, useEffect } from 'react';
import { newObjectIdAction, sendMessageToAIAction, generateTitleAction, saveChatToDbAction, updateChatModelAction } from '../../actions/dbActions';
import { readStreamableValue } from 'ai/rsc';
import { llmModels } from '../models';
import { Chat, LLMModel, Message, MediaItem, User } from '../../../types/types';
import { createNewChat } from '../../../utils/mediaUtils';
import { logger } from '../../../utils/logger';

type UseChatActionsArgs = {
  activeChat: Chat | undefined;
  user?: User;
  setActiveChat: React.Dispatch<React.SetStateAction<Chat | undefined>>;
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
  extraModels?: LLMModel[];
};

export function useChatActions({ activeChat, user, setActiveChat, setChatList, extraModels }: UseChatActionsArgs) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(llmModels[0]);
  const [showModelChangeModal, setShowModelChangeModal] = useState(false);
  const [pendingModelChange, setPendingModelChange] = useState<LLMModel | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<MediaItem[]>([]);
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // Update selected model when active chat changes
  useEffect(() => {
    if (activeChat?.model) {
      const allModels = extraModels?.length ? [...llmModels, ...extraModels] : llmModels;
      const chatModel = allModels.find(m => m.id === activeChat.model);
      if (chatModel) {
        setSelectedModel(chatModel);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat]);

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleDownloadImage = (content: string) => {
    const link = document.createElement('a');
    link.href = content;
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditMessage = (messageId: number, content: string) => {
    setEditingMessage(messageId);
    setEditText(content);
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!activeChat || !user?.email) return;

    const updatedChat = {
      ...activeChat,
      chatHistory: activeChat.chatHistory.filter(msg => msg.id !== messageId)
    };

    setActiveChat(updatedChat);

    try {
      if (!user?.isGuest) {
        await saveChatToDbAction(updatedChat, user);
      }
      setChatList(prev =>
        prev.map(chat =>
          chat._id === activeChat._id ? updatedChat : chat
        )
      );
    } catch (error) {
      logger.error('Error deleting message:', error);
    }
  };

  const handleSaveEdit = async (messageId: number) => {
    if (!activeChat || !user?.email) return;

    if (editText.trim() === '') {
      if (confirm('Delete this message? This action cannot be undone.')) {
        handleDeleteMessage(messageId);
      }
      return;
    }

    const updatedChat = {
      ...activeChat,
      chatHistory: activeChat.chatHistory.map(msg =>
        msg.id === messageId ? { ...msg, content: editText } : msg
      )
    };

    setActiveChat(updatedChat);
    setEditingMessage(null);
    setEditText('');

    try {
      if (!user?.isGuest) {
        await saveChatToDbAction(updatedChat, user);
      }
      setChatList(prev =>
        prev.map(chat =>
          chat._id === activeChat._id ? updatedChat : chat
        )
      );
    } catch (error) {
      logger.error('Error saving edited message:', error);
    }
  };

  const handleRegenerateMessage = async (messageId: number) => {
    if (!activeChat || !user?.email) return;

    const messageIndex = activeChat.chatHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Remove the message and all subsequent messages
    const updatedHistory = activeChat.chatHistory.slice(0, messageIndex);
    const updatedChat = { ...activeChat, chatHistory: updatedHistory };
    setActiveChat(updatedChat);

    // Regenerate from the previous user message
    const lastUserMessage = updatedHistory.slice().reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      setIsSending(true);
      // Trigger regeneration logic similar handleSend
    }
  };

  const handleBranchChat = async (messageId: number) => {
    if (!activeChat || !user?.email) return;

    const messageIndex = activeChat.chatHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    // Create new chat with history up to this message
    const branchedHistory = activeChat.chatHistory.slice(0, messageIndex + 1);
    const idResp = await newObjectIdAction();

    if (idResp.success && idResp.data) {
      const newId = JSON.parse(idResp.data);
      const branchedChat = {
        _id: newId,
        title: `${activeChat.title} (Branch)`,
        model: activeChat.model,
        chatHistory: branchedHistory,
        mediaItems: activeChat.mediaItems
      };

      try {
        if (!user?.isGuest) {
          await saveChatToDbAction(branchedChat, user);
        }
        setChatList(prev => [...prev, branchedChat]);
        setActiveChat(branchedChat);
      } catch (error) {
        logger.error('Error creating branch:', error);
      }
    }
  };

  const handleModelChange = async (newModel: LLMModel) => {
    // If no active chat or same model, just update selected model
    if (!activeChat || activeChat.model === newModel.id) {
      setSelectedModel(newModel);
      return;
    }

    // If different model and existing chat, show confirmation
    setPendingModelChange(newModel);
    setShowModelChangeModal(true);
  };

  const confirmModelChange = async () => {
    if (!pendingModelChange || !activeChat || !user?.email) return;

    try {
      // Update chat model in database
      const updateResult = await updateChatModelAction(activeChat._id, pendingModelChange.id, user);

      if (updateResult.success) {
        // Update local state
        const updatedChat = { ...activeChat, model: pendingModelChange.id };
        setActiveChat(updatedChat);

        // Update chat list
        setChatList(prev =>
          prev.map(chat =>
            chat._id === activeChat._id
              ? { ...chat, model: pendingModelChange.id }
              : chat
          )
        );

        setSelectedModel(pendingModelChange);
      } else {
        logger.error('Failed to update chat model:', updateResult.error);
      }
    } catch (error) {
      logger.error('Error updating chat model:', error);
    }

    setShowModelChangeModal(false);
    setPendingModelChange(null);
  };

  const cancelModelChange = () => {
    setShowModelChangeModal(false);
    setPendingModelChange(null);
  };

  const removePendingMedia = (id: number) => {
    setPendingMedia(prev => prev.filter(media => media.id !== id));
  };

  const handleFileUpload = (fileData: string, fileType: string, fileName: string) => {
    return; // disable this feature for now in prod, does not work properly
    const newMediaItem: MediaItem = {
      id: Date.now() + Math.random(),
      messageId: 0, // Will be set when message is sent
      fileName,
      fileData,
      fileType,
      mediaType: fileType.startsWith('image/') ? 'image' : 'file',
      timestamp: Date.now()
    };
    setPendingMedia(prev => [...prev, newMediaItem]);
  };

  const handleSend = async () => {
    if (input.trim() === '' || isSending) return;
    if (!user?.email) throw new Error('Something went wrong, user not authenticated');
    try {
      const messageInput = input;

      setInput('');
      setIsSending(true);

      const messageId = Date.now();
      const userMessage: Message = {
        id: messageId,
        content: messageInput,
        role: 'user',
        mediaIds: pendingMedia.map(m => m.id)
      };

      // Associate pending media with this message
      const messageMedia = pendingMedia.map(media => ({
        ...media,
        messageId: messageId
      }));

      setPendingMedia([]); // Clear pending media after sending

      let chatToUpdate = activeChat;
      if (activeChat) {
        chatToUpdate = {
          ...activeChat,
          chatHistory: [...activeChat.chatHistory, userMessage],
          mediaItems: [...activeChat.mediaItems, ...messageMedia]
        };
        setActiveChat(chatToUpdate);
      } else {
        const idResp = await newObjectIdAction();
        const titleResp = await generateTitleAction(selectedModel.id, userMessage, user);
        if (idResp.success && idResp.data && titleResp.success && titleResp.data) {
          const chatId = JSON.parse(idResp.data);
          const title = titleResp.data;
          chatToUpdate = createNewChat(chatId, title, selectedModel.id);
          chatToUpdate.chatHistory = [userMessage];
          chatToUpdate.mediaItems = messageMedia;
          setActiveChat(chatToUpdate);
        } else throw new Error(idResp.error ? idResp.error : "No id error, " + titleResp.error ? idResp.error : "No title error.");
      }


      // Call the Server Action
      const result = await sendMessageToAIAction(selectedModel.id, chatToUpdate, user);

      // Add AI placeholder message
      const aiMessagePlaceholder: Message = {
        id: Date.now() + 1,
        content: '',
        role: 'model',
        isStreaming: true,
      };
      chatToUpdate = {
        ...chatToUpdate,
        chatHistory: [...chatToUpdate.chatHistory, aiMessagePlaceholder],
      };
      setActiveChat(chatToUpdate);

      let fullResponse = '';

      if (result.success && result.data) {
        let lastContent = '';
        let lastStreaming = true;
        for await (const delta of readStreamableValue(result.data.stream)) {
          fullResponse += delta;
          lastContent = fullResponse;
          // Update the AI message in chatHistory
          setActiveChat(prev => {
            if (!prev) return prev;
            const updatedHistory = prev.chatHistory.map((msg, idx) =>
              idx === prev.chatHistory.length - 1
                ? { ...msg, content: lastContent, isStreaming: lastStreaming }
                : msg
            );
            return { ...prev, chatHistory: updatedHistory };
          });
        }
        // Finalize the AI message state
        lastStreaming = false;
        setActiveChat(prev => {
          if (!prev) return prev;
          const updatedHistory = prev.chatHistory.map((msg, idx) =>
            idx === prev.chatHistory.length - 1
              ? { ...msg, content: lastContent, isStreaming: lastStreaming }
              : msg
          );
          return { ...prev, chatHistory: updatedHistory };
        });
        chatToUpdate.chatHistory[chatToUpdate.chatHistory.length - 1].content = fullResponse;
        chatToUpdate.chatHistory[chatToUpdate.chatHistory.length - 1].isStreaming = false;

        let imgResponse = "";

        if (result.data.img) {
          for await (const delta of readStreamableValue(result.data.img)) {
            imgResponse += delta;
          }
          if (imgResponse) {
            // Add AI image message after streaming is complete
            const aiImageMessage: Message = {
              id: Date.now() + 2,
              content: `data:image/png;base64,${imgResponse}`,
              role: 'model',
              isStreaming: false,
            };
            chatToUpdate = {
              ...chatToUpdate,
              chatHistory: [...chatToUpdate.chatHistory, aiImageMessage],
            };
            setActiveChat(chatToUpdate);
          }
        }
      } else {
        // Handle error: show an error message in the chat
        chatToUpdate.chatHistory.pop(); //remove old placeholder
        setActiveChat(chatToUpdate); // update both

        const errorMessage: Message = { id: Date.now() + 1, content: `Youve probably reached token/rate limit by having too much context or some other fatal backend error, try sending another message or starting a new chat. (You can download the pictures then delete the message which frees up tokens)\nError: ${result.error}`, role: 'model', isStreaming: false };
        chatToUpdate.chatHistory.push(errorMessage);
        setActiveChat(prev => {
          if (!prev) return ({
            _id: 'error-chat',
            title: 'Error Chat',
            model: selectedModel.id,
            chatHistory: [errorMessage],
            mediaItems: [],
          });
          return { ...prev, chatHistory: [...prev.chatHistory, errorMessage] };
        });
      }
      logger.chat('mediaItems for chat update:', chatToUpdate.mediaItems);

      if (!user?.isGuest) {
        const saveResp = await saveChatToDbAction(chatToUpdate, user);
        if (!saveResp.success) throw new Error("Could not save chat to DB!" + saveResp.error);
      }

      setChatList(
        prev => {
          const existingIndex = prev.findIndex(chat => chat._id === chatToUpdate._id);
          if (existingIndex !== -1) {
            // Update existing chat
            const updatedChats = [...prev];
            updatedChats[existingIndex] = chatToUpdate;
            return updatedChats;
          } else {
            // Add new chat
            return [...prev, chatToUpdate];
          }
        }
      );

      setIsSending(false);

    } catch (error) {
      // Remove placeholder message if it exists
      if (activeChat && activeChat.chatHistory[activeChat.chatHistory.length - 1].role === 'model' && activeChat.chatHistory[activeChat.chatHistory.length - 1].content === "") {
        activeChat.chatHistory.pop();
      }

      const errorMessage: Message = {
        id: Date.now() + 1,
        content: `Youve probably reached token/rate limit by having too much context or some other fatal backend error, try sending another message or starting a new chat. (You can download the pictures then delete the message which frees up tokens)\nError: ${error instanceof Error ? error.message : String(error)}`,
        role: 'model',
        isStreaming: false
      };

      setIsSending(false);

      let chatToUpdate: Chat;

      if (!activeChat) {
        // Create new error chat
        chatToUpdate = {
          _id: 'error-chat',
          title: 'Error Chat',
          model: selectedModel.id,
          chatHistory: [errorMessage],
          mediaItems: [],
        };
        setActiveChat(chatToUpdate);
      } else {
        // Update existing chat
        chatToUpdate = {
          ...activeChat,
          chatHistory: [...activeChat.chatHistory, errorMessage],
        };
        setActiveChat(chatToUpdate);
      }

      // Save the updated chat to database
      if (!user?.isGuest) {
        try {
          const saveResp = await saveChatToDbAction(chatToUpdate, user);
          if (!saveResp.success) {
            logger.error("Could not save error chat to DB:", saveResp.error);
          }
        } catch (saveError) {
          logger.error("Error saving chat to DB:", saveError);
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return {
    input,
    setInput,
    selectedModel,
    isSending,
    pendingMedia,
    showModelChangeModal,
    pendingModelChange,
    editingMessage,
    editText,
    handleCopyMessage,
    handleDownloadImage,
    handleEditMessage,
    handleSaveEdit,
    handleDeleteMessage,
    handleRegenerateMessage,
    handleBranchChat,
    handleModelChange,
    confirmModelChange,
    cancelModelChange,
    removePendingMedia,
    handleFileUpload,
    handleSend,
    handleKeyPress,
  };
}
