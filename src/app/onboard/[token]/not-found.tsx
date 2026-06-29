import Link from "next/link";
import { LinkIcon } from "lucide-react";

export default function OnboardNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-5">
        <LinkIcon className="w-6 h-6 text-gray-400" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">This link is no longer valid</h1>
      <p className="text-sm text-gray-500 max-w-sm">
        This onboarding link has expired or doesn&apos;t exist. Please contact your employer for a new link.
      </p>
      <p className="text-xs text-gray-400 mt-8">
        Powered by{" "}
        <Link href="https://axiploy.com" className="text-blue-500 hover:underline">
          Axiploy
        </Link>
      </p>
    </div>
  );
}
