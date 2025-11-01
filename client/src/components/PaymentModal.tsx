// Payment Modal Component with Stripe Elements
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { api } from '../services/api';

// Initialize Stripe (use publishable key from env or fallback to test key)
const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SAvlgC2wUQ3ouKDotZPx4YjXM2NbOOD3gtN6zz3GyEofO8qic3fojvoNANdjhwIF6SdmQL7ktebM1i1IdPI1lRp004yoU4KvJ'
);

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectTitle: string;
    amount: number;
    projectId: string;
    freelancerName?: string;
}

// Payment Form Component
const PaymentForm: React.FC<{
    amount: number;
    projectTitle: string;
    projectId: string;
    freelancerName?: string;
    onSuccess: () => void;
    onError: (error: string) => void;
}> = ({ amount, projectTitle, projectId: _projectId, freelancerName, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Create payment intent on mount
    useEffect(() => {
        const createPaymentIntent = async () => {
            try {
                setLoading(true);
                const response = await api.post('/payments/intent', {
                    amount,
                    description: `Payment for ${projectTitle}${freelancerName ? ` (Freelancer: ${freelancerName})` : ''}`,
                });

                setClientSecret(response.data.client_secret);
            } catch (error: any) {
                console.error('Error creating payment intent:', error);
                const errorMessage = error.response?.data?.error || error.message || 'Failed to initialize payment';

                // Check if it's a Stripe configuration error
                if (error.response?.status === 503 || errorMessage.includes('Stripe not configured')) {
                    onError('Payment system is not configured on the server. Please add STRIPE_SECRET_KEY to the server .env file and restart the server.');
                } else {
                    onError(errorMessage);
                }
            } finally {
                setLoading(false);
            }
        };

        if (amount > 0) {
            createPaymentIntent();
        }
    }, [amount, projectTitle, freelancerName]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setProcessing(true);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            onError('Card element not found');
            setProcessing(false);
            return;
        }

        try {
            // Confirm payment with Stripe
            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: cardElement,
                    }
                }
            );

            if (confirmError) {
                onError(confirmError.message || 'Payment failed');
                setProcessing(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            onError(error.message || 'Payment failed');
            setProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#9e2146',
            },
        },
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading payment form...</p>
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#dc3545' }}>Failed to initialize payment. Please try again.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                    Card Details
                </label>
                <div style={{
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#fff'
                }}>
                    <CardElement options={cardElementOptions} />
                </div>
            </div>

            <div style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                marginBottom: '1.5rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666' }}>Amount:</span>
                    <span style={{ fontWeight: '600', fontSize: '1.25rem', color: '#333' }}>
                        ${amount.toFixed(2)}
                    </span>
                </div>
                {freelancerName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#666' }}>
                        <span>Freelancer:</span>
                        <span>{freelancerName}</span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                    type="submit"
                    disabled={!stripe || processing}
                    style={{
                        flex: 1,
                        padding: '0.875rem 1.5rem',
                        backgroundColor: processing ? '#6c757d' : '#14a800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: processing || !stripe ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s ease'
                    }}
                >
                    {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
                </button>
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>
                🔒 Secure payment powered by Stripe
            </div>
        </form>
    );
};

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    projectTitle,
    amount,
    projectId,
    freelancerName
}) => {
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handlePaymentSuccess = () => {
        setPaymentSuccess(true);
        // Close modal after 2 seconds
        setTimeout(() => {
            setPaymentSuccess(false);
            onClose();
            // Refresh page to show updated payment status
            window.location.reload();
        }, 2000);
    };

    const handlePaymentError = (errorMessage: string) => {
        setError(errorMessage);
        setTimeout(() => setError(null), 5000);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '2rem',
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: '#333' }}>Make Payment</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '0.25rem 0.5rem'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Project Info */}
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    marginBottom: '1.5rem'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#333' }}>
                        {projectTitle}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                        Project ID: {projectId}
                    </p>
                </div>

                {/* Success Message */}
                {paymentSuccess && (
                    <div style={{
                        padding: '1.5rem',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>
                            Payment Successful!
                        </h3>
                        <p style={{ margin: 0, color: '#155724' }}>
                            Your payment has been processed successfully.
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px',
                        marginBottom: '1.5rem',
                        color: '#721c24'
                    }}>
                        {error}
                    </div>
                )}

                {/* Payment Form */}
                {!paymentSuccess && (
                    <Elements stripe={stripePromise}>
                        <PaymentForm
                            amount={amount}
                            projectTitle={projectTitle}
                            projectId={projectId}
                            freelancerName={freelancerName}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                        />
                    </Elements>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;

