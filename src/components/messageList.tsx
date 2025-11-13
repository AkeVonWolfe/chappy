import React from "react";
import type { Message, User } from "../types";

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  users: User[];
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  users,
}) => (
  <div className="messages">
    {messages.map((msg) => {
      //  Find the sender in the user list
      const sender =
        users.find((u) => {
          const id = u.userId || u.id || u.sk?.replace(/^USER#/, "");
          return id === msg.senderId;
        }) || null;

      const senderName = sender?.name || "Unknown";

      const isSelf =
        msg.senderId === (currentUser.userId || currentUser.id);

      //  Get avatar text (first letter of name, uppercase)
      const avatarText = senderName.charAt(0).toUpperCase();

      return (
        <div
          key={msg.id}
          className={`message-row ${isSelf ? "self" : ""}`}
        >
          {/* Sender avatar (only show on left for others) */}
          {!isSelf && <div className="avatar">{avatarText}</div>}

          <div
            className={`message-bubble ${
              isSelf ? "self-bubble" : ""
            }`}
          >
            {/*  show sender name above message */}
            {!isSelf && (
              <div className="sender-name">{senderName}</div>
            )}
            <p>{msg.message}</p>
          </div>

          {/* Self avatar (on right) */}
          {isSelf && (
            <div className="avatar self-avatar">{avatarText}</div>
          )}
        </div>
      );
    })}
  </div>
);

export default MessageList;
