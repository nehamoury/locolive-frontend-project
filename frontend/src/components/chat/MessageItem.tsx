import { cn } from '../../utils/helpers';

interface MessageItemProps {
  message: string;
  sender: string;
  isMe?: boolean;
  timestamp: string;
}

const MessageItem = ({ message, isMe, timestamp }: Omit<MessageItemProps, 'sender'>) => {
  return (
    <div className={cn(
      "flex flex-col max-w-[80%]",
      isMe ? "ml-auto items-end" : "mr-auto items-start"
    )}>
      <div className={cn(
        "px-4 py-2 rounded-2xl text-sm",
        isMe 
          ? "bg-purple-600 text-white rounded-tr-none" 
          : "bg-white/10 text-white rounded-tl-none border border-white/5"
      )}>
        {message}
      </div>
      <span className="text-[10px] text-gray-500 mt-1 px-1">
        {timestamp}
      </span>
    </div>
  );
};

export { MessageItem };
