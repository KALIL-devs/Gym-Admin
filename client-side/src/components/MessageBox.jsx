// src/components/MessageBox.jsx

import React from 'react';

function MessageBox({ message, type, onClose, onConfirm }) {
  const isConfirm = type === 'confirm';
  const colorClass = type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : 'text-gray-200';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-slate-900 p-6 rounded-lg shadow-2xl z-10 w-11/12 max-w-sm">
        <p className={`text-center font-semibold mb-4 ${colorClass}`}>{message}</p>
        <div className="flex justify-center space-x-4">
          {isConfirm ? (
            <>
              <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-500 transition-colors">Yes</button>
              <button onClick={onClose} className="bg-slate-700 text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-slate-600 transition-colors">No</button>
            </>
          ) : (
            <button onClick={onClose} className="bg-teal-500 text-slate-950 px-4 py-2 rounded-lg font-semibold hover:bg-teal-400 transition-colors">Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBox;