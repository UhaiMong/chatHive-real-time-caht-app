import { cn } from "@/shared/utils/helpers";

const ActionBtn = ({
  icon,
  title,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={cn(
      "p-1.5 rounded-lg transition-colors",
      danger
        ? "hover:bg-red-500/10 text-gray-500 hover:text-red-400"
        : "hover:bg-surface-elevated text-gray-500 hover:text-gray-300",
    )}
  >
    {icon}
  </button>
);
export default ActionBtn;
