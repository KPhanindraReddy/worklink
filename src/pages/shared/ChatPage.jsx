import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { ConversationList } from '../../components/chat/ConversationList';
import { PageSEO } from '../../components/common/PageSEO';
import { AppShell } from '../../components/layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import {
  ensureConversation,
  getMessages,
  sendMessage,
  subscribeConversations,
  subscribeMessages
} from '../../services/chatService';
import { getLabourById } from '../../services/labourService';
import { getFirebaseErrorMessage } from '../../utils/firebaseErrors';

const decorateConversationForUser = (conversation, currentUserId) => {
  const otherUserId = conversation.participantIds?.find((id) => id !== currentUserId);
  const otherProfile = otherUserId ? conversation.participantProfiles?.[otherUserId] : null;

  return {
    ...conversation,
    otherUserId,
    displayName: otherProfile?.fullName || conversation.participantName || 'WorkLink user',
    displayRole: otherProfile?.role || conversation.participantRole || '',
    phoneNumber: otherProfile?.phoneNumber || conversation.phoneNumber || '',
    whatsAppLink: otherProfile?.whatsAppLink || conversation.whatsAppLink || ''
  };
};

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const targetLabourId = searchParams.get('target');
  const { currentUser, userProfile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      setActiveConversation(null);
      return undefined;
    }

    return subscribeConversations(
      currentUser.uid,
      (items) => {
        setConversations(items.map((item) => decorateConversationForUser(item, currentUser.uid)));
      },
      (error) => toast.error(getFirebaseErrorMessage(error))
    );
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser || !targetLabourId) {
      return undefined;
    }

    let isActive = true;

    getLabourById(targetLabourId)
      .then((labour) =>
        ensureConversation({
          currentUserId: currentUser.uid,
          otherUserId: targetLabourId,
          metadata: {
            currentUserProfile: {
              fullName: userProfile?.fullName,
              role: userProfile?.role,
              phoneNumber: userProfile?.phoneNumber || currentUser.phoneNumber || ''
            },
            otherUserProfile: {
              fullName: labour?.fullName,
              role: labour?.category || 'labour',
              phoneNumber: labour?.phoneNumber || '',
              whatsAppLink: labour?.phoneNumber
                ? `https://wa.me/${labour.phoneNumber.replace(/\D/g, '')}`
                : ''
            }
          }
        })
      )
      .then(() => {
        if (!isActive) {
          return;
        }
      })
      .catch((error) => toast.error(getFirebaseErrorMessage(error)));

    return () => {
      isActive = false;
    };
  }, [
    currentUser?.phoneNumber,
    currentUser?.uid,
    targetLabourId,
    userProfile?.fullName,
    userProfile?.phoneNumber,
    userProfile?.role
  ]);

  useEffect(() => {
    setActiveConversation((prev) => {
      if (!conversations.length) {
        return null;
      }

      if (targetLabourId) {
        const targetedConversation = conversations.find((item) =>
          item.participantIds?.includes(targetLabourId)
        );

        if (targetedConversation) {
          return targetedConversation;
        }
      }

      return conversations.find((item) => item.id === prev?.id) ?? conversations[0];
    });
  }, [conversations, targetLabourId]);

  useEffect(() => {
    if (!activeConversation?.id) {
      setMessages([]);
      return undefined;
    }

    return subscribeMessages(
      activeConversation.id,
      setMessages,
      (error) => toast.error(getFirebaseErrorMessage(error))
    );
  }, [activeConversation?.id]);

  const handleSend = async (text) => {
    if (!activeConversation || !currentUser) {
      return;
    }

    const optimisticMessage = {
      id: `local-${Date.now()}`,
      senderId: currentUser.uid,
      text,
      type: 'text',
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await sendMessage(activeConversation.id, {
        senderId: currentUser.uid,
        senderRole: userProfile?.role ?? 'client',
        text,
        type: 'text'
      });

      const nextMessages = await getMessages(activeConversation.id);
      setMessages(nextMessages);
    } catch (error) {
      toast.error(getFirebaseErrorMessage(error));
    }
  };

  return (
    <AppShell>
      <PageSEO title="Chat" description="Real-time one-to-one chat between clients and labour professionals." />

      <section className="section-space">
        <div className="page-shell grid gap-6 xl:grid-cols-[360px_1fr]">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onSelect={setActiveConversation}
          />
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            currentUserId={currentUser?.uid}
            onSend={handleSend}
          />
        </div>
      </section>
    </AppShell>
  );
};

export default ChatPage;
