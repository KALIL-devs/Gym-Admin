// src/components/RenewalHistoryModal.jsx
import React from 'react';

function RenewalHistoryModal({ history, onClose }) {
    if (!history) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-dark-card text-dark-text p-6 rounded-lg shadow-xl w-full max-w-md relative dark:bg-light-card dark:text-light-text">
                <button
                    className="absolute top-2 right-2 text-dark-text-highlight hover:text-dark-text dark:text-light-text-highlight dark:hover:text-light-text text-2xl"
                    onClick={onClose}
                >
                    &times;
                </button>
                <h3 className="text-2xl font-bold mb-4 text-dark-accent dark:text-light-accent">Renewal History</h3>
                {history.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {history.map((renewal) => (
                            <div key={renewal.id} className="bg-dark-card-lighter dark:bg-light-card-lighter p-4 rounded-lg shadow-md border border-dark-accent/10 dark:border-light-accent/10">
                                <div className="flex justify-between items-center text-sm">
                                    <p className="font-semibold">{renewal.membershipType} Membership</p>
                                    <p className="text-dark-text/70 dark:text-light-text/70">Renewed on {new Date(renewal.renewalDate).toLocaleDateString()}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                    <div>
                                        <p className="font-medium text-dark-text/80 dark:text-light-text/80">Start Date:</p>
                                        <p className="text-dark-text/70 dark:text-light-text/70">{new Date(renewal.renewalDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-dark-text/80 dark:text-light-text/80">End Date:</p>
                                        <p className="text-dark-text/70 dark:text-light-text/70">{new Date(renewal.newEndDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-dark-text/70 dark:text-light-text/70">No renewal history found.</p>
                )}
            </div>
        </div>
    );
}

export default RenewalHistoryModal;