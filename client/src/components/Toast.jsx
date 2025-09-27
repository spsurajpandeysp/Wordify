import React from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Custom hook to provide toast functionality with confirmation dialog
export const useToast = () => {
    const success = (message) => {
        return toast.success(message, {
            duration: 1500,
            position: 'top-right',
            style: {
                background: '#10b981',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
            },
            onClick: (toastId) => toast.dismiss(toastId),
        });
    };

    const error = (message) => {
        return toast.error(message, {
            duration: 1500,
            position: 'top-right',
            style: {
                background: '#ef4444',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
            },
            onClick: (toastId) => toast.dismiss(toastId),
        });
    };

    const warning = (message) => {
        return toast(message, {
            duration: 1500,
            position: 'top-right',
            icon: '⚠️',
            style: {
                background: '#f59e0b',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
            },
            onClick: (toastId) => toast.dismiss(toastId),
        });
    };

    const info = (message) => {
        return toast(message, {
            duration: 1500,
            position: 'top-right',
            icon: 'ℹ️',
            style: {
                background: '#3b82f6',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
            },
            onClick: (toastId) => toast.dismiss(toastId),
        });
    };

    const loading = (message) => {
        return toast.loading(message, {
            position: 'top-right',
            style: {
                borderRadius: '8px',
                fontSize: '14px',
            },
        });
    };

    const confirm = (message, title = 'Confirm Action') => {
        return new Promise((resolve) => {
            toast.custom((t) => (
                <>
                    {/* Backdrop overlay */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 99998,
                            animation: t.visible ? 'fadeIn 0.2s ease-out' : 'fadeOut 0.1s ease-in'
                        }}
                        onClick={() => {
                            toast.remove(t.id);
                            resolve(false);
                        }}
                    />
                    {/* Modal dialog */}
                    <div
                        className={`confirm-modal ${t.visible ? 'animate-enter' : 'animate-leave'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-icon">
                                🗑️
                            </div>
                            <div className="modal-title">
                                {title}
                            </div>
                            <div className="modal-message">
                                {message}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => {
                                    toast.remove(t.id);
                                    resolve(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-delete"
                                onClick={() => {
                                    toast.remove(t.id);
                                    resolve(true);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                    <style jsx>{`
                        .confirm-modal {
                            position: fixed !important;
                            top: 20% !important;
                            left: 50% !important;
                            transform: translate(-50%, 0) !important;
                            background: white;
                            border-radius: 16px;
                            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                            padding: 24px;
                            min-width: 280px;
                            max-width: 400px;
                            width: 90vw;
                            z-index: 99999 !important;
                            border: 1px solid #e2e8f0;
                            margin: 0 !important;
                        }

                        .modal-content {
                            text-align: center;
                            margin-bottom: 24px;
                        }

                        .modal-icon {
                            font-size: 48px;
                            margin-bottom: 16px;
                            opacity: 0.8;
                        }

                        .modal-title {
                            font-size: 18px;
                            font-weight: 600;
                            color: #2d3748;
                            margin-bottom: 8px;
                        }

                        .modal-message {
                            font-size: 14px;
                            color: #4a5568;
                            line-height: 1.5;
                        }

                        .modal-actions {
                            display: flex;
                            gap: 12px;
                            justify-content: center;
                        }

                        .btn-cancel {
                            padding: 12px 24px;
                            font-size: 14px;
                            font-weight: 600;
                            background-color: #e2e8f0;
                            color: #4a5568;
                            border: 2px solid #e2e8f0;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            min-width: 80px;
                        }

                        .btn-cancel:hover {
                            background-color: #cbd5e0;
                            border-color: #cbd5e0;
                            transform: translateY(-1px);
                        }

                        .btn-delete {
                            padding: 12px 24px;
                            font-size: 14px;
                            font-weight: 600;
                            background-color: #ef4444;
                            color: white;
                            border: 2px solid #ef4444;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            min-width: 80px;
                        }

                        .btn-delete:hover {
                            background-color: #dc2626;
                            border-color: #dc2626;
                            transform: translateY(-1px);
                            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                        }

                        .animate-enter {
                            animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                        }

                        .animate-leave {
                            animation: scaleOut 0.1s ease-in;
                        }

                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }

                        @keyframes fadeOut {
                            from { opacity: 1; }
                            to { opacity: 0; }
                        }

                        @keyframes scaleIn {
                            from { 
                                opacity: 0;
                                transform: translate(-50%, 0) scale(0.7);
                            }
                            to { 
                                opacity: 1;
                                transform: translate(-50%, 0) scale(1);
                            }
                        }

                        @keyframes scaleOut {
                            from { 
                                opacity: 1;
                                transform: translate(-50%, 0) scale(1);
                            }
                            to { 
                                opacity: 0;
                                transform: translate(-50%, 0) scale(0.7);
                            }
                        }

                        /* Mobile responsive */
                        @media (max-width: 480px) {
                            .confirm-modal {
                                min-width: 260px;
                                padding: 20px;
                                margin: 16px;
                                width: calc(100vw - 32px);
                                top: 15% !important;
                            }

                            .modal-icon {
                                font-size: 40px;
                                margin-bottom: 12px;
                            }

                            .modal-title {
                                font-size: 16px;
                            }

                            .modal-message {
                                font-size: 13px;
                            }

                            .modal-actions {
                                flex-direction: column;
                                gap: 8px;
                            }

                            .btn-cancel,
                            .btn-delete {
                                width: 100%;
                                padding: 14px 20px;
                            }
                        }

                        /* Dark mode support */
                        @media (prefers-color-scheme: dark) {
                            .confirm-modal {
                                background: #2d3748;
                                border-color: #4a5568;
                            }

                            .modal-title {
                                color: #e2e8f0;
                            }

                            .modal-message {
                                color: #cbd5e0;
                            }

                            .btn-cancel {
                                background-color: #4a5568;
                                color: #e2e8f0;
                                border-color: #4a5568;
                            }

                            .btn-cancel:hover {
                                background-color: #718096;
                                border-color: #718096;
                            }
                        }
                    `}</style>
                </>
            ), {
                duration: Infinity,
                position: 'top-center',
                dismissible: false,
                style: {
                    background: 'transparent',
                    boxShadow: 'none'
                }
            });
        });
    };

    return {
        success,
        error,
        warning,
        info,
        loading,
        confirm
    };
};

// Provider component to wrap the app
export const ToastProvider = ({ children }) => {
    React.useEffect(() => {
        const handleGlobalClick = (event) => {
            // Check if click is outside toast container
            const toastContainer = document.querySelector('.toaster');
            if (!toastContainer || !toastContainer.contains(event.target)) {
                toast.dismiss();
            }
        };

        document.addEventListener('click', handleGlobalClick);
        return () => {
            document.removeEventListener('click', handleGlobalClick);
        };
    }, []);

    return (
        <>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 1500,
                    style: {
                        borderRadius: '8px',
                        fontSize: '14px',
                        maxWidth: '400px',
                        zIndex: 1000,
                        cursor: 'pointer',
                    },
                    success: {
                        style: {
                            background: '#10b981',
                            color: '#fff',
                        },
                    },
                    error: {
                        style: {
                            background: '#ef4444',
                            color: '#fff',
                        },
                    },
                }}
                containerStyle={{
                    top: 100,
                    right: 20,
                    zIndex: 50000,
                }}
            />
        </>
    );
};