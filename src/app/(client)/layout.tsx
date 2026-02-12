import Link from "next/link";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-blue-600">OCEANSTAR</span>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                        <Link href="/" className="hover:text-blue-600 transition-colors">홈</Link>
                        <Link href="#" className="hover:text-blue-600 transition-colors">투어 소개</Link>
                        <Link href="#" className="hover:text-blue-600 transition-colors">예약 안내</Link>
                        <Link href="#" className="hover:text-blue-600 transition-colors">커뮤니티</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-blue-600">
                            관리자 로그인
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 bg-gray-50 py-12">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Oceanstar. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
