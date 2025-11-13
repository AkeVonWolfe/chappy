import React from "react";
import type { Channel, Message, User } from "../types";
import MessageList from "./messageList";
import MessageInput from "./messageInput";


// Props interface for ChatArea component
interface ChatAreaProps {
  selectedChannel: Channel | null;  // currently selected channel
  messages: Message[];              // messages in the chat area
  messageInput: string;             // current message input value
  setMessageInput: React.Dispatch<React.SetStateAction<string>>;   // setter for message input
  sendMessage: (e?: React.FormEvent | React.MouseEvent) => Promise<void>;  // function to send message
  loading: boolean;  // loading state for API requests
  currentUser: User; // current logged-in user info 
  users: User[];  // list of all users for avatar and name lookup
  isDirectChat: boolean;  // whether in direct chat mode
  selectedUser: User | null;  // currently selected user for direct chat
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;  // setter for selected user
  setIsDirectChat: React.Dispatch<React.SetStateAction<boolean>>;  // setter for direct chat mode
  fetchDirectMessages: (userId: string) => Promise<void>;  // function to fetch direct messages
}


// ChatArea component definition props above
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
  //  Check if user is a guest (no token in storage)
  const isGuest = !localStorage.getItem("token");

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
            {/* if direct chat or channel */}
            {isDirectChat
              ? `Direct Message with ${selectedUser?.name ?? ""}`
              : selectedChannel?.name ?? "Select a channel"}
          </h2>

          {/*  User avatars (profile badges) */}
          <div className="user-group">
            {users
              .filter((user) => {  // exclude self from avatar list
                const targetId = user.sk ?? user.id;  // get user ID
                const currentId = currentUser.userId || currentUser.id; // current user ID
                return targetId !== currentId; // hide self
              })
              .map((user) => {  // map to avatar elements
                const targetId = user.sk ?? user.id;  // get user ID
                const locked = isGuest; //  block all clicks if guest

                return (
                  <div
                    key={targetId}  // unique key for each avatar
                    className={`avatar ${locked ? "locked" : ""}`} // add locked class if guest
                    onClick={() => {
                      if (locked) return; //  guests can’t click avatars
                      if (!targetId) return; // safety check

                      const cleanId = targetId.replace(/^USER#/, ""); // clean ID format
                      const currentId = currentUser.userId || currentUser.id; // current user ID
                      if (cleanId === currentId) return; // prevent self-DM

                      setIsDirectChat(true); // switch to direct chat mode
                      setSelectedUser(user); // set selected user
                      fetchDirectMessages(cleanId); // load direct messages
                    }}
                    title={
                      locked
                        ? "Login required to start direct messages"
                        : `Chat with ${user.name}` // tooltip for avatar
                    }
                  >
                    {user.name[0]?.toUpperCase()} {/* first letter as avatar */}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    
      {/*   */}
      <MessageList
       messages={messages}  // messages to display
       currentUser={currentUser}  // current user info
       users={users} // list of all users
/>

      <MessageInput
        messageInput={messageInput} // current input value
        setMessageInput={setMessageInput} // setter for input
        sendMessage={sendMessage} // function to send message
        loading={loading} // loading state
      />
    </div>
  );
};

export default ChatArea;
