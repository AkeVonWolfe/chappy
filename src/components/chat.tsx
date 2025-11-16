import React, { useEffect, useState } from "react";
import "../App.css";
import Sidebar from "./sidebar";
import ChatArea from "./chatArea";
import type { Channel, Message, User } from "../types";
import { api } from "../api";



export default function ChatApp(): React.ReactElement { 

  // user info from localStorage
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;

  // current user object if logged in, else guest user
  const CURRENT_USER: User = parsedUser
    ? {
        id: parsedUser.userId || parsedUser.id,
        userId: parsedUser.userId || parsedUser.id,
        name: parsedUser.name || "Guest User",
      }
    : { id: "guest", userId: "guest", name: "Guest User" };  // guest user

  //  STATE VARIABLES
  const [channels, setChannels] = useState<Channel[]>([]);  // list of all channels
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);  // which channel is selected
  const [messages, setMessages] = useState<Message[]>([]);  // current messages in selected channel or DM
  const [messageInput, setMessageInput] = useState(""); // typed in message box
  const [newChannelName, setNewChannelName] = useState(""); // typed in new channel box
  const [showCreateChannel, setShowCreateChannel] = useState(false); // toggle create channel form
  const [loading, setLoading] = useState(false);  //show api request loading state
  const [users, setUsers] = useState<User[]>([]); // list of all users for DMs
  const [isDirectChat, setIsDirectChat] = useState(false); // whether in DM mode
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // who user is in DM

  // -------------------- FETCH CHANNELS --------------------
  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await fetch(api("/channels"));
      const data = await res.json();

      if (data.success && Array.isArray(data.items)) {  // valid data
        setChannels(data.items); 
        if (!selectedChannel && data.items.length > 0) {  
          setSelectedChannel(data.items[0]);  // select first channel by default
        }
      }
    } catch (error) {
      console.error("Failed to fetch channels:", error);
    } finally {  
      setLoading(false); // reset loading state spinning loader
    }
  };

  // FETCH USERS 
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");  // get auth token from storage
      const res = await fetch(api("/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.items)) {  // valid data
        setUsers(data.items);
      } else {
        console.error("Failed to fetch users: unexpected response", data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  //  FETCH MESSAGES CHANNEL 
  const fetchMessages = async (channelId: string) => {
    try {
      setLoading(true);
      const res = await fetch(api(`/messages/${channelId}`)); // fetch messages for channel
      const data = await res.json();

      if (data.success && Array.isArray(data.items)) {
        setMessages(data.items);
      } else {
        setMessages([]);
        console.error("Failed to fetch messages:", data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // FETCH MESSAGES (DIRECT CHAT) 
  const fetchDirectMessages = async (targetId: string) => {
    try {
      setLoading(true);
    const currentId = CURRENT_USER.userId || CURRENT_USER.id;
    console.log(" Fetching DMs for:", { currentId, targetId });
    const url = api(`/messages/direct/${currentId}/${targetId}`);  // fetch direct messages for DM
    console.log(" GET", url);

    const res = await fetch(url);
    const data = await res.json();
    console.log(" Fetched direct messages:", data);

      if (data.success && Array.isArray(data.items)) {
        console.log("Fetched direct messages:", data.items);
        setMessages(data.items);
        
      } else {
        setMessages([]);
        console.error("Failed to fetch direct messages:", data);
      }
    } catch (err) {
      console.error("Error fetching direct messages:", err);
    } finally {
      setLoading(false);
    }
    
  };

  //  EFFECTS, runs at start
  useEffect(() => {
    fetchChannels(); // load channels on start
    fetchUsers();  // load users on start
  }, []); // stop loop

    // EFFECT, when selectedChannel changes, fetch its messages
  useEffect(() => {
    if (selectedChannel) {
      setIsDirectChat(false); // switch to channel mode
      setMessages([]);  // clear old messages
      fetchMessages(selectedChannel.id);  // load messages for new channel
    }
  }, [selectedChannel]); // stop loop

  // SEND MESSAGE 
  const sendMessage = async (e?: React.FormEvent | React.MouseEvent) => {
  e?.preventDefault();
  if (!messageInput.trim()) return;  // don't send empty messages

  try {
    setLoading(true);  

    const senderId = CURRENT_USER.userId || CURRENT_USER.id;  // get current user ID
    let endpoint = ""; // api endpoint to send message to

    if (isDirectChat && selectedUser) {   // Direct message
        const cleanTargetId = (selectedUser.sk || selectedUser.id || "").replace("USER#", "");  // clean target user ID
        const senderId = CURRENT_USER.userId || CURRENT_USER.id;   // get sender ID
      endpoint = api(`/messages/direct/${senderId}/${cleanTargetId}`);
    } else if (selectedChannel) {
      // Channel message 
      endpoint = api(`/messages/${selectedChannel.id}`);
    } else {
      console.warn("No target channel or user selected");
      return;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: messageInput,
        senderId,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setMessageInput("");
      // Refresh messages after sending
      if (isDirectChat && selectedUser) {
        // Refresh direct messages
        const cleanTargetId = (selectedUser.sk || selectedUser.id || "").replace(/^USER#/, "");  // clean target ID
        await fetchDirectMessages(cleanTargetId);
      } else if (selectedChannel) {
        // Refresh channel messages
        await fetchMessages(selectedChannel.id);
      }
    } else {
      console.error("Failed to send message:", data);
    }
  } catch (err) {
    console.error("Error sending message:", err);
  } finally {
    setLoading(false);
  }
};

  // CHANNEL MANAGEMENT FUNCTIONS 
  const createChannel = async (guestAccess: boolean) => {
  if (!newChannelName.trim()) return;  // don't create channel with empty name

  const token = localStorage.getItem("token");  // get auth token to check if guest
  if (!token) {
    console.log("You must be logged in to create a channel!");
    return;
  }

  try {
    setLoading(true);  // show loading state
    const res = await fetch(api("/channels"), {  
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newChannelName,  // channel name
        Guest: guestAccess, //  send real state
      }),
    });

    const data = await res.json();
    if (data.success) {  // channel created
      setChannels((prev) => [...prev, data.item]);  // add new channel to list
      setNewChannelName("");  // clear input box
      setShowCreateChannel(false);  // hide create form
    } else {
      console.error("Failed to create channel:", data);
    }
  } catch (err) {
    console.error("Error creating channel:", err);
  } finally {
    setLoading(false); 
  }
};

  const deleteChannel = async (id: string) => {
  const token = localStorage.getItem("token");  // get auth token
  if (!token) {  // check if logged in
    console.log("You must be logged in to delete a channel!");
    return;
  }

  if (!confirm("Are you sure you want to delete this channel?")) return;  // confirm deletion, change to valdid ui later

  try {
    setLoading(true); // show loading state
    const res = await fetch(api(`/channels/${id}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (data.success) {  // channel deleted
      setChannels((prev) => prev.filter((ch) => ch.id !== id));  // remove from list
      if (selectedChannel?.id === id) setSelectedChannel(null);  // clear selection if deleted
    } else {
      console.error("Failed to delete channel:", data);
      console.log(data.message || "Failed to delete channel");
    }
  } catch (err) {
    console.error("Error deleting channel:", err);
  } finally {
    setLoading(false);
  }
};

  // RENDER the chat app and props to children, change to zustand later
  return (
    <div className="app-container">
    
      <Sidebar
        channels={channels}
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        showCreateChannel={showCreateChannel}
        setShowCreateChannel={setShowCreateChannel}
        newChannelName={newChannelName}
        setNewChannelName={setNewChannelName}
        createChannel={createChannel}
        deleteChannel={deleteChannel}
        loading={loading}
        currentUser={CURRENT_USER}
      />
   
      <ChatArea
        selectedChannel={selectedChannel}
        messages={messages}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        sendMessage={sendMessage}
        loading={loading}
        currentUser={CURRENT_USER}
        users={users}
        isDirectChat={isDirectChat}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        setIsDirectChat={setIsDirectChat}
        fetchDirectMessages={fetchDirectMessages}
      />
    </div>
  );
}
