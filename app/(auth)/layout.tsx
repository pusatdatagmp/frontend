import Image from "next/image";
import login from "@/app/assets/images/login.svg";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex p-8 items-center justify-center bg-gray-100">

      <div className="flex w-full max-w-7xl rounded-3xl overflow-hidden bg-white shadow-2xl">

        {/* LEFT SIDE */}
        <div className="hidden md:flex w-1/2 items-center justify-center p-10">
          <Image
            src={login}
            alt="Login Illustration"
            className="w-full h-auto"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="flex w-full md:w-1/2 items-center justify-center px-6 py-10 bg-white">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

      </div>

    </div>
  );
}