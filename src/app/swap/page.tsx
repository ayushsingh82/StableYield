"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import CUSDJson from "@/contracts/CUSD.sol/CUSD.json";
import sCUSDJson from "@/contracts/sCUSD.sol/sCUSD.json";
import { getContractAddress } from "../../config";
import MintCusdButton from "../components/MintCusdButton";

const SwapPage = () => {
  const [fromToken, setFromToken] = useState("CUSD");
  const [toToken, setToToken] = useState("stcUSD");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [CUSDBalance, setCUSDBalance] = useState("0");
  const [stcUSDBalance, setStcUSDBalance] = useState("0");

  // Fetch current exchange rate from vault
  const [currentRate, setCurrentRate] = useState<string>("1.0");
  const [unusualRate, setUnusualRate] = useState<boolean>(false);

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const fetchCurrentRate = useCallback(async () => {
    if (!publicClient) return;

    try {
      const sCUSDAddress = getContractAddress("sCUSD", chainId);
      if (sCUSDAddress === '0x0000000000000000000000000000000000000000') {
        setCurrentRate("1.0");
        return;
      }

      // Get rate by checking how many shares 1 asset would give
      const oneAsset = parseUnits("1", 18);
      const sharesForOneAsset = await publicClient.readContract({
        address: sCUSDAddress as `0x${string}`,
        abi: sCUSDJson.abi,
        functionName: "previewDeposit",
        args: [oneAsset],
      });

      if (sharesForOneAsset && typeof sharesForOneAsset === 'bigint') {
        const rate = formatUnits(sharesForOneAsset, 18);
        console.log(`Debug: Current vault rate - 1 cUSD = ${rate} stcUSD (raw: ${sharesForOneAsset.toString()})`);
        setCurrentRate(rate);
      } else {
        console.error("Invalid shares result:", sharesForOneAsset);
        setCurrentRate("1.0");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error fetching current rate:", err);
      } else {
        console.error("Error fetching current rate:", err);
      }
      setCurrentRate("1.0");
    }
  }, [publicClient, chainId]);

  // Debug function to check vault state
  const debugVaultState = useCallback(async () => {
    if (!publicClient) return;

    try {
      const sCUSDAddress = getContractAddress("sCUSD", chainId);
      if (sCUSDAddress === '0x0000000000000000000000000000000000000000') {
        console.log("Debug: sCUSD contract not deployed");
        return;
      }

      // Check total assets and total supply
      const totalAssets = await publicClient.readContract({
        address: sCUSDAddress as `0x${string}`,
        abi: sCUSDJson.abi,
        functionName: "totalAssets",
        args: [],
      });

      const totalSupply = await publicClient.readContract({
        address: sCUSDAddress as `0x${string}`,
        abi: sCUSDJson.abi,
        functionName: "totalSupply",
        args: [],
      });

      console.log(`Debug: Vault state - Total Assets: ${formatUnits(totalAssets as bigint, 18)}, Total Supply: ${formatUnits(totalSupply as bigint, 18)}`);

      if (totalAssets && totalSupply && typeof totalAssets === 'bigint' && typeof totalSupply === 'bigint') {
        const ratio = totalSupply > 0 ? Number(totalAssets) / Number(totalSupply) : 1;
        console.log(`Debug: Assets/Supply ratio: ${ratio}`);

        // Check if the ratio is reasonable (should be close to 1)
        if (ratio > 1.5 || ratio < 0.5) {
          console.warn(`Debug: Unusual vault ratio detected: ${ratio}. This might indicate vault issues.`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error debugging vault state:", err);
      } else {
        console.error("Error debugging vault state:", err);
      }
    }
  }, [publicClient, chainId]);

  // Validate exchange rate is reasonable
  const validateExchangeRate = useCallback((rate: number, fromToken: string, toToken: string): boolean => {
    // For a normal vault, the rate should be close to 1:1
    // Allow some deviation for fees and performance
    const minRate = 0.8; // 20% slippage tolerance
    const maxRate = 1.5; // 50% performance tolerance

    if (rate < minRate || rate > maxRate) {
      console.warn(`Debug: Unusual exchange rate detected: ${rate} for ${fromToken} -> ${toToken}`);
      setUnusualRate(true);
      return false;
    }
    setUnusualRate(false);
    return true;
  }, []);

  // Format number in ETH style
  const formatEthStyle = useCallback((value: string, decimals: number = 8): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00000000";

    // For very small numbers, show more precision
    if (num < 0.000001 && num > 0) {
      return num.toExponential(6);
    }

    // Format with proper decimal places
    const formatted = num.toFixed(decimals);

    // Remove trailing zeros after decimal point
    const trimmed = formatted.replace(/\.?0+$/, '');

    // Add comma separators for thousands
    const parts = trimmed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return parts.join('.');
  }, []);

  // Simple balance display for debugging
  const displayBalance = useCallback((balance: string): string => {
    const num = parseFloat(balance);
    if (isNaN(num)) return "0";

    // Just return the balance as is, since formatUnits should have already handled the decimals
    return balance;
  }, []);

  // Get token decimals
  const getTokenDecimals = useCallback(async (tokenAddress: string) => {
    if (!publicClient) return 18;

    try {
      const decimals = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            inputs: [],
            name: "decimals",
            outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
            stateMutability: "view",
            type: "function"
          }
        ],
        functionName: "decimals",
        args: [],
      });
      return Number(decimals);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Error getting decimals for ${tokenAddress}:`, err);
      } else {
        console.error(`Error getting decimals for ${tokenAddress}:`, err);
      }
      return 18; // fallback to 18
    }
  }, [publicClient]);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      const CUSDAddress = getContractAddress("CUSD", chainId);
      const sCUSDAddress = getContractAddress("sCUSD", chainId);

      // Fetch CUSD balance
      if (CUSDAddress !== '0x0000000000000000000000000000000000000000') {
        const CUSDBalanceData = await publicClient.readContract({
          address: CUSDAddress as `0x${string}`,
          abi: CUSDJson.abi,
          functionName: "balanceOf",
          args: [address],
        });
        if (CUSDBalanceData && typeof CUSDBalanceData === 'bigint') {
          const cusdDecimals = await getTokenDecimals(CUSDAddress);
          const formattedBalance = formatUnits(CUSDBalanceData, cusdDecimals);
          console.log(`Debug: CUSD Balance - Raw: ${CUSDBalanceData.toString()}, Decimals: ${cusdDecimals}, Formatted: ${formattedBalance}`);
          setCUSDBalance(formattedBalance);
        }
      }

      // Fetch stcUSD (sCUSD) balance
      if (sCUSDAddress !== '0x0000000000000000000000000000000000000000') {
        const stcUSDBalanceData = await publicClient.readContract({
          address: sCUSDAddress as `0x${string}`,
          abi: sCUSDJson.abi,
          functionName: "balanceOf",
          args: [address],
        });
        if (stcUSDBalanceData && typeof stcUSDBalanceData === 'bigint') {
          const stcusdDecimals = await getTokenDecimals(sCUSDAddress);
          const formattedBalance = formatUnits(stcUSDBalanceData, stcusdDecimals);
          console.log(`Debug: stcUSD Balance - Raw: ${stcUSDBalanceData.toString()}, Decimals: ${stcusdDecimals}, Formatted: ${formattedBalance}`);
          console.log(`Debug: stcUSD Balance - Raw length: ${stcUSDBalanceData.toString().length}`);
          console.log(`Debug: stcUSD Balance - Is zero: ${stcUSDBalanceData === BigInt(0)}`);
          console.log(`Debug: stcUSD Balance - Manual calculation: ${stcUSDBalanceData.toString()} / 10^${stcusdDecimals} = ${Number(stcUSDBalanceData) / Math.pow(10, stcusdDecimals)}`);

          setStcUSDBalance(formattedBalance);
        } else {
          console.error("Debug: stcUSD Balance data is invalid:", stcUSDBalanceData);
          setStcUSDBalance("0");
        }
      } else {
        console.log("Debug: sCUSD contract address not found");
        setStcUSDBalance("0");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error fetching balances:", err);
      } else {
        console.error("Error fetching balances:", err);
      }
    }
  }, [address, publicClient, chainId, getTokenDecimals]);

  // Calculate preview
  const calculateSwap = useCallback(async () => {
    if (!fromAmount || !publicClient) {
      setToAmount("");
      return;
    }

    // Validate that fromAmount is a valid number
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      setToAmount("");
      return;
    }

    try {
      const sCUSDAddress = getContractAddress("sCUSD", chainId);
      if (sCUSDAddress === '0x0000000000000000000000000000000000000000') {
        setToAmount(fromAmount); // 1:1 rate if contract not available
        return;
      }

      // Validate input amount
      const inputAmount = parseUnits(fromAmount, 18);
      if (inputAmount === BigInt(0)) {
        setToAmount("");
        return;
      }

      if (fromToken === "CUSD" && toToken === "stcUSD") {
        // Converting cUSD to stcUSD (deposit) - use previewDeposit for accurate amount
        const previewShares = await publicClient.readContract({
          address: sCUSDAddress as `0x${string}`,
          abi: sCUSDJson.abi,
          functionName: "previewDeposit",
          args: [inputAmount],
        });

        // Also get convertToShares for comparison
        const convertToSharesResult = await publicClient.readContract({
          address: sCUSDAddress as `0x${string}`,
          abi: sCUSDJson.abi,
          functionName: "convertToShares",
          args: [inputAmount],
        });

        if (previewShares && typeof previewShares === 'bigint') {
          const sharesAmount = formatUnits(previewShares, 18);
          if (convertToSharesResult && typeof convertToSharesResult === 'bigint') {
            const convertAmount = formatUnits(convertToSharesResult, 18);
            console.log(`Debug: ${fromAmount} cUSD -> ${sharesAmount} stcUSD (previewDeposit: ${previewShares.toString()})`);
            console.log(`Debug: ${fromAmount} cUSD -> ${convertAmount} stcUSD (convertToShares: ${convertToSharesResult.toString()})`);
          }

          // Validate the exchange rate
          const rate = parseFloat(sharesAmount) / parseFloat(fromAmount);
          if (!validateExchangeRate(rate, fromToken, toToken)) {
            console.warn(`Debug: Using fallback rate due to unusual exchange rate: ${rate}`);
            setToAmount(fromAmount); // Fallback to 1:1
            return;
          }

          setToAmount(sharesAmount);
        } else {
          console.error("Invalid preview shares result:", previewShares);
          setToAmount(fromAmount); // Fallback to 1:1
        }
      } else if (fromToken === "stcUSD" && toToken === "CUSD") {
        // Converting stcUSD to cUSD (withdraw) - use previewRedeem for accurate amount
        const previewAssets = await publicClient.readContract({
          address: sCUSDAddress as `0x${string}`,
          abi: sCUSDJson.abi,
          functionName: "previewRedeem",
          args: [inputAmount],
        });

        // Also get convertToAssets for comparison
        const convertToAssetsResult = await publicClient.readContract({
          address: sCUSDAddress as `0x${string}`,
          abi: sCUSDJson.abi,
          functionName: "convertToAssets",
          args: [inputAmount],
        });

        if (previewAssets && typeof previewAssets === 'bigint') {
          const assetsAmount = formatUnits(previewAssets, 18);
          if (convertToAssetsResult && typeof convertToAssetsResult === 'bigint') {
            const convertAmount = formatUnits(convertToAssetsResult, 18);
            console.log(`Debug: ${fromAmount} stcUSD -> ${assetsAmount} cUSD (previewRedeem: ${previewAssets.toString()})`);
            console.log(`Debug: ${fromAmount} stcUSD -> ${convertAmount} cUSD (convertToAssets: ${convertToAssetsResult.toString()})`);
          }

          // Validate the exchange rate
          const rate = parseFloat(assetsAmount) / parseFloat(fromAmount);
          if (!validateExchangeRate(rate, fromToken, toToken)) {
            console.warn(`Debug: Using fallback rate due to unusual exchange rate: ${rate}`);
            setToAmount(fromAmount); // Fallback to 1:1
            return;
          }

          setToAmount(assetsAmount);
        } else {
          console.error("Invalid preview assets result:", previewAssets);
          setToAmount(fromAmount); // Fallback to 1:1
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error calculating swap:", err);
      } else {
        console.error("Error calculating swap:", err);
      }
      // Fallback to 1:1 rate if calculation fails
      setToAmount(fromAmount);
    }
  }, [fromAmount, fromToken, toToken, publicClient, chainId, validateExchangeRate]);

  // Handle swap
  const handleSwap = async () => {
    if (!fromAmount || !toAmount || !walletClient || !publicClient) {
      setError("Please enter valid amounts and ensure wallet is connected");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const CUSDAddress = getContractAddress("CUSD", chainId);
      const sCUSDAddress = getContractAddress("sCUSD", chainId);

      if (!CUSDAddress || !sCUSDAddress) {
        throw new Error("Contract addresses not found");
      }

      const inputAmount = parseUnits(fromAmount, 18);

      if (fromToken === "CUSD" && toToken === "stcUSD") {
        // First, approve CUSD spending by sCUSD vault
        const { request: approveRequest } = await publicClient.simulateContract({
          address: CUSDAddress as `0x${string}`,
          abi: CUSDJson.abi,
          functionName: "approve",
          args: [sCUSDAddress as `0x${string}`, inputAmount],
          account: address,
        });

        const approveHash = await walletClient.writeContract(approveRequest);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // Then deposit CUSD to get stcUSD (sCUSD)
        const { request: depositRequest } = await publicClient.simulateContract({
          address: sCUSDAddress as `0x${string}`,
          abi: sCUSDJson.abi,
          functionName: "deposit",
          args: [inputAmount, address],
          account: address,
        });

        const depositHash = await walletClient.writeContract(depositRequest);
        await publicClient.waitForTransactionReceipt({ hash: depositHash });

        setSuccess(`Successfully swapped ${fromAmount} cUSD for ${toAmount} stcUSD!`);
      } else if (fromToken === "stcUSD" && toToken === "CUSD") {
        // Redeem stcUSD to get CUSD
        const { request: redeemRequest } = await publicClient.simulateContract({
          address: sCUSDAddress as `0x${string}`,
          abi: sCUSDJson.abi,
          functionName: "redeem",
          args: [inputAmount, address, address],
          account: address,
        });

        const redeemHash = await walletClient.writeContract(redeemRequest);
        await publicClient.waitForTransactionReceipt({ hash: redeemHash });

        setSuccess(`Successfully swapped ${fromAmount} stcUSD for ${toAmount} cUSD!`);
      }

      setFromAmount("");
      setToAmount("");

      // Refresh balances
      setTimeout(() => {
        fetchBalances();
      }, 2000);

    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Swap error:", err);
        setError(err.message || "Failed to execute swap");
      } else {
        console.error("Swap error:", err);
        setError("Failed to execute swap");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle token swap (switch from/to tokens)
  const handleTokenSwap = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount("");
  }, [fromToken, toToken, toAmount]);

  // Handle input change
  const handleFromAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid decimal numbers
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // Prevent multiple decimal points
      const decimalCount = (value.match(/\./g) || []).length;
      if (decimalCount <= 1) {
        setFromAmount(value);
      }
    }
  }, []);

  // Handle max button
  const handleMaxClick = useCallback(() => {
    if (fromToken === "CUSD") {
      setFromAmount(CUSDBalance);
    } else if (fromToken === "stcUSD") {
      setFromAmount(stcUSDBalance);
    }
  }, [fromToken, CUSDBalance, stcUSDBalance]);

  // Fetch balances on mount and when address changes
  useEffect(() => {
    if (isConnected && address && publicClient) {
      debugVaultState();
      fetchBalances();
      fetchCurrentRate(); // Fetch rate on mount
    }
  }, [address, isConnected, publicClient, chainId, debugVaultState, fetchBalances, fetchCurrentRate]);

  // Calculate swap when fromAmount changes
  useEffect(() => {
    calculateSwap();
  }, [fromAmount, fromToken, toToken, calculateSwap]);

  return (
    <div className="min-h-screen bg-black text-white p-8 relative">
      {/* Dotted Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      <div className="container mx-auto max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-[#FF8C00] mb-2">Stake</h1>
          <p className="text-gray-400">Stake cUSD to earn rewards or unstake stcUSD to get cUSD back</p>
        </div>

        <div className="flex justify-end mb-4">
          <div className="w-[150px]">
            <MintCusdButton onMintComplete={fetchBalances} showBalance={false} />
          </div>
        </div>

        {/* <div className="flex justify-center mb-4">
          <button
            onClick={debugVaultState}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Debug Vault State
          </button>
        </div> */}

        {/* Main Swap Card */}
        <div className="bg-black/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-gray-700 animate-slide-up relative">
          {/* Dotted Background Pattern for Swap Card */}
          <div className="absolute inset-0 opacity-20 rounded-3xl overflow-hidden">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '15px 15px'
            }}></div>
          </div>
          <div className="relative z-10">

            {/* From Token */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 mb-3 border border-gray-700 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">From</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    Balance: {fromToken === "CUSD" ? displayBalance(CUSDBalance) : displayBalance(stcUSDBalance)}
                  </span>
                  <button
                    onClick={handleMaxClick}
                    className="text-[#FF8C00] text-sm hover:text-[#FFA500] transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={fromAmount}
                    onChange={handleFromAmountChange}
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-500"
                  />
                </div>
                <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${fromToken === "CUSD" ? "bg-[#FF8C00]" : "bg-[#FF6347]"}`}>
                    <span className="text-white font-bold text-xs">{fromToken === "CUSD" ? "C" : "S"}</span>
                  </div>
                  <span className="font-semibold text-sm">{fromToken}</span>
                </div>
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center my-2">
              <button
                onClick={handleTokenSwap}
                className="w-8 h-8 bg-gray-700/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-600 hover:bg-gray-600/80 transition-colors"
              >
                <svg className="w-4 h-4 text-[#FF8C00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* Exchange Rate Display */}
            <div className="text-center mb-4 p-3 bg-gray-800/40 rounded-lg border border-gray-700">
              {fromAmount && toAmount && parseFloat(fromAmount) > 0 ? (
                <>
                  <div className="text-sm text-gray-400">
                    Exchange Rate: 1 {fromToken} = {parseFloat(fromAmount) > 0 ? formatEthStyle((parseFloat(toAmount) / parseFloat(fromAmount)).toString(), 8) : "0.00000000"} {toToken}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Rate may vary based on vault performance
                  </div>
                  {unusualRate && false && (
                    <div className="text-xs text-yellow-400 mt-2 p-2 bg-yellow-900/20 rounded border border-yellow-500">
                      ⚠️ Unusual exchange rate detected. Please check vault status.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-400">
                    Current Rate: 1 cUSD ≈ {formatEthStyle(currentRate, 8)} stcUSD
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Rate updates based on vault performance
                  </div>
                </>
              )}
            </div>

            {/* To Token */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">To</span>
                <span className="text-sm text-gray-400">
                  Balance: {toToken === "CUSD" ? displayBalance(CUSDBalance) : displayBalance(stcUSDBalance)}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={toAmount}
                    readOnly
                    placeholder="0.0"
                    className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-500"
                  />
                </div>
                <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${toToken === "CUSD" ? "bg-[#FF8C00]" : "bg-[#FF6347]"}`}>
                    <span className="text-white font-bold text-xs">{toToken === "CUSD" ? "C" : "S"}</span>
                  </div>
                  <span className="font-semibold text-sm">{toToken}</span>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={loading || !fromAmount || !isConnected}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-500 animate-slide-up ${loading || !fromAmount || !isConnected
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-[#FF8C00] to-[#FF6347] text-white hover:from-[#FFA500] hover:to-[#FF8C00] transform hover:scale-105"
                }`}
              style={{ animationDelay: '0.6s' }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Swapping...</span>
                </div>
              ) : !isConnected ? (
                "Connect Wallet"
              ) : !fromAmount ? (
                "Enter Amount"
              ) : (
                `Swap ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`
              )}
            </button>

            {/* Error/Success Messages */}
            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-xl text-red-400 animate-slide-up" style={{ animationDelay: '0.7s' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-500 rounded-xl text-green-400 animate-slide-up" style={{ animationDelay: '0.7s' }}>
                {success}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8">
          <div className="bg-black/90 backdrop-blur-md rounded-2xl p-6 border border-gray-700 animate-slide-up hover:scale-105 transition-transform duration-500 relative" style={{ animationDelay: '0.8s' }}>
            {/* Dotted Background Pattern for Info Card */}
            <div className="absolute inset-0 opacity-20 rounded-2xl overflow-hidden">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                backgroundSize: '15px 15px'
              }}></div>
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-[#FF8C00] mb-3">About cUSD</h3>
              <p className="text-gray-400 text-sm mb-4">
                cUSD is the native stablecoin of the StableCORE ecosystem. It&apos;s used as the base asset for trading and lending.
              </p>
              <h3 className="text-lg font-semibold text-[#FF6347] mb-3">About stcUSD</h3>
              <p className="text-gray-400 text-sm">
                stcUSD represents staked cUSD shares. By swapping cUSD for stcUSD, you&apos;re depositing into the vault and earning yield.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapPage;