import { Building2 } from 'lucide-react';

export function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6">
      <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
        <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
      </div>
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">How can I help you today?</h2>
    </div>
  );
}
