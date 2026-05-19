interface LayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-[100dvh] bg-black overflow-hidden">
      {/* Sidebar could go here */}
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>
      {/* Right side widgets or chat could go here */}
    </div>
  );
};

export { MainLayout };
