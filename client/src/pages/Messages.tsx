// Messages page - Chat interface with file sharing functionality
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

// Helper function to get file URL
const getFileUrl = (filePath: string): string => {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }
    const baseURL = api.defaults.baseURL || 'http://localhost:4000/api';
    const serverRoot = baseURL.replace('/api', '');
    return `${serverRoot}${filePath}`;
};

interface Message {
    _id: string;
    senderId: string | { _id: string; firstName: string; lastName: string; email: string };
    receiverId: string | { _id: string; firstName: string; lastName: string; email: string };
    content: string;
    attachments: string[];
    read: boolean;
    createdAt: string;
}

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

const Messages: React.FC = () => {
    const navigate = useNavigate();
    const { projectId: urlProjectId, userId } = useParams<{ projectId?: string; userId?: string }>();
    const [searchParams] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('projectId') || urlProjectId || undefined;
    });
    const projectId = searchParams;
    const [user, setUser] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messageContent, setMessageContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showNewChat, setShowNewChat] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            alert('Please log in to view messages');
            navigate('/');
            return;
        }

        const currentUser = JSON.parse(userStr);
        setUser(currentUser);

        const initMessages = async () => {
            if (userId) {
                const loadedUser = await loadUserProfile(userId);
                if (loadedUser) {
                    await loadMessages(currentUser._id, loadedUser._id, projectId);
                }
            }
            await loadConversations(currentUser);
            setLoading(false);
        };

        initMessages();
    }, [navigate, userId, projectId]);

    useEffect(() => {
        if (selectedUser && user && selectedUser._id !== user._id) {
            loadMessages(user._id, selectedUser._id, projectId);
        }
    }, [selectedUser, projectId, user]);

    useEffect(() => {
        // Auto-scroll to bottom when messages change
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadUserProfile = async (userId: string) => {
        try {
            const response = await api.get(`/users/${userId}`);
            const userProfile = response.data;
            setSelectedUser(userProfile);

            // If we have a selected user now, load messages
            if (user && userProfile) {
                await loadMessages(user._id, userProfile._id, projectId);
            }

            return userProfile;
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    };

    const loadConversations = async (currentUser: any) => {
        try {
            // Get all messages for current user to build conversation list
            const response = await api.get('/messages', {
                headers: { 'x-user-email': currentUser.email }
            });

            // Build unique list of conversation partners
            const partners = new Map<string, any>();
            response.data.forEach((msg: Message) => {
                const sender = typeof msg.senderId === 'object' ? msg.senderId : { _id: msg.senderId };
                const receiver = typeof msg.receiverId === 'object' ? msg.receiverId : { _id: msg.receiverId };

                if (sender._id !== currentUser._id) {
                    // Only add if it's a populated object, or fetch it
                    if (typeof msg.senderId === 'object' && msg.senderId.firstName) {
                        partners.set(sender._id, sender);
                    }
                }
                if (receiver._id !== currentUser._id) {
                    // Only add if it's a populated object
                    if (typeof msg.receiverId === 'object' && msg.receiverId.firstName) {
                        partners.set(receiver._id, receiver);
                    }
                }
            });

            // If userId is provided in URL, load that user's profile
            if (userId && !selectedUser) {
                try {
                    const userResponse = await api.get(`/users/${userId}`);
                    const partnerUser = userResponse.data;
                    partners.set(partnerUser._id, partnerUser);
                    setSelectedUser(partnerUser);
                } catch (e) {
                    console.error('Error loading user from URL:', e);
                }
            }

            setConversations(Array.from(partners.values()));
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const loadAvailableUsers = async (currentUser: any) => {
        try {
            setLoadingUsers(true);

            // Load freelancers if current user is a client, or load all users
            let response;
            if (currentUser.userType === 'client') {
                // Clients can message freelancers
                response = await api.get('/freelancers');
            } else {
                // For freelancers, we'll need to create an endpoint to get all users
                // For now, let's try to get freelancers or create a general endpoint
                // We can use the admin endpoint if available, or get freelancers
                try {
                    response = await api.get('/freelancers');
                } catch (e) {
                    // If that fails, we'll show an empty list
                    setAvailableUsers([]);
                    setLoadingUsers(false);
                    return;
                }
            }

            // Filter out current user and users already in conversations
            const conversationIds = new Set(conversations.map(c => c._id));
            const filtered = response.data.filter((u: any) =>
                u._id !== currentUser._id &&
                !conversationIds.has(u._id) &&
                u.status !== 'suspended'
            );

            setAvailableUsers(filtered);
        } catch (error) {
            console.error('Error loading available users:', error);
            setAvailableUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleStartNewChat = (userToMessage: any) => {
        setSelectedUser(userToMessage);
        setShowNewChat(false);
        setSearchQuery('');
        // Messages will load automatically via useEffect
    };

    const filteredAvailableUsers = availableUsers.filter((u: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        return (
            fullName.includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.profile?.bio?.toLowerCase().includes(query)
        );
    });

    const loadMessages = async (myId: string, otherUserId: string, projectId?: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ withUserId: otherUserId });
            if (projectId) params.append('projectId', projectId);

            const response = await api.get(`/messages?${params.toString()}`, {
                headers: { 'x-user-email': user.email }
            });

            // Messages should already be populated by backend, but handle if they're not
            const populatedMessages = response.data.map((msg: Message) => {
                // If sender/receiver are already populated objects, use them
                // Otherwise, they should have been populated by the backend
                if (typeof msg.senderId === 'string') {
                    console.warn('Sender not populated for message:', msg._id);
                }
                if (typeof msg.receiverId === 'string') {
                    console.warn('Receiver not populated for message:', msg._id);
                }
                return msg;
            });

            setMessages(populatedMessages);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const uploadFile = async (file: File): Promise<string | null> => {
        try {
            setUploadingFile(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-user-email': user.email
                }
            });

            return response.data.path;
        } catch (error: any) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file: ' + (error.response?.data?.error || error.message));
            return null;
        } finally {
            setUploadingFile(false);
        }
    };

    const sendMessage = async () => {
        if (!selectedUser || !messageContent.trim() && !selectedFile) {
            alert('Please enter a message or select a file');
            return;
        }

        if (!user) return;

        try {
            setSending(true);

            let attachments: string[] = [];

            // Upload file if selected
            if (selectedFile) {
                const filePath = await uploadFile(selectedFile);
                if (filePath) {
                    attachments = [filePath];
                }
                setSelectedFile(null);
                // Reset file input
                const fileInput = document.getElementById('file-input') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }

            const messageData: any = {
                receiverId: selectedUser._id,
                content: messageContent.trim(),
                attachments: attachments
            };

            if (projectId) {
                messageData.projectId = projectId;
            }

            await api.post('/messages', messageData, {
                headers: { 'x-user-email': user.email }
            });

            // Clear input and refresh messages
            setMessageContent('');

            // Reload messages
            if (selectedUser) {
                await loadMessages(user._id, selectedUser._id, projectId);
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + (error.response?.data?.error || error.message));
        } finally {
            setSending(false);
        }
    };

    const getSenderName = (message: Message) => {
        const sender = typeof message.senderId === 'object'
            ? message.senderId
            : null;
        return sender
            ? `${sender.firstName} ${sender.lastName}`.trim()
            : 'Unknown';
    };

    const isMyMessage = (message: Message) => {
        const sender = typeof message.senderId === 'object'
            ? message.senderId
            : { _id: message.senderId };
        return sender._id === user?._id;
    };

    if (loading && !messages.length) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Loading messages...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '2rem auto', padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                {/* Conversations List */}
                <div style={{
                    width: '300px',
                    border: '1px solid #e4e5e7',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa',
                    padding: '1rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0 }}>Conversations</h2>
                        <button
                            onClick={() => {
                                setShowNewChat(true);
                                loadAvailableUsers(user);
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}
                        >
                            + New
                        </button>
                    </div>

                    {showNewChat ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    marginBottom: '0.5rem'
                                }}
                            />
                            <button
                                onClick={() => {
                                    setShowNewChat(false);
                                    setSearchQuery('');
                                }}
                                style={{
                                    padding: '0.5rem',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    marginBottom: '0.5rem'
                                }}
                            >
                                ← Back to Conversations
                            </button>

                            {loadingUsers ? (
                                <p style={{ color: '#666', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                                    Loading users...
                                </p>
                            ) : filteredAvailableUsers.length === 0 ? (
                                <p style={{ color: '#666', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                                    {searchQuery ? 'No users found' : 'No users available'}
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                                    {filteredAvailableUsers.map((u: any) => (
                                        <button
                                            key={u._id}
                                            onClick={() => handleStartNewChat(u)}
                                            style={{
                                                padding: '1rem',
                                                border: 'none',
                                                borderRadius: '4px',
                                                backgroundColor: 'white',
                                                color: '#333',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '0.9375rem'
                                            }}
                                        >
                                            <strong>{u.firstName} {u.lastName}</strong>
                                            <br />
                                            <span style={{ fontSize: '0.8125rem', opacity: 0.8 }}>
                                                {u.email}
                                            </span>
                                            {u.userType && (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    marginLeft: '0.5rem',
                                                    padding: '0.125rem 0.5rem',
                                                    backgroundColor: '#e9ecef',
                                                    borderRadius: '12px',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {u.userType}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {conversations.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                                    <p style={{ color: '#666', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' }}>
                                        No conversations yet
                                    </p>
                                    <button
                                        onClick={() => {
                                            setShowNewChat(true);
                                            loadAvailableUsers(user);
                                        }}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.9375rem',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Start New Conversation
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1 }}>
                                    {conversations.map((partner) => (
                                        <button
                                            key={partner._id}
                                            onClick={() => setSelectedUser(partner)}
                                            style={{
                                                padding: '1rem',
                                                border: 'none',
                                                borderRadius: '4px',
                                                backgroundColor: selectedUser?._id === partner._id ? '#007bff' : 'white',
                                                color: selectedUser?._id === partner._id ? 'white' : '#333',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '0.9375rem'
                                            }}
                                        >
                                            <strong>{partner.firstName} {partner.lastName}</strong>
                                            <br />
                                            <span style={{ fontSize: '0.8125rem', opacity: 0.8 }}>
                                                {partner.email}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Messages Area */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #e4e5e7',
                    borderRadius: '8px',
                    backgroundColor: 'white'
                }}>
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid #e4e5e7',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px 8px 0 0'
                            }}>
                                <h3 style={{ margin: 0 }}>
                                    {selectedUser.firstName} {selectedUser.lastName}
                                </h3>
                                <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.875rem' }}>
                                    {selectedUser.email}
                                </p>
                            </div>

                            {/* Messages List */}
                            <div style={{
                                flex: 1,
                                padding: '1.5rem',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                {messages.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((message) => {
                                        const isMine = isMyMessage(message);
                                        return (
                                            <div
                                                key={message._id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: isMine ? 'flex-end' : 'flex-start'
                                                }}
                                            >
                                                <div style={{
                                                    maxWidth: '70%',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '12px',
                                                    backgroundColor: isMine ? '#007bff' : '#e9ecef',
                                                    color: isMine ? 'white' : '#333'
                                                }}>
                                                    {!isMine && (
                                                        <p style={{
                                                            margin: '0 0 0.5rem 0',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: '500',
                                                            opacity: 0.9
                                                        }}>
                                                            {getSenderName(message)}
                                                        </p>
                                                    )}

                                                    {message.content && (
                                                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                                            {message.content}
                                                        </p>
                                                    )}

                                                    {message.attachments && message.attachments.length > 0 && (
                                                        <div style={{ marginTop: message.content ? '0.5rem' : 0 }}>
                                                            {message.attachments.map((filePath, index) => (
                                                                <a
                                                                    key={index}
                                                                    href={getFileUrl(filePath)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{
                                                                        display: 'inline-block',
                                                                        padding: '0.5rem',
                                                                        backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                                                                        borderRadius: '4px',
                                                                        color: isMine ? 'white' : '#007bff',
                                                                        textDecoration: 'none',
                                                                        fontSize: '0.875rem',
                                                                        marginRight: '0.5rem',
                                                                        marginTop: '0.25rem'
                                                                    }}
                                                                >
                                                                    📎 {filePath.split('/').pop() || 'File'}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <p style={{
                                                        margin: '0.5rem 0 0 0',
                                                        fontSize: '0.75rem',
                                                        opacity: 0.7
                                                    }}>
                                                        {new Date(message.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderTop: '1px solid #e4e5e7',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '0 0 8px 8px'
                            }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {selectedFile && (
                                            <div style={{
                                                padding: '0.5rem',
                                                backgroundColor: '#e9ecef',
                                                borderRadius: '4px',
                                                fontSize: '0.875rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span>📎 {selectedFile.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedFile(null)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#dc3545',
                                                        cursor: 'pointer',
                                                        fontSize: '1.2rem',
                                                        padding: '0 0.5rem'
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                        <textarea
                                            value={messageContent}
                                            onChange={(e) => setMessageContent(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                            placeholder="Type your message..."
                                            rows={3}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '1rem',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label
                                            htmlFor="file-input"
                                            style={{
                                                padding: '0.75rem',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                textAlign: 'center',
                                                display: 'inline-block'
                                            }}
                                        >
                                            📎 Attach
                                        </label>
                                        <input
                                            id="file-input"
                                            type="file"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={sending || uploadingFile || (!messageContent.trim() && !selectedFile)}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                backgroundColor: (sending || uploadingFile || (!messageContent.trim() && !selectedFile)) ? '#6c757d' : '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: (sending || uploadingFile || (!messageContent.trim() && !selectedFile)) ? 'not-allowed' : 'pointer',
                                                fontSize: '1rem',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {uploadingFile ? 'Uploading...' : sending ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666'
                        }}>
                            <p>Select a conversation to start messaging</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
