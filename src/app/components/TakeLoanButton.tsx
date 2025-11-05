"use client";

import React, { useState } from "react";
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi";
import { parseUnits } from "viem";
import LoanManagerJson from "@/contracts/LoanManager.sol/LoanManager.json";
import { getContractAddress } from "@/config";

interface TakeLoanButtonProps {
    onTakeLoanSuccess: () => void;
    onError: (error: string) => void;
    className?: string;
    variant?: "default" | "text";
    presetAmount?: string;
    currentDelegation?: string;
}

export default function TakeLoanButton({
    onTakeLoanSuccess,
    onError,
    className = "",
    variant = "default",
    presetAmount = "10",
    currentDelegation = "0"
}: TakeLoanButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [loanAmount, setLoanAmount] = useState("10");
    const [collateralAmount, setCollateralAmount] = useState("15");

    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const chainId = useChainId();

    // Handle take loan action
    const handleTakeLoan = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!loanAmount || parseFloat(loanAmount) <= 0) {
            onError("Please enter a valid loan amount");
            return;
        }

        if (!walletClient || !publicClient) {
            onError("Wallet not connected properly");
            return;
        }

        setIsLoading(true);
        try {
            // Convert loan amount from cUSD to wei
            const loanAmountInWei = parseUnits(loanAmount, 18);

            const loanManagerAddress = getContractAddress("LoanManager", chainId);
            if (loanManagerAddress === '0x0000000000000000000000000000000000000000') {
                onError("LoanManager contract not available on current network");
                setIsLoading(false);
                return;
            }

            // Call createLoan on LoanManager contract
            const { request } = await publicClient.simulateContract({
                address: loanManagerAddress as `0x${string}`,
                abi: LoanManagerJson.abi,
                functionName: "createLoan",
                args: [loanAmountInWei],
                account: address,
            });

            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });

            onTakeLoanSuccess();
            setShowModal(false);
            setLoanAmount("10");
            setCollateralAmount("15");
        } catch (error: unknown) {
            console.error("Error creating loan:", error);
            onError(error instanceof Error ? error.message : "Failed to create loan");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={
                    variant === "text"
                        ? `text-[#FF8C00] hover:underline ${className}`
                        : `w-full bg-[#FF8C00] text-black py-3 rounded-lg font-medium hover:bg-opacity-90 transition-colors ${className}`
                }
            >
                {variant === "text" ? "Take Loan" : `Take ${presetAmount} cUSD Loan`}
            </button>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-black border border-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Take a New Loan</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleTakeLoan}>
                            <div className="mb-6">
                                <label className="block text-gray-300 mb-2">
                                    Loan Amount (cUSD)
                                </label>
                                <input
                                    type="number"
                                    value={loanAmount}
                                    readOnly
                                    className="w-full p-4 bg-gray-900 rounded-lg text-white outline-none"
                                    required
                                />
                                <p className="text-sm text-gray-400 mt-2">
                                    Fixed loan amount: 10 cUSD
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-300 mb-2">
                                    Current Delegation (stCORE)
                                </label>
                                <input
                                    type="number"
                                    value={currentDelegation}
                                    readOnly
                                    className="w-full p-4 bg-gray-900 rounded-lg text-white outline-none"
                                />
                                <p className="text-sm text-gray-400 mt-2">
                                    Your current delegated amount
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-300 mb-2">
                                    Required Delegation (stCORE)
                                </label>
                                <input
                                    type="number"
                                    value={collateralAmount}
                                    readOnly
                                    className="w-full p-4 bg-gray-900 rounded-lg text-white outline-none"
                                />
                                <p className="text-sm text-gray-400 mt-2">
                                    Collateral ratio: 150%
                                </p>
                            </div>

                            <div className="mb-8 p-4 bg-gray-900 rounded-lg">
                                <h3 className="font-bold mb-2">Loan Terms</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-400">Interest Rate (APR)</p>
                                        <p className="font-medium">5.0%</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Term Length</p>
                                        <p className="font-medium">90 days</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Liquidation Threshold</p>
                                        <p className="font-medium">120%</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Origination Fee</p>
                                        <p className="font-medium">0.5%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#FF8C00] text-black py-3 rounded-lg font-bold hover:bg-opacity-90 transition-colors"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "PROCESSING..." : "TAKE LOAN"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
