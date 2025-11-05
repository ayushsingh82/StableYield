'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import stCOREJson from '@/contracts/stCORE.sol/stCORE.json';
import EigenJson from '@/contracts/Eigen.sol/Eigen.json';
import { getContractAddress } from '@/config';

interface MintAndRestakeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMint: () => void;
    step: number;
    isStep1Loading: boolean;
    isStep2Loading: boolean;
    step1Hash?: string;
    step2Hash?: string;
    error?: string | null;
}

const MintAndRestakeModal: React.FC<MintAndRestakeModalProps> = ({
    isOpen,
    onClose,
    onMint,
    step,
    isStep1Loading,
    isStep2Loading,
    step1Hash,
    step2Hash,
    error,
}) => {
    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-black rounded-lg p-6 max-w-md w-full mx-4 backdrop-blur-sm" style={{ zIndex: 1000000, position: 'relative' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Mint & Delegate 10 stCORE</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Error Display */}
                    {error && (
                        <div className="p-4 rounded-lg border-2 border-red-500 bg-red-900 bg-opacity-50">
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Step 1 */}
                    <div className={`p-4 rounded-lg border-2 ${step >= 1 ? 'border-[#FF8C00] bg-black bg-opacity-50' : 'border-gray-700 bg-black bg-opacity-30'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-white">Step 1: Mint 10 stCORE</h3>
                                <p className="text-sm text-gray-300">Minting stCORE tokens to your wallet</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                {step > 1 && (
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                    </div>
                                )}
                                {step === 1 && isStep1Loading && (
                                    <div className="w-6 h-6 border-2 border-[#FF8C00] border-t-transparent rounded-full animate-spin"></div>
                                )}
                            </div>
                        </div>
                        {step1Hash && (
                            <p className="text-xs text-[#FF8C00] mt-2">
                                Transaction: {step1Hash.slice(0, 10)}...{step1Hash.slice(-8)}
                            </p>
                        )}
                    </div>

                    {/* Step 2 */}
                    <div className={`p-4 rounded-lg border-2 ${step >= 2 ? 'border-[#FF8C00] bg-black bg-opacity-50' : 'border-gray-700 bg-black bg-opacity-30'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-white">Step 2: Delegate to Operator</h3>
                                <p className="text-sm text-gray-300">Delegating stCORE to the operator</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                {step > 2 && (
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                    </div>
                                )}
                                {step === 2 && isStep2Loading && (
                                    <div className="w-6 h-6 border-2 border-[#FF8C00] border-t-transparent rounded-full animate-spin"></div>
                                )}
                            </div>
                        </div>
                        {step2Hash && (
                            <p className="text-xs text-[#FF8C00] mt-2">
                                Transaction: {step2Hash.slice(0, 10)}...{step2Hash.slice(-8)}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                        {step === 0 && (
                            <button
                                onClick={onMint}
                                className="flex-1 bg-black border border-[#FF8C00] text-white py-2 px-4 rounded-lg hover:text-[#FF8C00] transition-colors shadow-[0_0_15px_rgba(255,140,0,0.7)] hover:shadow-[0_0_20px_rgba(255,140,0,1)]"
                            >
                                Start Process
                            </button>
                        )}
                        {step === 3 && (
                            <button
                                onClick={onClose}
                                className="flex-1 bg-black border border-green-500 text-white py-2 px-4 rounded-lg hover:text-green-400 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.7)] hover:shadow-[0_0_20px_rgba(34,197,94,1)]"
                            >
                                Complete
                            </button>
                        )}
                        {(step === 1 || step === 2) && (
                            <button
                                disabled
                                className="flex-1 bg-gray-800 text-gray-400 py-2 px-4 rounded-lg cursor-not-allowed border border-gray-700"
                            >
                                Processing...
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

interface MintAndRestakeButtonProps {
    onComplete?: () => void;
    showDelegated?: boolean;
}

const MintAndRestakeButton: React.FC<MintAndRestakeButtonProps> = ({ onComplete, showDelegated = true }) => {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const chainId = useChainId();

    // State for modal and steps
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [isStep1Loading, setIsStep1Loading] = useState(false);
    const [isStep2Loading, setIsStep2Loading] = useState(false);
    const [step1Hash, setStep1Hash] = useState<string>();
    const [step2Hash, setStep2Hash] = useState<string>();

    // State for delegated amount
    const [delegatedAmount, setDelegatedAmount] = useState("0");
    const [error, setError] = useState<string | null>(null);

    // Fetch delegated amount
    const fetchDelegatedAmount = useCallback(async () => {
        if (!address || !publicClient) return;

        try {
            const eigenAddress = getContractAddress("Eigen", chainId);

            if (eigenAddress === '0x0000000000000000000000000000000000000000') {
                console.error("Eigen contract not available on current network");
                setDelegatedAmount("0");
                return;
            }

            const delegatedData = await publicClient.readContract({
                address: eigenAddress as `0x${string}`,
                abi: EigenJson.abi,
                functionName: "getDelegatedAmount",
                args: [address],
            });

            setDelegatedAmount(formatUnits(delegatedData as bigint, 18));
        } catch (err) {
            console.error("Error fetching delegated amount:", err);
            setDelegatedAmount("0");
        }
    }, [address, publicClient, chainId]);

    // Fetch delegated amount on mount and when address changes
    useEffect(() => {
        if (isConnected && address && publicClient) {
            fetchDelegatedAmount();
        }
    }, [address, isConnected, publicClient, fetchDelegatedAmount]);

    // Handle step 1 completion
    const handleStep2 = useCallback(async () => {
        if (!address || !walletClient || !publicClient || step !== 2) return;

        setIsStep2Loading(true);

        try {
            const eigenAddress = getContractAddress("Eigen", chainId);

            if (eigenAddress === '0x0000000000000000000000000000000000000000') {
                setError("Eigen contract not available on current network");
                setStep(1);
                return;
            }

            // Delegate 10 stCORE to the operator
            const { request } = await publicClient.simulateContract({
                address: eigenAddress as `0x${string}`,
                abi: EigenJson.abi,
                functionName: "addDelegation",
                args: [parseUnits("10", 18)],
                account: address,
            });

            const hash = await walletClient.writeContract(request);
            setStep2Hash(hash);

            // Wait for transaction to complete
            await publicClient.waitForTransactionReceipt({ hash });
        } catch (error) {
            console.error("Error delegating stCORE:", error);
            setError(error instanceof Error ? error.message : "Failed to delegate stCORE");
            setStep(1);
        } finally {
            setIsStep2Loading(false);
        }
    }, [address, walletClient, publicClient, step, chainId]);

    useEffect(() => {
        if (step1Hash && !isStep1Loading) {
            setStep(2);
            handleStep2();
        }
    }, [step1Hash, isStep1Loading, step, handleStep2]);

    // Handle step 2 completion
    useEffect(() => {
        if (step2Hash && !isStep2Loading) {
            setStep(3);
            // Refetch delegated amount after step 2 completes
            setTimeout(() => {
                fetchDelegatedAmount();
            }, 1000);
            // Call the callback to refresh parent component data
            if (onComplete) {
                onComplete();
            }
        }
    }, [step2Hash, isStep2Loading, onComplete, fetchDelegatedAmount]);

    const handleMint = async () => {
        if (!address || !walletClient || !publicClient) {
            console.error("Wallet not connected properly");
            return;
        }

        setStep(1);
        setIsStep1Loading(true);

        try {
            const stcoreAddress = getContractAddress("stCORE", chainId);

            if (stcoreAddress === '0x0000000000000000000000000000000000000000') {
                setError("stCORE contract not available on current network");
                setStep(0);
                return;
            }

            // Convert 10 stCORE to units (18 decimals)
            const stCOREAmountUnits = parseUnits("10", 18);

            // Prepare the mint transaction
            const { request } = await publicClient.simulateContract({
                address: stcoreAddress as `0x${string}`,
                abi: stCOREJson.abi,
                functionName: "mint",
                args: [stCOREAmountUnits],
                account: address,
            });

            // Execute the transaction
            const hash = await walletClient.writeContract(request);
            setStep1Hash(hash);

            // Wait for transaction to complete
            await publicClient.waitForTransactionReceipt({ hash });
        } catch (error) {
            console.error("Error minting stCORE:", error);
            setError(error instanceof Error ? error.message : "Failed to mint stCORE");
            setStep(0);
        } finally {
            setIsStep1Loading(false);
        }
    };

    const formatDelegated = (delegated: string) => {
        return parseFloat(delegated).toFixed(2);
    };

    if (!isConnected) {
        return (
            <div className="bg-black rounded-lg p-3 text-center backdrop-blur-sm">
                <p className="text-gray-300 text-sm">Please connect your wallet to mint and delegate stCORE</p>
            </div>
        );
    }

    return (
        <div className="bg-black rounded-lg shadow-lg p-2 backdrop-blur-sm">
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-black border border-[#FF8C00] text-white py-2 px-4 rounded-lg hover:text-[#FF8C00] transition-colors font-semibold text-sm shadow-[0_0_15px_rgba(255,140,0,0.7)] hover:shadow-[0_0_20px_rgba(255,140,0,1)] cursor-pointer"
            >
                Mint & Delegate 10 stCORE{showDelegated && ` • Delegated: ${formatDelegated(delegatedAmount)} stCORE`}
            </button>

            <MintAndRestakeModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setStep(0);
                    setStep1Hash(undefined);
                    setStep2Hash(undefined);
                    setError(null);
                    // Refetch delegated amount when modal closes
                    setTimeout(() => {
                        fetchDelegatedAmount();
                    }, 500);
                }}
                onMint={handleMint}
                step={step}
                isStep1Loading={isStep1Loading}
                isStep2Loading={isStep2Loading}
                step1Hash={step1Hash}
                step2Hash={step2Hash}
                error={error}
            />
        </div>
    );
};

export default MintAndRestakeButton;
