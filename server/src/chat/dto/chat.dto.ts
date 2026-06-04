// Chat DTOs for F21

export class CreateChatRoomDto {
  name: string;
  type: 'direct' | 'group';
  memberIds?: string[]; // UUID array
  description?: string;
}

export class CreateChatMessageDto {
  roomId: number;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

export class UpdateChatMessageDto {
  content?: string;
  status?: 'pending' | 'sent' | 'read';
}

export class ChatMessageResponseDto {
  id: number;
  roomId: number;
  senderId: string;
  senderName?: string;
  content: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  isEdited: boolean;
  status: string;
  createdAt: Date;
  readBy?: Array<{ userId: string; readAt: Date }>;
}

export class ChatRoomResponseDto {
  id: number;
  name: string;
  type: 'direct' | 'group';
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  members?: Array<{ userId: string; userName: string; joinedAt: Date }>;
  createdAt: Date;
}

export class UserOnlineStatusDto {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  currentRoom?: number;
}

export class PaginatedMessagesDto {
  messages: ChatMessageResponseDto[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
