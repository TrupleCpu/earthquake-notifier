"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const Header = () => {
  const pathName = usePathname();

  const isInMain = pathName !== "/logs"
  return (
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
        Philippines Earthquake Feed
      </h1>
      <Link href={isInMain ? "/logs" : "/"} className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors duration-300">
       {isInMain ? "Earthquake Logs" : "Latest Earthquake"}
      </Link>
    </header>
  );
};

export default Header;
