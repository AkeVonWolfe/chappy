export interface User {
  id: string;           // Used locally (normalized id)
  userId?: string;      // Actual userId returned from backend
  name: string;
  sk?: string;          // DynamoDB sort key (e.g. USER#...)
  pk?: string;          // DynamoDB partition key
  Guest?: boolean;
  password?: string;    // only used during registration/login
}

export interface Channel {
  id: string;
  name: string;
  ownerId?: string;
   Guest?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  message: string;
  timestamp: string;
}