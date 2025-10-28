// src/components/RenewalConfirmationModal.jsx
import React from 'react';
// Import the necessary helper
import { getMonthsDuration } from '../utils/membershipHelpers'; 

/**
 * Confirmation modal for the renewal transaction.
 */
export const RenewalConfirmationModal = React.memo(({ renewalData, clientName, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all duration-300 scale-100 border-t-8 border-green-500">
                
                <div className="flex flex-col items-center">
                    <div className="bg-green-100 p-3 rounded-full mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7l-3-3-3 3"></path></svg>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-800 mb-1">Confirm Transaction</h3>
                    <p className="text-sm text-gray-500">Final check before processing payment.</p>
                </div>
                
                <div className="mt-6 space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Member:</span>
                        <span className="font-semibold text-gray-900">{clientName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-semibold text-green-700">{renewalData.membershipType.toUpperCase()} ({getMonthsDuration(renewalData.membershipType)} mos)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">New Period:</span>
                        <span className="font-semibold text-gray-900">{renewalData.renewalStartDate} to {renewalData.newEndDate}</span>
                    </div>
                    <div className="h-px bg-gray-300 my-3"></div>
                    <div className="flex justify-between items-center pt-1">
                        <span className="text-lg font-extrabold text-gray-800">Total Amount Due:</span>
                        <span className="text-3xl font-extrabold text-green-700">₹ {renewalData.pricePaid.toLocaleString('en-IN', {minimumFractionDigits: 0})}</span>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-extrabold shadow-md shadow-amber-300/50"
                    >
                        Confirm & Process
                    </button>
                </div>
            </div>
        </div>
    );
});