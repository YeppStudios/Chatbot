import Image from "next/image";
import { MouseEventHandler, ReactNode } from "react";

interface AuthButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
}

const AuthButton = ({ onClick, children }: AuthButtonProps) => (
  <button
    onClick={onClick}
    className="px-4 py-2 border flex gap-2 border-slate-200 rounded-lg text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow transition duration-150"
  >
    <GoogleIcon />
    <span>{children}</span>
  </button>
);

export default AuthButton;

const GoogleIcon = () => (
  <Image
    width={24}
    height={24}
    className="w-6 h-6"
    src="https://www.svgrepo.com/show/475656/google-color.svg"
    loading="lazy"
    alt="google logo"
  />
);
