import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from '../services/api';
import { X, Send, MessageCircle } from 'lucide-react';
import './ChatWidget.css';

const ChatWidget = ({ propertyId, customerId, customerName, propertyName, defaultOpen = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch existing messages
      api.messages.get(propertyId, customerId)
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
        newSocket.emit('join_booking_room', `${propertyId}_${customerId}`);
      });

      newSocket.on('receive_message', (msg) => {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
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
  }, [isOpen, propertyId, customerId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await api.messages.send(propertyId, customerId, newMessage);
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
    <div className="chat-widget-wrapper" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, fontFamily: 'inherit' }}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: '#0A3B2A',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer'
          }}
        >
          <MessageCircle size={28} />
        </button>
      ) : (
        <div className="chat-widget-box" style={{
          width: '90vw',
          maxWidth: '350px',
          height: 'min(70vh, 450px)',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#0A3B2A',
            color: 'white',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Host / Reception</h4>
              {propertyName && <span style={{ fontSize: '11px', color: '#CBD5E1' }}>{propertyName}</span>}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={async () => {
                if (window.confirm('Clear all messages for this stay?')) {
                  try {
                    await api.messages.clear(propertyId, customerId);
                  } catch (e) {
                    console.error('Failed to clear chat', e);
                  }
                }
              }} style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: '11px' }}>
                Clear Chat
              </button>
              <button onClick={() => { setIsOpen(false); if(onClose) onClose(); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {errorMsg && (
              <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', border: '1px solid #FCA5A5', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.1)' }}>
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg('')} style={{ background: 'transparent', border: 'none', color: '#B91C1C', cursor: 'pointer', padding: '0 0 0 8px' }}><X size={16} /></button>
              </div>
            )}
            
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', marginTop: '20px' }}>
                Ask a question before booking or request room service. Messages disappear after 10 days.
              </div>
            ) : (
              messages.map(msg => {
                const isMine = msg.sender?._id === customerId || msg.sender === customerId;
                return (
                  <div key={msg._id} style={{
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '80%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                      <div style={{
                        backgroundColor: isMine ? '#0A3B2A' : '#E2E8F0',
                        color: isMine ? 'white' : '#0F172A',
                        padding: '10px 14px',
                        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        {msg.text}
                      </div>
                      {isMine && (
                        <button 
                          onClick={async () => {
                            if (window.confirm('Unsend this message?')) {
                              try {
                                await api.messages.delete(msg._id);
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
                      fontSize: '10px',
                      color: '#94A3B8',
                      marginTop: '4px',
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

          {/* Input */}
          <form onSubmit={handleSendMessage} style={{
            padding: '12px',
            backgroundColor: 'white',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text" 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #CBD5E1',
                borderRadius: '20px',
                outline: 'none',
                fontSize: '14px'
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
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
