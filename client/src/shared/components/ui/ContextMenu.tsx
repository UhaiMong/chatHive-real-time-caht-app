import { Fragment, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { cn } from "../../utils/helpers";

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
}

export const ContextMenuDrawer = ({ items, trigger }: ContextMenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      <Transition show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setOpen(false)}
        >
          {/* Overlay */}
          <TransitionChild
            as={Fragment}
            enter="transition-opacity ease-linear duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </TransitionChild>

          {/* Drawer panel */}
          <TransitionChild
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel
              className={cn(
                "fixed top-(--header-height,64px) left-0 h-[calc(100%-var(--header-height,64px))] w-64",
                "bg-gray-800 text-gray-200 shadow-xl flex flex-col",
              )}
            >
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  disabled={item.disabled}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                    item.danger
                      ? "text-red-400 hover:bg-red-500/10"
                      : "text-gray-300 hover:bg-white/5",
                    item.disabled && "opacity-40 cursor-not-allowed",
                  )}
                >
                  {item.icon && (
                    <span className="w-4 h-4 shrink-0">{item.icon}</span>
                  )}
                  {item.label}
                </button>
              ))}
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
};
