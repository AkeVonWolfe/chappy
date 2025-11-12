import React from "react";
import type { Message, User } from "../types";

interface MessageListProps {
  messages: Message[];
  currentUser: User;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser }) => (
  <div className="messages">
    {messages.map((msg) => (
      <div
        key={msg.id}
        className={`message-row ${msg.senderId === currentUser.id ? "self" : ""}`}
      >
        {msg.senderId !== currentUser.id && <div className="avatar">P</div>}
        <div
          className={`message-bubble ${msg.senderId === currentUser.id ? "self-bubble" : ""}`}
        >
          <p>{msg.message}</p>
        </div>
        {msg.senderId === currentUser.id && <div className="avatar self-avatar">P</div>}
      </div>
    ))}
  </div>
);

export default MessageList;
