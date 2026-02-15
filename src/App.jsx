import React, { useState, useEffect } from 'react';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Hero from './components/home/Hero';
import HowItWorks from './components/home/HowItWorks';
import LoadingScreen from './components/common/LoadingScreen';
import BackgroundEffects from './components/common/BackgroundEffects';
import CreditsModal from './components/common/CreditsModal';
import LabAmbience from './components/common/LabAmbience';

// Pages
import AIChatPage from './pages/AIChatPage';
import SearchPage from './pages/SearchPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';
import UserAccountPage from './pages/UserAccountPage';
import OurStoryPage from './pages/OurStoryPage';
import ChatHistoryView from './pages/ChatHistoryView';

// Components
import AuthModal from './components/auth/AuthModal';

// Data
import { INITIAL_PRODUCTS } from './utils/mockData';

const App = () => {
  const [view, setView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Chat session state — threaded to Hero and CheckoutPage
  const [chatSessionId, setChatSessionId] = useState(null);
  const [viewChatSessionId, setViewChatSessionId] = useState(null);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Auth State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('3dprintables_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('3dprintables_token'));

  // Initialize from LocalStorage
  const [products, setProducts] = useState([]);

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('3dprintables_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch products from database on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/products');
        const data = await response.json();
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          const saved = localStorage.getItem('3dprintables_products');
          setProducts(saved ? JSON.parse(saved) : INITIAL_PRODUCTS);
        }
      } catch {
        // Backend unavailable — fall back to local/mock data silently
        const saved = localStorage.getItem('3dprintables_products');
        setProducts(saved ? JSON.parse(saved) : INITIAL_PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Persistence Effects
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('3dprintables_products', JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    localStorage.setItem('3dprintables_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (user) localStorage.setItem('3dprintables_user', JSON.stringify(user));
    else localStorage.removeItem('3dprintables_user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('3dprintables_token', token);
    else localStorage.removeItem('3dprintables_token');
  }, [token]);

  // Auth Functions
  const handleAuthSuccess = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('3dprintables_user');
    localStorage.removeItem('3dprintables_token');
  };

  // Cart Functions
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const addNewProduct = (product) => {
    setProducts(prev => [product, ...prev]);
  };

  const addBulkProducts = (newProducts) => {
    setProducts(prev => [...newProducts, ...prev]);
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen neon-bg font-['Outfit'] text-white flex flex-col selection:bg-purple-500/30 selection:text-white relative">
      <div className="neon-grid"></div>

      <LoadingScreen isLoading={isLoading} />
      <BackgroundEffects />

      <Navbar
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        setView={setView}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        user={user}
        logout={logout}
        openAuth={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1">
        <div style={{ display: view === 'home' ? 'block' : 'none' }}>
          <Hero setView={setView} addToCart={addToCart} user={user} chatSessionId={chatSessionId} setChatSessionId={setChatSessionId} />
          <HowItWorks />
        </div>
        {view === 'our-story' && <OurStoryPage setView={setView} />}
        {view === 'chat-history' && (
          <ChatHistoryView
            sessionId={viewChatSessionId}
            setView={setView}
            setChatSessionId={setChatSessionId}
          />
        )}
        {view === 'search' && <SearchPage setView={setView} />}
        {view === 'cart' && (
          <CheckoutPage
            cart={cart}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            clearCart={clearCart}
            setView={setView}
            user={user}
            onAuthSuccess={handleAuthSuccess}
            openAuth={() => setIsAuthModalOpen(true)}
            chatSessionId={chatSessionId}
          />
        )}
        {view === 'admin' && (
          <AdminDashboard
            addNewProduct={addNewProduct}
            addBulkProducts={addBulkProducts}
            deleteProduct={deleteProduct}
            products={products}
            setView={setView}
          />
        )}
        {view === 'account' && (
          <UserAccountPage
            user={user}
            logout={logout}
            setView={setView}
            addToCart={addToCart}
            onAuthSuccess={handleAuthSuccess}
            onViewChat={(sessionId) => { setViewChatSessionId(sessionId); setView('chat-history'); }}
          />
        )}
      </main>

      <Footer setView={setView} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <LabAmbience />
    </div>
  );
};

export default App;
