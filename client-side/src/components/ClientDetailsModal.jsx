import React, { useState, useEffect } from 'react';
import RenewalHistoryModal from './RenewalHistoryModal'; // Import the new component

// Helper to safely format a date string or return an empty string/null
const safelyFormatDate = (dateString) => {
    // Return empty string if the date string is falsy (null, undefined, '')
    if (!dateString) return '';

    let date;

    // Check if the string is in DD-MM-YYYY format (or similar with hyphens)
    if (dateString.includes('-') && dateString.split('-')[0].length <= 2 && dateString.split('-').length === 3) {
        // Assume DD-MM-YYYY format (e.g., '20-10-2025') and manually parse it.
        const parts = dateString.split('-');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Use YYYY, MM-1, DD format (Note: month is 0-indexed in Date constructor)
        date = new Date(year, month - 1, day);
        
    } else {
        // Try parsing directly (works for YYYY-MM-DD or full date strings)
        date = new Date(dateString);
    }
    
    // CRITICAL CHECK: Check for Invalid Date object before calling toISOString()
    if (isNaN(date.getTime())) {
        console.error("Invalid date value encountered:", dateString);
        return ''; // Return empty string
    }

    // toISOString().split('T')[0] returns the date in YYYY-MM-DD format, which is safe for date inputs
    return date.toISOString().split('T')[0];
};

const calculateFrontendEndDate = (startDate, membershipType) => {
    if (!startDate || !membershipType) return '';
    
    // Use the safe date parsing logic here as well
    const start = new Date(safelyFormatDate(startDate));
    
    // Add check here too, in case the manually entered startDate is invalid
    if (isNaN(start.getTime())) return ''; 
    
    let end = new Date(start);
    switch (membershipType) {
        case '1 Month':
            end.setMonth(end.getMonth() + 1);
            break;
        case '3 Months':
            end.setMonth(end.getMonth() + 3);
            break;
        case '6 Months':
            end.setMonth(end.getMonth() + 6);
            break;
        case '1 Year':
            end.setFullYear(end.getFullYear() + 1);
            break;
        default:
            break;
    }
    
    // Substract one day to ensure the membership ends the day before the rollover date
    end.setDate(end.getDate() - 1);
    
    // Add safety check before final formatting
    if (isNaN(end.getTime())) return ''; 
    
    return end.toISOString().split('T')[0];
};

// 🌟 NEW HELPER: Calculate age from a YYYY-MM-DD date string
const calculateAge = (dobString) => {
    if (!dobString) return '';

    try {
        const today = new Date();
        const birthDate = new Date(dobString);
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        
        // If the current month is before the birth month, or if it's the birth month
        // but the current day is before the birth day, subtract one year.
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age > 0 ? age : 0;
    } catch (e) {
        console.error("Error calculating age:", e);
        return 'N/A';
    }
}


function ClientDetailsModal({ client, onClose, onUpdate, onDelete, setMessageBox }) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editableClient, setEditableClient] = useState(null);
    const [renewalHistory, setRenewalHistory] = useState([]);
    const [renewalLoading, setRenewalLoading] = useState(false);
    const [renewalError, setRenewalError] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false); // New state for history modal
    
    // Calculate the age on render (will update whenever client.dob changes)
    const clientAge = editableClient ? calculateAge(editableClient.dob) : '';

    useEffect(() => {
        setEditableClient({
            ...client,
            // 🌟 FIX 1: Use the 'dob' column from the client object
            dob: safelyFormatDate(client.dob), 
            // Use the safe helper function to parse and format dates for the state
            startDate: safelyFormatDate(client.membershipStart),
            endDate: safelyFormatDate(client.membershipEnd),
        });
    }, [client]);

    const handleFetchHistory = async () => {
        setShowHistoryModal(true);
        if (renewalHistory.length > 0) return;

        setRenewalLoading(true);
        setRenewalError(null);
        try {
            const historyResponse = await fetch(`http://localhost:5000/admin/history/${client.id}`);
            if (historyResponse.ok) {
                const data = await historyResponse.json();
                setRenewalHistory(data);
            } else {
                const errorData = await historyResponse.json();
                setRenewalError('Failed to fetch renewal history: ' + errorData.error);
            }
        } catch (error) {
            setRenewalError('An error occurred while fetching renewal history.');
        } finally {
            setRenewalLoading(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditableClient((prev) => {
            const updatedClient = {
                ...prev,
                [name]: value,
            };

            // Recalculate end date if membership type or start date changes
            if (name === 'membershipType' || name === 'startDate') {
                updatedClient.endDate = calculateFrontendEndDate(
                    updatedClient.startDate,
                    updatedClient.membershipType
                );
            }
            return updatedClient;
        });
    };

    const handleSaveChanges = async () => {
        try {
            setLoading(true);
            const updatePayload = {
                ...editableClient,
                membershipStart: editableClient.startDate,
                membershipEnd: editableClient.endDate,
                // 🌟 IMPORTANT: Send the raw dob string back to the backend for update
                // The backend (update-client route) must be updated to handle this!
                dob: editableClient.dob, 
            };
            
            // Delete the old age field if it somehow made it into the payload (for safety)
            delete updatePayload.age;

            const response = await fetch(`http://localhost:5000/admin/update-client/${editableClient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload),
            });

            if (response.ok) {
                onUpdate(editableClient);
                setIsEditing(false);
                setMessageBox({
                    isVisible: true,
                    message: 'Client details updated successfully!',
                    type: 'success',
                });
            } else {
                const errorData = await response.json();
                setMessageBox({
                    isVisible: true,
                    message: 'Failed to update client: ' + errorData.error,
                    type: 'error',
                });
            }
        } catch (error) {
            setMessageBox({
                isVisible: true,
                message: 'Error updating client: ' + error.message,
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };



    if (!editableClient) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
            <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-card text-dark-text p-8 rounded-xl shadow-2xl z-50 w-11/12 max-w-3xl overflow-y-auto transition-all duration-300 dark:bg-light-card dark:text-light-text ${isEditing ? 'border-2 border-dashed border-dark-accent dark:border-light-accent' : ''}`}>
                <button className="absolute top-4 right-4 text-dark-text-highlight hover:text-dark-text dark:text-light-text-highlight dark:hover:text-light-text text-2xl" onClick={onClose}>
                    &times;
                </button>
                <h3 className="text-2xl font-bold mb-6 text-dark-accent dark:text-light-accent">Client Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    {/* Roll No */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">Roll No:</label>
                            <p className="text-lg font-semibold text-dark-text dark:text-light-text">{editableClient.rollno}</p>
                    </div>
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">Name:</label>
                            <p className="text-lg font-semibold text-dark-text dark:text-light-text">{editableClient.name}</p>
                    </div>
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">Email:</label>
                        {isEditing ? (
                            <input type="email" name="email" value={editableClient.email || ''} onChange={handleEditChange} className="w-full p-2 rounded bg-dark-card border border-dark-text-highlight/10 text-dark-text-highlight focus:outline-none focus:border-dark-accent disabled:bg-gray-700 disabled:cursor-not-allowed dark:bg-light-card dark:border-light-text/10 dark:text-light-text-highlight dark:focus:border-light-accent"/>
                        ) : (
                            <p className="text-lg font-semibold text-dark-text dark:text-light-text">{editableClient.email}</p>
                        )}
                    </div>
                    

                    {/* 🌟 FIX 3: Display Calculated Age */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">Age:</label>
                        {/* Always display, never edit. Calculated from DOB. */}
                        <p className="text-lg font-semibold text-dark-text dark:text-light-text">{clientAge}</p>
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">Gender:</label>
                            <p className="text-lg font-semibold text-dark-text dark:text-light-text">{editableClient.gender}</p>
                    </div>
                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">Phone:</label>
                        {isEditing ? (
                            <input type="text" name="phone" value={editableClient.phone || ''} onChange={handleEditChange} className="w-full p-2 rounded bg-dark-card border border-dark-text-highlight/10 text-dark-text-highlight focus:outline-none focus:border-dark-accent disabled:bg-gray-700 disabled:cursor-not-allowed dark:bg-light-card dark:border-light-text/10 dark:text-light-text-highlight dark:focus:border-light-accent"/>
                        ) : (
                            <p className="text-lg font-semibold text-dark-text dark:text-light-text">{editableClient.phone}</p>
                        )}
                    </div>
                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">Address:</label>
                        {isEditing ? (
                            <input type="text" name="address" placeholder="Address / City" value={editableClient.address || ''} onChange={handleEditChange} className="w-full p-2 rounded bg-dark-card border border-dark-text-highlight/10 text-dark-text-highlight focus:outline-none focus:border-dark-accent disabled:bg-gray-700 disabled:cursor-not-allowed dark:bg-light-card dark:border-light-text/10 dark:text-light-text-highlight dark:focus:border-light-accent"/>
                        ) : (
                            <p className="text-lg font-semibold text-dark-text dark:text-light-text">{editableClient.address}</p>
                        )}
                    </div>
                    {/* Trainer */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">Trainer:</label>
                        {isEditing ? (
                            <input type="text" name="trainerName" value={editableClient.trainerName || ''} onChange={handleEditChange} placeholder="Enter Trainer Name" className="w-full p-2 rounded bg-dark-card border border-dark-text-highlight/10 text-dark-text-highlight focus:outline-none focus:border-dark-accent disabled:bg-gray-700 disabled:cursor-not-allowed dark:bg-light-card dark:border-light-text/10 dark:text-light-text-highlight dark:focus:border-light-accent"/>
                        ) : (
                            <p className="text-lg font-semibold text-dark-text dark:text-light-text">{editableClient.trainerName || 'Not Assigned'}</p>
                        )}
                    </div>
                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">Status:</label>
                        <p className="text-lg font-semibold text-status-active dark:text-status-active">{editableClient.status}</p>
                    </div>
                    {/* Membership */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">Membership:</label>
                            <p className="text-lg font-semibold text-dark-text dark:text-light-text">{editableClient.membershipType}</p>
                    </div>
                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">Start Date:</label>
                            <p className="text-lg font-semibold text-dark-text dark:text-light-text">{editableClient.startDate || 'N/A'}</p>
                    </div>
                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text/70 dark:text-light-text/70">End Date:</label>
                        <p className="text-lg font-semibold text-dark-text dark:text-light-text">{editableClient.endDate || 'N/A'}</p>
                    </div>
                </div>

                {/* 'See Renewal History' Button */}
                <div className="mt-8 pt-6 border-t border-dark-text-highlight/20 dark:border-light-text/20">
                    <button
                        onClick={handleFetchHistory}
                        className="bg-dark-accent text-dark-bg px-5 py-2 rounded-lg font-semibold hover:bg-opacity-80 transition-colors disabled:opacity-50 dark:bg-light-accent dark:text-light-bg"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'See Renewal History'}
                    </button>
                </div>

                <div className="flex justify-end mt-6 space-x-4">
                    {isEditing ? (
                        <>
                            <button onClick={handleSaveChanges} disabled={loading} className="bg-dark-accent text-dark-bg px-5 py-2 rounded-lg font-semibold hover:bg-opacity-80 transition-colors disabled:opacity-50 dark:bg-light-accent dark:text-light-bg">
                                {loading ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => { setIsEditing(false); setEditableClient({ ...client, startDate: safelyFormatDate(client.membershipStart), endDate: safelyFormatDate(client.membershipEnd) }); }} className="bg-gray-700 text-dark-text-highlight px-5 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors dark:bg-gray-300 dark:text-light-text dark:hover:bg-gray-200">
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="bg-dark-accent text-dark-bg px-5 py-2 rounded-lg font-semibold hover:bg-opacity-80 transition-colors dark:bg-light-accent dark:text-light-bg">
                            Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Conditionally render the new modal */}
            {showHistoryModal && (
                <RenewalHistoryModal
                    history={renewalHistory}
                    onClose={() => setShowHistoryModal(false)}
                    loading={renewalLoading} // Pass loading state to the modal
                    error={renewalError} // Pass error state
                />
            )}
        </>
    );
}

export default ClientDetailsModal;