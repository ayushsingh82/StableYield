"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePublicClient, useWalletClient, useAccount, useChainId } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import CUSDJson from "../../contracts/CUSD.sol/CUSD.json";
import { getContractAddress } from "../../config";

interface OperatorCUSDBalanceProps {
    onBalanceUpdate?: (balance: string) => void;
    onMintSuccess?: () => void;
    onMintError?: (error: string) => void;
}

export default function OperatorCUSDBalance({ onBalanceUpdate, onMintSuccess, onMintError }: OperatorCUSDBalanceProps) {
    const [operatorBalance, setOperatorBalance] = useState("0");
    const [loading, setLoading] = useState(false);
    const [mintLoading, setMintLoading] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "success" as "success" | "error",
    });

    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { address } = useAccount();
    const chainId = useChainId();

    const showNotification = (message: string, type: "success" | "error") => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 5000);
    };

    // Fetch operator balance
    const fetchOperatorBalance = useCallback(async () => {
        if (!publicClient) return;

        setLoading(true);
        try {
            const operatorAddress = getContractAddress("Operator", chainId);
            const cusdAddress = getContractAddress("CUSD", chainId);

            if (operatorAddress === '0x0000000000000000000000000000000000000000' ||
                cusdAddress === '0x0000000000000000000000000000000000000000') {
                setLoading(false);
                return;
            }

            const operatorBalanceData = await publicClient.readContract({
                address: cusdAddress as `0x${string}`,
                abi: CUSDJson.abi,
                functionName: "balanceOf",
                args: [operatorAddress],
            });

            const formattedBalance = formatUnits(operatorBalanceData as bigint, 18);
            setOperatorBalance(formattedBalance);
            onBalanceUpdate?.(formattedBalance);
        } catch (err) {
            console.error("Error fetching operator balance:", err);
        } finally {
            setLoading(false);
        }
    }, [publicClient, chainId, onBalanceUpdate]);

    // Handle minting cUSD to operator
    const handleMintToOperator = async () => {
        if (!walletClient || !publicClient) {
            const errorMsg = "Wallet not connected properly";
            showNotification(errorMsg, "error");
            onMintError?.(errorMsg);
            return;
        }

        setMintLoading(true);
        try {
            const cusdAddress = getContractAddress("CUSD", chainId);

            if (cusdAddress === '0x0000000000000000000000000000000000000000') {
                const errorMsg = "CUSD contract not available on current network";
                showNotification(errorMsg, "error");
                onMintError?.(errorMsg);
                setMintLoading(false);
                return;
            }

            // Mint 10 CUSD to operator
            const { request } = await publicClient.simulateContract({
                address: cusdAddress as `0x${string}`,
                abi: CUSDJson.abi,
                functionName: "mintToOperator",
                args: [parseUnits("10", 18)], // Mint 10 CUSD to operator
                account: address,
            });

            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });

            const successMsg = "Successfully minted 10 CUSD to operator";
            showNotification(successMsg, "success");
            onMintSuccess?.();

            // Refresh balance after minting
            await fetchOperatorBalance();
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : "Failed to mint to operator";
            console.error("Error minting to operator:", error);
            showNotification(errorMsg, "error");
            onMintError?.(errorMsg);
        } finally {
            setMintLoading(false);
        }
    };

    useEffect(() => {
        fetchOperatorBalance();
    }, [publicClient, chainId, fetchOperatorBalance]);

    return (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Operator cUSD Balance</h3>
                <button
                    onClick={fetchOperatorBalance}
                    disabled={loading}
                    className="px-4 py-2 bg-[#FF8C00] hover:bg-[#FF8C00]/80 disabled:bg-gray-600 text-black font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                    <svg
                        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    <span>{loading ? "Refreshing..." : "Refresh"}</span>
                </button>
            </div>

            <div className="text-center mb-4">
                <div className="text-3xl font-bold text-[#FF8C00] mb-2">
                    {loading ? "Loading..." : `${parseFloat(operatorBalance).toFixed(2)} cUSD`}
                </div>
                <p className="text-gray-400 text-sm">
                    Current operator balance in cUSD tokens
                </p>
            </div>

            {/* Mint Button */}
            <button
                onClick={handleMintToOperator}
                disabled={mintLoading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
                {mintLoading ? (
                    <>
                        <svg
                            className="w-5 h-5 animate-spin"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        <span>Minting...</span>
                    </>
                ) : (
                    <>
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        <span>Mint 10 cUSD to Operator</span>
                    </>
                )}
            </button>

            {/* Notification */}
            {notification.show && (
                <div
                    className={`mt-4 p-3 rounded-lg text-sm font-medium ${notification.type === "success"
                        ? "bg-green-500/20 border border-green-500/30 text-green-400"
                        : "bg-red-500/20 border border-red-500/30 text-red-400"
                        }`}
                >
                    {notification.message}
                </div>
            )}
        </div>
    );
}
