import { type FC } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const AuthLayout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
};

export { AuthLayout };
