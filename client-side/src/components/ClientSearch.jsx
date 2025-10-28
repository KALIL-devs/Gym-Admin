import React from "react";

function ClientSearch({ searchTerm, onSearchChange }) {
  const handleClear = () => {
    onSearchChange("");
  };

  return (
    <div className="mb-6 p-4 bg-dark-card dark:bg-light-card shadow-card rounded-xl transition-colors duration-300">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search clients by Name or Roll No..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          // ⬇️ REMOVE DUPLICATES HERE ⬇️
          className="
            w-full p-3 pr-10 rounded-lg
            border border-neutral-border dark:border-dark-border
            bg-dark-card dark:bg-light-card  // Keep one set for background
            text-dark-text dark:text-light-text  // Keep one set for text color
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2
            focus:ring-brand-primary dark:focus:ring-brand-primary
            focus:border-brand-primary dark:focus:border-brand-primary
            transition-all duration-200
          "
        />

        {searchTerm && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="
              absolute right-0 top-1/2 -translate-y-1/2 mr-3
              text-gray-500 dark:text-gray-400
              hover:text-status-expired dark:hover:text-status-expired
              p-1 rounded-full transition-colors
              focus:outline-none
            "
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default ClientSearch;