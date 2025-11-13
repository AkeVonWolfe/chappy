import React from "react";

 // Props interface for MessageInput component
interface MessageInputProps {
  messageInput: string;  // current input value
  setMessageInput: (v: string) => void;  // setter for input value
  sendMessage: (e?: React.FormEvent | React.MouseEvent) => void;  // function to send message
  loading: boolean;  // loading state
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
        disabled={loading} // disable input if loading
        onKeyDown={(e) => e.key === "Enter" && sendMessage(e)} // send on Enter 
      />
      <button
        className="send-btn"
        onClick={sendMessage} // send message on click
        disabled={loading || !messageInput.trim()}  // disable if loading or empty
      >
        
      </button>
    </div>
  </div>
);

export default MessageInput;
