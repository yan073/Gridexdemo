interface SystemMessageProps {
  children: React.ReactNode;
}

export function SystemMessage({ children }: SystemMessageProps) {
  return (
    <div className="bg-white border-2 border-black rounded-2xl px-4 py-3 shadow-sm max-w-2xl">
      {children}
    </div>
  );
}
