import { ReactNode } from 'react';
import { cn } from '../../utils/helpers';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 py-12 px-6 text-center', className)}>
    {icon && <div className="text-gray-600 mb-1">{icon}</div>}
    <p className="text-sm font-medium text-gray-400">{title}</p>
    {description && <p className="text-xs text-gray-600 max-w-xs">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
