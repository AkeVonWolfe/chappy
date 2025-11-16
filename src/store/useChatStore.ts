import { create } from "zustand";
import type { Channel, Message, User } from "../types";

// TODO: Refactor lifting state to Zustand store aka everything in components

interface ChatState {
  currentUser: User;
  channels: Channel[];
  selectedChannel: Channel | null;
  messages: Message[];
  users: User[];
  isDirectChat: boolean;
  selectedUser: User | null;
  messageInput: string;
  loading: boolean;
  showCreateChannel: boolean;
  newChannelName: string;

  // actions
  setSelectedChannel: (channel: Channel | null) => void;
  setMessageInput: (value: string) => void;
  setIsDirectChat: (value: boolean) => void;
  setSelectedUser: (user: User | null) => void;
  setShowCreateChannel: (v: boolean) => void;
  setNewChannelName: (v: string) => void;

  fetchChannels: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchMessages: (channelId: string) => Promise<void>;
  fetchDirectMessages: (targetId: string) => Promise<void>;
  sendMessage: () => Promise<void>;
  createChannel: (guestAccess: boolean) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
}


// Zustand store for chat state management
export const useChatStore = create<ChatState>((set, get) => ({
  currentUser: (() => {
    const storedUser = localStorage.getItem("user");
    const parsed = storedUser ? JSON.parse(storedUser) : null;
    return parsed
      ? {
          id: parsed.userId || parsed.id,
          userId: parsed.userId || parsed.id,
          name: parsed.name || "Unknown User",
        }
      : { id: "guest", userId: "guest", name: "Guest User" };
  })(),

  channels: [],
  selectedChannel: null,
  messages: [],
  users: [],
  isDirectChat: false,
  selectedUser: null,
  messageInput: "",
  loading: false,
  showCreateChannel: false,
  newChannelName: "",

  // simple setters
  setSelectedChannel: (c) => set({ selectedChannel: c }),
  setMessageInput: (v) => set({ messageInput: v }),
  setIsDirectChat: (v) => set({ isDirectChat: v }),
  setSelectedUser: (u) => set({ selectedUser: u }),
  setShowCreateChannel: (v) => set({ showCreateChannel: v }),
  setNewChannelName: (v) => set({ newChannelName: v }),

  // async actions
  fetchChannels: async () => {
    try {
      set({ loading: true });
      const res = await fetch("http://localhost:1337/channels");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        set({ channels: data.items });
        if (!get().selectedChannel && data.items.length > 0)
          set({ selectedChannel: data.items[0] });
      }
    } finally {
      set({ loading: false });
    }
  },
// Fetch all users for direct messaging
  fetchUsers: async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:1337/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) set({ users: data.items });
    } catch (e) {
      console.error(e);
    }
  },
 // Fetch messages for a specific channel
  fetchMessages: async (channelId) => {
    try {
      set({ loading: true });
      const res = await fetch(`http://localhost:1337/messages/${channelId}`);
      const data = await res.json();
      set({ messages: data.items || [] });
    } finally {
      set({ loading: false });
    }
  },
  // Fetch direct messages for a specific user
  fetchDirectMessages: async (targetId) => {
    try {
      set({ loading: true });
      const { currentUser } = get();
      const currentId = currentUser.userId || currentUser.id;
      const res = await fetch(
        `http://localhost:1337/messages/direct/${currentId}/${targetId}`
      );
      const data = await res.json();
      set({ messages: data.items || [] });
    } finally {
      set({ loading: false });
    }
  },
// Send a message in either channel or direct chat
  sendMessage: async () => {
    const {
      messageInput,
      isDirectChat,
      selectedUser,
      selectedChannel,
      currentUser,
      fetchDirectMessages,
      fetchMessages,
    } = get();
    if (!messageInput.trim()) return;
    try {
      set({ loading: true });
      const senderId = currentUser.userId || currentUser.id;
      let endpoint = "";

      if (isDirectChat && selectedUser) {
        const target = (selectedUser.sk || selectedUser.id || "").replace(
          /^USER#/,
          ""
        );
        endpoint = `http://localhost:1337/messages/direct/${senderId}/${target}`;
      } else if (selectedChannel) {
        endpoint = `http://localhost:1337/messages/${selectedChannel.id}`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageInput, senderId }),
      });

      const data = await res.json();
      if (data.success) {
        set({ messageInput: "" });
        if (isDirectChat && selectedUser)
          await fetchDirectMessages(selectedUser.id);
        else if (selectedChannel) await fetchMessages(selectedChannel.id);
      }
    } finally {
      set({ loading: false });
    }
  },
// Create a new channel
  createChannel: async (guestAccess) => {
    const token = localStorage.getItem("token");
    const { newChannelName } = get();
    if (!newChannelName.trim() || !token) return;
    try {
      set({ loading: true });
      const res = await fetch("http://localhost:1337/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newChannelName, Guest: guestAccess }),
      });
      const data = await res.json();
      if (data.success)
        set((state) => ({
          channels: [...state.channels, data.item],
          newChannelName: "",
          showCreateChannel: false,
        }));
    } finally {
      set({ loading: false });
    }
  },
 // Delete a channel by ID
  deleteChannel: async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!confirm("Are you sure?")) return;
    try {
      set({ loading: true });
      const res = await fetch(`http://localhost:1337/channels/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success)
        set((state) => ({
          channels: state.channels.filter((ch) => ch.id !== id),
          selectedChannel:
            state.selectedChannel?.id === id ? null : state.selectedChannel,
        }));
    } finally {
      set({ loading: false });
    }
  },
}));
