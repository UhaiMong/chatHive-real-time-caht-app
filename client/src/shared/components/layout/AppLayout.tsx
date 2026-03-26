// import { useAppSelector } from '../../shared/store/hooks';
// import { useSocket } from '../../shared/hooks/useSocket';
// import { Sidebar } from '../../features/conversations/Sidebar';
// import { ChatWindow } from '../../features/chat/ChatWindow';
// import { WelcomeScreen } from '../../features/chat/WelcomeScreen';
// import { ToastContainer } from '../components/ui/ToastContainer';

import { ChatWindow } from "@/features/chat/ChatWindow";
import { WelcomeScreen } from "@/features/chat/WelcomeScreen";
import { Sidebar } from "@/features/conversations/Sidebar";
import { useSocket } from "@/shared/hooks/useSocket";
import { useAppSelector } from "@/shared/store/hooks";
import { ToastContainer } from "../ui/ToastContainer";

export const AppLayout = () => {
  const activeConversationId = useAppSelector((s) => s.ui.activeConversationId);
  const conversations = useAppSelector((s) => s.conversations.items);
  const currentUser = useAppSelector((s) => s.auth.user);
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

  // Bootstrap all socket listeners
  useSocket();

  const activeConversation = conversations.find(
    (c) => c._id === activeConversationId,
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface">
      <Sidebar />

      {/* Main content */}
      <main
        className={`flex-1 min-w-0 flex flex-col bg-fixed bg-center bg-cover bg-no-repeat bg-[url(bg_.png)] ${
          !sidebarOpen || activeConversationId ? "flex" : "hidden md:flex"
        }`}
      >
        {activeConversation && currentUser ? (
          <ChatWindow
            conversation={activeConversation}
            currentUserId={currentUser.userId}
          />
        ) : (
          <WelcomeScreen />
        )}
      </main>

      <ToastContainer />
    </div>
  );
};
