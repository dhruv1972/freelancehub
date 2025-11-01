// Search Freelancers page - For clients to find and hire freelancers
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Freelancer {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
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

interface SearchFilters {
    q: string;
    skills: string;
    location: string;
    minRating: string;
}

const SearchFreelancers: React.FC = () => {
    const navigate = useNavigate();
    const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        q: '',
        skills: '',
        location: '',
        minRating: ''
    });
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check if user is logged in
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            alert('Please log in to search for freelancers');
            navigate('/');
            return;
        }

        const currentUser = JSON.parse(userStr);
        setUser(currentUser);

        // Load all freelancers on mount (with empty filters)
        const loadInitial = async () => {
            try {
                setLoading(true);
                const response = await api.get('/freelancers');
                setFreelancers(response.data || []);
            } catch (error: any) {
                console.error('Error loading freelancers:', error);
                setFreelancers([]);
            } finally {
                setLoading(false);
            }
        };
        loadInitial();
    }, [navigate]);

    const searchFreelancers = async () => {
        try {
            setLoading(true);

            // Build query parameters
            const params = new URLSearchParams();
            if (filters.q) params.append('q', filters.q);
            if (filters.skills) params.append('skills', filters.skills);
            if (filters.location) params.append('location', filters.location);
            if (filters.minRating) params.append('minRating', filters.minRating);

            const queryString = params.toString();
            const url = queryString ? `/freelancers?${queryString}` : '/freelancers';

            const response = await api.get(url);
            console.log('Freelancers loaded:', response.data);
            setFreelancers(response.data || []);
        } catch (error: any) {
            console.error('Error searching freelancers:', error);
            alert('Failed to search freelancers: ' + (error.response?.data?.error || error.message));
            setFreelancers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: keyof SearchFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchFreelancers();
    };

    const handleClearFilters = () => {
        setFilters({
            q: '',
            skills: '',
            location: '',
            minRating: ''
        });
        // Search will be triggered by useEffect when filters change
    };

    // Trigger search when filters change (debounced)
    useEffect(() => {
        // Skip if this is the initial mount (handled by first useEffect)
        if (!user) return;

        const timer = setTimeout(() => {
            searchFreelancers();
        }, 500);

        return () => clearTimeout(timer);
    }, [filters.q, filters.skills, filters.location, filters.minRating, user]);

    const renderStars = (rating: number = 0) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {Array.from({ length: fullStars }).map((_, i) => (
                    <span key={i} style={{ color: '#ffc107', fontSize: '1.2rem' }}>★</span>
                ))}
                {hasHalfStar && (
                    <span style={{ color: '#ffc107', fontSize: '1.2rem' }}>☆</span>
                )}
                {Array.from({ length: emptyStars }).map((_, i) => (
                    <span key={i} style={{ color: '#ddd', fontSize: '1.2rem' }}>★</span>
                ))}
                <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                    {rating.toFixed(1)}
                </span>
            </div>
        );
    };

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '2rem auto', padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1>Search Freelancers</h1>
                <p style={{ color: '#666', marginTop: '0.5rem' }}>
                    Find talented freelancers for your projects
                </p>
            </div>

            {/* Search Filters */}
            <div style={{
                padding: '1.5rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '2rem'
            }}>
                <form onSubmit={handleSearch}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1rem'
                    }}>
                        {/* Search Query */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Name, bio, experience..."
                                value={filters.q}
                                onChange={(e) => handleFilterChange('q', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {/* Skills Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                                Skills (comma-separated)
                            </label>
                            <input
                                type="text"
                                placeholder="React, Node.js, Design..."
                                value={filters.skills}
                                onChange={(e) => handleFilterChange('skills', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {/* Location Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                                Location
                            </label>
                            <input
                                type="text"
                                placeholder="City, Country..."
                                value={filters.location}
                                onChange={(e) => handleFilterChange('location', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {/* Minimum Rating Filter */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
                                Minimum Rating
                            </label>
                            <select
                                value={filters.minRating}
                                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="">All Ratings</option>
                                <option value="4.5">4.5+ Stars</option>
                                <option value="4">4+ Stars</option>
                                <option value="3.5">3.5+ Stars</option>
                                <option value="3">3+ Stars</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 2rem',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            style={{
                                padding: '0.75rem 2rem',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                </form>
            </div>

            {/* Results */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>Searching freelancers...</p>
                </div>
            ) : freelancers.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                }}>
                    <h3>No freelancers found</h3>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>
                        Try adjusting your search filters to find more results.
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: '1rem', color: '#666' }}>
                        Found {freelancers.length} freelancer{freelancers.length !== 1 ? 's' : ''}
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {freelancers.map((freelancer) => (
                            <div
                                key={freelancer._id}
                                style={{
                                    padding: '1.5rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                                onClick={() => navigate(`/freelancer/${freelancer._id}`)}
                            >
                                {/* Header */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                                        {freelancer.firstName} {freelancer.lastName}
                                    </h3>
                                    {freelancer.profile?.rating !== undefined && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            {renderStars(freelancer.profile.rating)}
                                        </div>
                                    )}
                                    {freelancer.profile?.location && (
                                        <div style={{ color: '#666', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span>📍</span>
                                            <span>{freelancer.profile.location}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Bio */}
                                {freelancer.profile?.bio && (
                                    <p style={{
                                        color: '#666',
                                        fontSize: '0.9rem',
                                        marginBottom: '1rem',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {freelancer.profile.bio}
                                    </p>
                                )}

                                {/* Skills */}
                                {freelancer.profile?.skills && freelancer.profile.skills.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '0.5rem'
                                        }}>
                                            {freelancer.profile.skills.slice(0, 5).map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    style={{
                                                        padding: '0.25rem 0.75rem',
                                                        backgroundColor: '#e7f3ff',
                                                        color: '#007bff',
                                                        borderRadius: '20px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {freelancer.profile.skills.length > 5 && (
                                                <span style={{ color: '#666', fontSize: '0.85rem' }}>
                                                    +{freelancer.profile.skills.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Experience */}
                                {freelancer.profile?.experience && (
                                    <div style={{
                                        marginBottom: '1rem',
                                        padding: '0.75rem',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem',
                                        color: '#666'
                                    }}>
                                        <strong>Experience:</strong> {freelancer.profile.experience}
                                    </div>
                                )}

                                {/* Action */}
                                <Link
                                    to={`/freelancer/${freelancer._id}`}
                                    style={{
                                        display: 'block',
                                        textAlign: 'center',
                                        padding: '0.75rem',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '4px',
                                        fontWeight: '500',
                                        marginTop: '1rem'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View Profile →
                                </Link>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default SearchFreelancers;

