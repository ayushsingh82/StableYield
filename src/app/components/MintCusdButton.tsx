'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { getContractAddress } from '@/config';
import CUSD_ABI from '@/contracts/CUSD.sol/CUSD.json';
import USDC_ABI from '@/contracts/USDC/USDC.json';

interface MintModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMint: () => void;
    step: number;
    isStep1Loading: boolean;
    isStep2Loading: boolean;
    step1Hash?: string;
    step2Hash?: string;
}

const MintModal: React.FC<MintModalProps> = ({
    isOpen,
    onClose,
    onMint,
    step,
    isStep1Loading,
    isStep2Loading,
    step1Hash,
    step2Hash,
}) => {
    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-black rounded-lg p-6 max-w-md w-full mx-4 backdrop-blur-sm" style={{ zIndex: 1000000, position: 'relative' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Mint 10 cUSD</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Step 1 */}
                    <div className={`p-4 rounded-lg border-2 ${step >= 1 ? 'border-[#FF8C00] bg-black bg-opacity-50' : 'border-gray-700 bg-black bg-opacity-30'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-white">Step 1: Mint 10 USDC</h3>
                                <p className="text-sm text-gray-300">Minting USDC tokens to your wallet</p>
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
                                <h3 className="font-semibold text-white">Step 2: Mint 10 cUSD From USDC</h3>
                                <p className="text-sm text-gray-300">Converting USDC to cUSD</p>
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
                                Start Minting
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

interface MintCusdButtonProps {
    onMintComplete?: () => void;
    showBalance?: boolean;
}

const MintCusdButton: React.FC<MintCusdButtonProps> = ({ onMintComplete, showBalance = true }) => {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [step1Hash, setStep1Hash] = useState<string>();
    const [step2Hash, setStep2Hash] = useState<string>();

    // Get contract addresses for current network
    const getCUSDAddress = useCallback(() => {
        return getContractAddress('CUSD', chainId);
    }, [chainId]);

    const getUSDCAddress = useCallback(() => {
        return getContractAddress('USDC', chainId);
    }, [chainId]);

    // Read cUSD balance with manual refetch capability
    const { data: cusdBalance, refetch: refetchCusdBalance } = useReadContract({
        address: getCUSDAddress() as `0x${string}`,
        abi: CUSD_ABI.abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        query: {
            enabled: !!address && !!getCUSDAddress() && getCUSDAddress() !== '0x0000000000000000000000000000000000000000',
            refetchInterval: 3000, // Refetch every 3 seconds
        },
    });

    // Step 1: Mint USDC
    const { writeContract: mintUsdc, data: step1Data } = useWriteContract();
    const { isLoading: isStep1Loading } = useWaitForTransactionReceipt({
        hash: step1Data,
    });

    // Step 2: Mint cUSD
    const { writeContract: mintCusd, data: step2Data } = useWriteContract();
    const { isLoading: isStep2Loading } = useWaitForTransactionReceipt({
        hash: step2Data,
    });

    // Handle step 1 completion
    useEffect(() => {
        if (step1Data && !isStep1Loading) {
            setStep1Hash(step1Data);
            setStep(2);
            setTimeout(() => {
                refetchCusdBalance();
            }, 1000);
        }
    }, [step1Data, isStep1Loading, refetchCusdBalance]);

    // Handle step 2 completion
    useEffect(() => {
        if (step2Data && !isStep2Loading) {
            setStep2Hash(step2Data);
            setStep(3);
            setTimeout(() => {
                refetchCusdBalance();
            }, 1000);
            if (onMintComplete) {
                onMintComplete();
            }
        }
    }, [step2Data, isStep2Loading, refetchCusdBalance, onMintComplete]);

    const handleMint = async () => {
        if (!address) return;

        const usdcAddress = getUSDCAddress();
        if (!usdcAddress || usdcAddress === '0x0000000000000000000000000000000000000000') {
            console.error('USDC contract not available on current network');
            return;
        }

        setStep(1);

        try {
            // Step 1: Mint 10 USDC
            await mintUsdc({
                address: usdcAddress as `0x${string}`,
                abi: USDC_ABI.abi,
                functionName: 'mint',
                args: [parseEther('10')],
            });
        } catch {
            console.error('Error minting USDC');
            setStep(0);
        }
    };

    const handleStep2 = useCallback(async () => {
        if (!address || step !== 2) return;
        const cusdAddress = getCUSDAddress();
        if (!cusdAddress || cusdAddress === '0x0000000000000000000000000000000000000000') {
            return;
        }
        try {
            await mintCusd({
                address: cusdAddress as `0x${string}`,
                abi: CUSD_ABI.abi,
                functionName: 'depositAndMint',
                args: [parseEther('10')],
            });
        } catch {
            setStep(1);
        }
    }, [address, step, getCUSDAddress, mintCusd]);

    // Trigger step 2 when step 1 is complete
    useEffect(() => {
        if (step === 2 && !isStep1Loading) {
            handleStep2();
        }
    }, [step, isStep1Loading, handleStep2]);

    const formatBalance = (balance: unknown) => {
        if (!balance || typeof balance !== 'bigint') return '0';
        return parseFloat(formatEther(balance)).toFixed(2);
    };

    if (!isConnected) {
        return (
            <div className="bg-black rounded-lg p-3 text-center backdrop-blur-sm">
                <p className="text-gray-300 text-sm">Please connect your wallet to mint cUSD</p>
            </div>
        );
    }

    return (
        <div className="bg-black rounded-lg shadow-lg p-2 backdrop-blur-sm">
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-black border border-[#FF8C00] text-white py-2 px-4 rounded-lg hover:text-[#FF8C00] transition-colors font-semibold text-sm shadow-[0_0_15px_rgba(255,140,0,0.7)] hover:shadow-[0_0_20px_rgba(255,140,0,1)] cursor-pointer"
            >
                Mint 10 cUSD{showBalance && ` • Balance: ${formatBalance(cusdBalance)} cUSD`}
            </button>

            <MintModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setStep(0);
                    setStep1Hash(undefined);
                    setStep2Hash(undefined);
                    // Refetch balances when modal closes
                    setTimeout(() => {
                        refetchCusdBalance();
                    }, 500);
                }}
                onMint={handleMint}
                step={step}
                isStep1Loading={isStep1Loading}
                isStep2Loading={isStep2Loading}
                step1Hash={step1Hash}
                step2Hash={step2Hash}
            />
        </div>
    );
};

export default MintCusdButton;
