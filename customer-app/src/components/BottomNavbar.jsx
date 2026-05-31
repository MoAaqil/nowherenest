import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clapperboard, Compass, Car, User, Bed, Briefcase, Heart } from 'lucide-react';
import './BottomNavbar.css';

const BottomNavbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const isHomeActive = currentPath === '/';
  const isVibesActive = currentPath === '/vibes';
  const isTripsActive = currentPath === '/trips';
  const isFavouritesActive = currentPath === '/favourites';
  const isPgRoomsActive = currentPath === '/rentals';
  const isRidesActive = currentPath === '/ride';
  const isMoreActive = currentPath === '/profile';

  return (
    <div className="bottom-navbar-container">
      <nav className="floating-bottom-nav">
        {/* Stays (Home) */}
        <Link 
          to="/" 
          className={`nav-dock-item ${isHomeActive ? 'active' : ''}`}
        >
          <Home size={22} />
          {isHomeActive && <span className="nav-dock-label">Stays</span>}
        </Link>

        {/* Vibes */}
        <Link 
          to="/vibes" 
          className={`nav-dock-item ${isVibesActive ? 'active' : ''}`}
        >
          <Clapperboard size={22} />
          {isVibesActive && <span className="nav-dock-label">Vibes</span>}
        </Link>

        {/* Trips — dedicated page */}
        <Link 
          to="/trips" 
          className={`nav-dock-item ${isTripsActive ? 'active' : ''}`}
        >
          <Briefcase size={22} />
          {isTripsActive && <span className="nav-dock-label">Trips</span>}
        </Link>

        {/* Favourites */}
        <Link 
          to="/favourites" 
          className={`nav-dock-item ${isFavouritesActive ? 'active' : ''}`}
        >
          <Heart size={22} />
          {isFavouritesActive && <span className="nav-dock-label">Favourites</span>}
        </Link>

        {/* PG Rooms */}
        <Link 
          to="/rentals" 
          className={`nav-dock-item ${isPgRoomsActive ? 'active' : ''}`}
        >
          <Bed size={22} />
          {isPgRoomsActive && <span className="nav-dock-label">PG Rooms</span>}
        </Link>

        {/* Rides */}
        <Link 
          to="/ride" 
          className={`nav-dock-item ${isRidesActive ? 'active' : ''}`}
        >
          <Car size={22} />
          {isRidesActive && <span className="nav-dock-label">Rides</span>}
        </Link>

        {/* More */}
        <Link 
          to="/profile?tab=settings" 
          className={`nav-dock-item ${isMoreActive ? 'active' : ''}`}
        >
          <User size={22} />
          {isMoreActive && <span className="nav-dock-label">More</span>}
        </Link>
      </nav>
    </div>
  );
};

export default BottomNavbar;
