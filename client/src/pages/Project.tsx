// Project page with timer, payment, and review functionality.
// Week 4 scope - basic freelancer project management features.
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import PaymentModal from '../components/PaymentModal';

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
  selectedFreelancer?: string | { _id: string; firstName?: string; lastName?: string };
}

// Timer display component to show elapsed time
const TimerDisplay: React.FC<{ startTime: string }> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState<string>('0:00:00');

  useEffect(() => {
    const updateElapsed = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000); // Difference in seconds

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setElapsed(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745', fontFamily: 'monospace' }}>
      {elapsed}
    </span>
  );
};

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
  const [user, setUser] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalData, setProposalData] = useState({
    coverLetter: '',
    proposedBudget: '',
    timeline: '',
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  // Load project, time entries, and proposals on mount
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

        // Load real project details (selectedFreelancer is populated by backend)
        const projectRes = await api.get(`/projects/${id}`);
        setProject(projectRes.data);

        // Load time entries for this project
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const currentUser = JSON.parse(userStr);
          const timeRes = await api.get(`/time?projectId=${id}`, {
            headers: { 'x-user-email': currentUser.email }
          });
          setTimeEntries(timeRes.data);

          // Check if there's an active timer (no endTime)
          const active = timeRes.data.find((entry: TimeEntry) => !entry.endTime);
          setActiveTimer(active || null);
        }

        // Load proposals if user is a client
        if (user?.userType === 'client') {
          try {
            const proposalsRes = await api.get(`/projects/${id}/proposals`);
            console.log('Proposals loaded:', proposalsRes.data);
            setProposals(proposalsRes.data || []);
          } catch (error) {
            console.error('Error loading proposals:', error);
            setProposals([]);
          }
        }
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
  }, [id, user]);

  // Submit proposal
  const submitProposal = async () => {
    if (!proposalData.coverLetter.trim() || !proposalData.proposedBudget || !proposalData.timeline.trim()) {
      alert('Please fill in all proposal fields');
      return;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Please log in to submit a proposal');
      return;
    }

    setSubmittingProposal(true);
    try {
      const currentUser = JSON.parse(userStr);
      await api.post(`/projects/${id}/proposals`, {
        coverLetter: proposalData.coverLetter,
        proposedBudget: parseFloat(proposalData.proposedBudget),
        timeline: proposalData.timeline,
      }, {
        headers: { 'x-user-email': currentUser.email }
      });
      alert('Proposal submitted successfully!');
      setProposalData({ coverLetter: '', proposedBudget: '', timeline: '' });
      setShowProposalForm(false);
    } catch (error: any) {
      console.error('Error submitting proposal:', error);
      alert(error.response?.data?.error || 'Failed to submit proposal');
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Start timer
  const startTimer = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Please log in to track time');
      return;
    }

    if (!timerDescription.trim()) {
      alert('Please enter a description for what you are working on');
      return;
    }

    try {
      const currentUser = JSON.parse(userStr);

      // Check if there's already an active timer
      if (activeTimer) {
        alert('A timer is already running. Please stop it before starting a new one.');
        return;
      }

      const response = await api.post('/time/start', {
        projectId: id,
        description: timerDescription.trim(),
      }, {
        headers: { 'x-user-email': currentUser.email }
      });

      setActiveTimer(response.data);
      setTimerDescription('');

      // Refresh time entries
      const timeRes = await api.get(`/time?projectId=${id}`, {
        headers: { 'x-user-email': currentUser.email }
      });
      setTimeEntries(timeRes.data);
    } catch (error: any) {
      console.error('Error starting timer:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to start timer';
      alert(`Failed to start timer: ${errorMessage}`);
    }
  };

  // Stop timer
  const stopTimer = async () => {
    if (!activeTimer) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert('Please log in to stop timer');
      return;
    }

    try {
      const currentUser = JSON.parse(userStr);
      const response = await api.post('/time/stop', {
        timeEntryId: activeTimer._id,
      }, {
        headers: { 'x-user-email': currentUser.email }
      });

      // Calculate and show duration from actual times
      if (response.data.endTime && response.data.startTime) {
        const totalSeconds = Math.floor((new Date(response.data.endTime).getTime() - new Date(response.data.startTime).getTime()) / 1000);
        const duration = formatDurationFromSeconds(totalSeconds);
        alert(`Timer stopped. Total time: ${duration}`);
      } else if (response.data.durationMinutes) {
        const duration = formatDuration(response.data.durationMinutes);
        alert(`Timer stopped. Total time: ${duration}`);
      }

      setActiveTimer(null);

      // Wait a brief moment to ensure backend has saved the duration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Refresh time entries
      const timeRes = await api.get(`/time?projectId=${id}`, {
        headers: { 'x-user-email': currentUser.email }
      });

      console.log('Time entries after stop:', timeRes.data);
      setTimeEntries(timeRes.data);
    } catch (error: any) {
      console.error('Error stopping timer:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to stop timer';
      alert(`Failed to stop timer: ${errorMessage}`);
    }
  };

  // Open payment modal
  const handlePaymentClick = () => {
    setShowPaymentModal(true);
  };

  // Update project status (mark as completed)
  const updateProjectStatus = async () => {
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;

    if (!id || !currentUser) {
      alert('Please log in to update project status');
      return;
    }

    const confirmUpdate = window.confirm('Are you sure you want to mark this project as completed? This action cannot be undone.');
    if (!confirmUpdate) return;

    try {
      await api.patch(`/projects/${id}`, {
        status: 'completed'
      }, {
        headers: { 'x-user-email': currentUser.email }
      });
      alert('Project marked as completed! The client has been notified.');
      // Reload project data
      const projectRes = await api.get(`/projects/${id}`);
      setProject(projectRes.data);
    } catch (error: any) {
      console.error('Error updating project status:', error);
      alert(error.response?.data?.error || 'Failed to update project status');
    }
  };

  // Submit review
  const submitReview = async () => {
    if (!id || !reviewData.comment.trim()) {
      alert('Please fill in all review fields');
      return;
    }

    try {
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;

      await api.post('/reviews', {
        projectId: id,
        ...reviewData,
      }, {
        headers: { 'x-user-email': currentUser?.email || DEMO_USER }
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

  // Format duration with seconds (from total seconds)
  const formatDurationFromSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Format duration from minutes (kept for backward compatibility)
  const formatDuration = (minutes: number) => {
    const totalSeconds = Math.floor(minutes * 60);
    return formatDurationFromSeconds(totalSeconds);
  };

  if (!project) {
    return <div className="container">Loading project...</div>;
  }

  // Check if user is freelancer and project is open
  const isFreelancer = user?.userType === 'freelancer';
  const isClient = user?.userType === 'client';
  const canSubmitProposal = isFreelancer && project.status === 'open';

  // Check if freelancer is working on this project (has been selected)
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isWorkingOnProject = isFreelancer &&
    project.status === 'in-progress' &&
    project.selectedFreelancer &&
    (typeof project.selectedFreelancer === 'string'
      ? project.selectedFreelancer === currentUser?._id
      : project.selectedFreelancer._id === currentUser?._id);

  return (
    <div className="container">
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      <p><strong>Budget:</strong> ${project.budget}</p>
      <p><strong>Status:</strong> {project.status}</p>

      {/* Proposal Submission Section (Freelancer) */}
      {canSubmitProposal && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
          <h2>Submit Proposal</h2>
          {!showProposalForm ? (
            <button
              onClick={() => setShowProposalForm(true)}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Apply for This Project
            </button>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submitProposal(); }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Cover Letter *
                </label>
                <textarea
                  value={proposalData.coverLetter}
                  onChange={(e) => setProposalData({ ...proposalData, coverLetter: e.target.value })}
                  rows={5}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="Explain why you're the right fit for this project..."
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Proposed Budget ($) *
                </label>
                <input
                  type="number"
                  value={proposalData.proposedBudget}
                  onChange={(e) => setProposalData({ ...proposalData, proposedBudget: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter your proposed budget"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Timeline *
                </label>
                <input
                  type="text"
                  value={proposalData.timeline}
                  onChange={(e) => setProposalData({ ...proposalData, timeline: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="e.g., 2 weeks, 1 month"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={submittingProposal}
                  style={{
                    backgroundColor: submittingProposal ? '#6c757d' : '#007bff',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: submittingProposal ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {submittingProposal ? 'Submitting...' : 'Submit Proposal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProposalForm(false);
                    setProposalData({ coverLetter: '', proposedBudget: '', timeline: '' });
                  }}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Proposals List Section (Client) */}
      {isClient && project.status === 'open' && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Proposals ({proposals.length})</h2>
          {proposals.length === 0 ? (
            <p>No proposals yet. Freelancers can submit proposals by viewing this project.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {proposals.map((proposal) => (
                <div
                  key={proposal._id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <div>
                      <strong>Proposed Budget: ${proposal.proposedBudget}</strong>
                      {(() => {
                        // Handle both populated object and raw ID
                        const freelancerId = typeof proposal.freelancerId === 'object'
                          ? proposal.freelancerId?._id
                          : proposal.freelancerId;
                        return freelancerId ? (
                          <div style={{ marginTop: '0.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <Link
                              to={`/freelancer/${freelancerId}`}
                              style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }}
                            >
                              View Freelancer Profile →
                            </Link>
                            <Link
                              to={`/messages/${freelancerId}?projectId=${id}`}
                              style={{ color: '#28a745', textDecoration: 'none', fontSize: '0.9rem' }}
                            >
                              💬 Message Freelancer
                            </Link>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      backgroundColor:
                        proposal.status === 'accepted' ? '#28a745' :
                          proposal.status === 'rejected' ? '#dc3545' : '#ffc107',
                      color: proposal.status === 'pending' ? 'black' : 'white',
                      fontSize: '0.85rem'
                    }}>
                      {proposal.status}
                    </span>
                  </div>
                  <p><strong>Timeline:</strong> {proposal.timeline}</p>
                  <p><strong>Cover Letter:</strong></p>
                  <p style={{ marginTop: '0.5rem', color: '#666' }}>{proposal.coverLetter}</p>
                  {proposal.status === 'pending' && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={async () => {
                          try {
                            await api.post(`/proposals/${proposal._id}/accept`);
                            alert('Proposal accepted! Project status updated.');
                            window.location.reload();
                          } catch (error) {
                            console.error('Error accepting proposal:', error);
                            alert('Failed to accept proposal');
                          }
                        }}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await api.post(`/proposals/${proposal._id}/reject`);
                            alert('Proposal rejected.');
                            window.location.reload();
                          } catch (error) {
                            console.error('Error rejecting proposal:', error);
                            alert('Failed to reject proposal');
                          }
                        }}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Project Status Update Section (Freelancer) */}
      {isWorkingOnProject && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
          <h2>Project Status</h2>
          <div style={{ marginBottom: '1rem' }}>
            <p><strong>Current Status:</strong>
              <span style={{
                padding: '0.25rem 0.75rem',
                marginLeft: '0.5rem',
                borderRadius: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                {project.status}
              </span>
            </p>
          </div>
          {project.status === 'in-progress' && (
            <div>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                When you finish all the work for this project, you can mark it as completed. The client will be notified automatically.
              </p>
              <button
                onClick={updateProjectStatus}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Mark Project as Completed
              </button>
            </div>
          )}
          {project.status === 'completed' && (
            <p style={{ color: '#28a745', fontWeight: '500' }}>
              ✓ This project has been marked as completed.
            </p>
          )}
        </div>
      )}

      {/* Timer Section - Only visible to freelancers working on the project */}
      {(isFreelancer && (project.status === 'in-progress' || project.status === 'completed')) && (
        <div className="timer-section" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #e4e5e7', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>⏱️ Time Tracking</h2>

          {activeTimer ? (
            <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '4px', marginBottom: '1rem', border: '2px solid #28a745' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#28a745' }}>⏳ Timer Running</p>
                <TimerDisplay startTime={activeTimer.startTime} />
              </div>
              <p style={{ margin: '0.5rem 0', color: '#666' }}>
                <strong>Started:</strong> {new Date(activeTimer.startTime).toLocaleString()}
              </p>
              {activeTimer.description && (
                <p style={{ margin: '0.5rem 0', color: '#666' }}>
                  <strong>Description:</strong> {activeTimer.description}
                </p>
              )}
              <button
                onClick={stopTimer}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  marginTop: '0.5rem'
                }}
              >
                ⏹️ Stop Timer
              </button>
            </div>
          ) : (
            <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '4px', marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                What are you working on?
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <input
                  type="text"
                  placeholder="e.g., Implementing login feature, Fixing bugs..."
                  value={timerDescription}
                  onChange={(e) => setTimerDescription(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && timerDescription.trim()) {
                      startTimer();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
                <button
                  onClick={startTimer}
                  disabled={!timerDescription.trim()}
                  style={{
                    backgroundColor: timerDescription.trim() ? '#28a745' : '#6c757d',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: timerDescription.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  ▶️ Start Timer
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Time Entries History</h3>
            {timeEntries.length === 0 ? (
              <p style={{ color: '#666', padding: '1rem', backgroundColor: 'white', borderRadius: '4px', textAlign: 'center' }}>
                No time entries yet. Start tracking your time to see entries here.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {timeEntries.map((entry) => (
                  <div
                    key={entry._id}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      border: '1px solid #e4e5e7',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: '500', color: '#333' }}>
                        {entry.description || 'No description'}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
                        {new Date(entry.startTime).toLocaleString()}
                        {entry.endTime && ` - ${new Date(entry.endTime).toLocaleString()}`}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {entry.endTime ? (
                        // Calculate duration from actual startTime and endTime to preserve seconds
                        <span style={{
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          color: '#007bff',
                          fontFamily: 'monospace'
                        }}>
                          {(() => {
                            const start = new Date(entry.startTime).getTime();
                            const end = new Date(entry.endTime).getTime();
                            const totalSeconds = Math.floor((end - start) / 1000);

                            // Debug log to verify calculation
                            console.log('Time entry calculation:', {
                              startTime: entry.startTime,
                              endTime: entry.endTime,
                              start,
                              end,
                              diffMs: end - start,
                              totalSeconds,
                              durationMinutes: entry.durationMinutes
                            });

                            return formatDurationFromSeconds(totalSeconds);
                          })()}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          color: '#28a745',
                          fontFamily: 'monospace'
                        }}>
                          Running...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Section (Client only) */}
      {isClient && project.status !== 'open' && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
          <h2 style={{ marginTop: 0 }}>Make Payment</h2>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ marginBottom: '0.5rem', color: '#666' }}>
              <strong>Project Budget:</strong> ${project.budget}
            </p>
            {project.selectedFreelancer && (
              <p style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                Pay to the freelancer working on this project
              </p>
            )}
          </div>
          <button
            onClick={handlePaymentClick}
            style={{
              backgroundColor: '#14a800',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#108e00';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#14a800';
            }}
          >
            💳 Pay ${project.budget}
          </button>
        </div>
      )}

      {/* Payment Modal */}
      {isClient && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          projectTitle={project.title}
          amount={project.budget}
          projectId={project._id}
          freelancerName={
            project.selectedFreelancer && typeof project.selectedFreelancer === 'object'
              ? `${project.selectedFreelancer.firstName || ''} ${project.selectedFreelancer.lastName || ''}`
              : undefined
          }
        />
      )}

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
