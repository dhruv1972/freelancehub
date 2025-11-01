// View Profile page - Public view of freelancer profile
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface FreelancerProfile {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
    profile?: {
        bio?: string;
        skills?: string[];
        experience?: string;
        portfolio?: string[];
        rating?: number;
        location?: string;
    };
    createdAt: string;
}

const ViewProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<FreelancerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        // Load current user
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }

        if (!id) return;

        const loadProfile = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Loading profile for user ID:', id);
                const response = await api.get(`/users/${id}`);
                console.log('Profile loaded:', response.data);

                if (!response.data) {
                    throw new Error('User not found');
                }

                setProfile(response.data);

                // Load reviews for this freelancer
                try {
                    const reviewsRes = await api.get(`/reviews?userId=${id}`);
                    console.log('Reviews loaded:', reviewsRes.data);
                    setReviews(reviewsRes.data || []);
                } catch (error) {
                    console.error('Error loading reviews:', error);
                    // Don't fail the whole page if reviews fail
                    setReviews([]);
                }
            } catch (error: any) {
                console.error('Error loading profile:', error);
                const errorMessage = error.response?.data?.error
                    || error.message
                    || `Failed to load profile. Status: ${error.response?.status || 'Unknown'}`;
                setError(errorMessage);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [id]);

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
                <h2>Profile Not Found</h2>
                <p style={{ color: '#dc3545', marginBottom: '1rem' }}>
                    {error || 'The profile you are looking for does not exist.'}
                </p>
                {id && (
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '1rem',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        color: '#666'
                    }}>
                        <strong>Debug Info:</strong> Attempting to load profile for ID: {id}
                        <br />
                        <strong>API Endpoint:</strong> /api/users/{id}
                    </div>
                )}
                <Link to="/search" style={{ color: '#007bff', textDecoration: 'none' }}>
                    ← Back to Search
                </Link>
            </div>
        );
    }

    const profileData = profile.profile || {};
    const averageRating = profileData.rating || 0;
    const skills = profileData.skills || [];
    const portfolio = profileData.portfolio || [];

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '2rem auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '2rem',
                borderRadius: '8px',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>
                        {profile.firstName} {profile.lastName}
                    </h1>
                    {profileData.location && (
                        <p style={{ margin: 0, color: '#666' }}>
                            📍 {profileData.location}
                        </p>
                    )}
                    {averageRating > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                ⭐ {averageRating.toFixed(1)}
                            </span>
                            <span style={{ color: '#666', marginLeft: '0.5rem' }}>
                                ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                            </span>
                        </div>
                    )}
                </div>
                <Link
                    to="/search"
                    style={{
                        color: '#007bff',
                        textDecoration: 'none',
                        padding: '0.5rem 1rem',
                        border: '1px solid #007bff',
                        borderRadius: '4px'
                    }}
                >
                    ← Back
                </Link>
            </div>

            {/* Bio Section */}
            {profileData.bio && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>About</h2>
                    <p style={{ lineHeight: '1.6', color: '#333' }}>{profileData.bio}</p>
                </div>
            )}

            {/* Skills Section */}
            {skills.length > 0 && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Skills</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {skills.map((skill, index) => (
                            <span
                                key={index}
                                style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Experience Section */}
            {profileData.experience && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Experience</h2>
                    <p style={{ lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' }}>
                        {profileData.experience}
                    </p>
                </div>
            )}

            {/* Portfolio Section */}
            {portfolio.length > 0 && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Portfolio</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {portfolio.map((link, index) => (
                            <a
                                key={index}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#007bff',
                                    textDecoration: 'none',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    display: 'block'
                                }}
                            >
                                🔗 {link}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Message Button - Only show if logged in and not viewing own profile */}
            {currentUser && currentUser._id !== id && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Contact</h3>
                    <button
                        onClick={() => navigate(`/messages/${id}`)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        💬 Send Message
                    </button>
                </div>
            )}

            {/* Reviews Section */}
            {reviews.length > 0 && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>
                        Reviews ({reviews.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {reviews.map((review) => (
                            <div
                                key={review._id}
                                style={{
                                    padding: '1rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold' }}>
                                        {'⭐'.repeat(review.rating)} {review.rating}/5
                                    </span>
                                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {review.comment && (
                                    <p style={{ margin: 0, color: '#333' }}>{review.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Contact Section */}
            <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#666' }}>
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
};

export default ViewProfile;
