import clsx from 'clsx';
import { fromNow } from '../../utils/formatters';

export const ConversationList = ({ conversations, activeConversationId, onSelect }) => (
  <div className="surface-card h-full max-h-72 overflow-hidden p-2 xl:max-h-none">
    <div className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
      <h2 className="text-base font-semibold text-slate-950 dark:text-white">Conversations</h2>
    </div>
    <div className="max-h-[13.5rem] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800 xl:max-h-none">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          type="button"
          onClick={() => onSelect(conversation)}
          className={clsx(
            'flex w-full items-start gap-3 px-3 py-3 text-left transition',
            activeConversationId === conversation.id
              ? 'bg-brand-50 dark:bg-brand-500/10'
              : 'hover:bg-slate-50 dark:hover:bg-slate-900'
          )}
        >
          <div className="relative">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {(conversation.displayName || conversation.participantName)?.slice(0, 1) ?? 'W'}
            </div>
            {conversation.online ? (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                {conversation.displayName || conversation.participantName}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {fromNow(conversation.lastMessageAt)}
              </span>
            </div>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              {conversation.displayRole || conversation.participantRole}
            </p>
            <p className="mt-1 truncate text-[13px] text-slate-600 dark:text-slate-300">
              {conversation.lastMessage}
            </p>
          </div>
        </button>
      ))}
    </div>
  </div>
);
