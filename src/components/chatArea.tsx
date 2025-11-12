import React from "react";
import type { Channel, Message, User } from "../types";
import MessageList from "./messageList";
import MessageInput from "./messageInput";

interface ChatAreaProps {
  selectedChannel: Channel | null;
  messages: Message[];
  messageInput: string;
  setMessageInput: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: (e?: React.FormEvent | React.MouseEvent) => Promise<void> | void;
  loading: boolean;
  currentUser: User;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  selectedChannel,
  messages,
  messageInput,
  setMessageInput,
  sendMessage,
  loading,
  currentUser
}) => {
  if (!selectedChannel) {
    return (
      <div className="no-channel-selected">
        <p>Select a channel to start chatting</p>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <h2>{selectedChannel.name}</h2>
        <div className="user-group">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="avatar">
              P
            </div>
          ))}
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
