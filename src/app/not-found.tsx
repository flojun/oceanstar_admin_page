import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 px-4">
          <h1 className="text-6xl font-black text-blue-600 mb-4">404</h1>
          <p className="text-xl font-bold mb-8 text-center text-slate-600">
            Page Not Found / 페이지를 찾을 수 없습니다
          </p>
          <Link 
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:-translate-y-1"
          >
            Go Home / 홈으로 가기
          </Link>
        </div>
      </body>
    </html>
  );
}
