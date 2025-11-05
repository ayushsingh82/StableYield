"use client";

import React from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useChainId, useSwitchChain } from "wagmi";
import { supportedChains } from "../../config";

const Navbar = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const handleNetworkSwitch = (targetChainId: number) => {
    if (chainId !== targetChainId) {
      switchChain({ chainId: targetChainId });
    }
  };

  return (
    <nav className="bg-black text-white p-8">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold text-[#FF8C00]">
          <Link href="/">StableCORE</Link>
        </div>

        <div className="hidden md:flex space-x-8">
          {/* <Link
            href="/mint"
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            MINT
          </Link> */}
          {/* <Link
            href="/admin"
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            ADMIN
          </Link> */}
          <Link
            href="/operator-screen"
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            OPERATOR
          </Link>
          {/* <Link
            href="/restaking-screen"
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            RESTAKING
          </Link> */}
          {/* <Link
            href="/cpusd"
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            SCUSD
          </Link> */}
          {/* <Link
            href="/usdc"
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            USDC
          </Link> */}
          <Link
            href="/swap"
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            SWAP
          </Link>
          {/* <Link
            href="/stCORE"
            className="font-medium tracking-wide hover:text-[#FF8C00] transition duration-300"
          >
            stCORE
          </Link> */}
        </div>

        <div className="flex items-center space-x-4">
          {/* Network Switcher */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">Network:</span>
            <div className="flex space-x-1">
              {/* <button
                onClick={() => handleNetworkSwitch(supportedChains.hardhat.id)}
                className={`px-2 py-1 text-xs rounded ${chainId === supportedChains.hardhat.id
                  ? "bg-[#FF8C00] text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
                  } transition-colors`}
              >
                Hardhat
              </button> */}
              <button
                onClick={() => handleNetworkSwitch(supportedChains.coreTestnet2.id)}
                className={`px-2 py-1 text-xs rounded ${chainId === supportedChains.coreTestnet2.id
                  ? "bg-[#FF8C00] text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
                  } transition-colors`}
              >
                Core Testnet2
              </button>
            </div>
          </div>

          <ConnectButton />
        </div>

        <div className="md:hidden">
          {/* Mobile menu button - you can expand this with a dropdown later */}
          <button className="focus:outline-none">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
            </svg>
          </button>
        </div>
      </div>
      <hr className="border-t border-gray-700 my-2" />
    </nav>
  );
};

export default Navbar;