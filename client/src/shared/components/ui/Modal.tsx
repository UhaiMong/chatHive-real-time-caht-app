import { Fragment, ReactNode } from "react";
import {
  Dialog,
  Transition,
  DialogTitle,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "../../utils/helpers";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

export const Modal = ({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}: ModalProps) => (
  <Transition appear show={open} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <TransitionChild
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      </TransitionChild>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className={cn(
                "w-full bg-surface-secondary rounded-xl shadow-2xl",
                sizeMap[size],
                className,
              )}
            >
              {title && (
                <div className="flex items-center justify-between px-5 py-4 border-b border-surface-elevated">
                  <DialogTitle className="text-base font-semibold text-gray-100">
                    {title}
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-surface-elevated text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
              {children}
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </Transition>
);
