import React from "react";

interface MessageInputProps {
  messageInput: string;
  setMessageInput: (v: string) => void;
  sendMessage: (e?: React.FormEvent | React.MouseEvent) => void;
  loading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  messageInput,
  setMessageInput,
  sendMessage,
  loading
}) => (
  <div className="message-input-container">
    <div className="input-row">
      <input
        type="text"
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        placeholder="Type a message..."
        disabled={loading}
        onKeyPress={(e) => e.key === "Enter" && sendMessage(e)}
      />
      <button
        onClick={() => sendMessage()}
        disabled={loading || !messageInput.trim()}
        className="send-btn"
      />
    </div>
  </div>
);

export default MessageInput;
