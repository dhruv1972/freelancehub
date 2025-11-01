// My Proposals page - Freelancer dashboard to view all submitted proposals
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Proposal {
    _id: string;
    projectId: {
        _id: string;
        title: string;
        description: string;
        budget: number;
        status: string;
        category?: string;
    };
    coverLetter: string;
    proposedBudget: number;
    timeline: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

const MyProposals: React.FC = () => {
    const navigate = useNavigate();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
    useEffect(() => {
        // Check if user is logged in
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            alert('Please log in to view your proposals');
            navigate('/');
            return;
        }

        const currentUser = JSON.parse(userStr);

        // Only freelancers can view proposals
        if (currentUser.userType !== 'freelancer') {
            alert('This page is only for freelancers');
            navigate('/');
            return;
        }

        loadProposals(currentUser);
    }, [navigate]);

    const loadProposals = async (currentUser: any) => {
        try {
            setLoading(true);
            const response = await api.get('/proposals/my', {
                headers: { 'x-user-email': currentUser.email }
            });
            console.log('Proposals loaded:', response.data);
            setProposals(response.data || []);
        } catch (error: any) {
            console.error('Error loading proposals:', error);
            alert('Failed to load proposals: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const filteredProposals = proposals.filter(p => {
        if (filter === 'all') return true;
        return p.status === filter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted': return '#28a745';
            case 'rejected': return '#dc3545';
            case 'pending': return '#ffc107';
            default: return '#6c757d';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'accepted': return 'Accepted';
            case 'rejected': return 'Rejected';
            case 'pending': return 'Pending';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Loading your proposals...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>My Proposals</h1>
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
                    Find New Projects →
                </Link>
            </div>

            {/* Filter Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                borderBottom: '2px solid #eee',
                paddingBottom: '1rem'
            }}>
                {(['all', 'pending', 'accepted', 'rejected'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: filter === status ? '#007bff' : 'transparent',
                            color: filter === status ? 'white' : '#007bff',
                            border: '1px solid #007bff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            fontWeight: filter === status ? '600' : '400'
                        }}
                    >
                        {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                        {status !== 'all' && (
                            <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>
                                ({proposals.filter(p => p.status === status).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Proposals List */}
            {filteredProposals.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                }}>
                    <h3>No {filter === 'all' ? '' : filter} proposals found</h3>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>
                        {filter === 'all'
                            ? 'Start submitting proposals to projects to see them here.'
                            : `You don't have any ${filter} proposals yet.`
                        }
                    </p>
                    {filter === 'all' && (
                        <Link
                            to="/search"
                            style={{
                                display: 'inline-block',
                                marginTop: '1rem',
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#007bff',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px'
                            }}
                        >
                            Browse Projects
                        </Link>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredProposals.map((proposal) => (
                        <div
                            key={proposal._id}
                            style={{
                                padding: '1.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                backgroundColor: '#fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                                        <Link
                                            to={`/project/${proposal.projectId._id}`}
                                            style={{
                                                color: '#007bff',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            {proposal.projectId.title}
                                        </Link>
                                    </h3>
                                    <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                        {proposal.projectId.description.length > 150
                                            ? `${proposal.projectId.description.substring(0, 150)}...`
                                            : proposal.projectId.description
                                        }
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                                        <span><strong>Project Budget:</strong> ${proposal.projectId.budget}</span>
                                        <span><strong>Your Proposal:</strong> ${proposal.proposedBudget}</span>
                                        <span><strong>Timeline:</strong> {proposal.timeline}</span>
                                        {proposal.projectId.category && (
                                            <span><strong>Category:</strong> {proposal.projectId.category}</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ marginLeft: '1rem' }}>
                                    <span
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '20px',
                                            backgroundColor: getStatusColor(proposal.status),
                                            color: proposal.status === 'pending' ? 'black' : 'white',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            display: 'inline-block'
                                        }}
                                    >
                                        {getStatusText(proposal.status)}
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px'
                            }}>
                                <strong>Cover Letter:</strong>
                                <p style={{ margin: '0.5rem 0 0 0', color: '#333' }}>
                                    {proposal.coverLetter}
                                </p>
                            </div>

                            <div style={{
                                marginTop: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <small style={{ color: '#999' }}>
                                    Submitted on {new Date(proposal.createdAt).toLocaleDateString()} at {new Date(proposal.createdAt).toLocaleTimeString()}
                                </small>
                                <Link
                                    to={`/project/${proposal.projectId._id}`}
                                    style={{
                                        color: '#007bff',
                                        textDecoration: 'none',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    View Project →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary Stats */}
            {proposals.length > 0 && (
                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-around',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                            {proposals.length}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Total Proposals</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                            {proposals.filter(p => p.status === 'pending').length}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Pending</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                            {proposals.filter(p => p.status === 'accepted').length}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Accepted</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>
                            {proposals.filter(p => p.status === 'rejected').length}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Rejected</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProposals;
