// Basic admin page for managing users and projects.
// Week 4 scope - simple list views and basic actions.
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    userType: string;
    status?: string;
}

interface Project {
    _id: string;
    title: string;
    description: string;
    budget: number;
    status: string;
    category?: string;
}

const Admin: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'projects'>('projects');
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Check if current user has admin access
    const hasUserAccess = currentUser?.email === 'chavda.dhruv@gmail.com';

    // Load data on mount
    useEffect(() => {
        // Get current user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }

        loadProjects();
        if (hasUserAccess) {
            loadUsers();
        }
    }, [hasUserAccess]);

    // Subtle auto-refresh when page is active (like professional websites)
    useEffect(() => {
        if (!currentUser) return;

        const interval = setInterval(() => {
            // Only refresh if page is visible and user is logged in
            if (!document.hidden) {
                loadProjects();
                if (hasUserAccess) {
                    loadUsers();
                }
            }
        }, 30000); // Every 30 seconds when page is active

        return () => clearInterval(interval);
    }, [hasUserAccess, currentUser]);

    const loadUsers = async () => {
        if (!currentUser) return; // Don't load if not logged in

        try {
            const response = await api.get('/admin/users');
            console.log('Loaded users:', response.data);
            // Hide suspended users from the list
            const activeUsers = (response.data || []).filter((u: any) => u.status !== 'suspended');
            console.log('Active users after filter:', activeUsers);
            setUsers(activeUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadProjects = async () => {
        if (!currentUser) return; // Don't load if not logged in

        try {
            const response = await api.get('/admin/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const suspendUser = async (userId: string) => {
        if (!confirm('Are you sure you want to suspend this user?')) return;

        try {
            await api.post(`/admin/users/${userId}/suspend`);
            alert('User suspended successfully');
            // Reload users to reflect the change
            loadUsers();
        } catch (error) {
            console.error('Error suspending user:', error);
            alert('Failed to suspend user');
        }
    };

    // Show login message if not logged in
    if (!currentUser) {
        return (
            <div className="container">
                <h1>Admin Dashboard</h1>
                <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '2rem',
                    textAlign: 'center',
                    marginTop: '2rem'
                }}>
                    <h3>Please Log In</h3>
                    <p>You need to be logged in to access the admin dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Admin Dashboard</h1>
            {!hasUserAccess && (
                <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '1rem',
                    marginBottom: '1rem'
                }}>
                    <p style={{ margin: 0, color: '#6c757d' }}>
                        <strong>Note:</strong> You can view projects. User management is restricted to authorized administrators only.
                    </p>
                </div>
            )}

            {/* Tab Navigation */}
            <div style={{ marginBottom: '2rem' }}>
                {hasUserAccess && (
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '0.5rem 1rem',
                            marginRight: '0.5rem',
                            backgroundColor: activeTab === 'users' ? '#007bff' : '#f8f9fa',
                            color: activeTab === 'users' ? 'white' : 'black',
                            border: '1px solid #ccc',
                            cursor: 'pointer',
                        }}
                    >
                        Users ({users.length})
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('projects')}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: activeTab === 'projects' ? '#007bff' : '#f8f9fa',
                        color: activeTab === 'projects' ? 'white' : 'black',
                        border: '1px solid #ccc',
                        cursor: 'pointer',
                    }}
                >
                    Projects ({projects.length})
                </button>
            </div>

            {/* Users Tab - Only for specific admin email */}
            {activeTab === 'users' && hasUserAccess && (
                <div>
                    <h2>Users Management</h2>
                    {users.length === 0 ? (
                        <p>No users found.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ccc', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ccc', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ccc', textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ccc', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ccc', textAlign: 'left' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{user.email}</td>
                                        <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>
                                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'N/A'}
                                        </td>
                                        <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{user.userType}</td>
                                        <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '3px',
                                                backgroundColor: user.status === 'suspended' ? '#dc3545' : '#28a745',
                                                color: 'white',
                                                fontSize: '0.8rem',
                                            }}>
                                                {user.status || 'active'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>
                                            {user.status !== 'suspended' && (
                                                <button
                                                    onClick={() => suspendUser(user._id)}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                    }}
                                                >
                                                    Suspend
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Access denied message for users without admin access */}
            {activeTab === 'users' && !hasUserAccess && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h2>Access Restricted</h2>
                    <p>You don't have permission to view user management.</p>
                    <p>Only authorized administrators can access this section.</p>
                </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div>
                    <h2>Projects Management</h2>
                    {projects.length === 0 ? (
                        <p>No projects found.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ccc', textAlign: 'left' }}>Title</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ccc', textAlign: 'left' }}>Category</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ccc', textAlign: 'left' }}>Budget</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ccc', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '0.5rem', border: '1px solid #ccc', textAlign: 'left' }}>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project) => (
                                    <tr key={project._id}>
                                        <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{project.title}</td>
                                        <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{project.category || 'N/A'}</td>
                                        <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>${project.budget}</td>
                                        <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '3px',
                                                backgroundColor:
                                                    project.status === 'completed' ? '#28a745' :
                                                        project.status === 'in-progress' ? '#ffc107' : '#007bff',
                                                color: project.status === 'in-progress' ? 'black' : 'white',
                                                fontSize: '0.8rem',
                                            }}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.5rem', border: '1px solid #ccc', maxWidth: '300px' }}>
                                            {project.description.length > 100
                                                ? `${project.description.substring(0, 100)}...`
                                                : project.description}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default Admin;
