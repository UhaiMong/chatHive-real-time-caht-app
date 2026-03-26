import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { cn } from '../../utils/helpers';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  trigger: React.ReactNode;
  align?: 'left' | 'right';
}

export const ContextMenu = ({ items, trigger, align = 'right' }: ContextMenuProps) => (
  <Menu as="div" className="relative">
    <Menu.Button as={Fragment}>{trigger}</Menu.Button>

    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items
        className={cn(
          'absolute z-30 mt-1 min-w-[160px] rounded-xl bg-surface-elevated shadow-2xl',
          'border border-white/5 py-1 focus:outline-none',
          align === 'right' ? 'right-0' : 'left-0'
        )}
      >
        {items.map((item, i) => (
          <Menu.Item key={i} disabled={item.disabled}>
            {({ active }) => (
              <button
                onClick={item.onClick}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors',
                  item.danger
                    ? active ? 'bg-red-500/10 text-red-400' : 'text-red-400'
                    : active ? 'bg-white/5 text-gray-100' : 'text-gray-300',
                  item.disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            )}
          </Menu.Item>
        ))}
      </Menu.Items>
    </Transition>
  </Menu>
);
