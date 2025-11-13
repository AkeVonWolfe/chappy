import React from "react";
import type { Message, User } from "../types";

// Props interface for MessageList component
interface MessageListProps {
  messages: Message[];  // messages to display
  currentUser: User;  // current logged-in user
  users: User[];  // list of all users
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
          const id = u.userId || u.id || u.sk?.replace(/^USER#/, "");  // normalize id
          return id === msg.senderId;  // match senderId
        }) || null;  // default to null if not found

      const senderName = sender?.name || "Unknown";

      const isSelf =
        msg.senderId === (currentUser.userId || currentUser.id); // check if message is from current user

      //  Get avatar text first letter of name, uppercase
      const avatarText = senderName.charAt(0).toUpperCase();

      return (
        <div
          key={msg.id}
          className={`message-row ${isSelf ? "self" : ""}`}
        >
          {/* Sender avatar only show on left for others */}
          {!isSelf && <div className="avatar">{avatarText}</div>}

          <div
            className={`message-bubble ${ // add self-bubble class
              isSelf ? "self-bubble" : ""  // self vs others styling
            }`}
          >
            {/*  show sender name above message */}
            {!isSelf && (
              <div className="sender-name">{senderName}</div> // sender name
            )}
            <p>{msg.message}</p>
          </div>

          {/* Self avatar (on right) */}
          {isSelf && (
            <div className="avatar self-avatar">{avatarText}</div> // self avatar
          )}
        </div>
      );
    })}
  </div>
);

export default MessageList;
