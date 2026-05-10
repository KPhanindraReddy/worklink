import { ImagePlus, SendHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { fromNow } from '../../utils/formatters';

export const ChatWindow = ({ conversation, messages, currentUserId, onSend }) => {
  const [draft, setDraft] = useState('');
  const typingState = useMemo(
    () => Object.values(conversation?.typing ?? {}).some(Boolean),
    [conversation?.typing]
  );

  if (!conversation) {
    return (
      <Card className="grid min-h-[520px] place-items-center text-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Choose a conversation</h3>
          <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
            Open any booking conversation to chat, share updates, and confirm work.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="surface-card flex min-h-[520px] flex-col overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              {conversation.displayName || conversation.participantName}
            </h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              {typingState ? 'Typing...' : conversation.online ? 'Online now' : 'Away'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button as="a" href={`tel:${conversation.phoneNumber ?? ''}`} variant="outline" size="sm">
              Call
            </Button>
            <Button as="a" href={conversation.whatsAppLink ?? '#'} variant="outline" size="sm">
              WhatsApp
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;
          return (
            <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-[20px] px-3.5 py-2.5 text-[13px] shadow-sm ${
                  isMine
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                }`}
              >
                {message.imageUrl ? (
                  <img
                    src={message.imageUrl}
                    alt="Chat attachment"
                    className="mb-3 max-h-56 w-full rounded-2xl object-cover"
                  />
                ) : null}
                {message.text ? <p>{message.text}</p> : null}
                <p
                  className={`mt-2 text-[11px] ${
                    isMine ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {fromNow(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form
        className="border-t border-slate-200 px-4 py-3 dark:border-slate-800"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) {
            return;
          }
          onSend(draft.trim());
          setDraft('');
        }}
      >
        <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
          <Button type="button" variant="ghost" size="sm">
            <ImagePlus size={16} />
          </Button>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-brand-500/20"
          />
          <Button type="submit" className="w-full sm:w-auto">
            <SendHorizontal size={16} />
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};
