"use client";

import { useState } from "react";
import OperatorCUSDBalance from "./OperatorCUSDBalance";
import MintCusdToOperator from "./MintCusdToOperator";

export default function OperatorManagement() {
    const [currentBalance, setCurrentBalance] = useState("0");

    const handleBalanceUpdate = (balance: string) => {
        setCurrentBalance(balance);
    };

    const handleMintSuccess = () => {
        // Trigger a balance refresh after successful mint
        // The OperatorCUSDBalance component will handle the refresh
    };

    const handleMintError = (error: string) => {
        console.error("Mint error:", error);
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">OPERATOR MANAGEMENT</h2>
                <p className="text-gray-400">
                    Monitor and manage the operator&apos;s cUSD balance and minting operations
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OperatorCUSDBalance onBalanceUpdate={handleBalanceUpdate} />
                <MintCusdToOperator
                    onMintSuccess={handleMintSuccess}
                    onMintError={handleMintError}
                />
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-3">Operator Information</h3>
                <div className="space-y-2 text-sm text-gray-300">
                    <p>• The operator is responsible for managing the protocol&apos;s operations</p>
                    <p>• Current balance: <span className="text-[#FF8C00] font-semibold">{parseFloat(currentBalance).toFixed(2)} cUSD</span></p>
                    <p>• Minting 10 cUSD will add tokens directly to the operator&apos;s address</p>
                    <p>• Only authorized accounts can mint tokens to the operator</p>
                </div>
            </div>
        </div>
    );
}
