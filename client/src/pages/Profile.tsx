// Profile page - Freelancer can create and update their profile
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// Helper function to get file URL (works for both local and production)
const getFileUrl = (filePath: string): string => {
    if (!filePath) return '';
    // If it's already a full URL, return it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }
    // Otherwise, construct URL based on API base URL
    const baseURL = api.defaults.baseURL || 'http://localhost:4000/api';
    // Remove /api from baseURL to get server root
    const serverRoot = baseURL.replace('/api', '');
    return `${serverRoot}${filePath}`;
};

interface ProfileData {
    bio: string;
    skills: string[];
    experience: string;
    portfolio: string[];
    resume?: string;
    location: string;
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    const [formData, setFormData] = useState<ProfileData>({
        bio: '',
        skills: [],
        experience: '',
        portfolio: [],
        resume: '',
        location: '',
    });

    const [newSkill, setNewSkill] = useState('');
    const [newPortfolioLink, setNewPortfolioLink] = useState('');
    const [reviews, setReviews] = useState<any[]>([]);
    const [overallRating, setOverallRating] = useState<number>(0);
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            alert('Please log in to view your profile');
            navigate('/');
            return;
        }

        const currentUser = JSON.parse(userStr);
        setUser(currentUser);
        loadProfile(currentUser);
        loadReviews(currentUser);
    }, [navigate]);

    const loadProfile = async (currentUser: any) => {
        try {
            setLoading(true);
            const response = await api.get('/profile/me', {
                headers: { 'x-user-email': currentUser.email }
            });

            const userData = response.data;
            console.log('Loaded profile data from server:', userData);
            if (userData?.profile) {
                const loadedData = {
                    bio: userData.profile.bio || '',
                    skills: Array.isArray(userData.profile.skills) ? userData.profile.skills : [],
                    experience: userData.profile.experience || '',
                    portfolio: Array.isArray(userData.profile.portfolio) ? userData.profile.portfolio : [],
                    resume: userData.profile.resume || '',
                    location: userData.profile.location || '',
                };
                console.log('Setting formData to:', loadedData);
                console.log('Skills count:', loadedData.skills.length);
                console.log('Portfolio count:', loadedData.portfolio.length);
                console.log('Skills array:', loadedData.skills);
                console.log('Portfolio array:', loadedData.portfolio);

                // Only update formData if we're not currently editing and user hasn't made changes
                // This prevents overwriting user's unsaved changes
                setFormData(prev => {
                    // If user is editing, preserve their changes unless server has different data
                    if (isEditing) {
                        console.log('User is editing - preserving formData state');
                        return prev;
                    }
                    return loadedData;
                });
            } else {
                console.log('No profile data found in userData');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async (currentUser: any) => {
        try {
            const reviewsRes = await api.get(`/reviews?userId=${currentUser._id}`);
            const reviewsData = reviewsRes.data || [];
            setReviews(reviewsData);

            // Calculate overall rating
            if (reviewsData.length > 0) {
                const totalRating = reviewsData.reduce((sum: number, review: any) => sum + review.rating, 0);
                const avgRating = totalRating / reviewsData.length;
                setOverallRating(avgRating);
            } else {
                setOverallRating(0);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            setReviews([]);
        }
    };

    const renderStars = (rating: number) => {
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
                <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.9rem', fontWeight: '600' }}>
                    {rating.toFixed(1)}
                </span>
            </div>
        );
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData(prev => {
                const updated = {
                    ...prev,
                    skills: [...prev.skills, newSkill.trim()]
                };
                console.log('Skill added. Updated formData.skills:', updated.skills);
                return updated;
            });
            setNewSkill('');
        }
    };

    const removeSkill = (skill: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skill)
        }));
    };

    const addPortfolioLink = () => {
        if (newPortfolioLink.trim() && !formData.portfolio.includes(newPortfolioLink.trim())) {
            setFormData(prev => {
                const updated = {
                    ...prev,
                    portfolio: [...prev.portfolio, newPortfolioLink.trim()]
                };
                console.log('Portfolio link added. Updated formData.portfolio:', updated.portfolio);
                return updated;
            });
            setNewPortfolioLink('');
        }
    };

    const removePortfolioLink = (link: string) => {
        setFormData(prev => ({
            ...prev,
            portfolio: prev.portfolio.filter(l => l !== link)
        }));
    };

    // Handle resume file upload
    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type (PDF, DOC, DOCX)
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PDF, DOC, or DOCX file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setUploadingResume(true);
        setError(null);

        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) throw new Error('Please log in');

            const currentUser = JSON.parse(userStr);
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            // Upload file
            const uploadResponse = await api.post('/upload', uploadFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-user-email': currentUser.email
                }
            });

            const filePath = uploadResponse.data.path;

            // Update profile with resume path
            const updatedProfile = {
                ...formData,
                resume: filePath
            };
            setFormData(updatedProfile);

            // Save profile immediately
            await api.post('/profile', {
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                userType: currentUser.userType,
                profile: updatedProfile
            }, {
                headers: { 'x-user-email': currentUser.email }
            });

            alert('Resume uploaded successfully!');

            // If not editing, switch to view mode to show the uploaded resume
            if (!isEditing) {
                // Update formData immediately so it shows in view mode
                setFormData(updatedProfile);
            }
        } catch (error: any) {
            console.error('Error uploading resume:', error);
            setError(error.response?.data?.error || 'Failed to upload resume');
        } finally {
            setUploadingResume(false);
        }
    };

    // Handle portfolio file upload
    const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setUploadingPortfolio(true);
        setError(null);

        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) throw new Error('Please log in');

            const currentUser = JSON.parse(userStr);
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            // Upload file
            const uploadResponse = await api.post('/upload', uploadFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-user-email': currentUser.email
                }
            });

            const filePath = uploadResponse.data.path;

            // Add to portfolio array
            const updatedProfile = {
                ...formData,
                portfolio: [...formData.portfolio, filePath]
            };
            setFormData(updatedProfile);

            // Save profile immediately
            await api.post('/profile', {
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                userType: currentUser.userType,
                profile: updatedProfile
            }, {
                headers: { 'x-user-email': currentUser.email }
            });

            alert('Portfolio file uploaded successfully!');

            // If not editing, switch to view mode to show the uploaded file
            if (!isEditing) {
                // Update formData immediately so it shows in view mode
                setFormData(updatedProfile);
            }
        } catch (error: any) {
            console.error('Error uploading portfolio file:', error);
            setError(error.response?.data?.error || 'Failed to upload portfolio file');
        } finally {
            setUploadingPortfolio(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                throw new Error('Please log in');
            }

            const currentUser = JSON.parse(userStr);

            // Debug: Log what we're about to send
            console.log('About to save profile with formData:', formData);
            console.log('Skills being saved:', formData.skills);
            console.log('Portfolio being saved:', formData.portfolio);
            console.log('formData.skills type:', typeof formData.skills);
            console.log('formData.skills is array:', Array.isArray(formData.skills));

            // Ensure arrays are properly formatted
            const profileToSave = {
                ...formData,
                skills: Array.isArray(formData.skills) ? formData.skills : [],
                portfolio: Array.isArray(formData.portfolio) ? formData.portfolio : []
            };

            console.log('Final profile to save:', profileToSave);

            // Update profile
            await api.post('/profile', {
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                userType: currentUser.userType,
                profile: profileToSave
            }, {
                headers: { 'x-user-email': currentUser.email }
            });

            alert('Profile updated successfully!');

            // Update localStorage user data immediately
            const updatedUserData = { ...currentUser, profile: profileToSave };
            localStorage.setItem('user', JSON.stringify(updatedUserData));

            // Update formData immediately with what we just saved (don't wait for server reload)
            setFormData(profileToSave);

            // Close edit mode to show view mode
            setIsEditing(false);

            // Reload profile data from server to ensure we have the latest (but don't overwrite if it fails)
            try {
                await loadProfile(currentUser);
            } catch (err) {
                console.error('Failed to reload profile, but changes are already saved:', err);
                // Keep the local formData we just set
            }

            // Debug: Log what was saved
            console.log('Profile saved:', profileToSave);
            console.log('Skills:', profileToSave.skills);
            console.log('Portfolio:', profileToSave.portfolio);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setError(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Loading profile...</p>
            </div>
        );
    }

    // Check if profile has any data
    const hasProfileData = formData.bio || formData.skills.length > 0 || formData.experience ||
        formData.portfolio.length > 0 || formData.location || formData.resume;

    // Check if we should show view mode (has any data OR has uploaded files)
    const shouldShowViewMode = hasProfileData || (formData.resume || formData.portfolio.length > 0);

    // Debug: Log current state
    console.log('Profile state:', {
        isEditing,
        hasProfileData,
        skillsCount: formData.skills.length,
        portfolioCount: formData.portfolio.length,
        hasBio: !!formData.bio
    });

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>My Profile</h1>
                {!isEditing && hasProfileData && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '500'
                        }}
                    >
                        ✏️ Edit Profile
                    </button>
                )}
                {isEditing && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false);
                            // Reload original data if cancelled
                            loadProfile(user);
                        }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '500'
                        }}
                    >
                        Cancel Editing
                    </button>
                )}
            </div>

            {error && (
                <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '1rem',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            {/* View Mode */}
            {!isEditing && shouldShowViewMode && (
                <div style={{
                    padding: '2rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '2rem',
                    border: '1px solid #e4e5e7'
                }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#333' }}>Bio</h3>
                        <p style={{ color: '#666', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                            {formData.bio || 'No bio provided'}
                        </p>
                    </div>

                    {formData.location && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#333' }}>Location</h3>
                            <p style={{ color: '#666', margin: 0 }}>📍 {formData.location}</p>
                        </div>
                    )}

                    {formData.skills.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#333' }}>Skills</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {formData.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        style={{
                                            backgroundColor: '#e7f3ff',
                                            color: '#007bff',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '20px',
                                            fontSize: '0.875rem',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.experience && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#333' }}>Experience</h3>
                            <p style={{ color: '#666', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {formData.experience}
                            </p>
                        </div>
                    )}

                    {formData.resume && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#333' }}>Resume</h3>
                            <a
                                href={getFileUrl(formData.resume)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#007bff',
                                    textDecoration: 'none',
                                    fontSize: '0.9375rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                📄 View Resume
                            </a>
                        </div>
                    )}

                    {formData.portfolio.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#333' }}>Portfolio</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {formData.portfolio.map((link, index) => {
                                    // Check if it's a URL or a file path
                                    const isUrl = link.startsWith('http://') || link.startsWith('https://');
                                    const displayUrl = isUrl ? link : getFileUrl(link);

                                    return (
                                        <a
                                            key={index}
                                            href={displayUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: '#007bff',
                                                textDecoration: 'none',
                                                fontSize: '0.9375rem',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {isUrl ? '🔗' : '📎'} {isUrl ? link : 'Portfolio File'}
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Mode or Empty State */}
            {(isEditing || !hasProfileData) && (
                <form onSubmit={handleSubmit}>
                    {/* Bio */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="bio" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Bio *
                        </label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows={5}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                            placeholder="Tell clients about yourself, your background, and what you do..."
                            required={!hasProfileData}
                        />
                    </div>

                    {/* Location */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="location" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Location
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                            placeholder="e.g., New York, USA"
                        />
                    </div>

                    {/* Skills */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Skills
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                                type="text"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addSkill();
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                                placeholder="Add a skill (e.g., React, Node.js)"
                            />
                            <button
                                type="button"
                                onClick={addSkill}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Add
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {formData.skills.map((skill, index) => (
                                <span
                                    key={index}
                                    style={{
                                        backgroundColor: '#e9ecef',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#dc3545',
                                            fontSize: '1.2rem',
                                            padding: 0,
                                            lineHeight: 1
                                        }}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Experience */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="experience" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Experience
                        </label>
                        <textarea
                            id="experience"
                            name="experience"
                            value={formData.experience}
                            onChange={handleInputChange}
                            rows={6}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                            placeholder="Describe your work experience, projects you've completed, and your expertise..."
                        />
                    </div>

                    {/* Resume Upload */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Resume (PDF, DOC, DOCX - Max 5MB)
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeUpload}
                            disabled={uploadingResume}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                        />
                        {uploadingResume && (
                            <p style={{ marginTop: '0.5rem', color: '#007bff', fontSize: '0.875rem' }}>
                                Uploading resume...
                            </p>
                        )}
                        {formData.resume && !uploadingResume && (
                            <p style={{ marginTop: '0.5rem', color: '#28a745', fontSize: '0.875rem' }}>
                                ✓ Resume uploaded: <a href={getFileUrl(formData.resume)} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>View</a>
                            </p>
                        )}
                    </div>

                    {/* Portfolio Links */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Portfolio Links (URLs)
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                                type="url"
                                value={newPortfolioLink}
                                onChange={(e) => setNewPortfolioLink(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addPortfolioLink();
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                                placeholder="Add portfolio link (e.g., https://yourportfolio.com)"
                            />
                            <button
                                type="button"
                                onClick={addPortfolioLink}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Add
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {formData.portfolio.map((link, index) => (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: '#f8f9fa',
                                        padding: '0.75rem',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <a
                                        href={link.startsWith('http') ? link : getFileUrl(link)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#007bff', textDecoration: 'none' }}
                                    >
                                        {link.startsWith('http') ? link : 'Portfolio File'}
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => removePortfolioLink(link)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#dc3545',
                                            fontSize: '1.2rem',
                                            padding: '0 0.5rem'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Portfolio File Upload */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Upload Portfolio Files (Max 10MB)
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                            onChange={handlePortfolioUpload}
                            disabled={uploadingPortfolio}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem'
                            }}
                        />
                        {uploadingPortfolio && (
                            <p style={{ marginTop: '0.5rem', color: '#007bff', fontSize: '0.875rem' }}>
                                Uploading portfolio file...
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexDirection: 'column' }}>
                        <div style={{
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffc107',
                            borderRadius: '4px',
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            <strong>💡 Tip:</strong> After filling in your information, click "{hasProfileData ? 'Save Profile' : 'Create Profile'}" below to save your changes. Your profile will then be visible in view mode.
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '0.75rem 2rem',
                                    backgroundColor: saving ? '#6c757d' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '500'
                                }}
                            >
                                {saving ? (hasProfileData ? 'Saving...' : 'Creating...') : (hasProfileData ? 'Save Profile' : 'Create Profile')}
                            </button>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        loadProfile(user);
                                    }}
                                    style={{
                                        padding: '0.75rem 2rem',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    style={{
                                        padding: '0.75rem 2rem',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '1rem'
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            )}

            {/* Show message if profile is empty and not editing */}
            {!isEditing && !hasProfileData && (
                <div style={{
                    padding: '2rem',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    marginBottom: '2rem',
                    textAlign: 'center'
                }}>
                    <p style={{ margin: 0, color: '#856404' }}>
                        Your profile is empty. Click "Create Profile" to get started!
                    </p>
                </div>
            )}

            {/* Reviews & Ratings Section */}
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e4e5e7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0 }}>Reviews & Ratings</h2>
                    {overallRating > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#333' }}>
                                    {overallRating.toFixed(1)}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                            <div>
                                {renderStars(overallRating)}
                            </div>
                        </div>
                    )}
                </div>

                {reviews.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                    }}>
                        <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
                            No reviews yet. Complete projects to receive reviews from clients!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Rating Distribution */}
                        <div style={{
                            padding: '1.5rem',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
                                Rating Breakdown
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[5, 4, 3, 2, 1].map((stars) => {
                                    const count = reviews.filter((r: any) => r.rating === stars).length;
                                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                    return (
                                        <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ minWidth: '3rem', fontSize: '0.875rem', color: '#666' }}>
                                                {stars} ★
                                            </div>
                                            <div style={{ flex: 1, height: '0.5rem', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div
                                                    style={{
                                                        height: '100%',
                                                        width: `${percentage}%`,
                                                        backgroundColor: percentage > 0 ? '#ffc107' : 'transparent',
                                                        transition: 'width 0.3s ease'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ minWidth: '3rem', fontSize: '0.875rem', color: '#666', textAlign: 'right' }}>
                                                {count}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Reviews List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {reviews.map((review) => (
                                <div
                                    key={review._id}
                                    style={{
                                        padding: '1.5rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        backgroundColor: '#fff',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div>
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                {renderStars(review.rating)}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <p style={{
                                            margin: 0,
                                            color: '#333',
                                            fontSize: '0.9375rem',
                                            lineHeight: '1.6'
                                        }}>
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Profile;
