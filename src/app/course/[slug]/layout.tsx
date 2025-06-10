import { ReactNode } from "react";

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[250px_1fr]">
      {/* Sidebar ToC */}
      <aside className="hidden lg:block border-r border-gray-200 p-6 sticky top-0 h-screen overflow-y-auto">
        <h2 className="text-base font-semibold mb-4 text-gray-900">
          Table of Contents
        </h2>
        <div id="toc-placeholder" />
      </aside>

      {/* Main Content */}
      <div>{children}</div>
    </div>
  );
}
