import React from "react";
import type { Channel, Message, User } from "../types";


interface ChatAreaProps {
  selectedChannel: Channel | null;
  messages: Message[];
  messageInput: string;
  setMessageInput: (v: string) => void;
  sendMessage: (e?: React.FormEvent | React.MouseEvent) => void;
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
        <div className="chat-header-top">
          <h2>{selectedChannel.name}</h2>
          <div className="user-group">
            <div className="avatars">
              {[1,2,3,4,5,6,7,8,9].map(i => (
                <div key={i} className="avatar">P</div>
              ))}
            </div>
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
