import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface ProjectFormData {
    title: string;
    description: string;
    category: string;
    budget: number;
    timeline: string;
    requirements: string[];
}

const CreateProject: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<ProjectFormData>({
        title: '',
        description: '',
        category: '',
        budget: 0,
        timeline: '',
        requirements: ['']
    });

    const categories = [
        'Web Development',
        'Mobile Development',
        'Design',
        'Writing',
        'Marketing',
        'Data Science',
        'AI/ML',
        'Other'
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'budget' ? Number(value) : value
        }));
    };

    const handleRequirementChange = (index: number, value: string) => {
        const newRequirements = [...formData.requirements];
        newRequirements[index] = value;
        setFormData(prev => ({
            ...prev,
            requirements: newRequirements
        }));
    };

    const addRequirement = () => {
        setFormData(prev => ({
            ...prev,
            requirements: [...prev.requirements, '']
        }));
    };

    const removeRequirement = (index: number) => {
        if (formData.requirements.length > 1) {
            const newRequirements = formData.requirements.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                requirements: newRequirements
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Get user from localStorage
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                throw new Error('Please log in to create a project');
            }

            const user = JSON.parse(userStr);

            // Filter out empty requirements
            const filteredRequirements = formData.requirements.filter(req => req.trim() !== '');

            const projectData = {
                ...formData,
                requirements: filteredRequirements
            };

            // Create project with user email header for authentication
            const response = await api.post('/projects', projectData, {
                headers: {
                    'x-user-email': user.email
                }
            });

            console.log('Project created:', response.data);
            alert('Project created successfully!');
            navigate('/search'); // Redirect to search page to see the new project

        } catch (error: any) {
            console.error('Error creating project:', error);
            setError(error.response?.data?.error || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
            <div className="create-project-header">
                <h1>Create New Project</h1>
                <p>Post your project and find the perfect freelancer to bring your ideas to life.</p>
            </div>

            <form onSubmit={handleSubmit} className="project-form">
                <div className="form-group">
                    <label htmlFor="title">Project Title *</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Build a React e-commerce website"
                        required
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Project Description *</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your project in detail. What do you need? What are your goals? What should the freelancer know?"
                        required
                        rows={6}
                        className="form-textarea"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="category">Category *</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="form-select"
                        >
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="budget">Budget ($) *</label>
                        <input
                            type="number"
                            id="budget"
                            name="budget"
                            value={formData.budget}
                            onChange={handleInputChange}
                            placeholder="1000"
                            min="1"
                            required
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="timeline">Timeline *</label>
                    <select
                        id="timeline"
                        name="timeline"
                        value={formData.timeline}
                        onChange={handleInputChange}
                        required
                        className="form-select"
                    >
                        <option value="">Select timeline</option>
                        <option value="Less than 1 week">Less than 1 week</option>
                        <option value="1-2 weeks">1-2 weeks</option>
                        <option value="1 month">1 month</option>
                        <option value="1-3 months">1-3 months</option>
                        <option value="3+ months">3+ months</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Project Requirements</label>
                    {formData.requirements.map((req, index) => (
                        <div key={index} className="requirement-input">
                            <input
                                type="text"
                                value={req}
                                onChange={(e) => handleRequirementChange(index, e.target.value)}
                                placeholder={`Requirement ${index + 1}`}
                                className="form-input"
                            />
                            {formData.requirements.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeRequirement(index)}
                                    className="remove-btn"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addRequirement}
                        className="add-requirement-btn"
                    >
                        + Add Requirement
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/search')}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Creating Project...' : 'Create Project'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProject;
