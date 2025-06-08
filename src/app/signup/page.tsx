import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Sign Up Page</h1>
        <p className="text-gray-400 mt-2">This is a placeholder page.</p>
        <Link href="/" className="text-blue-400 hover:underline mt-4 inline-block">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}