// Project page with timer, payment, and review functionality.
// Week 4 scope - basic freelancer project management features.
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

// Demo user for development
const DEMO_USER = 'freelancer@demo.com';

interface TimeEntry {
    _id: string;
    startTime: string;
    endTime?: string;
    description?: string;
    durationMinutes?: number;
}

interface Project {
    _id: string;
    title: string;
    description: string;
    budget: number;
    status: string;
}

const Project: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [timerDescription, setTimerDescription] = useState('');
    const [reviewData, setReviewData] = useState({
        rating: 5,
        comment: '',
        revieweeId: '',
        reviewType: 'freelancer-to-client' as const,
    });

  // Load project and time entries on mount
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        // For demo purposes, if id is "sample", use mock data
        if (id === 'sample') {
          setProject({
            _id: 'sample',
            title: 'Sample Project - Website Redesign',
            description: 'Redesign the company website with modern UI/UX principles. Include responsive design and accessibility features.',
            budget: 2500,
            status: 'in-progress'
          });
          return;
        }
        
        // Load real project details
        const projectRes = await api.get(`/projects/${id}`);
        setProject(projectRes.data);

        // Load time entries for this project
        const timeRes = await api.get(`/time?projectId=${id}`);
        setTimeEntries(timeRes.data);
        
        // Check if there's an active timer (no endTime)
        const active = timeRes.data.find((entry: TimeEntry) => !entry.endTime);
        setActiveTimer(active || null);
      } catch (error) {
        console.error('Error loading project data:', error);
        // For demo, show a fallback project if API fails
        if (id === 'sample') {
          setProject({
            _id: 'sample',
            title: 'Demo Project',
            description: 'This is a demo project for testing the FreelanceHub features.',
            budget: 1000,
            status: 'in-progress'
          });
        }
      }
    };

    loadData();
  }, [id]);

  // Start timer
  const startTimer = async () => {
    try {
      const response = await api.post('/time/start', {
        projectId: id,
        description: timerDescription,
      }, {
        headers: { 'x-user-email': DEMO_USER }
      });
      setActiveTimer(response.data);
      setTimerDescription('');
      // Refresh time entries
      const timeRes = await api.get(`/time?projectId=${id}`, {
        headers: { 'x-user-email': DEMO_USER }
      });
      setTimeEntries(timeRes.data);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  // Stop timer
  const stopTimer = async () => {
    if (!activeTimer) return;
    
    try {
      await api.post('/time/stop', {
        timeEntryId: activeTimer._id,
      }, {
        headers: { 'x-user-email': DEMO_USER }
      });
      setActiveTimer(null);
      // Refresh time entries
      const timeRes = await api.get(`/time?projectId=${id}`, {
        headers: { 'x-user-email': DEMO_USER }
      });
      setTimeEntries(timeRes.data);
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

    // Create payment intent (simple test)
    const handlePayment = async () => {
        if (!project) return;

        try {
            const response = await api.post('/payments/intent', {
                amount: project.budget,
                description: `Payment for ${project.title}`,
            });
            alert(`Payment intent created! Client secret: ${response.data.client_secret}`);
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Payment failed');
        }
    };

  // Submit review
  const submitReview = async () => {
    if (!id || !reviewData.comment.trim()) {
      alert('Please fill in all review fields');
      return;
    }

    try {
      await api.post('/reviews', {
        projectId: id,
        ...reviewData,
      }, {
        headers: { 'x-user-email': DEMO_USER }
      });
      alert('Review submitted successfully!');
      setReviewData({
        rating: 5,
        comment: '',
        revieweeId: '',
        reviewType: 'freelancer-to-client',
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

    // Format duration
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    if (!project) {
        return <div className="container">Loading project...</div>;
    }

    return (
        <div className="container">
            <h1>{project.title}</h1>
            <p>{project.description}</p>
            <p><strong>Budget:</strong> ${project.budget}</p>
            <p><strong>Status:</strong> {project.status}</p>

            {/* Timer Section */}
            <div className="timer-section" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
                <h2>Time Tracking</h2>

                {activeTimer ? (
                    <div>
                        <p><strong>Timer Running</strong></p>
                        <p>Started: {new Date(activeTimer.startTime).toLocaleString()}</p>
                        <p>Description: {activeTimer.description || 'No description'}</p>
                        <button onClick={stopTimer} style={{ backgroundColor: '#dc3545', color: 'white', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer' }}>
                            Stop Timer
                        </button>
                    </div>
                ) : (
                    <div>
                        <input
                            type="text"
                            placeholder="What are you working on?"
                            value={timerDescription}
                            onChange={(e) => setTimerDescription(e.target.value)}
                            style={{ width: '300px', padding: '0.5rem', marginRight: '0.5rem' }}
                        />
                        <button onClick={startTimer} style={{ backgroundColor: '#28a745', color: 'white', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer' }}>
                            Start Timer
                        </button>
                    </div>
                )}

                <h3>Time Entries</h3>
                {timeEntries.length === 0 ? (
                    <p>No time entries yet.</p>
                ) : (
                    <ul>
                        {timeEntries.map((entry) => (
                            <li key={entry._id}>
                                {new Date(entry.startTime).toLocaleDateString()} -
                                {entry.description || 'No description'} -
                                {entry.durationMinutes ? formatDuration(entry.durationMinutes) : 'Running...'}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Payment Section */}
            <div className="payment-section" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
                <h2>Payment</h2>
                <p>Project Budget: ${project.budget}</p>
                <button onClick={handlePayment} style={{ backgroundColor: '#007bff', color: 'white', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer' }}>
                    Create Payment Intent (Test)
                </button>
            </div>

            {/* Review Section */}
            <div className="review-section" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
                <h2>Submit Review</h2>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Rating: </label>
                    <select
                        value={reviewData.rating}
                        onChange={(e) => setReviewData({ ...reviewData, rating: parseInt(e.target.value) })}
                        style={{ padding: '0.25rem' }}
                    >
                        {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Reviewee ID: </label>
                    <input
                        type="text"
                        placeholder="User ID to review"
                        value={reviewData.revieweeId}
                        onChange={(e) => setReviewData({ ...reviewData, revieweeId: e.target.value })}
                        style={{ padding: '0.5rem', width: '300px' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Review Type: </label>
                    <select
                        value={reviewData.reviewType}
                        onChange={(e) => setReviewData({ ...reviewData, reviewType: e.target.value as any })}
                        style={{ padding: '0.25rem' }}
                    >
                        <option value="freelancer-to-client">Freelancer to Client</option>
                        <option value="client-to-freelancer">Client to Freelancer</option>
                    </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Comment: </label><br />
                    <textarea
                        value={reviewData.comment}
                        onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                        rows={4}
                        cols={50}
                        placeholder="Write your review..."
                        style={{ padding: '0.5rem' }}
                    />
                </div>

                <button onClick={submitReview} style={{ backgroundColor: '#ffc107', color: 'black', padding: '0.5rem 1rem', border: 'none', cursor: 'pointer' }}>
                    Submit Review
                </button>
            </div>
        </div>
    );
};

export default Project;
