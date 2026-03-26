import { useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeNotification } from '../../../features/notifications/notificationsSlice';
import { cn } from '../../utils/helpers';
import type { Notification } from '../../../features/notifications/notificationsSlice';

const AUTO_DISMISS_MS = 4000;

const iconMap = {
  success: <CheckCircleIcon className="w-5 h-5 text-emerald-400" />,
  error: <XCircleIcon className="w-5 h-5 text-red-400" />,
  info: <InformationCircleIcon className="w-5 h-5 text-blue-400" />,
  warning: <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />,
};

const ToastItem = memo(({ item }: { item: Notification }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeNotification(item.id)), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [item.id, dispatch]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl min-w-[280px] max-w-sm',
        'bg-surface-elevated border border-white/5'
      )}
    >
      <span className="flex-shrink-0 mt-0.5">{iconMap[item.type]}</span>
      <p className="text-sm text-gray-200 flex-1 leading-snug">{item.message}</p>
      <button
        onClick={() => dispatch(removeNotification(item.id))}
        className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors mt-0.5"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
});
ToastItem.displayName = 'ToastItem';

export const ToastContainer = () => {
  const notifications = useAppSelector(s => s.notifications.items);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto">
            <ToastItem item={n} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
