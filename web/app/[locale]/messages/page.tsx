'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useUser } from '@/app/hooks/useUser';
import { useMessages } from '@/app/hooks/useMessages';
import { useAppointments } from '@/app/hooks/useAppointments';
import { usePropertyById } from '@/app/hooks/useProperties';
import AuthLayout from '../layouts/AuthLayout';
import { ArrowLeft, LucidePaperclip, Calendar } from 'lucide-react';
import ModalDate from '../components/ModalDate';

export default function MessagesPage() {
  const t = useTranslations('Messages');
  const { user } = useUser();
  const { conversations, sendMessage, markAsRead, hasUnread, deleteConversation } = useMessages();
  const { createAppointment } = useAppointments();

  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: property } = usePropertyById(activePropertyId ?? '');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeConversation = conversations.find(c => c.propertyId === activePropertyId);
  const isChatOpen = !!activeConversation;

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation, newMessage]);

  const handleSelectConversation = async (propertyId: string) => {
    setActivePropertyId(propertyId);
    await markAsRead(propertyId);
  };

  const handleSendMessage = async () => {
    if (!newMessage || !activePropertyId || !user) return;

    await sendMessage({ propertyId: activePropertyId, content: newMessage });
    setNewMessage('');
  };

  const handleCreateAppointment = async () => {
    if (!activeConversation || !appointmentDate || !user) return;

    await createAppointment({
      propertyId: activeConversation.propertyId,
      agentId: user.id,
      date: appointmentDate,
    });
    await sendMessage({
      propertyId: activeConversation.propertyId,
      content: t('appointmentScheduled', {
        date: new Date(appointmentDate).toLocaleString(),
        address: `${property?.address}, ${property?.city}` || '',
      }),
    });

    setAppointmentDate('');
    setIsModalOpen(false);
  };

  const handleDeleteConversation = async () => {
    if (!activePropertyId) return;

    try {
      await deleteConversation(activePropertyId);
      setActivePropertyId(null);
    } catch (error) {
      console.error(error);
      alert(t('deleteFailed'));
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col sm:flex-row h-[85vh] max-w-7xl mx-auto w-full bg-white dark:bg-gray-900 shadow-lg rounded-xl overflow-hidden">
        {!isChatOpen && (
          <aside className="w-full sm:w-1/3 md:w-1/4 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800 transition-all duration-300">
            <div className="p-4">
              <h2 data-testid="conversations" className="text-xl font-semibold mb-4">
                {t('conversations')}
              </h2>
              {conversations.map(conv => (
                <div
                  key={conv.propertyId}
                  onClick={() => handleSelectConversation(conv.propertyId)}
                  className={`messages w-full p-3 rounded cursor-pointer mb-2 border flex justify-between items-center transition ${
                    conv.propertyId === activePropertyId
                      ? 'border-primary bg-primary-light dark:bg-primary-dark'
                      : 'border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {property?.images[0]?.url && <img src={property.images[0].url} alt="" className="w-10 h-10 rounded-md object-cover" />}
                    <div className="flex flex-col">
                      <p className="font-semibold text-gray-700 dark:text-gray-200">{conv.propertyTitle}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{conv.messages[0]?.content.slice(0, 23) || t('noMessages')}</p>
                    </div>
                  </div>
                  {hasUnread(conv) && <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{t('new')}</span>}
                </div>
              ))}
            </div>
          </aside>
        )}

        <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isChatOpen ? 'w-full' : ''}`}>
          {isChatOpen && (
            <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button onClick={() => setActivePropertyId(null)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                  <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
                <h2 className="font-semibold text-lg">{activeConversation?.propertyTitle}</h2>
              </div>
              <button onClick={handleDeleteConversation} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition">
                {t('delete')}
              </button>
            </div>
          )}

          {activeConversation ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse space-y-2 space-y-reverse">
                {activeConversation.messages.map(msg => {
                  const isSender = msg.senderId === user!.id;
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[70%] px-4 py-2 break-words rounded-2xl transition-all duration-200 ${
                        isSender
                          ? 'bg-primary text-white self-end rounded-bl-none shadow'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 self-start rounded-br-none shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 p-4 border-t border-gray-200 dark:border-gray-700 items-center">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={t('typeMessage')}
                  className="flex-1 w-full border p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all"
                  rows={1}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                />

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleSendMessage}
                    className="bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-dark transition-colors flex-none flex items-center gap-2"
                  >
                    <LucidePaperclip className="w-4 h-4" />
                    {t('send')}
                  </button>

                  {user?.role === 'AGENT' && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition-colors flex-none flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      {t('schedule')}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 m-4">{t('selectConversation')}</p>
          )}
        </div>
      </div>

      {isModalOpen && property && (
        <ModalDate onClose={() => setIsModalOpen(false)}>
          <h3 className="text-lg font-semibold mb-1">{property.title_en}</h3>
          <p className="text-gray-500 text-sm mb-1">
            {property.city}, {property.state}
          </p>
          <p className="text-xs text-gray-400 mb-3 select-all">ID: {property.id}</p>

          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">{t('selectDate')}</label>
          <input
            type="datetime-local"
            value={appointmentDate}
            onChange={e => setAppointmentDate(e.target.value)}
            className="border p-2 rounded w-full mb-4"
            min={new Date().toISOString().slice(0, 16)}
          />

          <div className="flex justify-end gap-2">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              {t('cancel')}
            </button>
            <button onClick={handleCreateAppointment} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition" disabled={!appointmentDate}>
              {t('confirm')}
            </button>
          </div>
        </ModalDate>
      )}
    </AuthLayout>
  );
}
