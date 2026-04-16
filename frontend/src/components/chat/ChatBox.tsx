import { type FC } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const ChatBox: FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#121214] border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/5">
        <h3 className="text-lg font-semibold text-white">Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Messages placeholder */}
        <div className="text-center text-gray-500 text-sm py-10">
          Select a conversation to start chatting
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-white/5">
        <div className="flex gap-2">
          <Input placeholder="Type a message..." className="bg-white/5" />
          <Button variant="primary" className="p-3 w-12 h-12">
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export { ChatBox };
