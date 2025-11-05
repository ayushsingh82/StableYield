'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const OperatorRegistration = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    operatorAddress: '',
    metadataURI: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.name.trim()) {
      setError('Operator name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.operatorAddress.trim() || !formData.operatorAddress.startsWith('0x')) {
      setError('Valid Ethereum address is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.metadataURI.trim()) {
      setError('Metadata URI is required');
      setIsSubmitting(false);
      return;
    }

    try {
      // Here you would connect to the blockchain and call the registerOperator function
      console.log('Registering operator with data:', formData);
      
      // Mock successful registration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(`Successfully registered ${formData.name} as an operator!`);
      
      // Reset form after successful submission
      setFormData({
        name: '',
        operatorAddress: '',
        metadataURI: ''
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/operator-screen');
      }, 2000);
    } catch (err) {
      setError('Failed to register operator. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center font-mono" style={{ 
          letterSpacing: '0.05em',
          textShadow: '0.05em 0 0 rgba(255,140,0,0.75), -0.025em -0.05em 0 rgba(255,127,80,0.75), 0.025em 0.05em 0 rgba(255,99,71,0.75)',
          fontFamily: 'monospace'
        }}>
          OPERATOR REGISTRATION
        </h1>
        
        <div className="bg-black border border-gray-800 p-6 rounded-lg shadow-lg mb-6 backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
          <p className="mb-4 text-gray-300">
            Register as an operator in the restaking system to receive delegations from users.
          </p>
          
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-900 bg-opacity-50 border border-green-700 text-green-200 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-[#FF8C00] mb-1">
                Operator Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-black border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                placeholder="Enter your operator name"
              />
              <p className="text-xs text-gray-500 mt-1">
                This name will be visible to users looking to delegate tokens.
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="operatorAddress" className="block text-sm font-medium text-[#FF8C00] mb-1">
                Operator Address
              </label>
              <input
                type="text"
                id="operatorAddress"
                name="operatorAddress"
                value={formData.operatorAddress}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-black border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                placeholder="0x..."
              />
              <p className="text-xs text-gray-500 mt-1">
                The Ethereum address that will receive delegations and rewards.
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="metadataURI" className="block text-sm font-medium text-[#FF8C00] mb-1">
                Metadata URI
              </label>
              <input
                type="text"
                id="metadataURI"
                name="metadataURI"
                value={formData.metadataURI}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-black border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                placeholder="ipfs://... or https://..."
              />
              <p className="text-xs text-gray-500 mt-1">
                URI pointing to a JSON file with additional operator information (performance history, infrastructure details, etc.)
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
                isSubmitting ? 'opacity-70' : ''
              } bg-black border border-[#FF8C00] shadow-[0_0_15px_rgba(255,140,0,0.7)] hover:shadow-[0_0_20px_rgba(255,140,0,1)] hover:text-[#FF8C00]`}
            >
              {isSubmitting ? 'Registering...' : 'Register as Operator'}
            </button>
          </form>
        </div>
        
        <div className="bg-black border border-gray-800 p-4 rounded-lg backdrop-blur-sm bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:10px_10px]">
          <h2 className="text-lg font-semibold mb-2 text-[#FF8C00]">Operator Requirements</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            <li>Maintain high uptime and reliability</li>
            <li>Secure your private keys properly</li>
            <li>Fulfill all validation duties</li>
            <li>Maintain sufficient collateral</li>
            <li>Follow protocol rules and updates</li>
          </ul>
        </div>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/restaking-screen')}
            className="text-[#FF8C00] hover:text-white font-medium transition-colors px-4 py-2 border border-[#FF8C00] rounded-md shadow-[0_0_10px_rgba(255,140,0,0.7)] hover:shadow-[0_0_20px_rgba(255,140,0,1)]"
          >
            Back to Restaking →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperatorRegistration;