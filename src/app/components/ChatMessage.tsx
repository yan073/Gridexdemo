import { User, FileText } from "lucide-react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  showTranscript?: boolean;
}

export function ChatMessage({ message, isUser, showTranscript = false }: ChatMessageProps) {
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <div className="flex-shrink-0 w-12" />}
      <div className={`max-w-2xl ${isUser ? '' : ''}`}>
        <div className="relative bg-white border-2 border-black rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <p className="text-sm leading-relaxed flex-1">{message}</p>
            {showTranscript && (
              <div className="flex-shrink-0 w-16 h-16 bg-white border-2 border-black rounded-lg flex flex-col items-center justify-center p-2">
                <FileText className="size-6 mb-1" strokeWidth={1.5} />
                <div className="space-y-0.5 w-full">
                  <div className="h-0.5 bg-black w-full rounded" />
                  <div className="h-0.5 bg-black w-full rounded" />
                  <div className="h-0.5 bg-black w-full rounded" />
                  <div className="h-0.5 bg-black w-3/4 rounded" />
                </div>
                <p className="text-[10px] mt-1">Transcript</p>
              </div>
            )}
          </div>
          {isUser && (
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-black rotate-45" />
          )}
          {!isUser && (
            <div className="absolute -left-3 top-8 w-6 h-6 bg-white border-2 border-black rotate-45" />
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
          <User className="size-6" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}