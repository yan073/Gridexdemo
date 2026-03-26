interface RobotMessageProps {
  children: React.ReactNode;
}

export function RobotMessage({ children }: RobotMessageProps) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-16 h-20 flex flex-col items-center">
        {/* Robot head */}
        <div className="w-12 h-10 bg-white border-2 border-black rounded-lg relative mb-1">
          <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full" />
          <div className="absolute bottom-2 left-3 right-3 h-1 bg-black rounded" />
          {/* Antenna */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-black" />
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-2 border-black rounded-full" />
        </div>
        {/* Robot body */}
        <div className="w-10 h-8 bg-white border-2 border-black rounded-md" />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
