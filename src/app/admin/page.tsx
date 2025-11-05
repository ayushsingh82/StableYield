"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { formatUnits } from "viem";
import LoanManagerJson from "@/contracts/LoanManager.sol/LoanManager.json";
import ContractAddresses from "../../deployed-address.json";
import EigenJson from "@/contracts/Eigen.sol/Eigen.json";

export default function CapAdminScreen() {
  const [activeTab, setActiveTab] = useState("operators");
  const [baseRate, setBaseRate] = useState("5.0");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [operatorDelegation, setOperatorDelegation] = useState("0");

  // Add Wagmi hooks
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Show notification function
  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 5000);
  };

  const handleBaseRateChange = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Base rate updated to ${baseRate}%`);
  };

  // Update the slash operator function to call the contract
  const handleSlashOperator = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletClient || !publicClient || !address) {
      showNotification("Wallet not connected properly", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Call slashLoan on LoanManager contract without amount parameter
      const { request } = await publicClient.simulateContract({
        address: ContractAddresses.LoanManager as `0x${string}`,
        abi: LoanManagerJson.abi,
        functionName: "slashLoan",
        args: [], // No parameters needed
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      showNotification(`Successfully slashed operator`, "success");
    } catch (error: unknown) {
      console.error("Error slashing operator:", error);
      showNotification(error instanceof Error ? error.message : "Failed to slash operator", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to fetch the operator's delegated stCORE
  const fetchOperatorDelegation = useCallback(async () => {
    if (!publicClient) return;

    try {
      // Fetch the actual delegated amount from the Eigen contract
      const delegatedData = await publicClient.readContract({
        address: ContractAddresses.Eigen as `0x${string}`,
        abi: EigenJson.abi,
        functionName: "getDelegatedAmount",
        args: [address],
      });

      // Format the amount with 18 decimals (for stCORE)
      setOperatorDelegation(formatUnits(delegatedData as bigint, 18));
    } catch (err) {
      console.error("Error fetching operator delegation:", err);
      // If there's an error, we'll show 0 stCORE
      setOperatorDelegation("0");
    }
  }, [publicClient, address]);

  // Call this in useEffect
  useEffect(() => {
    if (publicClient) {
      fetchOperatorDelegation();
    }
  }, [publicClient, fetchOperatorDelegation]);

  return (
    <div className="min-h-screen bg-black text-white pt-10 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1
              className="text-4xl font-bold mb-4 font-mono"
              style={{
                letterSpacing: "0.05em",
                textShadow:
                  "0.05em 0 0 rgba(255,140,0,0.75), -0.025em -0.05em 0 rgba(255,127,80,0.75), 0.025em 0.05em 0 rgba(255,99,71,0.75)",
                fontFamily: "monospace",
              }}
            >
              ADMIN DASHBOARD
            </h1>
            <p className="text-xl text-gray-300">
              Manage protocol parameters and operators
            </p>
          </div>

          {/* Admin Badge */}
          <div className="flex justify-center mb-8">
            <div className="px-4 py-2 bg-[#FF8C00] text-black rounded-full font-bold text-sm">
              ADMIN ACCESS
            </div>
          </div>

          {/* Notification */}
          {notification.show && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                notification.type === "error"
                  ? "bg-red-900 bg-opacity-50 text-red-200"
                  : "bg-green-900 bg-opacity-50 text-green-200"
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-800 mb-8">
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === "operators"
                  ? "text-[#FF8C00] border-b-2 border-[#FF8C00]"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("operators")}
            >
              Operators
            </button>
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === "rates"
                  ? "text-[#FF8C00] border-b-2 border-[#FF8C00]"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("rates")}
            >
              Base Rate
            </button>
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === "slash"
                  ? "text-[#FF8C00] border-b-2 border-[#FF8C00]"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("slash")}
            >
              Slash Operator
            </button>
          </div>

          {/* Operators Tab */}
          {activeTab === "operators" && (
            <div className="bg-black p-6 rounded-lg border border-gray-800 backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
              <h2 className="text-2xl font-bold mb-6 text-[#FF8C00]">Active Operators</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-800">
                      <th className="pb-3 pr-4">ID</th>
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Address</th>
                      <th className="pb-3 pr-4">Collateral</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Active Loans</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* First Operator - ONDO */}
                    <tr className="border-b border-gray-800">
                      <td className="py-4 pr-4">#1</td>
                      <td className="py-4 pr-4">ONDO Finance</td>
                      <td className="py-4 pr-4">
                        {ContractAddresses.Operator.substring(0, 6)}...
                        {ContractAddresses.Operator.substring(
                          ContractAddresses.Operator.length - 4
                        )}
                      </td>
                      <td className="py-4 pr-4">{operatorDelegation} stCORE</td>
                      <td className="py-4 pr-4">
                        <span className="px-2 py-1 rounded text-xs bg-green-900 text-green-300">
                          Active
                        </span>
                      </td>
                      <td className="py-4 pr-4">1</td>
                      <td className="py-4">
                        <button
                          onClick={() => setActiveTab("slash")}
                          className="text-[#FF8C00] hover:underline mr-3"
                        >
                          Slash
                        </button>
                        <button className="text-gray-400 hover:text-white hover:underline">
                          Details
                        </button>
                      </td>
                    </tr>

                    {/* Second Operator - Plume */}
                    <tr className="border-b border-gray-800">
                      <td className="py-4 pr-4">#2</td>
                      <td className="py-4 pr-4">Colend</td>
                      <td className="py-4 pr-4">0x3Bc8...9F2a</td>
                      <td className="py-4 pr-4">0 stCORE</td>
                      <td className="py-4 pr-4">
                        <span className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-400">
                          Inactive
                        </span>
                      </td>
                      <td className="py-4 pr-4">0</td>
                      <td className="py-4">
                        <button className="text-gray-400 hover:text-white hover:underline">
                          Details
                        </button>
                      </td>
                    </tr>

                    {/* Third Operator - TrueFi */}
                    <tr className="border-b border-gray-800">
                      <td className="py-4 pr-4">#3</td>
                      <td className="py-4 pr-4">Sumer.Money</td>
                      <td className="py-4 pr-4">0x5Df1...4E3b</td>
                      <td className="py-4 pr-4">0 stCORE</td>
                      <td className="py-4 pr-4">
                        <span className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-400">
                          Inactive
                        </span>
                      </td>
                      <td className="py-4 pr-4">0</td>
                      <td className="py-4">
                        <button className="text-gray-400 hover:text-white hover:underline">
                          Details
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Base Rate Tab */}
          {activeTab === "rates" && (
            <div className="bg-black p-8 rounded-lg border border-gray-800 backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
              <h2 className="text-2xl font-bold mb-6 text-[#FF8C00]">Update Base Rate</h2>

              <form onSubmit={handleBaseRateChange}>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">
                    Base Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    value={baseRate}
                    onChange={(e) => setBaseRate(e.target.value)}
                    placeholder="Enter base rate"
                    className="w-full p-4 bg-gray-900 rounded-lg text-white outline-none focus:ring-2 focus:ring-[#FF8C00]"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Current base rate: 5.0%
                  </p>
                </div>

                <div className="mb-8 p-4 bg-gray-900 rounded-lg">
                  <h3 className="font-bold mb-2 text-[#FF8C00]">Rate Impact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400">Operator Margin</p>
                      <p className="font-medium">+2.0% (fixed)</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Effective Borrower Rate</p>
                      <p className="font-medium">
                        {(parseFloat(baseRate) + 2.0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Protocol Fee</p>
                      <p className="font-medium">0.5% (fixed)</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Stablecoin Holder Yield</p>
                      <p className="font-medium">
                        {(parseFloat(baseRate) - 0.5).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FF8C00] text-black py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transition duration-300"
                >
                  UPDATE BASE RATE
                </button>
              </form>
            </div>
          )}

          {/* Slash Operator Tab */}
          {activeTab === "slash" && (
            <div className="bg-black p-8 rounded-lg border border-gray-800 backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
              <h2 className="text-2xl font-bold mb-6 text-[#FF8C00]">Slash Operator</h2>

              <form onSubmit={handleSlashOperator}>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">Operator</label>
                  <div className="w-full p-4 bg-gray-900 rounded-lg text-white">
                  Avalon Finance
                  ({ContractAddresses.Operator.substring(0, 6)}
                    ...
                    {ContractAddresses.Operator.substring(
                      ContractAddresses.Operator.length - 4
                    )}
                    )
                  </div>
                </div>

                <div className="mb-8 p-4 bg-red-900 bg-opacity-30 border border-red-800 rounded-lg">
                  <h3 className="font-bold mb-2 text-red-400">Warning</h3>
                  <p className="text-gray-300">
                    Slashing an operator is a severe action that will reduce
                    their collateral and may affect their status. This action is
                    recorded on-chain and cannot be reversed.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "PROCESSING..." : "CONFIRM SLASH"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


