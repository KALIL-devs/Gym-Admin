// src/pages/RenewalHistoryLog.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { HiOutlineDocumentText } from "react-icons/hi"; // Icon for the component header
import { FiPrinter } from "react-icons/fi"; // Icon for print functionality

// Define the base URL. In a real project, this would be imported from a config file or .env
const API_BASE_URL = 'http://localhost:5000'; 

// Utility function to format Date object to API-friendly string (YYYY-MM-DD)
const getFormattedDate = (date) => {
    if (!date) return '';
    // Use substring(0, 10) to get YYYY-MM-DD part of ISO string
    // CRITICAL: Ensure we use the date part only.
    return date.toISOString().substring(0, 10); 
};

/**
 * Triggers the browser's native print dialog.
 */
const handlePrintOrExport = () => {
    window.print(); 
};

const RenewalHistoryLog = () => {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for Date Filtering (using Date objects for easy manipulation)
    const [startDate, setStartDate] = useState(null); 
    const [endDate, setEndDate] = useState(null);

    // Effect to fetch data whenever the date filters change
    useEffect(() => {
        setLoading(true);
        setError(null);

        // Format Date objects to YYYY-MM-DD strings for the API
        const start = startDate ? getFormattedDate(startDate) : '';
        const end = endDate ? getFormattedDate(endDate) : '';

        // Construct query string
        const query = new URLSearchParams({ 
            startDate: start, 
            endDate: end 
        }).toString();

        // The correct URL path is /admin/renewal-history
        const apiUrl = `${API_BASE_URL}/admin/renewal-history?${query}`;
        
        // Fetch token for authorization
        const token = localStorage.getItem('token'); 

        fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`, // Include the token for authorization
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (!res.ok) {
                    // Throw a specific error based on status for debugging
                    throw new Error(`API returned status ${res.status} (${res.statusText}). Check backend logs.`);
                }
                return res.json();
            })
            .then(data => {
                setHistoryData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch Error:", err);
                // Display the simplified error message to the user
                setError(`Fetch Error: ${err.message}. Ensure backend is running and you are logged in.`);
                setLoading(false);
            });
    }, [startDate, endDate]); 

    // Memoized calculation of total revenue
    const totalRevenue = useMemo(() => {
        return historyData.reduce((sum, record) => {
            return sum + (parseFloat(record.pricePaid) || 0); 
        }, 0);
    }, [historyData]);


    // --- RENDERING LOGIC ---
    
    if (loading) return <div className="loading-message" style={{ padding: '20px' }}>Loading Renewal History...</div>;
    
    const tableHeaderStyle = { padding: '12px', border: '1px solid #ddd', textAlign: 'left', backgroundColor: '#e9e9e9' };
    const tableCellStyle = { padding: '12px', border: '1px solid #ddd', textAlign: 'left' };


    return (
        <>
            {/* CSS to isolate the report content when printing */}
            <style>
                {`
                    @media print {
                        /* CRITICAL: Hide everything not inside the #printable-content wrapper (sidebar, navbar, etc.) */
                        body * {
                            visibility: hidden; /* Hide all content initially */
                        }
                        
                        #printable-content, #printable-content * {
                            visibility: visible; /* Make only the printable content visible */
                        }
                        
                        /* Position the printable content */
                        #printable-content {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            padding: 20px !important; /* Re-apply padding for print margins */
                        }

                        /* Hide the Print button and any error/loading messages */
                        .print-hide {
                            display: none !important;
                        }
                        
                        /* Print table styles clean */
                        th, tr {
                            background-color: white !important;
                            -webkit-print-color-adjust: exact; 
                            print-color-adjust: exact;
                        }
                        
                        th, td {
                            border: 1px solid #000 !important;
                        }
                    }
                `}
            </style>
            
            {/* 1. The main container for all report content */}
            <div id="printable-content" style={{ padding: '20px' }}>
                
                <h2 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HiOutlineDocumentText /> Renewal History Log
                    </span>

                    {/* 2. Print Button (Hidden in print mode) */}
                    <button 
                        onClick={handlePrintOrExport}
                        className="print-hide" 
                        style={{ 
                            padding: '10px 20px', 
                            cursor: 'pointer', 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                    >
                        <FiPrinter /> Export/Print Report
                    </button>
                </h2>
                
                {error && <div className="error-message print-hide" style={{ color: 'white', backgroundColor: '#f44336', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}>{error}</div>}

                {/* 3. Date Filter Controls (Hidden in print mode) */}
                <div className="print-hide" style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div>
                        <label htmlFor="startDate">From Date:</label>
                        <input 
                            type="date" 
                            id="startDate" 
                            value={startDate ? getFormattedDate(startDate) : ''}
                            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                            style={{ marginLeft: '10px', padding: '8px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate">To Date:</label>
                        <input 
                            type="date" 
                            id="endDate" 
                            value={endDate ? getFormattedDate(endDate) : ''}
                            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                            style={{ marginLeft: '10px', padding: '8px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <button 
                        onClick={() => { setStartDate(null); setEndDate(null); }}
                        style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Reset Filters
                    </button>
                </div>
                
                {/* 4. Display the currently applied filter period on the report */}
                {(startDate || endDate) && (
                    <div style={{ marginBottom: '10px' }}>
                        <strong>Report Period:</strong> {startDate ? getFormattedDate(startDate) : 'Start'} to {endDate ? getFormattedDate(endDate) : 'End'}
                    </div>
                )}

                {/* 5. Total Revenue Widget */}
                <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#e6ffed', 
                    border: '1px solid #b7eb8f', 
                    borderRadius: '5px',
                    marginBottom: '20px'
                }}>
                    <strong>Total Revenue for Filtered Period:</strong> 
                    <span style={{ color: '#52c41a', fontSize: '1.3em', fontWeight: 'bold', marginLeft: '10px' }}>
                        ₹ {totalRevenue.toFixed(2)}
                    </span>
                </div>

                {/* 6. Renewal History Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={tableHeaderStyle}>ID</th>
                            <th style={tableHeaderStyle}>Client Name</th>
                            <th style={tableHeaderStyle}>Membership</th>
                            <th style={tableHeaderStyle}>Price Paid</th>
                            <th style={tableHeaderStyle}>Renewal Date</th>
                            <th style={tableHeaderStyle}>New End Date</th>
                            <th style={tableHeaderStyle}>Client ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyData.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', border: '1px solid #ddd' }}>
                                    No renewal records found for the selected period.
                                </td>
                            </tr>
                        ) : (
                            historyData.map((record, index) => (
                                <tr key={record.id || index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tableCellStyle}>{record.id}</td> 
                                    <td style={tableCellStyle}>{record.clientName}</td>
                                    <td style={tableCellStyle}>{record.membershipType}</td>
                                    <td style={{ ...tableCellStyle, fontWeight: 'bold', color: '#006400' }}>
                                        ₹ {parseFloat(record.pricePaid).toFixed(2)} 
                                    </td>
                                    <td style={tableCellStyle}>{record.renewalDate}</td>
                                    <td style={tableCellStyle}>{record.newEndDate}</td>
                                    <td style={tableCellStyle}>{record.clientId}</td> 
                                </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default RenewalHistoryLog;