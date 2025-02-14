import React, { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Loader } from "./Loaders";

interface ButtonType {
  title?: string;
  iconSrc?: string;
  iconOnly?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  alt?: string;
  loading?: boolean;
  loaderColor?: string;
  imgClassName?: string;
  type: "submit" | "reset" | "button";
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseUp?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onTouchStart?: (event: React.TouchEvent<HTMLButtonElement>) => void;
  onTouchEnd?: (event: React.TouchEvent<HTMLButtonElement>) => void;
}

const Button = ({
  type,
  title,
  iconSrc,
  iconOnly,
  className,
  alt,
  onClick,
  loaderColor,
  loading,
  imgClassName,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
}: ButtonType) => {
  const isGif = iconSrc?.endsWith(".gif");

  return (
    <button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      type={type}
      onClick={onClick}
      className={clsx(
        "bg-pearl-white font-medium cursor-pointer whitespace-nowrap hover:bg-opacity-70 p-2 flex justify-center items-center min-w-12 h-12 border border-white",
        className
      )}
    >
      {iconSrc &&
        !loading &&
        (isGif ? (
          <Image
            src={iconSrc}
            alt={alt || "button"}
            width={20}
            height={20}
            className={clsx(
              {
                "mr-3": !iconOnly,
                hidden: !iconSrc,
              },
              imgClassName
            )}
          />
        ) : (
          <Image
            src={iconSrc}
            alt={alt || "button"}
            width={20}
            height={20}
            className={clsx(
              {
                "mr-3": !iconOnly,
                hidden: !iconSrc,
              },
              imgClassName
            )}
          />
        ))}

      {loading && <Loader color={loaderColor ? loaderColor : "black"} />}

      <span
        className={clsx({
          "": !iconOnly,
          hidden: iconOnly,
        })}
      >
        {title}
      </span>
    </button>
  );
};

export default Button;
