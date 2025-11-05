"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import StablecoinAnimation from "./components/StablecoinAnimation";
import Image from "next/image";
import CUSDJson from "@/contracts/CUSD.sol/CUSD.json";
import sCUSDJson from "@/contracts/sCUSD.sol/sCUSD.json";
import stCOREJson from "@/contracts/stCORE.sol/stCORE.json";
import EigenJson from "@/contracts/Eigen.sol/Eigen.json";
import { getContractAddress, supportedChains } from "../config";
import USDCJson from "@/contracts/USDC/USDC.json";
import LoanManagerJson from "@/contracts/LoanManager.sol/LoanManager.json";

interface LoanContractResponse {
  0: bigint; // amount
  1: bigint; // interestRate
  2: bigint; // startTime
  3: bigint; // dueTime
  4: boolean; // isRepaid
  5: bigint; // collateralAmount
  6: bigint; // loanedUSDCAmount
}

const HomePage = () => {
  const [USDCBalance, setUSDCBalance] = useState("0");
  const [CUSDBalance, setCUSDBalance] = useState("0");
  const [repayAmount, setRepayAmount] = useState("");

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const devnetAddresses = {
    "USDC": "0x3eCA9205a5A8b602067B2a58F60C30EA020FeCeb",
    "stCORE": "0x58f4BBC38d592F253fB98C53A4D2f55B8DBF51a7",
    "CUSD": "0x71E00C10F924355453bCF8fe86F6B63980f859DD",
    "sCUSD": "0x5BC5C3A0F7ee4465DFCC1ad9526d9Bf107361AD1",
    "Operator": "0x025f719646013A8b69b8568F105c67e60D14d8ab",
    "Eigen": "0x6C2ba32a3ADBA2D61a02F5EAe3bd86F59B6a7B18",
    "LoanManager": "0x0b3827aE16a73887F3C5c25d13CF5Ea4a2772c3C"
  };

  const router = useRouter();

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      console.log("Fetching balances for address:", address);

      // Get contract addresses for current network
      const USDCAddress = getContractAddress("USDC", chainId);
      const cusdAddress = getContractAddress("CUSD", chainId);

      console.log("USDC contract address:", USDCAddress);

      // Fetch USDC balance
      if (USDCAddress !== '0x0000000000000000000000000000000000000000') {
        const USDCBalanceData = await publicClient.readContract({
          address: USDCAddress as `0x${string}`,
          abi: USDCJson.abi,
          functionName: "balanceOf",
          args: [address],
        });

        console.log("Raw USDC balance data:", USDCBalanceData);
        const formattedBalance = formatUnits(USDCBalanceData as bigint, 18);
        console.log("Formatted USDC balance:", formattedBalance);
        setUSDCBalance(formattedBalance);
      } else {
        setUSDCBalance("0");
      }

      // Fetch CUSD balance
      if (cusdAddress !== '0x0000000000000000000000000000000000000000') {
        const CUSDBalanceData = await publicClient.readContract({
          address: cusdAddress as `0x${string}`,
          abi: CUSDJson.abi,
          functionName: "balanceOf",
          args: [address],
        });

        console.log("Raw CUSD balance data:", CUSDBalanceData);
        const formattedCUSDBalance = formatUnits(CUSDBalanceData as bigint, 18);
        console.log("Formatted CUSD balance:", formattedCUSDBalance);
        setCUSDBalance(formattedCUSDBalance);
      } else {
        setCUSDBalance("0");
      }
    } catch (err: unknown) {
      console.error("Error fetching balances:", err);
    }
  }, [address, publicClient, chainId]);

  // sCUSD vault functions
  const fetchSCUSDVaultData = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      // Get contract addresses for current network
      const cusdAddress = getContractAddress("CUSD", chainId);
      const scusdAddress = getContractAddress("sCUSD", chainId);

      if (cusdAddress === '0x0000000000000000000000000000000000000000' ||
        scusdAddress === '0x0000000000000000000000000000000000000000') {
        return;
      }

      // Fetch sCUSD balance (shares)
      const shareBalanceData = (await publicClient.readContract({
        address: scusdAddress as `0x${string}`,
        abi: sCUSDJson.abi,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      // Convert shares to assets to get the user's vault balance in CUSD
      if (shareBalanceData > BigInt(0)) {
        await publicClient.readContract({
          address: scusdAddress as `0x${string}`,
          abi: sCUSDJson.abi,
          functionName: "convertToAssets",
          args: [shareBalanceData],
        });
      }

      // Get total assets and shares to calculate conversion rate
      const totalAssets = (await publicClient.readContract({
        address: scusdAddress as `0x${string}`,
        abi: sCUSDJson.abi,
        functionName: "totalAssets",
        args: [],
      })) as bigint;
      const totalShares = (await publicClient.readContract({
        address: scusdAddress as `0x${string}`,
        abi: sCUSDJson.abi,
        functionName: "totalSupply",
        args: [],
      })) as bigint;

      // Calculate conversion rate (assets per share)
      if (totalShares > BigInt(0)) {
        const conversionRate = Number(totalAssets) / Number(totalShares);
        console.log("Conversion rate:", conversionRate);
      }

      // Preview shares for 10 CUSD deposit
      try {
        const assets = parseUnits("10", 18);
        await publicClient.readContract({
          address: scusdAddress as `0x${string}`,
          abi: sCUSDJson.abi,
          functionName: "previewDeposit",
          args: [assets],
        });
      } catch (err) {
        console.error("Error calculating deposit preview:", err);
      }
    } catch (err) {
      console.error("Error fetching sCUSD vault data:", err);
    }
  }, [address, publicClient, chainId]);

  // Helper function to check if contract has required functions
  const checkContractFunctions = async (contractAddress: string, abi: unknown[]) => {
    if (!publicClient) return false;

    try {
      // Try to call a basic function to check if contract exists and has expected interface
      await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: abi,
        functionName: "totalAssets",
        args: [],
      });
      return true;
    } catch (error) {
      console.error("Contract function check failed:", error);
      return false;
    }
  };

  // Helper function to log contract details for debugging
  const logContractDetails = async (contractAddress: string, contractName: string) => {
    if (!publicClient) return;

    try {
      console.log(`Checking ${contractName} contract at address:`, contractAddress);

      // Try to get contract code to verify it exists
      const code = await publicClient.getBytecode({ address: contractAddress as `0x${string}` });
      if (!code || code === '0x') {
        console.error(`${contractName} contract has no code at address:`, contractAddress);
        return;
      }

      console.log(`${contractName} contract exists at address:`, contractAddress);
    } catch (error) {
      console.error(`Error checking ${contractName} contract:`, error);
    }
  };

  // Restaking functions
  // Fetch stCORE balance and delegated amount
  const fetchstCOREBalance = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      // Get contract addresses for current network
      const stcoreAddress = getContractAddress("stCORE", chainId);
      const eigenAddress = getContractAddress("Eigen", chainId);

      if (stcoreAddress === '0x0000000000000000000000000000000000000000') {
        return;
      }

      await publicClient.readContract({
        address: stcoreAddress as `0x${string}`,
        abi: stCOREJson.abi,
        functionName: "balanceOf",
        args: [address],
      });

      // Also fetch delegated amount
      if (eigenAddress !== '0x0000000000000000000000000000000000000000') {
        try {
          await publicClient.readContract({
            address: eigenAddress as `0x${string}`,
            abi: EigenJson.abi,
            functionName: "getDelegatedAmount",
            args: [address],
          });
        } catch (err) {
          console.error("Error fetching delegated amount:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching stCORE balance:", err);
    }
  }, [address, publicClient, chainId]);

  // Fetch active loan details
  const fetchActiveLoans = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      const loanManagerAddress = getContractAddress("LoanManager", chainId);
      if (loanManagerAddress === '0x0000000000000000000000000000000000000000') {
        return;
      }

      const loanDetailsResponse = (await publicClient.readContract({
        address: loanManagerAddress as `0x${string}`,
        abi: LoanManagerJson.abi,
        functionName: "getLoanDetails",
        args: [],
      })) as LoanContractResponse;

      if (loanDetailsResponse) {
        const loanDetails: {
          amount: string;
          interestRate: number;
          startTime: number;
          dueTime: number;
          isRepaid: boolean;
          collateralAmount: string;
          loanedUSDCAmount: string;
        } = {
          amount: loanDetailsResponse[0] ? formatUnits(loanDetailsResponse[0], 18) : "0",
          interestRate: loanDetailsResponse[1] ? Number(loanDetailsResponse[1]) / 100 : 0,
          startTime: loanDetailsResponse[2] ? Number(loanDetailsResponse[2]) : 0,
          dueTime: loanDetailsResponse[3] ? Number(loanDetailsResponse[3]) : 0,
          isRepaid: loanDetailsResponse[4] || false,
          collateralAmount: "",
          loanedUSDCAmount: loanDetailsResponse[6] ? formatUnits(loanDetailsResponse[6], 18) : "0",
        };
        console.log("Loan details:", loanDetails);
      }
    } catch (err) {
      console.error("Error fetching active loan:", err);
    }
  }, [address, publicClient, chainId]);

  // Fetch repayment amount
  const fetchRepaymentAmount = useCallback(async () => {
    if (!publicClient) return;

    try {
      const loanManagerAddress = getContractAddress("LoanManager", chainId);
      if (loanManagerAddress === '0x0000000000000000000000000000000000000000') {
        return;
      }

      const repaymentAmount = await publicClient.readContract({
        address: loanManagerAddress as `0x${string}`,
        abi: LoanManagerJson.abi,
        functionName: "calculateRepaymentAmount",
        args: [],
      });

      setRepayAmount(formatUnits(repaymentAmount as bigint, 18));
    } catch (err) {
      console.error("Error fetching repayment amount:", err);
    }
  }, [publicClient, chainId]);

  // Get current network name
  const getCurrentNetworkName = () => {
    if (chainId === supportedChains.coreTestnet2.id) {
      return "Core Testnet2";
    } else if (chainId === supportedChains.hardhat.id) {
      return "Hardhat";
    }
    return "Unknown Network";
  };

  // Fetch balances on mount and when address changes
  useEffect(() => {
    if (isConnected && address && publicClient) {
      fetchBalances();
      fetchSCUSDVaultData();
      fetchActiveLoans();
      fetchRepaymentAmount();
      fetchstCOREBalance();

      // Set up polling for balance updates
      const interval = setInterval(() => {
        fetchBalances();
        fetchSCUSDVaultData();
        fetchActiveLoans();
        fetchRepaymentAmount();
        fetchstCOREBalance();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [address, isConnected, publicClient, chainId, fetchBalances, fetchSCUSDVaultData, fetchActiveLoans, fetchRepaymentAmount, fetchstCOREBalance]);

  // Keep placeholder functions for future use (suppress ESLint warnings with void operator)
  const handleAmountChange = () => { void 0; /* Keep for future use */ };
  const handleUSDCMint = () => { void 0; /* Keep for future use */ };
  const handleMint = () => { void 0; /* Keep for future use */ };
  const handleSCUSDDeposit = () => { void 0; /* Keep for future use */ };
  const handleSCUSDWithdraw = () => { void 0; /* Keep for future use */ };
  const handlestCOREAmountChange = () => { void 0; /* Keep for future use */ };
  const handlestCOREMint = () => { void 0; /* Keep for future use */ };
  const handleDelegate = () => { void 0; /* Keep for future use */ };
  const handleUndelegate = () => { void 0; /* Keep for future use */ };
  const handleLoanAmountChange = () => { void 0; /* Keep for future use */ };
  const calculateCollateral = () => { void 0; /* Keep for future use */ };
  const handleTakeLoan = () => { void 0; /* Keep for future use */ };
  const handleRepayLoan = () => { void 0; /* Keep for future use */ };

  // Log available functions for debugging
  console.log("Functions available:", {
    handleAmountChange,
    handleUSDCMint,
    handleMint,
    handleSCUSDDeposit,
    handleSCUSDWithdraw,
    handlestCOREAmountChange,
    handlestCOREMint,
    handleDelegate,
    handleUndelegate,
    handleLoanAmountChange,
    calculateCollateral,
    handleTakeLoan,
    handleRepayLoan,
    checkContractFunctions,
    logContractDetails
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Network Indicator */}
      <div className="container mx-auto px-4 pt-4">
        <div className="text-center">
          <p className="text-gray-300">
            Network: <span className="text-[#FF8C00] font-bold">{getCurrentNetworkName()}</span>
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1
              className="text-6xl font-bold mb-4 font-mono"
              style={{
                letterSpacing: "0.05em",
                textShadow:
                  "0.05em 0 0 rgba(255,0,0,0.75), -0.025em -0.05em 0 rgba(0,255,0,0.75), 0.025em 0.05em 0 rgba(0,0,255,0.75)",
                fontFamily: "monospace",
              }}
            >
              VERIFIABLE MONEY
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              Stablecoin protocol with credible financial guarantees
            </p>
            <button
              onClick={() => router.push("/mint")}
              className="px-8 py-3 bg-black text-[#FF8C00] text-lg font-semibold border-2 border-[#FF8C00] rounded-md hover:bg-[#FF8C00] hover:text-black transition-colors shadow-[0_0_15px_rgba(198,209,48,0.7)] hover:shadow-[0_0_25px_rgba(198,209,48,1)]"
            >
              LAUNCH APP
            </button>
          </div>

          <div className="md:w-1/2 h-[500px]">
            <StablecoinAnimation />
          </div>
        </div>

        {/* Flow Diagram - Full Width */}
        <div
          className="w-full mt-20 bg-black/90 backdrop-blur-md p-8 rounded-lg border border-gray-700"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
            backgroundSize: "10px 10px",
          }}
        >
          <Image
            src="/flow.png"
            alt="Protocol Flow Diagram"
            width={1200}
            height={600}
            className="w-full rounded-lg shadow-lg"
            priority
            style={{
              filter:
                "invert(1) hue-rotate(180deg) brightness(2) contrast(1.5)",
              mixBlendMode: "difference",
              backgroundColor: "transparent",
            }}
          />

          {/* Diagram Explanation */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#FF8C00]">
                Collateral Flow
              </h3>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start">
                  <span className="text-[#FF8C00] mr-2">1.</span>
                  <span>
                    Users deposit stCORE tokens as collateral into the protocol
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF8C00] mr-2">2.</span>
                  <span>
                    stCORE tokens are delegated to verified operators for restaking
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF8C00] mr-2">3.</span>
                  <span>
                    Operators provide security across multiple networks
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#FF8C00]">
                Stablecoin Flow
              </h3>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start">
                  <span className="text-[#FF8C00] mr-2">4.</span>
                  <span>
                    Users receive CUSD stablecoins against their collateral
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF8C00] mr-2">5.</span>
                  <span>
                    CUSD can be deposited into sCUSD vault for yield generation
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#FF8C00] mr-2">6.</span>
                  <span>
                    Yield is generated from operator rewards and lending markets
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose COREDOTMONEY Section */}
      <div className="container mx-auto px-4 py-20 border-t border-gray-800">
        <div className="text-left mb-16">
          <h2
            className="text-4xl font-bold mb-4 font-mono"
            style={{
              letterSpacing: "0.05em",
              textShadow:
                "0.05em 0 0 rgba(255,140,0,0.75), -0.025em -0.05em 0 rgba(255,127,80,0.75), 0.025em 0.05em 0 rgba(255,99,71,0.75)",
              fontFamily: "monospace",
            }}
          >
            WHY CHOOSE STABLECORECORE
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl">
            Earn yield safely while maintaining access to your funds.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature Box 1 */}
          <div
            className="bg-black p-8 rounded-lg border border-gray-800 hover:border-[#FF8C00] transition duration-300 flex flex-col justify-between min-h-[220px] group"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px)",
              backgroundSize: "10px 10px",
            }}
          >
            <h3 className="text-xl font-bold mb-4 text-white group-hover:text-gray-200 transition-colors">
              NON-CUSTODIAL
            </h3>
            <div className="bg-black p-4 rounded-lg border border-[#FF8C00] border-opacity-50">
              <p className="text-[#FF8C00] font-bold leading-relaxed">
                No party has access to unsecured user deposits
              </p>
            </div>
          </div>

          {/* Feature Box 2 */}
          <div
            className="bg-black p-8 rounded-lg border border-gray-800 hover:border-[#FF8C00] transition duration-300 flex flex-col justify-between min-h-[220px] group"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px)",
              backgroundSize: "10px 10px",
            }}
          >
            <h3 className="text-xl font-bold mb-4 text-white group-hover:text-gray-200 transition-colors">
              PRIVATE CREDIT
            </h3>
            <div className="bg-black p-4 rounded-lg border border-[#FF8C00] border-opacity-50">
              <p className="text-[#FF8C00] font-bold leading-relaxed">
                Competitive yield generated by efficient markets
              </p>
            </div>
          </div>

          {/* Feature Box 3 */}
          <div
            className="bg-black p-8 rounded-lg border border-gray-800 hover:border-[#FF8C00] transition duration-300 flex flex-col justify-between min-h-[220px] group"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px)",
              backgroundSize: "10px 10px",
            }}
          >
            <h3 className="text-xl font-bold mb-4 text-white group-hover:text-gray-200 transition-colors">
              FULLY COVERED YIELD
            </h3>
            <div className="bg-black p-4 rounded-lg border border-[#FF8C00] border-opacity-50">
              <p className="text-[#FF8C00] font-bold leading-relaxed">
                Shared security model underwrites counterparty activity
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20 border-t border-gray-800">
        <h2
          className="text-4xl font-bold mb-8 font-mono text-center"
          style={{
            letterSpacing: "0.05em",
            textShadow:
              "0.05em 0 0 rgba(255,140,0,0.75), -0.025em -0.05em 0 rgba(255,127,80,0.75), 0.025em 0.05em 0 rgba(255,99,71,0.75)",
            fontFamily: "monospace",
          }}
        >
          STABLECORE TESTNET DEPLOYMENT ADDRESSES
        </h2>
        <div
          className="max-w-4xl mx-auto bg-black p-8 rounded-lg border border-gray-800"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
            backgroundSize: "10px 10px",
          }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-800 p-4 text-left text-[#FF8C00]">
                  Token
                </th>
                <th className="border border-gray-800 p-4 text-left text-[#FF8C00]">
                  Address
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(devnetAddresses).map(([token, address]) => (
                <tr key={token} className="hover:bg-gray-900 transition-colors">
                  <td className="border border-gray-800 p-4 text-gray-300">
                    {token}
                  </td>
                  <td className="border border-gray-800 p-4 text-gray-300 font-mono">
                    {address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <footer
        className="mt-20 bg-black"
        style={{
          boxShadow: "inset 0 10px 30px -10px rgba(0,0,0,0.3)",
        }}
      >
        {/* Gray top line */}
        <div className="border-t border-gray-600"></div>

        <div className="container mx-auto px-4 py-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-4">
              <h3 className="text-2xl font-bold text-[#FF8C00] mb-4">StableCORE</h3>
              <p className="text-white mb-4 font-medium">
                The next generation stablecoin protocol with credible <br /> financial guarantees and institutional-grade security.
              </p>
              <div className="flex space-x-4">

              </div>
            </div>
          </div>
        </div>

      </footer>

      {/* Debug info - shows current balances and repay amount */}
      <div style={{ display: 'none' }}>
        USDC Balance: {USDCBalance}, CUSD Balance: {CUSDBalance}, Repay Amount: {repayAmount}
      </div>
    </div>
  );
};

export default HomePage;