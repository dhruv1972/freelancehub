// My Projects page - Freelancer dashboard showing ongoing projects
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Project {
    _id: string;
    title: string;
    description: string;
    category: string;
    budget: number;
    timeline: string;
    status: 'open' | 'in-progress' | 'completed';
    requirements: string[];
    clientId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

const MyProjects: React.FC = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check if user is logged in
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            alert('Please log in to view your projects');
            navigate('/');
            return;
        }

        const currentUser = JSON.parse(userStr);
        setUser(currentUser);

        // Only freelancers can view ongoing projects
        if (currentUser.userType !== 'freelancer') {
            alert('This page is only for freelancers');
            navigate('/');
            return;
        }

        loadProjects(currentUser);
    }, [navigate, filter]);

    const loadProjects = async (currentUser: any) => {
        try {
            setLoading(true);
            const statusParam = filter === 'all' ? '' : `?status=${filter}`;
            const response = await api.get(`/projects/my${statusParam}`, {
                headers: { 'x-user-email': currentUser.email }
            });
            console.log('Projects loaded:', response.data);
            setProjects(response.data || []);
        } catch (error: any) {
            console.error('Error loading projects:', error);
            alert('Failed to load projects: ' + (error.response?.data?.error || error.message));
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p => {
        if (filter === 'all') return true;
        return p.status === filter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'in-progress': return '#007bff';
            case 'completed': return '#28a745';
            case 'open': return '#ffc107';
            default: return '#6c757d';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'in-progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'open': return 'Open';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Loading your projects...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '2rem auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>My Projects</h1>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>
                        Manage your active and completed projects
                    </p>
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
                {(['all', 'in-progress', 'completed'] as const).map((status) => (
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
                        {status === 'all' ? 'All Projects' : status === 'in-progress' ? 'Active' : 'Completed'}
                        {status !== 'all' && (
                            <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>
                                ({projects.filter(p => p.status === status).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Projects List */}
            {filteredProjects.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                }}>
                    <h3>No {filter === 'all' ? '' : filter} projects found</h3>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>
                        {filter === 'all'
                            ? "You don't have any active projects yet. Start by applying to projects!"
                            : filter === 'in-progress'
                                ? "You don't have any active projects at the moment."
                                : "You haven't completed any projects yet."
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
                    {filteredProjects.map((project) => (
                        <div
                            key={project._id}
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
                                            to={`/project/${project._id}`}
                                            style={{
                                                color: '#007bff',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            {project.title}
                                        </Link>
                                    </h3>
                                    <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                        {project.description.length > 150
                                            ? `${project.description.substring(0, 150)}...`
                                            : project.description
                                        }
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: '#666', flexWrap: 'wrap' }}>
                                        <span><strong>Budget:</strong> ${project.budget}</span>
                                        <span><strong>Timeline:</strong> {project.timeline}</span>
                                        <span><strong>Category:</strong> {project.category}</span>
                                        <span><strong>Client:</strong> {project.clientId.firstName} {project.clientId.lastName}</span>
                                    </div>
                                </div>
                                <div style={{ marginLeft: '1rem' }}>
                                    <span
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '20px',
                                            backgroundColor: getStatusColor(project.status),
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            display: 'inline-block'
                                        }}
                                    >
                                        {getStatusText(project.status)}
                                    </span>
                                </div>
                            </div>

                            {/* Requirements */}
                            {project.requirements && project.requirements.length > 0 && (
                                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#333' }}>Requirements:</strong>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {project.requirements.map((req, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    backgroundColor: '#e7f3ff',
                                                    color: '#007bff',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {req}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{
                                marginTop: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ fontSize: '0.85rem', color: '#999' }}>
                                    {project.status === 'in-progress' ? (
                                        <span>Started: {new Date(project.updatedAt).toLocaleDateString()}</span>
                                    ) : (
                                        <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Link
                                        to={`/project/${project._id}`}
                                        style={{
                                            color: '#007bff',
                                            textDecoration: 'none',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            padding: '0.5rem 1rem',
                                            border: '1px solid #007bff',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        View Project →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary Stats */}
            {projects.length > 0 && (
                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'around',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ textAlign: 'center', flex: 1, minWidth: '150px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                            {projects.length}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Total Projects</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1, minWidth: '150px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
                            {projects.filter(p => p.status === 'in-progress').length}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Active</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1, minWidth: '150px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                            {projects.filter(p => p.status === 'completed').length}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Completed</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1, minWidth: '150px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                            ${projects.filter(p => p.status === 'in-progress').reduce((sum, p) => sum + p.budget, 0)}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>Active Budget</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProjects;

