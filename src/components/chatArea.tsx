import React from "react";
import type { Channel, Message, User } from "../types";
import MessageList from "./messageList";
import MessageInput from "./messageInput";

interface ChatAreaProps {
  selectedChannel: Channel | null;
  messages: Message[];
  messageInput: string;
  setMessageInput: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: (e?: React.FormEvent | React.MouseEvent) => Promise<void>;
  loading: boolean;
  currentUser: User;
  users: User[];
  isDirectChat: boolean;
  selectedUser: User | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsDirectChat: React.Dispatch<React.SetStateAction<boolean>>;
  fetchDirectMessages: (userId: string) => Promise<void>;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  selectedChannel,
  messages,
  messageInput,
  setMessageInput,
  sendMessage,
  loading,
  currentUser,
  users,
  isDirectChat,
  selectedUser,
  setSelectedUser,
  setIsDirectChat,
  fetchDirectMessages,
}) => {
  // Handle case when no channel or DM selected
  if (!selectedChannel && !isDirectChat) {
    return (
      <div className="no-channel-selected">
        <p>Select a channel or user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div className="chat-header-top">
          <h2>
            {isDirectChat
              ? `Direct Message with ${selectedUser?.name ?? ""}`
              : selectedChannel?.name ?? "Select a channel"}
          </h2>

          <div className="user-group">
            {users
              .filter((user) => {
                const targetId = user.sk ?? user.id;
                const currentId = currentUser.userId || currentUser.id;
                return targetId !== currentId; // hide self
              })
              .map((user) => (
                <div
                  key={user.sk || user.id}
                  className="avatar"
                  onClick={() => {
                    let rawId = user.sk ?? user.id;
                    if (!rawId) return;

                    // Remove USER# prefix so backend gets plain ID
                    const cleanId = rawId.replace(/^USER#/, "");

                    const currentId = currentUser.userId || currentUser.id;
                    if (cleanId === currentId) return; // skip self

                    setIsDirectChat(true);
                    setSelectedUser(user);
                    fetchDirectMessages(cleanId); // now sends correct ID (e.g., "2")
                  }}
                  title={`Chat with ${user.name}`}
                >
                  {user.name[0]?.toUpperCase()}
                </div>
              ))}
          </div>
        </div>
      </div>

      <MessageList messages={messages} currentUser={currentUser} />

      <MessageInput
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        sendMessage={sendMessage}
        loading={loading}
      />
    </div>
  );
};

export default ChatArea;
