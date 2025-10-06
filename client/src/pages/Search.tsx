// Advanced search page component (Week 5)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface Project {
    _id: string;
    title: string;
    description: string;
    category: string;
    budget: number;
    timeline: string;
    status: string;
    requirements: string[];
    clientId: {
        firstName: string;
        lastName: string;
    };
    createdAt: string;
}

interface SearchFilters {
    q: string;
    category: string;
    minBudget: string;
    maxBudget: string;
    status: string;
    skills: string;
    sortBy: string;
    sortOrder: string;
}

const Search: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const [filters, setFilters] = useState<SearchFilters>({
        q: '',
        category: 'all',
        minBudget: '',
        maxBudget: '',
        status: 'all',
        skills: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    const categories = [
        'all',
        'Web Development',
        'Mobile Development',
        'Design',
        'Writing',
        'Marketing',
        'Data Science',
        'Other'
    ];

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'open', label: 'Open' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' }
    ];

    const sortOptions = [
        { value: 'createdAt', label: 'Date Created' },
        { value: 'budget', label: 'Budget' },
        { value: 'title', label: 'Title' }
    ];

    useEffect(() => {
        searchProjects();
    }, [filters, pagination.page]);

    const searchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();

            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all') {
                    params.append(key, value);
                }
            });

            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());

            const response = await api.get(`/projects?${params.toString()}`);
            setProjects(response.data.projects || []);
            setPagination(prev => ({
                ...prev,
                ...response.data.pagination
            }));
        } catch (error) {
            console.error('Failed to search projects:', error);
            setError('Failed to search projects. Please try again.');
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: keyof SearchFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const clearFilters = () => {
        setFilters({
            q: '',
            category: 'all',
            minBudget: '',
            maxBudget: '',
            status: 'all',
            skills: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatBudget = (budget: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(budget);
    };

    return (
        <div style={{
            padding: window.innerWidth <= 768 ? '1rem' : '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <h2>Search Projects</h2>

            {/* Error Message */}
            {error && (
                <div style={{
                    color: '#dc3545',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    padding: '1rem',
                    borderRadius: '4px',
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc3545',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Search Filters */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
                padding: '1.5rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #ddd'
            }}>
                {/* Text Search */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Search Text:
                    </label>
                    <input
                        type="text"
                        value={filters.q}
                        onChange={(e) => handleFilterChange('q', e.target.value)}
                        placeholder="Search projects..."
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                </div>

                {/* Category */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Category:
                    </label>
                    <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Budget Range */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Min Budget:
                    </label>
                    <input
                        type="number"
                        value={filters.minBudget}
                        onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                        placeholder="$0"
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Max Budget:
                    </label>
                    <input
                        type="number"
                        value={filters.maxBudget}
                        onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                        placeholder="No limit"
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                </div>

                {/* Status */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Status:
                    </label>
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Skills */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Skills:
                    </label>
                    <input
                        type="text"
                        value={filters.skills}
                        onChange={(e) => handleFilterChange('skills', e.target.value)}
                        placeholder="React, Node.js, etc."
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                </div>

                {/* Sort */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Sort By:
                    </label>
                    <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    >
                        {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Order:
                    </label>
                    <select
                        value={filters.sortOrder}
                        onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>

                {/* Clear Filters Button */}
                <div style={{ display: 'flex', alignItems: 'end' }}>
                    <button
                        onClick={clearFilters}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Results */}
            <div style={{ marginBottom: '2rem' }}>
                <h3>
                    Search Results
                    {pagination.total > 0 && (
                        <span style={{ color: '#666', fontSize: '1rem', fontWeight: 'normal' }}>
                            ({pagination.total} projects found)
                        </span>
                    )}
                </h3>

                {loading ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '3rem',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #007bff',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '1rem'
                        }}></div>
                        <p style={{ color: '#666' }}>Searching projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        <h4>No projects found</h4>
                        <p>Try adjusting your search filters or clearing them to see more results.</p>
                    </div>
                ) : (
                    <div>
                        {projects.map((project) => (
                            <div
                                key={project._id}
                                style={{
                                    padding: '1.5rem',
                                    marginBottom: '1rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0' }}>
                                            <Link
                                                to={`/project/${project._id}`}
                                                style={{ color: '#007bff', textDecoration: 'none' }}
                                            >
                                                {project.title}
                                            </Link>
                                        </h4>
                                        <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                                            by {project.clientId.firstName} {project.clientId.lastName} • {formatDate(project.createdAt)}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>
                                            {formatBudget(project.budget)}
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '12px',
                                            backgroundColor: project.status === 'open' ? '#d4edda' : '#f8d7da',
                                            color: project.status === 'open' ? '#155724' : '#721c24',
                                            marginTop: '0.5rem'
                                        }}>
                                            {project.status}
                                        </div>
                                    </div>
                                </div>

                                <p style={{ margin: '0 0 1rem 0', color: '#333' }}>
                                    {project.description.length > 200
                                        ? project.description.substring(0, 200) + '...'
                                        : project.description
                                    }
                                </p>

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.9rem', color: '#666' }}>
                                    <span><strong>Category:</strong> {project.category}</span>
                                    <span><strong>Timeline:</strong> {project.timeline}</span>
                                    {project.requirements.length > 0 && (
                                        <span><strong>Skills:</strong> {project.requirements.slice(0, 3).join(', ')}</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.page === 1}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: pagination.page === 1 ? '#ccc' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Previous
                                </button>

                                <span style={{ padding: '0.5rem 1rem', alignSelf: 'center' }}>
                                    Page {pagination.page} of {pagination.pages}
                                </span>

                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                                    disabled={pagination.page === pagination.pages}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: pagination.page === pagination.pages ? '#ccc' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
