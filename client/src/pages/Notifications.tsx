// Notifications page component (Week 5)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
}

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [user, setUser] = useState<any>(null);
    // Removed explicit error banner; use gentle empty state instead

    useEffect(() => {
        // Get logged-in user from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        } else {
            setLoading(false);
            alert('Please log in to view notifications');
        }
    }, []);

    useEffect(() => {
        if (user?.email) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [user]);

    const fetchNotifications = async () => {
        if (!user?.email) {
            console.log('No user email, cannot fetch notifications');
            setLoading(false);
            return;
        }

        try {
            console.log('Fetching notifications for:', user.email);
            console.log('User ID:', user._id);
            const response = await api.get('/notifications', {
                headers: { 'x-user-email': user.email }
            });
            console.log('Notifications API response:', response);
            console.log('Notifications data:', response.data);
            console.log('Notifications data type:', typeof response.data);
            console.log('Notifications data length:', Array.isArray(response.data) ? response.data.length : 'not an array');

            // Ensure we handle both array and non-array responses
            const notifications = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
            console.log('Setting notifications:', notifications);

            // Debug: Check notification userIds
            if (notifications.length > 0) {
                console.log('Notification user IDs:', notifications.map((n: any) => n.userId));
                console.log('Current user ID:', user._id);
            }

            setNotifications(notifications);
        } catch (error: any) {
            console.error('Failed to fetch notifications:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        if (!user?.email) return;

        try {
            const response = await api.get('/notifications/unread-count', {
                headers: { 'x-user-email': user.email }
            });
            setUnreadCount(response.data?.count || 0);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if not already read
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        // Navigate to the action URL if available
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    const markAsRead = async (notificationId: string) => {
        if (!user?.email) return;

        try {
            await api.patch(`/notifications/${notificationId}/read`, {}, {
                headers: { 'x-user-email': user.email }
            });

            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId
                        ? { ...notif, isRead: true }
                        : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user?.email) return;

        try {
            await api.patch('/notifications/read-all', {}, {
                headers: { 'x-user-email': user.email }
            });

            // Update local state
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'proposal_received': return '📝';
            case 'proposal_accepted': return '✅';
            case 'proposal_rejected': return '❌';
            case 'payment_received': return '💰';
            case 'project_completed': return '🎉';
            case 'message_received': return '💬';
            case 'admin_notice': return '⚠️';
            default: return '🔔';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!user) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh',
                flexDirection: 'column'
            }}>
                <h2>Please Log In</h2>
                <p style={{ color: '#666' }}>You need to be logged in to view notifications.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh',
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
                <p style={{ color: '#666' }}>Loading notifications...</p>
            </div>
        );
    }

    return (
        <div style={{
            padding: window.innerWidth <= 768 ? '1rem' : '2rem',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            {/* Gentle info state instead of error */}
            {!loading && notifications.length === 0 && (
                <div style={{
                    color: '#555',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #eee',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    marginBottom: '1rem'
                }}>
                    No notifications found.
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Notifications {unreadCount > 0 && <span style={{ color: '#dc3545' }}>({unreadCount} unread)</span>}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Mark All as Read
                        </button>
                    )}
                    <button
                        onClick={async () => {
                            if (!user?.email) return;
                            try {
                                const response = await api.post('/notifications/test', {}, {
                                    headers: { 'x-user-email': user.email }
                                });
                                console.log('Test notification created:', response.data);
                                alert('Test notification created! Refresh the page to see it.');
                                fetchNotifications();
                                fetchUnreadCount();
                            } catch (error: any) {
                                console.error('Failed to create test notification:', error);
                                alert('Failed to create test notification: ' + (error.response?.data?.error || error.message));
                            }
                        }}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Create Test Notification
                    </button>
                </div>
            </div>

            {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
                    <h3>No notifications yet</h3>
                    <p>You'll see notifications here when you receive proposals, payments, messages, and other updates.</p>
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        textAlign: 'left',
                        maxWidth: '500px',
                        margin: '1rem auto'
                    }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>How to receive notifications:</p>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                            <li>As a client: Get notifications when freelancers submit proposals to YOUR projects</li>
                            <li>As a freelancer: Get notifications when YOUR proposals are accepted/rejected</li>
                            <li>Make sure you're logged in as the correct account</li>
                        </ul>
                    </div>
                </div>
            ) : (
                <div>
                    {notifications.map((notification) => (
                        <div
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            style={{
                                padding: '1rem',
                                marginBottom: '1rem',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                backgroundColor: notification.isRead ? '#f8f9fa' : '#fff3cd',
                                cursor: 'pointer',
                                borderLeft: notification.isRead ? '4px solid #28a745' : '4px solid #ffc107',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = notification.isRead ? '#e9ecef' : '#ffeaa7';
                                e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = notification.isRead ? '#f8f9fa' : '#fff3cd';
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{getNotificationIcon(notification.type)}</span>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                                        {notification.title}
                                        {!notification.isRead && <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>●</span>}
                                    </h4>
                                    <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                                        {notification.message}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <small style={{ color: '#999' }}>
                                            {formatDate(notification.createdAt)}
                                        </small>
                                        {notification.actionUrl && (
                                            <small style={{ color: '#007bff', fontStyle: 'italic' }}>
                                                Click to view →
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
