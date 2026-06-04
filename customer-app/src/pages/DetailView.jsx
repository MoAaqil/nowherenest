import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Star, Wifi, Flame, Zap, Calendar, User, Phone, CheckCircle, Car, ArrowLeft, Heart, Tag, ChevronLeft, ChevronRight, X, MessageSquare } from 'lucide-react';
import './DetailView.css';
import { formatPrice } from '../utils/currency';
import { translate } from '../utils/translations';
import DateRangeCalendar from '../components/DateRangeCalendar';
import LeafletMap from '../components/LeafletMap';
import { pushNotification } from '../components/Navbar';
import ChatWidget from '../components/ChatWidget';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
};

const getRoomImage = (rm) => {
  if (rm.images && rm.images.length > 0) return rm.images[0];
  if (rm.category === 'suite') return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80';
  if (rm.category === 'deluxe') return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=300&q=80';
  return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=300&q=80'; // standard
};

const getRoomMeta = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat === 'standard') {
    return { sqft: '250 sq. ft', bed: 'Queen Bed', floor: '1st Floor' };
  } else if (cat === 'deluxe') {
    return { sqft: '350 sq. ft', bed: 'King Bed', floor: '2nd Floor' };
  } else if (cat === 'premium') {
    return { sqft: '450 sq. ft', bed: 'King Bed', floor: '3rd Floor' };
  } else if (cat === 'suite') {
    return { sqft: '600 sq. ft', bed: 'Super King Bed', floor: 'Top Floor' };
  }
  return { sqft: '300 sq. ft', bed: 'Double Bed', floor: '2nd Floor' };
};

const DetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');
  const [currencyChanged, setCurrencyChanged] = useState(0);
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrencyChanged(prev => prev + 1);
      setLanguage(localStorage.getItem('language') || 'English');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking details
  const [startDate, setStartDate] = useState(() => localStorage.getItem('search_start_date') || '');
  const [endDate, setEndDate] = useState(() => localStorage.getItem('search_end_date') || '');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  
  // Custom experiences & guest details
  const [selectedUsps, setSelectedUsps] = useState([]); 
  const [noteToOwner, setNoteToOwner] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [adultsCount, setAdultsCount] = useState(() => Number(localStorage.getItem('search_adults') || 1));
  const [childrenCount, setChildrenCount] = useState(() => Number(localStorage.getItem('search_children') || 0));
  const [infantsCount, setInfantsCount] = useState(() => Number(localStorage.getItem('search_infants') || 0));
  const guestCount = adultsCount + childrenCount + infantsCount;

  const [guestDetails, setGuestDetails] = useState(() => {
    const adults = Number(localStorage.getItem('search_adults') || 1);
    const children = Number(localStorage.getItem('search_children') || 0);
    const total = Math.max(1, adults + children);
    return Array.from({ length: total }, () => ({ name: '', age: '' }));
  });

  const [isLiked, setIsLiked] = useState(() => {
    try {
      const likedList = JSON.parse(localStorage.getItem('liked_stays') || '[]');
      return likedList.includes(id);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (property) {
      const likedList = JSON.parse(localStorage.getItem('liked_stays') || '[]');
      setIsLiked(likedList.includes(property._id));
    }
  }, [property]);

  // toggleLike: optimistic localStorage + sync to backend API
  const toggleLike = async () => {
    if (!property) return;
    try {
      // Optimistic UI update first
      const likedList = JSON.parse(localStorage.getItem('liked_stays') || '[]');
      let updated;
      if (likedList.includes(property._id)) {
        updated = likedList.filter(lId => lId !== property._id);
        setIsLiked(false);
      } else {
        updated = [...likedList, property._id];
        setIsLiked(true);
      }
      localStorage.setItem('liked_stays', JSON.stringify(updated));
      // Sync to backend
      await api.auth.toggleFavourite(property._id);
    } catch (err) {
      console.error('Failed to toggle favourite:', err);
      // Revert on error
      const likedList = JSON.parse(localStorage.getItem('liked_stays') || '[]');
      setIsLiked(likedList.includes(property._id));
    }
  };
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [expandedRoomId, setExpandedRoomId] = useState(null);
  const [bringPet, setBringPet] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]); // dates already booked for selected room

  // Room gallery images active selection state
  const [activeRoomImages, setActiveRoomImages] = useState({});

  // Saved guest history state
  const [savedGuests, setSavedGuests] = useState([]);

  // Lightbox & Touch states
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [lightboxTouchStart, setLightboxTouchStart] = useState(null);
  const [lightboxTouchEnd, setLightboxTouchEnd] = useState(null);

  const photosArray = property 
    ? (Array.isArray(property.photos) 
        ? property.photos 
        : (typeof property.photos === 'string' && property.photos 
            ? [property.photos] 
            : []))
    : [];

  const displayPhotos = photosArray.length > 0 
    ? photosArray 
    : ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'];

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        setLightboxIdx((prev) => (prev + 1) % displayPhotos.length);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIdx((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, displayPhotos]);

  // Request browser Notification permissions and load saved guests on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const saved = localStorage.getItem('nwn_saved_guests');
    if (saved) {
      try {
        setSavedGuests(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved guests', e);
      }
    }
  }, []);

  const handleSelectSavedGuest = (savedG) => {
    const updated = [...guestDetails];
    // Find first empty slot or use slot 0
    let emptyIndex = updated.findIndex(g => !g.name.trim());
    if (emptyIndex === -1) emptyIndex = 0;
    
    if (updated[emptyIndex]) {
      updated[emptyIndex] = { name: savedG.name, age: savedG.age };
      setGuestDetails(updated);
    }
  };

  // Booking type: nightly or hourly (fresher/day-use)
  const [bookingType, setBookingType] = useState('nightly');
  const [durationHours, setDurationHours] = useState(4);

  // Default mock experiences for stays
  const mockExperiences = [
    { title: 'Sunset Backwater Shikara Cruise', description: '2-hour private boat cruise in Vembanad lake waters', price: 2500, chargeType: 'per_family' },
    { title: 'Guided Tea Plantations Trekking', description: 'Guided morning walk to tea gardens and waterfalls', price: 1200, chargeType: 'per_person' }
  ];

  const propertyExperiences = (property && property.usps && property.usps.length > 0) ? property.usps : [];

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  useEffect(() => {
    if (selectedRoom) {
      const maxCap = selectedRoom.capacity || 2;
      if (adultsCount + childrenCount > maxCap) {
        setAdultsCount(1);
        setChildrenCount(0);
        setGuestDetails([{ name: '', age: '' }]);
      }

      // Fetch room blocked dates whenever the selected room changes
      const roomId = selectedRoom._id;
      if (roomId && roomId !== 'default_room_id') {
        api.rooms.getAvailability(roomId)
          .then(res => {
            if (res.success) {
              setBlockedDates(res.blockedDates || []);
            }
          })
          .catch(() => setBlockedDates([]));
      } else {
        setBlockedDates([]);
      }
    }
  }, [selectedRoom]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Property Details
      const propRes = await api.properties.getById(id).catch(async () => {
        // Fallback: If it's a legacy listing ID, fetch listing and fallback to its owner details
        const listRes = await api.listings.getById(id);
        // Map Listing structure to Property
        return {
          property: {
            _id: listRes.listing._id,
            name: listRes.listing.title,
            description: listRes.listing.description,
            type: listRes.listing.type === 'stay' ? 'hotel' : 'apartment',
            address: listRes.listing.location.address,
            location: listRes.listing.location,
            starRating: 4,
            amenities: listRes.listing.amenities,
            photos: listRes.listing.images,
            owner: listRes.listing.owner
          }
        };
      });
      
      setProperty(propRes.property);
      setReviews(propRes.reviews || []);

      // 2. Fetch Rooms for Property
      const roomsRes = await api.rooms.getByProperty(propRes.property._id).catch(() => ({ rooms: [] }));
      if (roomsRes.rooms && roomsRes.rooms.length > 0) {
        setRooms(roomsRes.rooms);
        setSelectedRoom(roomsRes.rooms[0]);
      } else {
        // Fallback room category if property has no rooms listed
        const fallbackRoom = {
          _id: 'default_room_id',
          category: 'standard',
          price: 1500,
          capacity: 2,
          amenities: propRes.property.amenities,
          cancellationPolicy: 'Free cancellation within 24 hours'
        };
        setRooms([fallbackRoom]);
        setSelectedRoom(fallbackRoom);
      }
      
      // Default dates (today and tomorrow)
      const localStart = localStorage.getItem('search_start_date');
      const localEnd = localStorage.getItem('search_end_date');
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      setStartDate(localStart || today.toISOString().split('T')[0]);
      setEndDate(localEnd || tomorrow.toISOString().split('T')[0]);

      // 3. Fetch public coupons for property
      try {
        const couponsRes = await api.coupons.getPropertyCouponsPublic(propRes.property._id);
        if (couponsRes.success) {
          setAvailableCoupons(couponsRes.coupons || []);
        }
      } catch (cErr) {
        console.error('Failed to load coupons:', cErr);
      }
    } catch (err) {
      setError(err.message || 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handleAdultsChange = (val) => {
    const newCount = adultsCount + val;
    const maxCap = selectedRoom?.capacity || 2;
    if (newCount >= 1 && newCount + childrenCount <= maxCap) {
      setAdultsCount(newCount);
      updateGuestDetails(newCount + childrenCount);
    }
  };

  const handleChildrenChange = (val) => {
    const newCount = childrenCount + val;
    const maxCap = selectedRoom?.capacity || 2;
    if (newCount >= 0 && adultsCount + newCount <= maxCap) {
      setChildrenCount(newCount);
      updateGuestDetails(adultsCount + newCount);
    }
  };

  const handleInfantsChange = (val) => {
    const newCount = infantsCount + val;
    if (newCount >= 0 && newCount <= 3) {
      setInfantsCount(newCount);
    }
  };

  const updateGuestDetails = (totalCount) => {
    const updatedDetails = [...guestDetails];
    if (totalCount > updatedDetails.length) {
      while (updatedDetails.length < totalCount) {
        updatedDetails.push({ name: '', age: '' });
      }
    } else {
      updatedDetails.splice(totalCount);
    }
    setGuestDetails(updatedDetails);
  };

  const handleUspToggle = (index) => {
    if (selectedUsps.includes(index)) {
      setSelectedUsps(selectedUsps.filter(i => i !== index));
    } else {
      setSelectedUsps([...selectedUsps, index]);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await api.coupons.validate(property._id, couponCode);
      setAppliedCoupon(res);
      setCouponSuccess(`Coupon code applied! ${res.discountPercent}% discount is active.`);
    } catch (err) {
      setCouponError(err.message || 'Invalid discount coupon code');
      setAppliedCoupon(null);
    }
  };

  // Calculations
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const getPriceBreakdown = () => {
    if (!selectedRoom) return { base: 0, deposit: 0, discount: 0, uspsTotal: 0, total: 0 };
    const days = calculateDays();
    
    let base = selectedRoom.price * days;
    let deposit = 0;
    
    if (property?.type === 'pg' || property?.type === 'guesthouse' && selectedRoom.category === 'standard') {
      // Monthly simulation PG rent
      base = selectedRoom.price;
      deposit = Math.round(selectedRoom.price * 2); // 2-month deposit
    }

    // Apply Coupon discount
    let discount = 0;
    if (appliedCoupon) {
      discount = Math.round(base * (appliedCoupon.discountPercent / 100));
    }

    // Experiences cost
    const uspsTotal = selectedUsps.reduce((acc, idx) => {
      const item = propertyExperiences[idx];
      if (!item) return acc;
      if (item.chargeType === 'per_person') {
        return acc + (item.price * guestCount);
      }
      return acc + item.price;
    }, 0);

    // Apply Nest Partner Discount
    let nestPartnerDiscount = 0;
    const isNestPartnerEligible = user && user.owlsPoints >= 250 && property?.owner?.nestPartner;
    if (isNestPartnerEligible) {
      nestPartnerDiscount = Math.round(base * 0.10);
    }

    return {
      base,
      deposit,
      discount,
      nestPartnerDiscount,
      uspsTotal,
      total: base + deposit + uspsTotal - discount - nestPartnerDiscount
    };
  };

  const triggerBookingNotifications = (booking) => {
    // Push in-app notification to the bell system
    pushNotification({
      type: 'booking',
      title: 'Stay Confirmed! 🎒',
      body: `Your booking at ${property.name} is confirmed. Check-in OTP: ${booking.checkInOTP}`
    });

    // Also attempt browser notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Stay Confirmed! 🎒', {
          body: `Your booking at ${property.name} is confirmed. Check-in OTP: ${booking.checkInOTP}`,
          icon: '/logo.png'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Stay Confirmed! 🎒', {
              body: `Your booking at ${property.name} is confirmed. Check-in OTP: ${booking.checkInOTP}`,
              icon: '/logo.png'
            });
          }
        });
      }
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    // Guest age validation (Adults 18+, Children under 18)
    for (let i = 0; i < adultsCount; i++) {
      const guest = guestDetails[i];
      if (!guest || !guest.age) {
        setError(`Please enter the age for Guest ${i + 1} (Adult).`);
        return;
      }
      if (guest.age < 18) {
        setError(`Guest ${i + 1} is configured as an Adult but age is ${guest.age}. Adults must be 18 years or older.`);
        return;
      }
    }
    for (let i = adultsCount; i < adultsCount + childrenCount; i++) {
      const guest = guestDetails[i];
      if (!guest || !guest.age) {
        setError(`Please enter the age for Guest ${i + 1} (Child).`);
        return;
      }
      if (guest.age >= 18) {
        setError(`Guest ${i + 1} is configured as a Child but age is ${guest.age}. Children must be under 18 years old (Age 2-17). Please count them as an adult.`);
        return;
      }
    }

    setBookingLoading(true);
    setError(null);
    try {
      const uspsList = selectedUsps.map(idx => propertyExperiences[idx]);
      const res = await api.bookings.create({
        propertyId: property._id,
        roomId: selectedRoom._id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        couponCode: appliedCoupon ? couponCode : undefined,
        selectedUsps: uspsList,
        noteToOwner: noteToOwner,
        guests: guestDetails,
        bookingType,
        durationHours: bookingType === 'hourly' ? durationHours : undefined
      });
      
      // Save new guests to localStorage
      if (guestDetails && guestDetails.length > 0) {
        const currentSaved = localStorage.getItem('nwn_saved_guests');
        let savedList = [];
        if (currentSaved) {
          try {
            savedList = JSON.parse(currentSaved);
          } catch (e) {
            savedList = [];
          }
        }
        guestDetails.forEach(g => {
          if (g.name.trim() && !savedList.some(s => s.name.toLowerCase() === g.name.trim().toLowerCase())) {
            savedList.push({ name: g.name.trim(), age: g.age });
          }
        });
        localStorage.setItem('nwn_saved_guests', JSON.stringify(savedList));
        setSavedGuests(savedList);
      }

      if (res.razorpayOrderId && window.Razorpay) {
        const options = {
          key: 'rzp_test_mock_123', // Real key should come from an API/env
          amount: res.booking.totalAmount * 100,
          currency: 'INR',
          name: 'Nowhere Nest',
          description: `Booking for ${property.name}`,
          order_id: res.razorpayOrderId,
          handler: async function (response) {
            try {
              const verifyRes = await api.payments.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: res.booking._id
              });
              if (verifyRes.success) {
                triggerBookingNotifications(res.booking);
                navigate('/trips');
              }
            } catch (verErr) {
              setError(verErr.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || ''
          },
          theme: { color: '#0A3B2A' }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setError('Payment failed: ' + response.error.description);
        });
        rzp.open();
      } else {
        triggerBookingNotifications(res.booking);
        navigate('/trips');
      }
    } catch (err) {
      setError(err.message || 'Booking checkout failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading && !property) {
    return <div className="detail-page-loading flex-center"><span>{translate('loading_property', language)}</span></div>;
  }

  if (error && !property) {
    return (
      <div className="container detail-page-error">
        <Link to="/" className="btn-back"><ArrowLeft size={16} /> {translate('back_to_search', language)}</Link>
        <div className="error-card">{error}</div>
      </div>
    );
  }

  const { base, deposit, discount, nestPartnerDiscount, uspsTotal, total } = getPriceBreakdown();
  


  // Touch gesture swipe handlers
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setActivePhotoIdx((prev) => (prev + 1) % displayPhotos.length);
    } else if (isRightSwipe) {
      setActivePhotoIdx((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
    }
  };

  const handleLightboxTouchStart = (e) => {
    setLightboxTouchEnd(null);
    setLightboxTouchStart(e.targetTouches[0].clientX);
  };
  const handleLightboxTouchMove = (e) => {
    setLightboxTouchEnd(e.targetTouches[0].clientX);
  };
  const handleLightboxTouchEnd = () => {
    if (!lightboxTouchStart || !lightboxTouchEnd) return;
    const distance = lightboxTouchStart - lightboxTouchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setLightboxIdx((prev) => (prev + 1) % displayPhotos.length);
    } else if (isRightSwipe) {
      setLightboxIdx((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
    }
  };

  const renderMediaGallery = () => {
    const len = displayPhotos.length;
    
    if (len === 1) {
      return (
        <section className="detail-media-gallery gallery-layout-single">
          <div 
            className="gallery-image-wrapper main-image-container card" 
            onClick={() => {
              setLightboxIdx(0);
              setIsLightboxOpen(true);
            }}
          >
            <img src={displayPhotos[0]} alt={property?.name || 'Stay'} className="gallery-main-img" referrerPolicy="no-referrer" />
            <button 
              className={`btn-favorite-circle ${isLiked ? 'liked' : ''}`} 
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
            >
              <Heart size={20} fill={isLiked ? '#EF4444' : 'none'} />
            </button>
          </div>
        </section>
      );
    }
    
    if (len === 2) {
      return (
        <section className="detail-media-gallery gallery-layout-split">
          {displayPhotos.map((url, idx) => (
            <div 
              key={idx} 
              className="gallery-image-wrapper card" 
              onClick={() => {
                setLightboxIdx(idx);
                setIsLightboxOpen(true);
              }}
            >
              <img src={url} alt={`${property?.name || 'Stay'} ${idx + 1}`} className="gallery-main-img" referrerPolicy="no-referrer" />
              {idx === 0 && (
                <button 
                  className={`btn-favorite-circle ${isLiked ? 'liked' : ''}`} 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike();
                  }}
                >
                  <Heart size={20} fill={isLiked ? '#EF4444' : 'none'} />
                </button>
              )}
            </div>
          ))}
        </section>
      );
    }
    
    if (len === 3) {
      return (
        <section className="detail-media-gallery gallery-layout-grid-3">
          <div 
            className="gallery-image-wrapper main-image-container card" 
            onClick={() => {
              setLightboxIdx(0);
              setIsLightboxOpen(true);
            }}
          >
            <img src={displayPhotos[0]} alt={property?.name || 'Stay'} className="gallery-main-img" referrerPolicy="no-referrer" />
            <button 
              className={`btn-favorite-circle ${isLiked ? 'liked' : ''}`} 
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
            >
              <Heart size={20} fill={isLiked ? '#EF4444' : 'none'} />
            </button>
          </div>
          <div className="thumbnails-column-two">
            {displayPhotos.slice(1, 3).map((url, idx) => (
              <div 
                key={idx + 1} 
                className="gallery-image-wrapper card" 
                onClick={() => {
                  setLightboxIdx(idx + 1);
                  setIsLightboxOpen(true);
                }}
              >
                <img src={url} alt={`${property?.name || 'Stay'} ${idx + 2}`} className="gallery-main-img" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </section>
      );
    }
    
    return (
      <section className="detail-media-gallery gallery-layout-carousel">
        <div 
          className="gallery-image-wrapper main-image-container card carousel-container"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            setLightboxIdx(activePhotoIdx);
            setIsLightboxOpen(true);
          }}
        >
          <img 
            src={displayPhotos[activePhotoIdx]} 
            alt={`${property?.name || 'Stay'} ${activePhotoIdx + 1}`} 
            className="gallery-main-img carousel-img" 
            referrerPolicy="no-referrer"
          />
          
          <button 
            className={`btn-favorite-circle ${isLiked ? 'liked' : ''}`} 
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
          >
            <Heart size={20} fill={isLiked ? '#EF4444' : 'none'} />
          </button>

          <button 
            type="button"
            className="carousel-nav-btn prev-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoIdx((prev) => (prev - 1 + len) % len);
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            type="button"
            className="carousel-nav-btn next-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoIdx((prev) => (prev + 1) % len);
            }}
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>

          <div className="carousel-index-badge">
            {activePhotoIdx + 1} / {len}
          </div>

          <div className="carousel-dots-container" onClick={e => e.stopPropagation()}>
            {displayPhotos.map((_, idx) => (
              <span 
                key={idx} 
                className={`carousel-dot ${activePhotoIdx === idx ? 'active' : ''}`}
                onClick={() => setActivePhotoIdx(idx)}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="detail-page container">
      <Link to="/" className="btn-back flex-center"><ArrowLeft size={16} /> {translate('back_to_home', language)}</Link>
      
      {/* Visual Image Header (Dynamic Layout Media Gallery) */}
      {renderMediaGallery()}

      {/* Split details content */}
      <div className="detail-split-layout">
        {/* Left Side: Info */}
        <div className="detail-info-column">
          <div className="detail-header-row flex-between">
            <span className="listing-type-badge badge badge-info">{property.type}</span>
            <div className="rating-row">
              <Star size={16} className="star-icon" />
              <span>{property.starRating} {translate('star_rating_label', language)}</span>
            </div>
          </div>

          <h2>{property.name}</h2>
          <p className="detail-address-label">
            <MapPin size={16} />
            <span>{property.address}</span>
          </p>

          <hr className="divider" />

          {/* Stay Registry & Information card */}
          <div className="owner-profile-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary-color)', letterSpacing: '0.5px' }}>Stay Registry & Information</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'block' }}>Stay License Number</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>
                  {property.licenseNumber ? property.licenseNumber : 'Pending Verification'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'block' }}>Category</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', textTransform: 'capitalize' }}>
                  {property.category || property.type || 'Stay'}
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'block' }}>Verification Status</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} /> Approved & Active
                </span>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'block' }}>Brokerage Rate</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)' }}>
                  0% (Brokerage Free)
                </span>
              </div>
            </div>
          </div>


          <hr className="divider" />

          {/* Room Selector grid */}
          <div className="detail-rooms-selection">
            <h4>{translate('select_room_title', language)}</h4>
            <p className="sub-tagline">{translate('select_room_desc', language)}</p>
            
            <div className="rooms-options-grid flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {rooms.length === 0 ? (
                <div className="empty-rooms flex-center" style={{ padding: '16px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  {translate('no_rooms_available', language)}
                </div>
              ) : (
                rooms.map(rm => (
                  <div 
                    key={rm._id} 
                    className={`detail-room-select-card card ${selectedRoom?._id === rm._id ? 'active' : ''}`}
                    onClick={() => setSelectedRoom(rm)}
                    style={{ padding: '16px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', border: selectedRoom?._id === rm._id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', background: selectedRoom?._id === rm._id ? 'var(--primary-light)' : 'white' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '50%', 
                          border: '2px solid ' + (selectedRoom?._id === rm._id ? 'var(--primary-color)' : 'var(--border-color)'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: selectedRoom?._id === rm._id ? 'var(--primary-color)' : 'transparent',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {selectedRoom?._id === rm._id && '✓'}
                        </div>
                        <img 
                          src={getRoomImage(rm)} 
                          alt={rm.category} 
                          style={{ width: '80px', height: '60px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)' }} 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h6 style={{ textTransform: 'capitalize', fontSize: '15px', fontWeight: '800', margin: '0 0 4px 0' }}>{rm.category} {translate('room_suffix', language)}</h6>
                          <span style={{ fontSize: '12px', color: 'var(--text-medium)', display: 'block', marginBottom: '4px' }}>{translate('max_capacity_label', language)}: {rm.capacity} {translate('guests_label', language)}</span>
                          
                          {rm.roomsAvailable !== undefined && rm.roomsAvailable <= 3 && rm.roomsAvailable > 0 && (
                            <span style={{ fontSize: '10px', color: '#EF4444', background: '#FEE2E2', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                              🔥 Hurry! Only {rm.roomsAvailable} left
                            </span>
                          )}
                          {rm.roomsAvailable === 0 && (
                            <span style={{ fontSize: '10px', color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                              🚫 Sold Out for selected dates
                            </span>
                          )}
                          
                          {rm.images && rm.images.length > 0 && (
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRoomId(prev => prev === rm._id ? null : rm._id);
                              }}
                              style={{ 
                                border: '1.5px solid var(--primary-color)', 
                                background: 'transparent', 
                                color: 'var(--primary-color)', 
                                padding: '4px 10px', 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '4px'
                              }}
                            >
                              🖼️ {expandedRoomId === rm._id ? 'Hide Photos' : `View Photos (${rm.images.length})`}
                            </button>
                          )}

                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '16px', color: 'var(--primary-color)', display: 'block' }}>{formatPrice(rm.price)}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block' }}>{translate('checkout_night_suffix', language)}</span>
                      </div>
                    </div>

                    {expandedRoomId === rm._id && rm.images && rm.images.length > 0 && (
                      <div 
                        className="room-gallery-slide-down" 
                        style={{ 
                          marginTop: '16px', 
                          borderTop: '1px solid var(--border-color)', 
                          paddingTop: '16px',
                          width: '100%',
                          animation: 'slideDown 0.3s ease-out',
                          textAlign: 'left'
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Main Large Image */}
                        <div style={{ position: 'relative', width: '100%', height: '240px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                          <img 
                            src={activeRoomImages[rm._id] || rm.images[0]} 
                            alt={`${rm.category} room main`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Clickable mini preview thumbnails */}
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px', scrollbarWidth: 'thin' }}>
                          {rm.images.map((url, idx) => {
                            const isActive = (activeRoomImages[rm._id] || rm.images[0]) === url;
                            return (
                              <img 
                                key={idx}
                                src={url} 
                                alt={`Thumbnail ${idx + 1}`} 
                                onClick={() => setActiveRoomImages(prev => ({ ...prev, [rm._id]: url }))}
                                style={{ 
                                  width: '60px', 
                                  height: '45px', 
                                  objectFit: 'cover', 
                                  borderRadius: '4px', 
                                  border: isActive ? '2px solid var(--primary-color)' : '1.5px solid var(--border-color)', 
                                  cursor: 'pointer',
                                  opacity: isActive ? 1 : 0.7,
                                  transition: 'all 0.2s',
                                  flexShrink: 0 
                                }}
                                referrerPolicy="no-referrer"
                              />
                            );
                          })}
                        </div>

                        {/* Inline metadata chips */}
                        {(() => {
                          const meta = getRoomMeta(rm.category);
                          return (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary-color)', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '20px' }}>
                                📐 {meta.sqft}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', background: '#F1F5F9', padding: '4px 10px', borderRadius: '20px' }}>
                                🛏️ {meta.bed}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1E293B', background: '#F1F5F9', padding: '4px 10px', borderRadius: '20px' }}>
                                🏢 {meta.floor}
                              </span>
                            </div>
                          );
                        })()}
                        
                        <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'block', fontWeight: '600' }}>
                          ℹ️ Click any thumbnail above to swap the main photo
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <hr className="divider" />

          {/* Amenities checklist */}
          <div className="detail-amenities-section">
            <h4>{translate('facilities_features', language)}</h4>
            <div className="facilities-grid">
              {property.amenities?.map(facility => (
                <div key={facility} className="facility-item">
                  <div className="facility-icon-circle flex-center">
                    {facility === 'wifi' && <Wifi size={16} />}
                    {facility === 'hot_water' && <Flame size={16} />}
                    {facility === 'electricity' && <Zap size={16} />}
                    {facility === 'food' && <span>🍲</span>}
                    {facility === 'pool' && <span>🏊</span>}
                    {facility !== 'wifi' && facility !== 'hot_water' && facility !== 'electricity' && facility !== 'food' && facility !== 'pool' && <span>✨</span>}
                  </div>
                  <span className="facility-label">{facility.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          <hr className="divider" />

          {/* Property description */}
          <div className="detail-desc-section">
            <h4>{translate('description_label', language)}</h4>
            <p className="desc-text">{property.description}</p>
          </div>

          {/* Exact Map Location */}
          <hr className="divider" />
          <div className="detail-map-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0 }}>Location on Map</h4>
                <p className="sub-tagline" style={{ margin: '4px 0 0 0' }}>Explore the exact surroundings and reach details</p>
              </div>
              {property && property.location && property.location.lat && property.location.lng && (
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${property.location.lat},${property.location.lng}`}
                  target="_blank" 
                  rel="noreferrer"
                  style={{ padding: '8px 16px', background: '#2563EB', color: '#fff', fontSize: '13px', fontWeight: '600', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
                >
                  🗺️ Get Directions
                </a>
              )}
            </div>
            <div className="detail-map-card card" style={{ height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              {property && (
                <LeafletMap 
                  listings={[{
                    _id: property._id,
                    title: property.name,
                    price: selectedRoom?.price || 1500,
                    type: property.type === 'stay' || property.type === 'hotel' || property.type === 'resort' || property.type === 'villa' || property.type === 'homestay' ? 'stay' : 'rental',
                    location: {
                      address: property.address,
                      lat: property.location?.lat || 9.5929,
                      lng: property.location?.lng || 76.4227
                    }
                  }]} 
                  center={[property.location?.lat || 9.5929, property.location?.lng || 76.4227]} 
                  zoom={14} 
                  hideControls={true}
                />
              )}
            </div>
          </div>

          {/* Local Tours / USPs Section */}
          {propertyExperiences.length > 0 && (
            <>
              <hr className="divider" />
              <div className="detail-usps-section">
                <h4>{translate('direct_experiences', language)}</h4>
                <p className="sub-tagline">{translate('experiences_tagline', language)}</p>
                <div className="detail-usps-list">
                  {propertyExperiences.map((usp, idx) => (
                    <div 
                      key={idx} 
                      className={`detail-usp-card card flex-between ${selectedUsps.includes(idx) ? 'active' : ''}`}
                      onClick={() => handleUspToggle(idx)}
                    >
                      <div className="usp-text-info">
                        <h6>{usp.title}</h6>
                        <p>{usp.description}</p>
                      </div>
                      <div className="usp-price-toggle flex-center">
                        <span className="price-tag">+{formatPrice(usp.price)}</span>
                        <div className={`checkbox-circle flex-center ${selectedUsps.includes(idx) ? 'checked' : ''}`}>
                          {selectedUsps.includes(idx) && <span>✓</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Customer Reviews Section */}
          <hr className="divider" />
          <div className="detail-reviews-section">
            <h4>Customer Feedback & Reviews</h4>
            <p className="sub-tagline">Real reviews from guests who stayed at this property</p>
            
            <div className="reviews-summary-card card" style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '24px', padding: '24px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              {/* Score card */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '20px' }}>
                <span style={{ fontSize: '48px', fontWeight: '800', color: 'var(--primary-color)' }}>{property.starRating || '3.0'}</span>
                <div style={{ display: 'flex', gap: '2px', margin: '8px 0' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={18} fill={s <= Math.round(property.starRating || 3) ? '#F59E0B' : 'none'} stroke={s <= Math.round(property.starRating || 3) ? '#F59E0B' : '#CBD5E1'} />
                  ))}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>Overall Rating</span>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>({reviews.length} reviews)</span>
              </div>

              {/* Progress bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = reviews.filter(r => r.rating === stars).length;
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-medium)', width: '45px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {stars} ★
                      </span>
                      <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#F59E0B', borderRadius: '4px' }}></div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', width: '25px', textAlign: 'right' }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* List of comments - Horizontal scrollable carousel */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              overflowX: 'auto', 
              paddingBottom: '12px',
              scrollbarWidth: 'thin',
              scrollSnapType: 'x mandatory'
            }}>
              {reviews.length === 0 ? (
                <div className="empty-reviews text-center card" style={{ padding: '24px', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'white', width: '100%' }}>
                  <p style={{ margin: 0, color: 'var(--text-medium)', fontSize: '13px' }}>
                    No reviews submitted yet for this property. Be the first to rate your stay!
                  </p>
                </div>
              ) : (
                reviews.map(rev => (
                  <div 
                    key={rev._id} 
                    className="review-comment-card card" 
                    style={{ 
                      padding: '20px', 
                      borderRadius: '16px', 
                      border: '1px solid var(--border-color)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px', 
                      background: 'white',
                      minWidth: '280px',
                      maxWidth: '300px',
                      flexShrink: 0,
                      scrollSnapAlign: 'start',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {rev.customerProfileImage ? (
                          <img src={rev.customerProfileImage} alt={rev.customerName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '15px', flexShrink: 0 }}>
                            {rev.customerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text-dark)', display: 'block' }}>{rev.customerName}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block' }}>
                            {rev.roomCategory ? `${rev.roomCategory} room guest` : 'Verified Guest'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FEF3C7', color: '#D97706', padding: '4px 8px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '800' }}>
                        ★ {rev.rating.toFixed(1)}
                      </div>
                    </div>

                    {rev.comment && (
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: '13px', 
                        color: 'var(--text-medium)', 
                        lineHeight: '1.5', 
                        fontStyle: 'italic', 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        "{rev.comment}"
                      </p>
                    )}
                    <span style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: 'auto', alignSelf: 'flex-end' }}>
                      {new Date(rev.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Booking Form Card */}
        <div className="detail-booking-column">
          <div className="booking-sticky-card card">
            {bookingSuccess ? (
              /* Success Panel */
              <div className="booking-success-panel text-center">
                <CheckCircle size={48} className="success-icon" style={{ color: '#16A34A', margin: '0 auto 12px' }} />
                <h3>{translate('stay_confirmed_title', language)}</h3>
                <p className="success-desc">
                  {language === 'Tamil' ? `தங்கள் தங்குமிட முன்பதிவு வெற்றிகரமாக செய்யப்பட்டுள்ளது.` : `Your reservation at ${property.name} has been secured successfully.`}
                </p>
                
                <div className="success-receipt" style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', margin: '20px 0', border: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <div className="flex-between"><span>{translate('total_paid', language)}:</span><strong>{formatPrice(total)}</strong></div>
                  <div className="flex-between" style={{ marginTop: '6px' }}><span>{translate('checkin_date', language)}:</span><span>{startDate}</span></div>
                  <div className="flex-between" style={{ marginTop: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
                    <span>{translate('checkin_otp_key', language)}:</span>
                    <strong style={{ fontSize: '20px', color: 'var(--primary-color)', letterSpacing: '2px' }}>
                      {bookingSuccess.checkInOTP}
                    </strong>
                  </div>
                </div>

                <div className="payout-split-info-alert" style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', color: '#B45309', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
                  ⚠️ {translate('checkout_otp_warning', language)}
                </div>

                <div className="cab-promo-card card" style={{ padding: '16px', background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
                  <div className="flex promo-header" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <Car size={24} className="car-icon" style={{ color: 'var(--primary-color)' }} />
                    <h5 style={{ fontWeight: '800' }}>{translate('need_ride_title', language)}</h5>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-medium)', marginBottom: '12px' }}>{translate('need_ride_desc', language)}</p>
                  <Link to={`/ride?bookingId=${bookingSuccess._id}`} className="btn btn-accent btn-small btn-block">
                    {translate('book_cab_btn', language)}
                  </Link>
                </div>

                <button 
                  onClick={() => setBookingSuccess(null)} 
                  className="btn btn-outline btn-block btn-small"
                  style={{ marginTop: '16px' }}
                >
                  {translate('close_receipt', language)}
                </button>
              </div>
            ) : (
              /* Standard Checkout Panel */
              <div className="booking-checkout-form">
                <div className="price-header-row flex-between">
                  <div>
                    <span className="price-title">{translate('checkout_price_label', language)}</span>
                    <h3>{formatPrice(selectedRoom?.price || 0)}<span>{translate('checkout_night_suffix', language)}</span></h3>
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit}>
                  {/* Booking Type Toggle */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setBookingType('nightly')}
                      style={{
                        flex: 1, padding: '8px 6px', border: 'none', borderRadius: '7px', cursor: 'pointer',
                        background: bookingType === 'nightly' ? 'white' : 'transparent',
                        color: bookingType === 'nightly' ? '#0A3B2A' : '#64748B',
                        fontWeight: '700', fontSize: '12px',
                        boxShadow: bookingType === 'nightly' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      🌙 Standard Overnight Stay
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType('hourly')}
                      style={{
                        flex: 1, padding: '8px 6px', border: 'none', borderRadius: '7px', cursor: 'pointer',
                        background: bookingType === 'hourly' ? '#0A3B2A' : 'transparent',
                        color: bookingType === 'hourly' ? 'white' : '#64748B',
                        fontWeight: '700', fontSize: '12px',
                        boxShadow: bookingType === 'hourly' ? '0 1px 4px rgba(10,59,42,0.3)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      ⏰ Hourly Flexi-Pass
                    </button>
                  </div>

                  {bookingType === 'hourly' && (
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase' }}>
                        ⏰ Hourly Flexi-Pass
                      </p>
                      <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748B' }}>
                        Perfect for day transit, quick refreshes, and business stopovers. Billed at an hourly rate.
                      </p>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#0A3B2A', marginBottom: '6px', display: 'block' }}>
                        Duration (hours)
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[2, 3, 4, 6, 8, 12].map(h => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setDurationHours(h)}
                            style={{
                              padding: '6px 14px', borderRadius: '8px', border: '1.5px solid',
                              borderColor: durationHours === h ? '#0A3B2A' : '#CBD5E1',
                              background: durationHours === h ? '#0A3B2A' : 'white',
                              color: durationHours === h ? 'white' : '#475569',
                              fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                            }}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-medium)', marginBottom: '8px', display: 'block' }}>
                      {bookingType === 'hourly' ? 'Select Check-In Date' : 'Select Date'}
                    </label>
                    <DateRangeCalendar 
                      startDate={startDate}
                      endDate={endDate}
                      blockedDates={blockedDates}
                      onChange={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                      }}
                    />
                  </div>


                  <div className="booking-inputs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}><Calendar size={12} /> {translate('checkin_date', language)}</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formatDisplayDate(startDate)}
                        readOnly
                        placeholder="Select check-in"
                        style={{ padding: '8px 10px', fontSize: '13px', backgroundColor: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-dark)', cursor: 'default', fontWeight: '600' }}
                        required 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}><Calendar size={12} /> {translate('checkout_date', language)}</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formatDisplayDate(endDate)}
                        readOnly
                        placeholder="Select check-out"
                        style={{ padding: '8px 10px', fontSize: '13px', backgroundColor: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-dark)', cursor: 'default', fontWeight: '600' }}
                        required 
                      />
                    </div>
                  </div>

                  {/* Guest details form entry */}
                   {/* Guest Counter Steppers */}
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)' }}>Configure Guests</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '600' }}>Max Capacity: {selectedRoom?.capacity || 2}</span>
                    </div>

                    {/* Adults row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', display: 'block', textAlign: 'left' }}>Adults</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', textAlign: 'left' }}>Age 18+</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button type="button" onClick={() => handleAdultsChange(-1)} disabled={adultsCount <= 1} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>-</button>
                        <span style={{ fontSize: '14px', fontWeight: '700', width: '16px', textAlign: 'center' }}>{adultsCount}</span>
                        <button type="button" onClick={() => handleAdultsChange(1)} disabled={adultsCount + childrenCount >= (selectedRoom?.capacity || 2)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>+</button>
                      </div>
                    </div>

                    {/* Children row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #F1F5F9' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', display: 'block', textAlign: 'left' }}>Children</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', textAlign: 'left' }}>Age 2–17</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button type="button" onClick={() => handleChildrenChange(-1)} disabled={childrenCount <= 0} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>-</button>
                        <span style={{ fontSize: '14px', fontWeight: '700', width: '16px', textAlign: 'center' }}>{childrenCount}</span>
                        <button type="button" onClick={() => handleChildrenChange(1)} disabled={adultsCount + childrenCount >= (selectedRoom?.capacity || 2)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>+</button>
                      </div>
                    </div>

                    {/* Infants row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #F1F5F9' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', display: 'block', textAlign: 'left' }}>Infants</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block', textAlign: 'left' }}>Under 2</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button type="button" onClick={() => handleInfantsChange(-1)} disabled={infantsCount <= 0} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>-</button>
                        <span style={{ fontSize: '14px', fontWeight: '700', width: '16px', textAlign: 'center' }}>{infantsCount}</span>
                        <button type="button" onClick={() => handleInfantsChange(1)} disabled={infantsCount >= 3} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>+</button>
                      </div>
                    </div>
                  </div>

                  {/* Pet Availability Option */}
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={bringPet} 
                        onChange={e => setBringPet(e.target.checked)} 
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                      />
                      <span>Bringing a pet? 🐾</span>
                    </label>
                    
                    {bringPet && (
                      <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: '600' }}>
                        {property?.amenities?.some(a => ['pets', 'pets_allowed', 'pet_friendly', 'pet friendly', 'pet'].includes(a.toLowerCase())) ? (
                          <div style={{ color: '#16A34A', background: '#DCFCE7', border: '1px solid #86EFAC', padding: '8px 10px', borderRadius: '6px', textAlign: 'left' }}>
                            ✅ Host allows pets at this property! You can bring your furry companion.
                          </div>
                        ) : (
                          <div style={{ color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '8px 10px', borderRadius: '6px', textAlign: 'left' }}>
                            ⚠️ Host does NOT list pet friendliness as an amenity. Please confirm with host.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {savedGuests.length > 0 && (
                    <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-medium)', display: 'block', marginBottom: '6px' }}>
                        ⚡ Quick Select Saved Guest
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {savedGuests.map((savedG, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSavedGuest(savedG)}
                            style={{
                              padding: '4px 10px',
                              background: '#FFF',
                              border: '1.5px solid var(--primary-color)',
                              color: 'var(--primary-color)',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#FFF'; }}
                          >
                            👤 {savedG.name} ({savedG.age})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-medium)', marginBottom: '8px', display: 'block' }}>
                      Enter Guest Details
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {guestDetails.map((guest, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '8px' }}>
                          <input 
                            type="text" 
                            placeholder={idx < adultsCount ? `Guest ${idx + 1} (Adult) Full Name` : `Guest ${idx + 1} (Child) Full Name`}
                            value={guest.name}
                            onChange={e => {
                              const updated = [...guestDetails];
                              updated[idx].name = e.target.value;
                              setGuestDetails(updated);
                            }}
                            className="form-control"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            required
                          />
                          <input 
                            type="number" 
                            placeholder={idx < adultsCount ? "Age (18+)" : "Age (2-17)"}
                            value={guest.age}
                            min={idx < adultsCount ? "18" : "2"}
                            max={idx < adultsCount ? undefined : "17"}
                            onChange={e => {
                              const updated = [...guestDetails];
                              updated[idx].age = parseInt(e.target.value) || '';
                              setGuestDetails(updated);
                            }}
                            className="form-control"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '16px', marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-medium)', marginBottom: '6px', display: 'block' }}>
                      Note to Owner (optional)
                    </label>
                    <textarea
                      placeholder="e.g. Requesting ground floor room, late check-in, etc."
                      value={noteToOwner}
                      onChange={e => setNoteToOwner(e.target.value)}
                      className="form-control"
                      style={{ padding: '10px 14px', fontSize: '13px', minHeight: '70px', resize: 'vertical', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}
                    />
                  </div>

                  {/* Calculations summary */}
                  <div className="booking-summary-box" style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', margin: '16px 0' }}>
                    <div className="flex-between summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                      <span>
                        {formatPrice(selectedRoom?.price || 0)} x {calculateDays()} {translate('nights_suffix', language)}
                      </span>
                      <span>{formatPrice(base)}</span>
                    </div>

                    {selectedUsps.length > 0 && (
                      <div style={{ borderTop: '1px dashed var(--border-color)', margin: '8px 0', paddingTop: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-medium)', display: 'block', marginBottom: '6px', textAlign: 'left' }}>
                          Selected Experiences:
                        </span>
                        {selectedUsps.map(idx => {
                          const item = propertyExperiences[idx];
                          if (!item) return null;
                          const isPerPerson = item.chargeType === 'per_person';
                          const itemTotal = isPerPerson ? item.price * guestCount : item.price;
                          return (
                            <div key={idx} className="flex-between summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: 'var(--text-medium)' }}>
                              <span>
                                • {item.title} {isPerPerson ? `(₹${item.price} x ${guestCount})` : '(Flat Fee)'}
                              </span>
                              <span>{formatPrice(itemTotal)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {discount > 0 && (
                      <div className="flex-between summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: '#16A34A', fontWeight: '600' }}>
                        <span>{translate('checkout_coupon_label', language)}</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}

                    <hr className="summary-divider" style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '12px 0' }} />
                    
                    {nestPartnerDiscount > 0 && (
                      <div className="flex-between summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: '#16A34A', fontWeight: 'bold', background: '#DCFCE7', padding: '8px', borderRadius: '6px' }}>
                        <span>✨ Nest Partner Discount (Grand Tier)</span>
                        <span>-{formatPrice(nestPartnerDiscount)}</span>
                      </div>
                    )}

                    <div className="flex-between summary-row total-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '15px' }}>
                      <span>{translate('checkout_total_label', language)}</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Coupon Ticket Panel */}
                  <div className="coupon-ticket-panel" style={{ marginBottom: '20px' }}>
                    <div className="coupon-ticket">
                      <div className="coupon-ticket-notch left"></div>
                      <div className="coupon-ticket-notch right"></div>
                      <div className="coupon-ticket-content">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#0A3B2A', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🎟️ {translate('apply_promo_label', language)}
                          </label>
                          <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 8px 0', fontWeight: '500' }}>
                            Have a discount promo code? Redeem it below for direct savings.
                          </p>
                          <div className="flex gap-8" style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              type="text" 
                              placeholder="e.g. SUMMER20" 
                              value={couponCode} 
                              onChange={e => setCouponCode(e.target.value.toUpperCase())}
                              className="form-control"
                              style={{ padding: '8px 12px', fontSize: '13px', flex: 1, border: '1.5px solid #86EFAC', borderRadius: '8px' }}
                            />
                            <button 
                              type="button" 
                              onClick={handleApplyCoupon} 
                              className="btn btn-secondary btn-small" 
                              style={{ borderRadius: '8px', background: '#0A3B2A', color: 'white', border: 'none', fontWeight: '700', padding: '0 16px' }}
                            >
                              {translate('apply_btn', language)}
                            </button>
                          </div>
                        </div>
                        {couponSuccess && <p style={{ fontSize: '11px', color: '#16A34A', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>✅ {couponSuccess}</p>}
                        {couponError && <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>❌ {couponError}</p>}
                      </div>
                    </div>

                    {/* Available Offers (Rotated Ticket Layout - De-simulated) */}
                    {availableCoupons.length > 0 && (
                      <div>
                        <h4 className="available-offers-heading">
                          🏷️ Available Property Offers
                        </h4>
                        <div className="offers-tickets-list">
                          {availableCoupons.map((c) => (
                            <div 
                              key={c._id} 
                              className="nwn-offer-ticket"
                              onClick={() => {
                                setCouponCode(c.code);
                                // Call validate manually on click to apply it instantly
                                setTimeout(async () => {
                                  try {
                                    setCouponError('');
                                    setCouponSuccess('');
                                    const res = await api.coupons.validate(property._id, c.code);
                                    setAppliedCoupon(res);
                                    setCouponSuccess(`Coupon code applied! ${res.discountPercent}% discount is active.`);
                                  } catch (err) {
                                    setCouponError(err.message || 'Failed to apply coupon');
                                    setAppliedCoupon(null);
                                  }
                                }, 50);
                              }}
                            >
                              <div className="nwn-offer-ticket-notch left"></div>
                              <div className="nwn-offer-ticket-notch right"></div>
                              <div className="nwn-offer-ticket-divider"></div>
                              
                              <div className="nwn-offer-ticket-left">
                                <div className="nwn-offer-ticket-header">
                                  <span className="nwn-offer-ticket-logo">🦉</span>
                                  <span className="nwn-offer-ticket-code">{c.code}</span>
                                </div>
                                <h4 className="nwn-offer-ticket-title">
                                  Enjoy {c.discountPercent}% OFF on this stay
                                </h4>
                                <span className="nwn-offer-ticket-expiry">
                                  *Valid until {new Date(c.expiryDate).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="nwn-offer-ticket-right">
                                <span className="nwn-offer-ticket-discount-text">
                                  {c.discountPercent}% Off
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="booking-error-message" style={{ color: '#EF4444', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                      {error}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-block" disabled={bookingLoading}>
                    {bookingLoading 
                      ? translate('processing_checkout', language) 
                      : user 
                        ? translate('book_pay_btn', language) 
                        : translate('signin_to_book', language)
                    }
                  </button>
                  
                  <p className="booking-terms-text" style={{ fontSize: '11px', color: 'var(--text-light)', textAlign: 'center', marginTop: '12px' }}>
                    {translate('brokerage_free_ssl', language)}
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="lightbox-modal" 
          onClick={() => setIsLightboxOpen(false)}
          onTouchStart={handleLightboxTouchStart}
          onTouchMove={handleLightboxTouchMove}
          onTouchEnd={handleLightboxTouchEnd}
        >
          <button 
            type="button"
            className="lightbox-close-btn" 
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <X size={28} />
          </button>

          <button 
            type="button"
            className="lightbox-nav-btn lightbox-prev-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={36} />
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={displayPhotos[lightboxIdx]} 
              alt={`${property?.name || 'Stay'} full view ${lightboxIdx + 1}`} 
              className="lightbox-img" 
              referrerPolicy="no-referrer"
            />
            <div className="lightbox-caption">
              <h4>{property?.name || 'Stay'}</h4>
              <span>Photo {lightboxIdx + 1} of {displayPhotos.length}</span>
            </div>
          </div>

          <button 
            type="button"
            className="lightbox-nav-btn lightbox-next-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((prev) => (prev + 1) % displayPhotos.length);
            }}
            aria-label="Next image"
          >
            <ChevronRight size={36} />
          </button>

          <div className="lightbox-thumbnails-strip" onClick={(e) => e.stopPropagation()}>
            {displayPhotos.map((url, idx) => (
              <div 
                key={idx} 
                className={`lightbox-thumb-wrapper ${lightboxIdx === idx ? 'active' : ''}`}
                onClick={() => setLightboxIdx(idx)}
              >
                <img src={url} alt={`Thumbnail ${idx + 1}`} referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>
      )}


      {user && property && (
        <ChatWidget 
          propertyId={property._id} 
          customerId={user._id} 
          customerName={user.name} 
        />
      )}

    </div>
  );
};

export default DetailView;
