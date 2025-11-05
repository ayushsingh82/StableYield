"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi";
import { parseUnits, formatUnits } from "viem";

import USDCJson from "@/contracts/USDC/USDC.json";
import { getContractAddress, supportedChains } from "../../config";
import ContractAddresses from "../../deployed-address.json";

const USDCMint = () => {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [txHash, setTxHash] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  // Get the correct contract address for the current network
  const getUSDCAddress = useCallback(() => {
    const dynamicAddress = getContractAddress("USDC", chainId);
    console.log("Dynamic USDC address:", dynamicAddress);

    // Fallback to deployed-address.json if dynamic address is zero
    if (dynamicAddress === '0x0000000000000000000000000000000000000000') {
      console.log("Using fallback address from deployed-address.json");
      return ContractAddresses.USDC;
    }

    return dynamicAddress;
  }, [chainId]);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!address || !publicClient) return;

    setBalanceLoading(true);
    try {
      const USDCAddress = getUSDCAddress();
      console.log("Current chainId:", chainId);
      console.log("USDC Address for current network:", USDCAddress);
      console.log("User address:", address);

      if (USDCAddress === '0x0000000000000000000000000000000000000000') {
        console.warn("USDC contract not found for current network");
        setBalance("0");
        return;
      }

      console.log("Attempting to read USDC balance...");
      const balanceData = await publicClient.readContract({
        address: USDCAddress as `0x${string}`,
        abi: USDCJson.abi,
        functionName: "balanceOf",
        args: [address],
      });

      console.log("Raw balance data:", balanceData);
      const formattedBalance = formatUnits(balanceData as bigint, 18);
      console.log("Formatted balance:", formattedBalance);
      setBalance(formattedBalance);
    } catch (err) {
      console.error("Error fetching balance:", err);
      setBalance("0");
    } finally {
      setBalanceLoading(false);
    }
  }, [address, publicClient, chainId, getUSDCAddress]);

  // Fetch balance on mount and when address, chainId, or publicClient changes
  useEffect(() => {
    if (isConnected && address && publicClient) {
      console.log("useEffect triggered - fetching balance");
      fetchBalance();

      // Set up polling for balance updates
      const interval = setInterval(() => {
        console.log("Polling balance update...");
        fetchBalance();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    } else {
      console.log("useEffect conditions not met:", { isConnected, address: !!address, publicClient: !!publicClient });
    }
  }, [address, isConnected, publicClient, fetchBalance]);

  // Handle input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Handle mint button click
  const handleMint = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!walletClient || !publicClient) {
      setError("Wallet not connected properly");
      return;
    }

    const USDCAddress = getUSDCAddress();
    if (USDCAddress === '0x0000000000000000000000000000000000000000') {
      setError("USDC contract not available on current network");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Convert ETH amount to USDC units (18 decimals)
      const USDCAmount = parseUnits(amount, 18);

      // Prepare the mint transaction
      const { request } = await publicClient.simulateContract({
        address: USDCAddress as `0x${string}`,
        abi: USDCJson.abi,
        functionName: "mint",
        args: [USDCAmount],
        account: address,
      });

      // Execute the transaction using the wallet's provider
      const hash = await walletClient.writeContract(request);
      setTxHash(hash);

      // Wait for transaction to complete
      await publicClient.waitForTransactionReceipt({ hash });

      // Update balance and reset form
      fetchBalance();
      setAmount("");
      setTxHash("");
      setSuccess(`Successfully minted ${amount} USDC!`);
    } catch (err: unknown) {
      console.error("Error minting USDC:", err);
      setTxHash("");
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mint USDC. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Get current network name
  const getCurrentNetworkName = () => {
    if (chainId === supportedChains.coreTestnet2.id) {
      return "Core Testnet2";
    } else if (chainId === supportedChains.hardhat.id) {
      return "Hardhat";
    }
    return "Unknown Network";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1
          className="text-4xl font-bold mb-6 text-center font-mono"
          style={{
            letterSpacing: "0.05em",
            textShadow:
              "0.05em 0 0 rgba(255,140,0,0.75), -0.025em -0.05em 0 rgba(255,127,80,0.75), 0.025em 0.05em 0 rgba(255,99,71,0.75)",
            fontFamily: "monospace",
          }}
        >
          USDC MINTER
        </h1>

        {!isConnected ? (
          <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg mb-6 backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
            <p className="text-center text-gray-300">
              Please connect your wallet to mint USDC
            </p>
          </div>
        ) : (
          <>
            <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg mb-6 backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
              <div className="mb-4">
                <p className="text-gray-300 mb-2">
                  Network: <span className="text-[#FF8C00] font-bold">{getCurrentNetworkName()}</span>
                </p>
                <p className="text-gray-300 mb-2">
                  Chain ID: <span className="text-[#FF8C00] font-bold">{chainId}</span>
                </p>
                <p className="text-gray-300 mb-2">
                  USDC Contract: <span className="text-[#FF8C00] font-bold text-xs">{getUSDCAddress()}</span>
                </p>
                <p className="text-gray-300 mb-2">
                  Your USDC Balance:{" "}
                  <span className="text-[#FF8C00] font-bold">
                    {balanceLoading ? "Loading..." : `${balance} USDC`}
                  </span>
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={fetchBalance}
                    className="text-sm text-[#FF8C00] hover:text-[#FFA500] underline"
                  >
                    Refresh Balance
                  </button>
                  <button
                    onClick={() => {
                      console.log("Manual balance check triggered");
                      fetchBalance();
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    Debug Check
                  </button>
                  <button
                    onClick={async () => {
                      if (!publicClient) {
                        alert("Public client not available");
                        return;
                      }
                      const USDCAddress = getUSDCAddress();
                      console.log("Testing contract access for:", USDCAddress);
                      try {
                        const totalSupply = await publicClient.readContract({
                          address: USDCAddress as `0x${string}`,
                          abi: USDCJson.abi,
                          functionName: "totalSupply",
                          args: [],
                        });
                        console.log("Total supply:", totalSupply);
                        alert(`Contract accessible! Total supply: ${formatUnits(totalSupply as bigint, 18)}`);
                      } catch (err) {
                        console.error("Contract test failed:", err);
                        alert("Contract test failed - check console for details");
                      }
                    }}
                    className="text-sm text-green-400 hover:text-green-300 underline"
                  >
                    Test Contract
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-[#FF8C00] mb-1"
                >
                  Amount to Mint
                </label>
                <input
                  type="text"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-black border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleMint}
                disabled={loading || !amount}
                className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${loading ? "opacity-70" : ""
                  } bg-black border border-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.7)] hover:shadow-[0_0_20px_rgba(255,140,0,1)] hover:text-[#FF8C00]`}
              >
                {loading ? "Processing..." : "Mint USDC"}
              </button>

              {txHash && (
                <div className="mt-2 p-2 bg-blue-900 border border-blue-700 rounded text-sm">
                  <p className="text-blue-300">Transaction submitted:</p>
                  <p className="text-blue-200 font-mono text-xs break-all">{txHash}</p>
                </div>
              )}

              {error && (
                <p className="mt-2 text-red-400 text-sm">Error: {error}</p>
              )}

              {success && (
                <p className="mt-2 text-green-400 text-sm">{success}</p>
              )}
            </div>

            <div className="bg-black border border-gray-800 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2 text-[#FF8C00]">
                About USDC Minting
              </h2>
              <p className="text-gray-300 mb-2">
                This is a testnet version of USDC that you can mint freely for
                testing purposes.
              </p>
              <p className="text-gray-300">
                In production, USDC is a fully-collateralized US dollar
                stablecoin issued by Circle.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default USDCMint;