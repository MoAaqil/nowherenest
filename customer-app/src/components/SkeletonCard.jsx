import React from 'react';
import './SkeletonCard.css';

export const SkeletonCard = ({ type = 'stay' }) => {
  if (type === 'trip') {
    return (
      <div className="skeleton-trip-card">
        <div className="skeleton-trip-banner skeleton-pulse"></div>
        <div className="skeleton-trip-body">
          <div className="skeleton-line title skeleton-pulse"></div>
          <div className="skeleton-line subtitle skeleton-pulse"></div>
          <div className="skeleton-line text skeleton-pulse" style={{ width: '60%' }}></div>
          <div className="skeleton-line row skeleton-pulse" style={{ height: '40px', marginTop: '12px', borderRadius: '12px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-stay-card">
      <div className="skeleton-stay-image skeleton-pulse"></div>
      <div className="skeleton-stay-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div className="skeleton-line tag skeleton-pulse" style={{ width: '60px' }}></div>
          <div className="skeleton-line tag skeleton-pulse" style={{ width: '40px' }}></div>
        </div>
        <div className="skeleton-line title skeleton-pulse"></div>
        <div className="skeleton-line text skeleton-pulse" style={{ width: '80%' }}></div>
        <div className="skeleton-line text skeleton-pulse" style={{ width: '50%' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
          <div className="skeleton-line text skeleton-pulse" style={{ width: '80px', margin: 0 }}></div>
          <div className="skeleton-line button skeleton-pulse" style={{ width: '50px', height: '24px', borderRadius: '12px' }}></div>
        </div>
      </div>
    </div>
  );
};
