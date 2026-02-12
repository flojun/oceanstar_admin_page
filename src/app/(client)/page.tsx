import Link from "next/link";

export default function ClientLandingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-blue-900 mb-6 tracking-tight">
                Welcome to <span className="text-blue-600">Oceanstar</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
                거북이 스노클링과 함께하는 하와이의 잊지 못할 추억.
            </p>
            <div className="flex gap-4">
                <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-transform hover:scale-105 shadow-md"
                >
                    예약하기 (관리자)
                </Link>
                {/* Add more client links here later */}
            </div>
        </div>
    );
}
