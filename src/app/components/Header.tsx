import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="border-b border-gray-300 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div className="border-2 border-black px-3 py-1.5 font-bold">
            LOGO
          </div>
          <nav className="flex items-center gap-6">
            <a href="#" className="text-sm hover:underline">Home</a>
            <span className="text-sm">-</span>
            <a href="#" className="text-sm hover:underline">About</a>
            <span className="text-sm">-</span>
            <a href="#" className="text-sm hover:underline">Contact</a>
          </nav>
        </div>
      </div>
    </header>
  );
}