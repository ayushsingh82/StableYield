"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useChainId, useSwitchChain } from "wagmi";
import { supportedChains } from "../../config";

const Navbar = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNetworkSwitch = (targetChainId: number) => {
    if (chainId !== targetChainId) {
      switchChain({ chainId: targetChainId });
    }
  };

  return (
    <nav className="bg-black text-white p-4 sm:p-8">
      <div className="container mx-auto flex justify-between items-center gap-4">
        <div className="text-xl font-bold text-[#FF8C00] flex-shrink-0">
          <Link href="/">StableYield</Link>
        </div>

        <div className="hidden md:flex space-x-8">
          <Link
            href="/operator-screen"
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            OPERATOR
          </Link>
          <Link
            href="/swap"
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            SWAP
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {/* Network Switcher */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">Network:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleNetworkSwitch(supportedChains.hardhat.id)}
                className={`px-2 py-1 text-xs rounded ${chainId === supportedChains.hardhat.id
                  ? "bg-[#FF8C00] text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
                  } transition-colors`}
              >
                Hardhat
              </button>
            </div>
          </div>

          <ConnectButton />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ConnectButton showBalance={false} />
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            className="focus:outline-none flex-shrink-0"
          >
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 1 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
              ) : (
                <path d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden container mx-auto mt-4 flex flex-col space-y-4 pb-2">
          <Link
            href="/operator-screen"
            onClick={() => setIsMenuOpen(false)}
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            OPERATOR
          </Link>
          <Link
            href="/swap"
            onClick={() => setIsMenuOpen(false)}
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            SWAP
          </Link>

          <div className="flex items-center space-x-2 pt-2">
            <span className="text-sm text-gray-300">Network:</span>
            <button
              onClick={() => handleNetworkSwitch(supportedChains.hardhat.id)}
              className={`px-2 py-1 text-xs rounded ${chainId === supportedChains.hardhat.id
                ? "bg-[#FF8C00] text-black"
                : "bg-gray-700 text-white hover:bg-gray-600"
                } transition-colors`}
            >
              Hardhat
            </button>
          </div>
        </div>
      )}

      <hr className="border-t border-gray-700 my-2" />
    </nav>
  );
};

export default Navbar;