import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../shared/store/hooks';
import { setReplyTo } from '../../shared/store/uiSlice';

export const ReplyBar = () => {
  const dispatch = useAppDispatch();
  const replyTo = useAppSelector(s => s.ui.replyToMessage);

  if (!replyTo) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-secondary border-t border-white/5">
      <div className="flex-1 min-w-0 border-l-2 border-primary-500 pl-3">
        <span className="text-xs font-medium text-primary-400 block">
          Replying to {replyTo.sender.username}
        </span>
        <span className="text-xs text-gray-500 truncate block">
          {replyTo.content || '📎 Media'}
        </span>
      </div>
      <button
        onClick={() => dispatch(setReplyTo(null))}
        className="p-1.5 rounded-lg hover:bg-surface-elevated text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};
