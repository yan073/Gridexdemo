import { Home } from "lucide-react";

export function Breadcrumb() {
  return (
    <div className="border-b border-gray-300 bg-gray-50 px-6 py-3">
      <div className="flex items-center gap-2 text-sm">
        <Home className="size-4" />
        <span>GRIDEX demo</span>
      </div>
    </div>
  );
}
