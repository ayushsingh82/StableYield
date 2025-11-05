"use client";

import React, { useState } from "react";
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi";
import LoanManagerJson from "@/contracts/LoanManager.sol/LoanManager.json";
import { getContractAddress } from "@/config";

interface RepayLoanButtonProps {
    loanDetails: {
        amount: string;
        interestRate: number;
        startTime: number;
        dueTime: number;
        isRepaid: boolean;
        collateralAmount: string;
        loanedUSDCAmount: string;
    } | null;
    repayAmount: string;
    onRepaySuccess: () => void;
    onError: (error: string) => void;
    className?: string;
    variant?: "default" | "text";
}

export default function RepayLoanButton({
    loanDetails,
    repayAmount,
    onRepaySuccess,
    onError,
    className = "",
    variant = "default"
}: RepayLoanButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const chainId = useChainId();

    // Format repayment amount for display
    const formatRepaymentAmount = (amount: string) => {
        const num = parseFloat(amount);
        if (isNaN(num) || num === 0) return "0.00";
        return num.toFixed(4);
    };

    // Handle repay loan action
    const handleRepayLoan = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!repayAmount || parseFloat(repayAmount) <= 0) {
            onError("Please enter a valid repayment amount");
            return;
        }

        if (!walletClient || !publicClient) {
            onError("Wallet not connected properly");
            return;
        }

        setIsLoading(true);
        try {
            const loanManagerAddress = getContractAddress("LoanManager", chainId);
            if (loanManagerAddress === '0x0000000000000000000000000000000000000000') {
                onError("LoanManager contract not available on current network");
                setIsLoading(false);
                return;
            }

            // Call repayLoan on LoanManager contract
            const { request } = await publicClient.simulateContract({
                address: loanManagerAddress as `0x${string}`,
                abi: LoanManagerJson.abi,
                functionName: "repayLoan",
                args: [],
                account: address,
            });

            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });

            onRepaySuccess();
            setShowModal(false);
        } catch (error: unknown) {
            console.error("Error repaying loan:", error);
            onError(error instanceof Error ? error.message : "Failed to repay loan");
        } finally {
            setIsLoading(false);
        }
    };

    // Don't render if no active loan
    if (!loanDetails || loanDetails.isRepaid || parseFloat(loanDetails.amount) <= 0) {
        return null;
    }

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
                {variant === "text" ? "Repay" : "Repay Loan"}
            </button>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-black border border-gray-800 p-8 rounded-lg max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Repay Loan</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleRepayLoan}>
                            <div className="mb-6">
                                <label className="block text-gray-300 mb-2">
                                    Loan to Repay
                                </label>
                                <div className="w-full p-4 bg-gray-900 rounded-lg text-white">
                                    {loanDetails.amount} cUSD (Due:{" "}
                                    {new Date(Number(loanDetails.dueTime) * 1000).toLocaleDateString()})
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-300 mb-2">
                                    Repayment Amount (cUSD)
                                </label>
                                <input
                                    type="number"
                                    value={formatRepaymentAmount(repayAmount)}
                                    readOnly
                                    className="w-full p-4 bg-gray-900 rounded-lg text-white outline-none"
                                />
                                <p className="text-sm text-gray-400 mt-2">
                                    Full repayment will release all delegation. Amount is 2x the principal.
                                </p>
                            </div>

                            <div className="mb-8 p-4 bg-gray-900 rounded-lg">
                                <h3 className="font-bold mb-2">Loan Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-400">Principal</p>
                                        <p className="font-medium">{loanDetails.amount} cUSD</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Additional Amount Due</p>
                                        <p className="font-medium">
                                            {isNaN(parseFloat(repayAmount) - parseFloat(loanDetails.amount))
                                                ? "0.0000"
                                                : (parseFloat(repayAmount) - parseFloat(loanDetails.amount)).toFixed(4)} cUSD
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Delegation to Release</p>
                                        <p className="font-medium">
                                            {loanDetails.collateralAmount} stCORE
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Due Date</p>
                                        <p className="font-medium">
                                            {new Date(Number(loanDetails.dueTime) * 1000).toLocaleDateString()}
                                        </p>
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
                                    {isLoading ? "PROCESSING..." : "REPAY LOAN"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
