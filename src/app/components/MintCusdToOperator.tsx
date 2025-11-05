"use client";

import { useState } from "react";
import { usePublicClient, useWalletClient, useAccount, useChainId } from "wagmi";
import { parseUnits } from "viem";
import CUSDJson from "../../contracts/CUSD.sol/CUSD.json";
import { getContractAddress } from "../../config";

interface MintCusdToOperatorProps {
    onMintSuccess?: () => void;
    onMintError?: (error: string) => void;
}

export default function MintCusdToOperator({ onMintSuccess, onMintError }: MintCusdToOperatorProps) {
    const [loading, setLoading] = useState(false);
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

    // Handle minting cUSD to operator
    const handleMintToOperator = async () => {
        if (!walletClient || !publicClient) {
            const errorMsg = "Wallet not connected properly";
            showNotification(errorMsg, "error");
            onMintError?.(errorMsg);
            return;
        }

        setLoading(true);
        try {
            const cusdAddress = getContractAddress("CUSD", chainId);

            if (cusdAddress === '0x0000000000000000000000000000000000000000') {
                const errorMsg = "CUSD contract not available on current network";
                showNotification(errorMsg, "error");
                onMintError?.(errorMsg);
                setLoading(false);
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
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : "Failed to mint to operator";
            console.error("Error minting to operator:", error);
            showNotification(errorMsg, "error");
            onMintError?.(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Mint cUSD to Operator</h3>
                <p className="text-gray-400 text-sm">
                    Mint 10 cUSD tokens directly to the operator address
                </p>
            </div>

            <button
                onClick={handleMintToOperator}
                disabled={loading}
                className="w-full px-6 py-3 bg-[#FF8C00] hover:bg-[#FF8C00]/80 disabled:bg-gray-600 text-black font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
                {loading ? (
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
