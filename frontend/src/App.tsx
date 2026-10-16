import React, { useState } from 'react';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { MessageComposer } from './components/MessageComposer';

export const App: React.FC = () => {
  const {
    conversations,
    activeConversation,
    activeId,
    isLoading,
    streamingMessage,
    error,
    backendHealth,
    theme,
    toggleTheme,
    createNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
    clearAllConversations,
    sendMessage,
    stopGeneration,
    retryLastMessage,
    exportConversation,
  } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-white dark:bg-[#090d16] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        isOpen={isSidebarOpen}
        isMobileOpen={isMobileMenuOpen}
        onToggleDesktop={() => setIsSidebarOpen(!isSidebarOpen)}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSelectConversation={selectConversation}
        onNewChat={createNewChat}
        onRenameConversation={renameConversation}
        onDeleteConversation={deleteConversation}
        onClearAll={clearAllConversations}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#090d16] relative">
        <Header
          conversationTitle={activeConversation?.title || 'New chat'}
          theme={theme}
          backendHealth={backendHealth}
          onToggleTheme={toggleTheme}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNewChat={createNewChat}
          onExport={exportConversation}
          hasMessages={Boolean(activeConversation && activeConversation.messages.length > 0)}
        />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ChatArea
            messages={activeConversation?.messages || []}
            isLoading={isLoading}
            streamingMessage={streamingMessage}
            error={error}
            onSelectPrompt={sendMessage}
            onRetry={retryLastMessage}
          />

          <MessageComposer
            onSendMessage={sendMessage}
            isLoading={isLoading}
            onStop={stopGeneration}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
