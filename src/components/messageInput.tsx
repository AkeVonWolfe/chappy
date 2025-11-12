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
        placeholder="Type a message..."
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        disabled={loading}
        onKeyDown={(e) => e.key === "Enter" && sendMessage(e)}
      />
      <button
        className="send-btn"
        onClick={sendMessage}
        disabled={loading || !messageInput.trim()}
      >
        
      </button>
    </div>
  </div>
);

export default MessageInput;
