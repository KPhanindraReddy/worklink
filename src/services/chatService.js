import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { isFirebaseConfigured } from '../firebase/env';
import { db } from '../firebase/firestore';

export const buildConversationId = (userA, userB) => [userA, userB].sort().join('__');

const normalizeParticipantProfile = (profile = {}) => ({
  fullName: profile.fullName || profile.participantName || profile.name || 'WorkLink user',
  role: profile.role || profile.participantRole || '',
  phoneNumber: profile.phoneNumber || '',
  whatsAppLink: profile.whatsAppLink || ''
});

export const subscribeConversations = (userId, onNext, onError) => {
  if (!userId) {
    onNext([]);
    return () => {};
  }

  if (!isFirebaseConfigured || !db) {
    onNext([]);
    return () => {};
  }

  const conversationQuery = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(
    conversationQuery,
    (snapshot) => {
      onNext(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    onError
  );
};

export const getMessages = async (conversationId) => {
  if (!conversationId) {
    return [];
  }

  if (!isFirebaseConfigured || !db) {
    return [];
  }

  const messagesQuery = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(messagesQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const subscribeMessages = (conversationId, onNext, onError) => {
  if (!conversationId) {
    onNext([]);
    return () => {};
  }

  if (!isFirebaseConfigured || !db) {
    onNext([]);
    return () => {};
  }

  const messagesQuery = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      onNext(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    onError
  );
};

export const ensureConversation = async ({ currentUserId, otherUserId, metadata = {} }) => {
  if (!currentUserId || !otherUserId) {
    throw new Error('Conversation participants are required.');
  }

  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase must be configured before starting chats.');
  }

  const conversationId = buildConversationId(currentUserId, otherUserId);
  const conversationRef = doc(db, 'conversations', conversationId);
  const snapshot = await getDoc(conversationRef);
  const {
    currentUserProfile,
    otherUserProfile,
    participantName,
    participantRole,
    phoneNumber,
    whatsAppLink,
    ...restMetadata
  } = metadata;
  const participantProfiles = {
    [currentUserId]: normalizeParticipantProfile(currentUserProfile),
    [otherUserId]: normalizeParticipantProfile({
      ...otherUserProfile,
      participantName,
      participantRole,
      phoneNumber,
      whatsAppLink
    })
  };
  const conversationMetadata = {
    participantProfiles,
    participantName: participantProfiles[otherUserId].fullName,
    participantRole: participantProfiles[otherUserId].role,
    phoneNumber: participantProfiles[otherUserId].phoneNumber,
    whatsAppLink: participantProfiles[otherUserId].whatsAppLink,
    ...restMetadata
  };

  if (!snapshot.exists()) {
    await setDoc(conversationRef, {
      participantIds: [currentUserId, otherUserId],
      typing: {},
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      ...conversationMetadata
    });
  } else {
    await setDoc(
      conversationRef,
      {
        participantProfiles,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  return conversationId;
};

export const sendMessage = async (conversationId, payload) => {
  if (!conversationId) {
    throw new Error('Conversation id is required.');
  }

  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase must be configured before sending chat messages.');
  }

  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    ...payload,
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: payload.text || 'Image',
    lastMessageAt: serverTimestamp(),
    [`readBy.${payload.senderId}`]: true
  });
};
