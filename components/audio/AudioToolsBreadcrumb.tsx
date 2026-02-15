import Link from "next/link";

export default function AudioToolsBreadcrumb({ currentTitle }: { currentTitle: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-gray-500">
        <li>
          <Link href="/tools" className="hover:text-orange-600 transition-colors">
            Tools
          </Link>
        </li>
        <li>/</li>
        <li>
          <Link href="/tools" className="hover:text-orange-600 transition-colors">
            Audio Tools Hub
          </Link>
        </li>
        <li>/</li>
        <li className="text-gray-800 font-medium">{currentTitle}</li>
      </ol>
    </nav>
  );
}
