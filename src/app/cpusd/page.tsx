"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import sCUSDJson from "@/contracts/sCUSD.sol/sCUSD.json";
import CUSDJson from "@/contracts/CUSD.sol/CUSD.json";
import ContractAddresses from "../../deployed-address.json";
import MintCusdButton from "../components/MintCusdButton";

const SCUSDPage = () => {
  const [activeTab, setActiveTab] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [USDCBalance, setUSDCBalance] = useState("0");
  const [sCUSDBalance, setSCUSDBalance] = useState("0");
  const [shareBalance, setShareBalance] = useState("0");
  const [vaultBalance, setVaultBalance] = useState("0");
  const [conversionRate, setConversionRate] = useState("1");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Fetch balances and conversion rate
  const fetchVaultData = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      // Fetch CUSD balance (asset)
      const CUSDBalanceData = (await publicClient.readContract({
        address: ContractAddresses.CUSD as `0x${string}`,
        abi: CUSDJson.abi,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;
      setUSDCBalance(formatUnits(CUSDBalanceData, 18));

      // Fetch sCUSD balance (shares)
      const shareBalanceData = (await publicClient.readContract({
        address: ContractAddresses.sCUSD as `0x${string}`,
        abi: sCUSDJson.abi,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;
      setShareBalance(formatUnits(shareBalanceData, 18));

      // Convert shares to assets to get the user's vault balance in CUSD
      if (shareBalanceData > BigInt(0)) {
        const vaultBalanceData = (await publicClient.readContract({
          address: ContractAddresses.sCUSD as `0x${string}`,
          abi: sCUSDJson.abi,
          functionName: "convertToAssets",
          args: [shareBalanceData],
        })) as bigint;
        setVaultBalance(formatUnits(vaultBalanceData, 18));
      } else {
        setVaultBalance("0");
      }

      // Get total assets and shares to calculate conversion rate
      const totalAssets = (await publicClient.readContract({
        address: ContractAddresses.sCUSD as `0x${string}`,
        abi: sCUSDJson.abi,
        functionName: "totalAssets",
        args: [],
      })) as bigint;
      const totalShares = (await publicClient.readContract({
        address: ContractAddresses.sCUSD as `0x${string}`,
        abi: sCUSDJson.abi,
        functionName: "totalSupply",
        args: [],
      })) as bigint;

      // Calculate conversion rate (assets per share)
      if (totalShares > BigInt(0)) {
        const assetsPerShare = Number(totalAssets) / Number(totalShares);
        setConversionRate(assetsPerShare.toString());
      } else {
        // When no shares exist yet, the exchange rate is 1:1
        setConversionRate("1");
      }

      // Preview shares for 10 CUSD deposit
      if (activeTab === "deposit") {
        const assets = parseUnits("10", 18);
        const previewShares = (await publicClient.readContract({
          address: ContractAddresses.sCUSD as `0x${string}`,
          abi: sCUSDJson.abi,
          functionName: "previewDeposit",
          args: [assets],
        })) as bigint;
        setSCUSDBalance(formatUnits(previewShares, 18));
      }


    } catch (err) {
      console.error("Error fetching vault data:", err);
    }
  }, [address, publicClient, activeTab]);

  useEffect(() => {
    if (isConnected && address && publicClient) {
      fetchVaultData();
    }
  }, [address, isConnected, publicClient, activeTab, fetchVaultData]);

  // Handle withdraw preview when amount changes
  useEffect(() => {
    if (isConnected && address && publicClient && activeTab === "withdraw" && amount) {
      const updateWithdrawPreview = async () => {
        try {
          const shares = parseUnits(amount, 18);
          const previewAssets = (await publicClient.readContract({
            address: ContractAddresses.sCUSD as `0x${string}`,
            abi: sCUSDJson.abi,
            functionName: "previewRedeem",
            args: [shares],
          })) as bigint;
          setSCUSDBalance(formatUnits(previewAssets, 18));
        } catch (err) {
          console.error("Error updating withdraw preview:", err);
        }
      };
      updateWithdrawPreview();
    }
  }, [amount, activeTab, address, isConnected, publicClient]);

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Handle deposit (fixed amount of 10 CUSD)
  const handleDeposit = async () => {
    if (!walletClient || !publicClient) {
      showNotification("Wallet not connected properly", "error");
      return;
    }

    // Check if user has at least 10 CUSD
    if (parseFloat(USDCBalance) < 10) {
      showNotification("Insufficient CUSD balance. You need at least 10 CUSD to deposit.", "error");
      return;
    }

    setLoading(true);
    try {
      const depositAmount = "10"; // Fixed amount of 10 CUSD

      // First approve CUSD
      const { request: approveRequest } = await publicClient.simulateContract({
        address: ContractAddresses.CUSD as `0x${string}`,
        abi: CUSDJson.abi,
        functionName: "approve",
        args: [ContractAddresses.sCUSD, parseUnits(depositAmount, 18)],
        account: address,
      });

      const approveHash = await walletClient.writeContract(approveRequest);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Deposit assets
      const { request: depositRequest } = await publicClient.simulateContract({
        address: ContractAddresses.sCUSD as `0x${string}`,
        abi: sCUSDJson.abi,
        functionName: "deposit",
        args: [parseUnits(depositAmount, 18), address],
        account: address,
      });

      const depositHash = await walletClient.writeContract(depositRequest);
      await publicClient.waitForTransactionReceipt({ hash: depositHash });

      fetchVaultData();
      showNotification(`Successfully deposited ${depositAmount} CUSD`, "success");
    } catch (error: unknown) {
      console.error("Error depositing:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to deposit",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle withdraw (using redeem function for exact shares)
  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showNotification("Please enter a valid amount", "error");
      return;
    }

    if (!walletClient || !publicClient) {
      showNotification("Wallet not connected properly", "error");
      return;
    }

    setLoading(true);
    try {
      const { request } = await publicClient.simulateContract({
        address: ContractAddresses.sCUSD as `0x${string}`,
        abi: sCUSDJson.abi,
        functionName: "redeem",
        args: [parseUnits(amount, 18), address, address],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      fetchVaultData();
      setAmount("");
      showNotification(
        `Successfully withdrawn ${sCUSDBalance} CUSD`,
        "success"
      );
    } catch (error: unknown) {
      console.error("Error withdrawing:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to withdraw",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Show notification helper
  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 5000);
  };

  // Update the formatNumber function
  const formatNumber = (value: string, decimals: number = 6) => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return "0";
    if (num < 0.000001) return "< 0.000001";

    // Format with up to 6 decimals but remove trailing zeros
    const formatted = num.toFixed(decimals);
    // Remove trailing zeros after decimal point
    return formatted.replace(/\.?0+$/, "");
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
          SCUSD VAULT
        </h1>

        {notification.show && (
          <div
            className={`mb-4 p-3 rounded-md ${notification.type === "error"
              ? "bg-red-900 bg-opacity-50 text-red-200"
              : "bg-green-900 bg-opacity-50 text-green-200"
              }`}
          >
            {notification.message}
          </div>
        )}

        {/* Mint cUSD Section */}
        <div className="mb-6">
          <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
            <h2 className="text-xl font-bold mb-4 text-[#FF8C00] font-mono">
              Mint cUSD
            </h2>
            <p className="text-gray-300 mb-4">
              Need cUSD to stake? Mint some cUSD tokens first using the two-step process below.
            </p>
            <MintCusdButton onMintComplete={fetchVaultData} />
          </div>
        </div>

        <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
          {/* Tabs */}
          <div className="flex mb-6 border-b border-gray-800">
            <button
              onClick={() => setActiveTab("deposit")}
              className={`py-2 px-4 ${activeTab === "deposit"
                ? "text-[#FF8C00] border-b-2 border-[#FF8C00]"
                : "text-gray-400"
                }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`py-2 px-4 ${activeTab === "withdraw"
                ? "text-[#FF8C00] border-b-2 border-[#FF8C00]"
                : "text-gray-400"
                }`}
            >
              Withdraw
            </button>
          </div>

          {/* Balances */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#FF8C00]">Your Balances</h3>
              <button
                onClick={fetchVaultData}
                className="text-xs bg-gray-700 px-3 py-1 rounded text-gray-300 hover:bg-gray-600 transition-colors"
                title="Refresh balances"
              >
                🔄 Refresh
              </button>
            </div>
            <p className="text-gray-300 mb-2">
              Your CUSD Balance:{" "}
              <span className="text-[#FF8C00] font-bold">
                {formatNumber(USDCBalance)} CUSD
              </span>
            </p>
            <p className="text-gray-300 mb-2">
              Your sCUSD Balance:{" "}
              <span className="text-[#FF8C00] font-bold">
                {formatNumber(shareBalance)} sCUSD
              </span>
            </p>
            <p className="text-gray-300 mb-2">
              Your Vault Balance:{" "}
              <span className="text-[#FF8C00] font-bold">
                {formatNumber(vaultBalance)} CUSD
              </span>
            </p>
            <p className="text-gray-300 mb-4">
              Exchange Rate:{" "}
              <span className="text-[#FF8C00] font-bold">
                {formatNumber(conversionRate)} CUSD per sCUSD
              </span>
            </p>
          </div>

          {/* Deposit Preview - Show for deposit tab */}
          {activeTab === "deposit" && (
            <div className="mb-6">
              <div className="p-4 bg-gray-900 bg-opacity-50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">
                  Deposit Amount: <span className="text-[#FF8C00] font-bold">10 CUSD</span>
                </p>
                <p className="text-sm text-gray-400">
                  You will receive: <span className="text-[#FF8C00] font-bold">~{formatNumber(sCUSDBalance)} sCUSD</span>
                </p>
              </div>
            </div>
          )}

          {/* Amount Input - Only show for withdraw tab */}
          {activeTab === "withdraw" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#FF8C00] mb-1">
                sCUSD Shares to Redeem
              </label>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-black border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                disabled={loading}
              />
              {amount && (
                <p className="text-sm text-gray-400 mt-2">
                  You will receive: {formatNumber(sCUSDBalance)} CUSD
                </p>
              )}
            </div>
          )}

          {/* Action Button */}
          {activeTab === "deposit" ? (
            <button
              onClick={handleDeposit}
              disabled={loading || parseFloat(USDCBalance) < 10}
              className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${loading || parseFloat(USDCBalance) < 10 ? "opacity-50 cursor-not-allowed" : ""
                } bg-black border border-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.7)] hover:shadow-[0_0_20px_rgba(255,140,0,1)] hover:text-[#FF8C00]`}
            >
              {loading
                ? "Processing..."
                : parseFloat(USDCBalance) < 10
                  ? "Insufficient CUSD Balance (Need 10+ CUSD)"
                  : "Deposit 10 CUSD"}
            </button>
          ) : (
            <button
              onClick={handleWithdraw}
              disabled={loading || !amount}
              className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${loading ? "opacity-70" : ""
                } bg-black border border-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.7)] hover:shadow-[0_0_20px_rgba(255,140,0,1)] hover:text-[#FF8C00]`}
            >
              {loading ? "Processing..." : "Withdraw CUSD"}
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-black border border-gray-800 p-4 rounded-lg backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
          <h2 className="text-lg font-semibold mb-2 text-[#FF8C00]">
            About sCUSD Vault
          </h2>
          <p className="text-gray-300 mb-2">
            sCUSD is an ERC4626 tokenized vault that accepts USDC deposits and
            provides sCUSD shares in return.
          </p>
          <p className="text-gray-300">
            The vault automatically compounds yield from lending markets,
            increasing the value of each sCUSD share over time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SCUSDPage;