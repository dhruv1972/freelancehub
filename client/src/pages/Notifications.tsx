// Notifications page component (Week 5)
import React, { useState, useEffect } from 'react';
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
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, []);

    const fetchNotifications = async () => {
        try {
            setError(null);
            const response = await api.get('/notifications', {
                headers: { 'x-user-email': 'test@example.com' }
            });
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            setError('Failed to load notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications/unread-count', {
                headers: { 'x-user-email': 'test@example.com' }
            });
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            setActionLoading(notificationId);
            await api.patch(`/notifications/${notificationId}/read`, {}, {
                headers: { 'x-user-email': 'test@example.com' }
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
            setError('Failed to mark notification as read. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all', {}, {
                headers: { 'x-user-email': 'test@example.com' }
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Notifications {unreadCount > 0 && <span style={{ color: '#dc3545' }}>({unreadCount} unread)</span>}</h2>
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
            </div>

            {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
                    <h3>No notifications yet</h3>
                    <p>You'll see notifications here when you receive proposals, payments, messages, and other updates.</p>
                </div>
            ) : (
                <div>
                    {notifications.map((notification) => (
                        <div
                            key={notification._id}
                            onClick={() => !notification.isRead && markAsRead(notification._id)}
                            style={{
                                padding: '1rem',
                                marginBottom: '1rem',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                backgroundColor: notification.isRead ? '#f8f9fa' : '#fff3cd',
                                cursor: notification.isRead ? 'default' : 'pointer',
                                borderLeft: notification.isRead ? '4px solid #28a745' : '4px solid #ffc107'
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
                                    <small style={{ color: '#999' }}>
                                        {formatDate(notification.createdAt)}
                                    </small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
                <h4>Demo Notifications</h4>
                <p>In a real application, notifications would be automatically created when:</p>
                <ul>
                    <li>Someone submits a proposal to your project</li>
                    <li>Your proposal gets accepted or rejected</li>
                    <li>You receive a payment</li>
                    <li>A project is completed</li>
                    <li>You receive a new message</li>
                    <li>Admin sends system notices</li>
                </ul>
            </div>
        </div>
    );
};

export default Notifications;
