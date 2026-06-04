import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { io } from 'socket.io-client';
import { Send, User, Building, X } from 'lucide-react';

const Messages = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const messagesEndRef = useRef(null);

  // Fetch properties on mount
  useEffect(() => {
    api.properties.getOwnerProperties()
      .then(res => {
        if (res.success && res.properties.length > 0) {
          setProperties(res.properties);
          setSelectedPropertyId(res.properties[0]._id);
        }
      })
      .catch(err => console.error('Error fetching properties', err));
  }, []);

  // Fetch threads when property changes
  useEffect(() => {
    if (selectedPropertyId) {
      api.messages.getThreads(selectedPropertyId)
        .then(res => {
          if (res.success) {
            setThreads(res.threads);
          }
        })
        .catch(err => console.error('Error fetching threads', err));
    }
  }, [selectedPropertyId]);

  // Handle selected thread and socket
  useEffect(() => {
    if (selectedPropertyId && selectedThread) {
      const customerId = selectedThread.customer._id;

      // Fetch existing messages
      api.messages.get(selectedPropertyId, customerId)
        .then(res => {
          if (res.success) {
            setMessages(res.messages);
            scrollToBottom();
          }
        })
        .catch(err => console.error('Failed to load messages', err));

      // Connect socket
      const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://nowherenest-backend.onrender.com';
      const newSocket = io(backendUrl);

      newSocket.on('connect', () => {
        newSocket.emit('join_booking_room', `${selectedPropertyId}_${customerId}`);
      });

      newSocket.on('receive_message', (msg) => {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
        
        // Also update thread last message
        setThreads(prev => {
          const updated = [...prev];
          const tIdx = updated.findIndex(t => t.customer._id === customerId);
          if (tIdx > -1) {
            updated[tIdx].lastMessage = {
              text: msg.text,
              createdAt: msg.createdAt,
              sender: msg.sender,
              senderRole: msg.senderRole
            };
          }
          return updated;
        });
      });
      newSocket.on('message_deleted', (msgId) => {
        setMessages(prev => prev.filter(m => m._id !== msgId));
      });

      newSocket.on('chat_cleared', () => {
        setMessages([]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [selectedPropertyId, selectedThread]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    try {
      const res = await api.messages.send(selectedPropertyId, selectedThread.customer._id, newMessage);
      if (res.success) {
        setNewMessage('');
        setErrorMsg('');
      } else {
        setErrorMsg(res.message || 'Failed to send message');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Failed to send message');
      console.error('Send message failed', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', fontFamily: 'inherit' }}>
      <div style={{ padding: '20px' }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#0F172A', fontSize: '24px' }}>Messages</h2>
        {properties.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <Building size={18} color="#64748B" />
            <select 
              value={selectedPropertyId} 
              onChange={e => {
                setSelectedPropertyId(e.target.value);
                setSelectedThread(null);
                setMessages([]);
              }}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', fontWeight: '600', color: '#0F172A', cursor: 'pointer' }}
            >
              {properties.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '24px', padding: '0 20px 20px 20px', minHeight: 0 }}>
        {/* Sidebar / Threads List */}
        <div style={{ width: '320px', background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', fontWeight: '600', color: '#0F172A' }}>
            Customer Conversations
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {threads.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                No active conversations for this property.
              </div>
            ) : (
              threads.map(t => {
                const isSelected = selectedThread?.customer._id === t.customer._id;
                return (
                  <div 
                    key={t.customer._id}
                    onClick={() => setSelectedThread(t)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer',
                      background: isSelected ? '#F8FAFC' : 'white',
                      borderLeft: isSelected ? '4px solid #0A3B2A' : '4px solid transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {t.customer.profileImage ? (
                        <img src={t.customer.profileImage} alt={t.customer.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                          <User size={20} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.customer.name}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                            {new Date(t.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.lastMessage.senderRole !== 'customer' ? 'You: ' : ''}{t.lastMessage.text}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedThread ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {selectedThread.customer.profileImage ? (
                    <img src={selectedThread.customer.profileImage} alt={selectedThread.customer.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <User size={24} />
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0F172A' }}>{selectedThread.customer.name}</h3>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>{selectedThread.customer.email}</span>
                  </div>
                </div>
                <button onClick={async () => {
                  if (window.confirm('Clear all messages with this customer?')) {
                    try {
                      await api.messages.clear(selectedPropertyId, selectedThread.customer._id);
                      setMessages([]);
                    } catch (e) {
                      console.error('Failed to clear chat', e);
                    }
                  }
                }} style={{ background: 'white', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: '8px', color: '#64748B', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                  Clear Chat
                </button>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'white' }}>
                {errorMsg && (
                  <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', border: '1px solid #FCA5A5' }}>
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg('')} style={{ background: 'transparent', border: 'none', color: '#B91C1C', cursor: 'pointer', padding: '0 0 0 8px' }}><X size={16} /></button>
                  </div>
                )}
                
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: '40px' }}>Loading messages...</div>
                ) : (
                  messages.map(msg => {
                    const isMine = (msg.sender?._id || msg.sender) !== selectedThread.customer._id;
                    return (
                      <div key={msg._id} style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '70%'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                          <div style={{
                            backgroundColor: isMine ? '#0A3B2A' : '#F1F5F9',
                            color: isMine ? 'white' : '#0F172A',
                            padding: '12px 16px',
                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            fontSize: '15px',
                            lineHeight: '1.5'
                          }}>
                            {msg.text}
                          </div>
                          {isMine && (
                            <button 
                              onClick={async () => {
                                if (window.confirm('Unsend this message?')) {
                                  try {
                                    await api.messages.delete(msg._id);
                                    setMessages(prev => prev.filter(m => m._id !== msg._id));
                                  } catch (e) {
                                    console.error('Failed to unsend', e);
                                  }
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
                              title="Unsend message"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                          )}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#94A3B8',
                          marginTop: '6px',
                          textAlign: isMine ? 'right' : 'left'
                        }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #E2E8F0', background: 'white', display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '24px',
                    outline: 'none',
                    fontSize: '15px',
                    background: '#F8FAFC'
                  }}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  style={{
                    backgroundColor: newMessage.trim() ? '#0A3B2A' : '#E2E8F0',
                    color: newMessage.trim() ? 'white' : '#94A3B8',
                    border: 'none',
                    borderRadius: '50%',
                    width: '52px',
                    height: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                >
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '15px' }}>
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
