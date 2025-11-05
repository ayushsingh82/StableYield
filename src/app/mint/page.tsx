"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import USDCJson from "@/contracts/USDC/USDC.json";
import CUSDJson from "@/contracts/CUSD.sol/CUSD.json";
import { getContractAddress, supportedChains } from "../../config";

const MintPage = () => {
  const [amount, setAmount] = useState("");
  const [USDCBalance, setUSDCBalance] = useState("0");
  const [CUSDBalance, setCUSDBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [USDCLoading, setUSDCLoading] = useState(false);
  const [error, setError] = useState("");
  const [USDCError, setUSDCError] = useState("");
  const [success, setSuccess] = useState("");
  const [USDCSuccess, setUSDCSuccess] = useState("");

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!address || !publicClient) return;
    try {
      // Get contract addresses for current network
      const USDCAddress = getContractAddress("USDC", chainId);
      const cusdAddress = getContractAddress("CUSD", chainId);
      // Fetch USDC balance
      if (USDCAddress !== '0x0000000000000000000000000000000000000000') {
        const USDCBalanceData = await publicClient.readContract({
          address: USDCAddress as `0x${string}`,
          abi: USDCJson.abi,
          functionName: "balanceOf",
          args: [address],
        });
        setUSDCBalance(formatUnits(USDCBalanceData as bigint, 18)); // USDC has 18 decimals
      } else {
        setUSDCBalance("0");
      }
      // Fetch CUSD balance
      if (cusdAddress !== '0x0000000000000000000000000000000000000000') {
        const CUSDBalanceData = await publicClient.readContract({
          address: cusdAddress as `0x${string}`,
          abi: CUSDJson.abi,
          functionName: "balanceOf",
          args: [address],
        });
        setCUSDBalance(formatUnits(CUSDBalanceData as bigint, 18)); // CUSD has 18 decimals
      } else {
        setCUSDBalance("0");
      }
    } catch {
      setUSDCBalance("0");
      setCUSDBalance("0");
    }
  }, [address, publicClient, chainId]);

  // Fetch balances on mount and when address, chainId, or publicClient changes
  useEffect(() => {
    if (isConnected && address && publicClient) {
      fetchBalances();

      // Set up polling for balance updates
      const interval = setInterval(() => {
        fetchBalances();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [address, isConnected, publicClient, chainId, fetchBalances]);

  // Handle input change for CUSD
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };



  // Handle USDC mint (fixed amount of 10 USDC)
  const handleUSDCMint = async () => {
    if (!walletClient || !publicClient) {
      setUSDCError("Wallet not connected properly");
      return;
    }

    setUSDCLoading(true);
    setUSDCError("");
    setUSDCSuccess("");

    try {
      // Convert 10 USDC to units (18 decimals)
      const USDCAmountUnits = parseUnits("10", 18);

      // Get USDC contract address for current network
      const USDCAddress = getContractAddress("USDC", chainId);
      if (USDCAddress === '0x0000000000000000000000000000000000000000') {
        setUSDCError("USDC contract not available on current network");
        setUSDCLoading(false);
        return;
      }

      // Prepare the mint transaction
      const { request } = await publicClient.simulateContract({
        address: USDCAddress as `0x${string}`,
        abi: USDCJson.abi,
        functionName: "mint",
        args: [USDCAmountUnits],
        account: address,
      });

      // Execute the transaction using the wallet's provider
      const hash = await walletClient.writeContract(request);

      // Wait for transaction to complete
      await publicClient.waitForTransactionReceipt({ hash });

      // Update balance
      fetchBalances();
      setUSDCSuccess("Successfully minted 10 USDC!");
    } catch (err: unknown) {
      console.error("Error minting USDC:", err);
      setUSDCError(
        err instanceof Error
          ? err.message
          : "Failed to mint USDC. Please try again."
      );
    } finally {
      setUSDCLoading(false);
    }
  };

  // Handle approve and mint CUSD
  const handleMint = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!walletClient || !publicClient) {
      setError("Wallet not connected properly");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Get contract addresses for current network
      const USDCAddress = getContractAddress("USDC", chainId);
      const cusdAddress = getContractAddress("CUSD", chainId);

      if (USDCAddress === '0x0000000000000000000000000000000000000000' ||
        cusdAddress === '0x0000000000000000000000000000000000000000') {
        setError("Contracts not available on current network");
        setLoading(false);
        return;
      }

      // First approve USDC spending
      const USDCAmount = parseUnits(amount, 18); // USDC has 18 decimals

      // Check if we have enough USDC
      if (parseFloat(USDCBalance) < parseFloat(amount)) {
        setError(`Insufficient USDC balance. You have ${USDCBalance} USDC.`);
        setLoading(false);
        return;
      }

      // Approve USDC
      const { request: approveRequest } = await publicClient.simulateContract({
        address: USDCAddress as `0x${string}`,
        abi: USDCJson.abi,
        functionName: "approve",
        args: [cusdAddress as `0x${string}`, USDCAmount],
        account: address,
      });

      const approveHash = await walletClient.writeContract(approveRequest);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Now call depositAndMint on CUSD contract
      const { request: mintRequest } = await publicClient.simulateContract({
        address: cusdAddress as `0x${string}`,
        abi: CUSDJson.abi,
        functionName: "depositAndMint",
        args: [USDCAmount],
        account: address,
      });

      const mintHash = await walletClient.writeContract(mintRequest);
      await publicClient.waitForTransactionReceipt({ hash: mintHash });

      // Update balances and reset form
      fetchBalances();
      setAmount("");
      setSuccess(`Successfully minted CUSD!`);
    } catch (err: unknown) {
      console.error("Error minting CUSD:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to mint CUSD. Please try again.";
      setError(errorMessage);
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
      <div className="max-w-6xl mx-auto">
        <h1
          className="text-4xl font-bold mb-6 text-center font-mono"
          style={{
            letterSpacing: "0.05em",
            textShadow:
              "0.05em 0 0 rgba(255,140,0,0.75), -0.025em -0.05em 0 rgba(255,127,80,0.75), 0.025em 0.05em 0 rgba(255,99,71,0.75)",
            fontFamily: "monospace",
          }}
        >
          MINT STABLECOINS
        </h1>

        {/* Network Indicator */}
        <div className="text-center mb-4">
          <p className="text-gray-300">
            Network: <span className="text-[#FF8C00] font-bold">{getCurrentNetworkName()}</span>
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg mb-6 backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
            <p className="text-center text-gray-300">
              Please connect your wallet to mint stablecoins
            </p>
          </div>
        ) : (
          <>
            {/* USDC Mint Button - Above CUSD Box */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="bg-black border border-gray-800 p-4 rounded-lg shadow-lg backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 mb-1">
                      Your USDC Balance:{" "}
                      <span className="text-[#FF8C00] font-bold">
                        {USDCBalance} USDC
                      </span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Need USDC to mint CUSD? Get 10 USDC for testing
                    </p>
                  </div>

                  <button
                    onClick={handleUSDCMint}
                    disabled={USDCLoading}
                    className={`px-6 py-3 rounded-md text-white font-medium transition-colors ${USDCLoading ? "opacity-70" : ""
                      } bg-black border border-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.7)] hover:shadow-[0_0_20px_rgba(255,140,0,1)] hover:text-[#FF8C00]`}
                  >
                    {USDCLoading ? "Processing..." : "Mint 10 USDC"}
                  </button>
                </div>

                {USDCError && (
                  <p className="mt-2 text-red-400 text-sm">Error: {USDCError}</p>
                )}

                {USDCSuccess && (
                  <p className="mt-2 text-green-400 text-sm">{USDCSuccess}</p>
                )}
              </div>
            </div>

            {/* CUSD Mint Box */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg mb-6 backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
                <h2 className="text-2xl font-bold mb-4 text-[#FF8C00] font-mono">
                  MINT CUSD
                </h2>

                <div className="mb-4">
                  <p className="text-gray-300 mb-2">
                    Your USDC Balance:{" "}
                    <span className="text-[#FF8C00] font-bold">
                      {USDCBalance} USDC
                    </span>
                  </p>
                  <p className="text-gray-300 mb-4">
                    Your CUSD Balance:{" "}
                    <span className="text-[#FF8C00] font-bold">
                      {CUSDBalance} CUSD
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-sm font-medium text-[#FF8C00] mb-1"
                    >
                      Deposit
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="amount"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-black border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                        disabled={loading}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-400">USDC</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#FF8C00] mb-1">
                      Receive
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={amount || "0.0"}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-800 bg-opacity-50 border border-gray-700 text-white rounded-md"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-400">CUSD</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleMint}
                  disabled={loading || !amount}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${loading ? "opacity-70" : ""
                    } bg-black border border-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.7)] hover:shadow-[0_0_20px_rgba(255,140,0,1)] hover:text-[#FF8C00]`}
                >
                  {loading ? "Processing..." : "Mint CUSD"}
                </button>

                {error && (
                  <p className="mt-2 text-red-400 text-sm">Error: {error}</p>
                )}

                {success && (
                  <p className="mt-2 text-green-400 text-sm">{success}</p>
                )}
              </div>

              <div className="bg-black border border-gray-800 p-4 rounded-lg backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
                <h2 className="text-lg font-semibold mb-2 text-[#FF8C00]">
                  About CUSD
                </h2>
                <p className="text-gray-300 mb-2">
                  CUSD is a yield-bearing stablecoin backed by USDC collateral.
                </p>
                <p className="text-gray-300">
                  When you mint CUSD, your USDC is deposited into the protocol and
                  used to generate yield through secure lending markets.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MintPage;



