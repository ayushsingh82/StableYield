"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import stCOREJson from "@/contracts/stCORE.sol/stCORE.json";
import ContractAddresses from "../../deployed-address.json";

const StCOREMint = () => {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      const balanceData = await publicClient.readContract({
        address: ContractAddresses.stCORE as `0x${string}`,
        abi: stCOREJson.abi,
        functionName: "balanceOf",
        args: [address],
      });

      setBalance(formatUnits(balanceData as bigint, 18)); // stCORE has 18 decimals
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  }, [address, publicClient]);

  // Fetch balance on mount and when address changes
  useEffect(() => {
    if (isConnected && address && publicClient) {
      fetchBalance();
    }
  }, [address, isConnected, publicClient, fetchBalance]);

  // Handle input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals, and ensure it's a valid number
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // Validate the number is within reasonable bounds
      const numValue = parseFloat(value);
      if (value === "" || (numValue >= 0 && numValue <= 1000000)) {
        setAmount(value);
      }
    }
  };

  // Handle mint button click
  const handleMint = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount greater than 0");
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
      // Convert ETH amount to wei (18 decimals)
      const amountInWei = parseUnits(amount, 18);

      // Prepare the mint transaction
      const { request } = await publicClient.simulateContract({
        address: ContractAddresses.stCORE as `0x${string}`,
        abi: stCOREJson.abi,
        functionName: "mint",
        args: [amountInWei],
        account: address,
      });

      // Execute the transaction using the wallet's provider
      const hash = await walletClient.writeContract(request);

      // Wait for transaction to complete
      await publicClient.waitForTransactionReceipt({ hash });

      // Update balance and reset form
      fetchBalance();
      setAmount("");
      setSuccess(`Successfully minted ${amount} stCORE!`);
    } catch (err: unknown) {
      console.error("Error minting stCORE:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to mint stCORE. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
          stCORE MINTER
        </h1>

        {!isConnected ? (
          <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg mb-6 backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
            <p className="text-center text-gray-300">
              Please connect your wallet to mint stCORE
            </p>
          </div>
        ) : (
          <>
            <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg mb-6 backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
              <div className="mb-4">
                <p className="text-gray-300 mb-2">
                  Your stCORE Balance:{" "}
                  <span className="text-[#FF8C00] font-bold">
                    {balance} stCORE
                  </span>
                </p>
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
                className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
                  loading ? "opacity-70" : ""
                } bg-black border border-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.7)] hover:shadow-[0_0_20px_rgba(255,140,0,1)] hover:text-[#FF8C00]`}
              >
                {loading ? "Processing..." : "Mint stCORE"}
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
                About stCORE
              </h2>
              <p className="text-gray-300 mb-2">
                This is a testnet version of Liquid Staking Tokens (stCORE) that
                you can mint freely for testing purposes.
              </p>
              <p className="text-gray-300">
                In production, stCOREs represent staked ETH that can be used in
                DeFi while earning staking rewards.
              </p>
              <p className="text-gray-300 mt-2">
                stCOREs are used in the StableCORE protocol for restaking,
                allowing operators to provide security to multiple networks
                simultaneously.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StCOREMint;
