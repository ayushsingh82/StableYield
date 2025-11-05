"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi";
import { formatUnits } from "viem";
import CUSDJson from "@/contracts/CUSD.sol/CUSD.json";
import LoanManagerJson from "@/contracts/LoanManager.sol/LoanManager.json";
import ContractAddresses from "../../deployed-address.json";
import EigenJson from "@/contracts/Eigen.sol/Eigen.json";

import MintAndRestakeButton from "../components/MintAndRestake";
import OperatorCUSDBalance from "../components/OperatorCUSDBalance";
import RepayLoanButton from "../components/RepayLoanButton";
import TakeLoanButton from "../components/TakeLoanButton";
import { getContractAddress } from "@/config";

interface LoanDetails {
  amount: string;
  interestRate: number;
  startTime: number;
  dueTime: number;
  isRepaid: boolean;
  collateralAmount: string;
  loanedUSDCAmount: string;
}

interface LoanContractResponse {
  0: bigint; // amount
  1: bigint; // interestRate
  2: bigint; // startTime
  3: bigint; // dueTime
  4: boolean; // isRepaid
  5: bigint; // collateralAmount
  6: bigint; // loanedUSDCAmount
}

export default function OperatorScreen() {
  const [repayAmount, setRepayAmount] = useState("");
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [delegatedAmount, setDelegatedAmount] = useState("0");
  const [delegatedAmountLoading, setDelegatedAmountLoading] = useState(false);

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  // Fetch stCORE and USDC balances
  const fetchBalances = useCallback(async () => {
    if (!address || !publicClient) return;

    // Fetch delegated amount from Eigen contract separately to ensure it's always attempted
    setDelegatedAmountLoading(true);
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
      console.log("Delegated amount fetched successfully:", formatUnits(delegatedData as bigint, 18));
    } catch (err) {
      console.error("Error fetching delegated amount:", err);
      setDelegatedAmount("0");
    } finally {
      setDelegatedAmountLoading(false);
    }
  }, [address, publicClient, chainId]);

  // Fetch active loan details directly
  const fetchActiveLoans = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      console.log("Fetching active loan for address:", address);

      const loanManagerAddress = getContractAddress("LoanManager", chainId);
      if (loanManagerAddress === '0x0000000000000000000000000000000000000000') {
        console.error("LoanManager contract not available on current network");
        return;
      }

      // Directly call getLoanDetails without a loan ID
      const loanDetailsResponse = (await publicClient.readContract({
        address: loanManagerAddress as `0x${string}`,
        abi: LoanManagerJson.abi,
        functionName: "getLoanDetails",
        args: [],
      })) as LoanContractResponse;

      console.log("Loan details:", loanDetailsResponse);

      // Check if loanDetails has valid values before formatting
      if (loanDetailsResponse) {
        // Set the loan directly in the component state
        setLoanDetails({
          amount: loanDetailsResponse[0]
            ? formatUnits(loanDetailsResponse[0], 18)
            : "0",
          interestRate: loanDetailsResponse[1]
            ? Number(loanDetailsResponse[1]) / 100
            : 0,
          startTime: loanDetailsResponse[2]
            ? Number(loanDetailsResponse[2])
            : 0,
          dueTime: loanDetailsResponse[3] ? Number(loanDetailsResponse[3]) : 0,
          isRepaid: loanDetailsResponse[4] || false,
          collateralAmount: delegatedAmount,
          loanedUSDCAmount: loanDetailsResponse[6]
            ? formatUnits(loanDetailsResponse[6], 18)
            : "0",
        });
      }
    } catch (err) {
      console.error("Error fetching active loan:", err);
    }
  }, [address, publicClient, chainId, delegatedAmount]);

  // Fetch operator balance
  const fetchOperatorBalance = useCallback(async () => {
    if (!publicClient) return;

    try {
      await publicClient.readContract({
        address: ContractAddresses.CUSD as `0x${string}`,
        abi: CUSDJson.abi,
        functionName: "balanceOf",
        args: [ContractAddresses.Operator],
      });

      // Removed unused variables 'operatorBalanceData' and 'balance'.
    } catch (err) {
      console.error("Error fetching operator balance:", err);
    }
  }, [publicClient]);

  // Fetch repayment amount from LoanManager
  const fetchRepaymentAmount = useCallback(async () => {
    if (!publicClient) return;

    try {
      const loanManagerAddress = getContractAddress("LoanManager", chainId);
      if (loanManagerAddress === '0x0000000000000000000000000000000000000000') {
        console.error("LoanManager contract not available on current network");
        return;
      }

      // First get loan details to calculate repayment amount
      const loanDetailsResponse = (await publicClient.readContract({
        address: loanManagerAddress as `0x${string}`,
        abi: LoanManagerJson.abi,
        functionName: "getLoanDetails",
        args: [],
      })) as LoanContractResponse;

      if (loanDetailsResponse && loanDetailsResponse[0] > BigInt(0) && !loanDetailsResponse[4]) {
        // Calculate repayment amount: 2 * principal
        const principal = loanDetailsResponse[0];
        const totalRepayment = principal * BigInt(2);
        console.log("Calculated repayment amount (2x):", totalRepayment);

        setRepayAmount(formatUnits(totalRepayment, 18));
      } else {
        setRepayAmount("0");
      }
    } catch (err) {
      console.error("Error fetching repayment amount:", err);
      setRepayAmount("0");
    }
  }, [publicClient, chainId]);

  // Fetch balances and active loans
  useEffect(() => {
    if (isConnected && address && publicClient) {
      fetchBalances();
      fetchActiveLoans();
      fetchOperatorBalance();
      fetchRepaymentAmount();
    }
  }, [address, isConnected, publicClient, fetchBalances, fetchActiveLoans, fetchOperatorBalance, fetchRepaymentAmount]);

  // Update repayment amount when loan details change
  useEffect(() => {
    if (loanDetails && !loanDetails.isRepaid && parseFloat(loanDetails.amount) > 0) {
      fetchRepaymentAmount();
    }
  }, [loanDetails, fetchRepaymentAmount]);

  // Debug effect to log delegated amount changes
  useEffect(() => {
    console.log("Delegated amount updated:", delegatedAmount);
  }, [delegatedAmount]);

  // Function to retry fetching delegated amount
  const retryFetchDelegatedAmount = useCallback(async () => {
    if (!address || !publicClient) return;

    setDelegatedAmountLoading(true);
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
      console.log("Delegated amount retry successful:", formatUnits(delegatedData as bigint, 18));
    } catch (err) {
      console.error("Error retrying delegated amount fetch:", err);
      setDelegatedAmount("0");
    } finally {
      setDelegatedAmountLoading(false);
    }
  }, [address, publicClient, chainId]);

  // Show notification
  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 5000);
  };

  // Format repayment amount for display
  const formatRepaymentAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num === 0) return "0.00";
    return num.toFixed(4);
  };

  // Handle repay loan action
  // Removed unused function 'handleRepayLoan'



  // Add this function to handle slashing the operator
  const handleSlashOperator = useCallback(async () => {
    if (!walletClient || !publicClient || !address) {
      showNotification("Wallet not connected properly", "error");
      return;
    }

    setIsLoading(true);
    try {
      const loanManagerAddress = getContractAddress("LoanManager", chainId);
      if (loanManagerAddress === '0x0000000000000000000000000000000000000000') {
        showNotification("LoanManager contract not available on current network", "error");
        setIsLoading(false);
        return;
      }

      // Call slashLoan on LoanManager contract
      const { request } = await publicClient.simulateContract({
        address: loanManagerAddress as `0x${string}`,
        abi: LoanManagerJson.abi,
        functionName: "slashLoan",
        args: [], // No parameters needed
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      // Update balances and loans
      fetchBalances();
      fetchActiveLoans();
      fetchOperatorBalance();

      showNotification("Successfully slashed operator", "success");
    } catch (error: unknown) {
      console.error("Error slashing operator:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to slash operator",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient, address, chainId, fetchBalances, fetchActiveLoans, fetchOperatorBalance]);

  return (
    <div className="min-h-screen bg-black text-white pt-10 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div className="text-center flex-1">
              <h1
                className="text-4xl font-bold mb-4 font-mono"
                style={{
                  letterSpacing: "0.05em",
                  textShadow:
                    "0.05em 0 0 rgba(255,140,0,0.75), -0.025em -0.05em 0 rgba(255,127,80,0.75), 0.025em 0.05em 0 rgba(255,99,71,0.75)",
                  fontFamily: "monospace",
                }}
              >
                OPERATOR DASHBOARD
        </h1>
              <p className="text-xl text-gray-300">
                Manage your loans and collateral
              </p>
            </div>
            <div className="ml-4">
              <MintAndRestakeButton
                onComplete={() => {
                  fetchBalances();
                  fetchActiveLoans();
                  retryFetchDelegatedAmount();
                }}
                showDelegated={true}
              />
            </div>
            </div>
            
          {/* Notification */}
          {notification.show && (
            <div
              className={`mb-6 p-3 rounded-md ${notification.type === "error"
                ? "bg-red-900 bg-opacity-50 text-red-200"
                : "bg-green-900 bg-opacity-50 text-green-200"
                }`}
            >
              {notification.message}
            </div>
          )}

          {/* Combined View Only - No Tabs */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#FF8C00] mb-4">Operator Dashboard</h2>
            </div>
            
          {/* Combined View Content */}
          <div className="space-y-8">
            {/* Loan Management Card */}
            <div
              className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg backdrop-blur-sm"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
                backgroundSize: "10px 10px",
              }}
            >
              <h2 className="text-2xl font-bold mb-6 text-[#FF8C00]">Loan Management</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Status */}
                <div className="space-y-4">
                  {/* Operator CUSD Balance Component */}
                  <OperatorCUSDBalance
                    onBalanceUpdate={() => {}}
                    onMintSuccess={() => {
                      fetchBalances();
                      // fetchOperatorBalance(); // Removed unused variable
                    }}
                    onMintError={(error: string) => {
                      showNotification(error, "error");
                    }}
                  />

                  <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-white">Current Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Your Delegated stCORE:</span>
                        <span className="text-[#FF8C00] font-medium">
                          {delegatedAmountLoading ? "Loading..." : `${delegatedAmount} stCORE`}
                        </span>
                      </div>
                      {loanDetails && !loanDetails.isRepaid && parseFloat(loanDetails.amount) > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Active Loan Amount:</span>
                            <span className="text-red-400 font-medium">{loanDetails.amount} cUSD</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Interest Rate:</span>
                            <span className="text-yellow-400 font-medium">{(Number(loanDetails.interestRate) / 100).toFixed(2)}% APR</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Repayment Amount:</span>
                            <span className="text-red-400 font-medium">{formatRepaymentAmount(repayAmount)} cUSD</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Due Date:</span>
                            <span className="text-orange-400 font-medium">
                              {new Date(Number(loanDetails.dueTime) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
        </div>
        
                  {/* Required Delegation for 10 cUSD Loan */}
                  <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 text-white">Required for 10 cUSD Loan</h3>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#FF8C00]">15 stCORE</div>
                      <p className="text-gray-400 text-sm">150% collateral ratio</p>
                    </div>
                  </div>
        </div>
        
                {/* Actions */}
                <div className="space-y-4">
                  {loanDetails && !loanDetails.isRepaid && parseFloat(loanDetails.amount) > 0 ? (
                    // Show repayment and slash options when loan is active
                    <div className="space-y-4">
                      <div className="bg-red-900 bg-opacity-30 border border-red-800 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 text-red-400">Active Loan Actions</h3>
                        <div className="space-y-3">
                          <RepayLoanButton
                            loanDetails={loanDetails}
                            repayAmount={repayAmount}
                            onRepaySuccess={() => {
                              fetchBalances();
                              fetchActiveLoans();
                              fetchRepaymentAmount();
                              showNotification("Successfully repaid loan", "success");
                            }}
                            onError={(error: string) => {
                              showNotification(error, "error");
                            }}
                          />
          <button 
                            onClick={handleSlashOperator}
                            disabled={isLoading}
                            className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
                            {isLoading ? "Processing..." : "Slash Operator"}
          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Show take loan option when no active loan
                    <div className="bg-green-900 bg-opacity-30 border border-green-800 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 text-green-400">Available Actions</h3>
                      <div className="space-y-3">
                        <TakeLoanButton
                          onTakeLoanSuccess={() => {
                            fetchBalances();
                            fetchActiveLoans();
                            fetchRepaymentAmount();
                            showNotification("Successfully created loan", "success");
                          }}
                          onError={(error: string) => {
                            showNotification(error, "error");
                          }}
                          presetAmount="10"
                          currentDelegation={delegatedAmount}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>






        </div>
      </div>
    </div>
  );
}