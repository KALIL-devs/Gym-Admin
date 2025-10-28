// AddUserForm.jsx
import React, { useState, useEffect } from "react";

// This function is moved here to encapsulate form-related logic.
const calculateFrontendEndDate = (startDate, membershipType) => {
    if (!startDate || !membershipType) return "";
    
    const parts = startDate.split('-').map(Number); // [YYYY, MM, DD]
    // Create the Date object using UTC methods to prevent local timezone shift.
    // Month in JS is 0-indexed (0=Jan, 8=Sep).
    let end = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

    // 1. Calculate the next cycle's start date
    switch (membershipType) {
        case "1 Month":
            end.setUTCMonth(end.getUTCMonth() + 1);
            break;
        case "3 Months":
            end.setUTCMonth(end.getUTCMonth() + 3);
            break;
        case "6 Months":
            end.setUTCMonth(end.getUTCMonth() + 6);
            break;
        case "1 Year":
            end.setUTCFullYear(end.getUTCFullYear() + 1);
            break;
        default:
            // Fallback for custom/invalid types
            return startDate; 
    }
    
    // 2. Subtract one day to get the final end date.
    // If the next cycle starts on 2025-10-01, this correctly sets the end date to 2025-09-30.
    end.setUTCDate(end.getUTCDate() - 1);

    // Format the date back to YYYY-MM-DD string
    const year = end.getUTCFullYear();
    const month = String(end.getUTCMonth() + 1).padStart(2, '0'); // month is 0-indexed
    const day = String(end.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

function AddUserForm({ lastRollNo, onClose, onAddSuccess, setMessageBox, clients }) {
    const initialForm = {
        rollno: lastRollNo + 1,
        name: "",
        dob: "", 
        gender: "Male",
        phone: "",
        email: "",
        membershipType: "1 Month",
        startDate: "",
        endDate: "", // This will be calculated and displayed, but not sent to backend directly
        address: "",
        hasTrainer: false,
        trainerName: "", 
    };

    const [formData, setFormData] = useState(initialForm);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (formData.startDate && formData.membershipType) {
            const calculatedEndDate = calculateFrontendEndDate(
                formData.startDate,
                formData.membershipType
            );
            setFormData((prev) => ({ ...prev, endDate: calculatedEndDate }));
        }
    }, [formData.startDate, formData.membershipType]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const updatedValue = name === "rollno" ? (value === "" ? "" : Number(value)) : value; 
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : updatedValue,
        }));
    };

    // Helper function to format date for display only (DD-MM-YYYY)
    const formatIsoToDMY = (isoDateString) => {
        if (!isoDateString || typeof isoDateString !== 'string' || isoDateString.length !== 10) return ''; 
        const parts = isoDateString.split('-'); // [YYYY, MM, DD]
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if a user with the same roll number already exists
        const rollNoExists = clients.some(client => client.rollno === formData.rollno);
        if (rollNoExists) {
            setMessageBox({
                isVisible: true,
                message: "❌ Error: This Roll No is already in use. Please enter a different one.",
                type: "error",
            });
            return;
        }

        if (
            !formData.name ||
            !formData.membershipType ||
            !formData.startDate ||
            !formData.email ||
            !formData.dob 
        ) {
            setMessageBox({
                isVisible: true,
                message: "Please fill in all required fields",
                type: "error",
            });
            return;
        }

        // 💥 MODIFIED LOGIC: Send the raw YYYY-MM-DD end date string.
        // The backend will interpret this correctly as the start of the day
        // and then calculate the dynamic status based on the server's current date.
        const dataToSend = {
            ...formData,
            trainerName: formData.hasTrainer ? formData.trainerName : null,
            
            // Send the calculated end date as 'membershipEnd'
            membershipEnd: formData.endDate, // YYYY-MM-DD format
        };
        
        // Remove the temporary 'endDate' field from the object that's being sent
        delete dataToSend.endDate;

        try {
            setLoading(true);
            setMessageBox({ isVisible: false, message: "" });

            const response = await fetch("http://localhost:5000/admin/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });

            const data = await response.json();

            if (response.ok) {
                setMessageBox({
                    isVisible: true,
                    message: "✅ User created successfully.",
                    type: "success",
                });
                onAddSuccess({ ...formData, ...data });
                setFormData(initialForm); // Reset form
            } else {
                setMessageBox({
                    isVisible: true,
                    message: "❌ " + data.error,
                    type: "error",
                });
            }
        } catch (error) {
            setMessageBox({
                isVisible: true,
                message: "❌ Error: " + error.message,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-dark-card dark:bg-light-card p-6 rounded-xl shadow-2xl z-50 w-11/12 max-w-lg text-dark-text dark:text-light-text">
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-dark-accent dark:hover:text-light-accent text-2xl"
                    onClick={onClose}
                >
                    &times;
                </button>
                <h3 className="text-xl font-bold mb-4 text-dark-accent dark:text-light-accent">
                    Add New User
                </h3>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Roll No */}
                    <input
                        type="number"
                        name="rollno"
                        placeholder="Roll No"
                        value={formData.rollno}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Name */}
                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Date of Birth */}
                    <input
                        type="date"
                        name="dob"
                        placeholder="Date of Birth"
                        value={formData.dob}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Email */}
                    <input
                        type="email"
                        name="email"
                        placeholder="Email (e.g., user@example.com)"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Gender */}
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text"
                    >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>

                    {/* Phone */}
                    <input
                        type="text"
                        name="phone"
                        placeholder="Phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Membership Type */}
                    <select
                        name="membershipType"
                        value={formData.membershipType}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text"
                    >
                        <option value="1 Month">1 Month</option>
                        <option value="3 Months">3 Months</option>
                        <option value="6 Months">6 Months</option>
                        <option value="1 Year">1 Year</option>
                    </select>

                    {/* Start Date */}
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text"
                    />

                    {/* End Date - Formatted for display */}
                    {formData.endDate && (
                        <p className="text-sm text-dark-text dark:text-light-text">
                            <b>End Date:</b> {formatIsoToDMY(formData.endDate)}
                        </p>
                    )}

                    {/* Trainer Option */}
                    <div className="flex items-center space-x-2">
                        <label htmlFor="hasTrainer" className="text-dark-text dark:text-light-text">
                            Assign a Trainer?
                        </label>
                        <input
                            type="checkbox"
                            id="hasTrainer"
                            name="hasTrainer"
                            checked={formData.hasTrainer}
                            onChange={handleChange}
                            className="form-checkbox h-5 w-5 text-orange-500 rounded-full cursor-pointer"
                        />
                    </div>

                    {/* Conditionally render Trainer Name input */}
                    {formData.hasTrainer && (
                        <input
                            type="text"
                            name="trainerName"
                            placeholder="Trainer Name"
                            value={formData.trainerName}
                            onChange={handleChange}
                            className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                        />
                    )}

                    {/* Address */}
                    <input
                        type="text"
                        name="address"
                        placeholder="Address / City"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-dark-bg dark:bg-light-bg border border-gray-600 dark:border-gray-300 text-dark-text dark:text-light-text placeholder-gray-400 dark:placeholder-gray-600"
                    />

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 w-full bg-dark-accent dark:bg-light-accent text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create User"}
                    </button>
                </form>
            </div>
        </>
    );
}

export default AddUserForm;