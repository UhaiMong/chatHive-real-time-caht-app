import { cn } from '../../utils/helpers';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export const Spinner = ({ size = 'md', className }: SpinnerProps) => (
  <span
    className={cn(
      'inline-block rounded-full border-2 border-current border-t-transparent animate-spin text-primary-500',
      sizeMap[size],
      className
    )}
  />
);
