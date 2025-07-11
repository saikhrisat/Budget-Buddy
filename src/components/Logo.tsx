import { Wallet } from 'lucide-react';

const Logo = ({ className }: { className?: string }) => (
  <div className={`flex items-center space-x-2 text-primary ${className}`}>
    <Wallet className="h-7 w-7 sm:h-8 sm:w-8" />
    <span className="text-xl sm:text-2xl font-bold">Budget Buddy</span>
  </div>
);

export default Logo;
