import { type FC } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const MainLayout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar could go here */}
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>
      {/* Right side widgets or chat could go here */}
    </div>
  );
};

export { MainLayout };
