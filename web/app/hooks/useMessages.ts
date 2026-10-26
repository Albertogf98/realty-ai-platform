'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/client';
import { useUser } from './useUser';
import { Conversation, Message } from '../interfaces/conversation.interface';
import { useCallback } from 'react';

export const useMessages = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data: conversations = [], refetch } = useQuery<Conversation[]>({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const res = await api.get<Message[]>('messages');

      let filteredMessages: Message[];

      if (user.role === 'USER') {
        const userPropertyIds = new Set(res.data.filter(msg => msg.senderId === user.id).map(msg => msg.propertyId));
        filteredMessages = res.data.filter(msg => userPropertyIds.has(msg.propertyId));
      } else {
        filteredMessages = res.data;
      }

      const grouped: Map<string, Conversation> = new Map();
      filteredMessages.forEach(msg => {
        if (!grouped.has(msg.propertyId)) {
          grouped.set(msg.propertyId, {
            propertyId: msg.propertyId,
            propertyTitle: `ID: ${msg.propertyId.slice(0, 6)} - ${msg.senderId.slice(0, 6)}`,
            messages: [],
          });
        }
        grouped.get(msg.propertyId)!.messages.push(msg);
      });

      const convs = Array.from(grouped.values()).map(conv => ({
        ...conv,
        messages: conv.messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      }));

      convs.sort((a, b) => new Date(b.messages[0].createdAt).getTime() - new Date(a.messages[0].createdAt).getTime());

      return convs;
    },
    enabled: !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ propertyId, content }: { propertyId: string; content: string }) => {
      if (!user) throw new Error('User not logged in');

      return api.post<Message>('messages', {
        senderId: user.id,
        propertyId,
        content,
      });
    },
    onSuccess: (res, variables) => {
      queryClient.setQueryData<Conversation[]>(['messages', user?.id], old =>
        old?.map(conv => (conv.propertyId === variables.propertyId ? { ...conv, messages: [res.data, ...conv.messages] } : conv))
      );
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error('User not logged in');

      return api.patch(`messages/read/${propertyId}/${user.id}`);
    },
    onSuccess: (_res, propertyId) => {
      queryClient.setQueryData<Conversation[]>(['messages', user?.id], old =>
        old?.map(conv =>
          conv.propertyId === propertyId
            ? {
                ...conv,
                messages: conv.messages.map(msg => ({ ...msg, read: true })),
              }
            : conv
        )
      );
    },
  });

  const hasUnread = useCallback(
    (conv: Conversation) => {
      if (!user) return false;
      return conv.messages.some(msg => !msg.read && msg.senderId !== user.id);
    },
    [user]
  );

  const deleteConversationMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error('User not logged in');

      return api.delete(`messages/${propertyId}`);
    },
    onSuccess: (_res, propertyId) => {
      queryClient.setQueryData<Conversation[]>(['messages', user?.id], old => old?.filter(conv => conv.propertyId !== propertyId));
    },
  });

  return {
    conversations,
    refetch,
    sendMessage: sendMessageMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    deleteConversation: deleteConversationMutation.mutateAsync,
    hasUnread,
  };
};
