
import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import AutoBanner from './components/AutoBanner';
import CategorySection from './components/CategorySection';
import PromotionSection from './components/PromotionSection';
import ProductCarouselSection from './components/ProductCarouselSection';
import ProductGrid from './components/ProductGrid';
import CartPage from './components/CartPage';
import FavoritesPage from './components/FavoritesPage';
import CheckoutPage from './components/CheckoutPage';
import ProductDetailPage from './components/ProductDetailPage';
import OrdersPage from './components/OrdersPage';
import Terminal from './components/Terminal';
import TerminalLogin from './components/TerminalLogin';
import UserLogin from './components/UserLogin';
import ResetPasswordPage from './components/ResetPasswordPage';
import ProfileSettings from './components/ProfileSettings';
import CategoryPageView from './components/CategoryPageView';
import FlashOffersPage from './components/FlashOffersPage';
import ScrollToTop from './components/ScrollToTop';
import AboutPage from './components/AboutPage';
import TermsPage from './components/TermsPage';
import SupportPage from './components/SupportPage';
import ContactPage from './components/ContactPage';
import MobileNavbar from './components/MobileNavbar';
import CategoryGridPage from './components/CategoryGridPage';
import CartDrawer from './components/CartDrawer';
import ConfirmModal from './components/ConfirmModal';
import Notification from './components/Notification';
import { auth, db } from './firebase';
import { 
  Filter, 
  Menu,
  X,
  Facebook,
  Instagram,
  MessageSquare,
  CheckCircle, 
  Loader2, 
  Zap,
  Flame,
  Camera,
  Plus,
  ArrowLeft,
  Truck,
  CreditCard,
  ShieldCheck,
  Lock,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { getFooterIcon } from './utils';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  getDocs
} from "firebase/firestore";

export interface ProductVariant {
  image: string;
  url?: string;
}

export interface ProductSize {
  name: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  extraImages?: ProductVariant[]; 
  galleryImages?: string[]; 
  category: string;
  description?: string;
  supplierAddress?: string; 
  supplierZipCode?: string;
  supplierContact?: string; 
  productLink?: string;
  externalCheckoutLink?: string;
  pixQRCode?: string;
  pixUrl?: string;
  isFlashOffer?: boolean;
  isOutOfStock?: boolean;
  isActive?: boolean;
  useExternalButton?: boolean;
  externalButtonText?: string;
  whatsappNumber?: string;
  whatsappCheckoutLink?: string;
  sizes?: string[] | ProductSize[];
  stock?: number;
  rating?: number;
  reviewCount?: number;
  shippingText?: string;
  createdAt?: any;
  gtin?: string;
  ean?: string;
  ncm?: string;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  subnames?: string;
  image?: string;
  isHidden?: boolean;
  bannerUrl?: string;
  showAsHomeSection?: boolean;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  buttonText?: string;
  createdAt?: any;
}

export interface FooterLink {
  id: string;
  platform: string;
  url: string;
  iconUrl?: string;
  order: number;
  createdAt?: any;
}

export interface CartItem extends Product {
  quantity: number;
  selectedImage?: string;
  selectedVersionUrl?: string;
  selectedSize?: string;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'Pendente' | 'Em Rota' | 'Finalizado' | 'Anulado';
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerCpf?: string;
  userId?: string;
  archivedByTerminal?: boolean;
  address?: {
    cep: string;
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
    numero: string;
    complemento: string;
  };
  createdAt?: any;
}

type View = 'home' | 'cart' | 'favorites' | 'checkout' | 'order-success' | 'product-detail' | 'orders' | 'terminal' | 'terminal-login' | 'customer-login' | 'category-page' | 'profile' | 'flash-offers' | 'reset-password' | 'about' | 'terms' | 'support' | 'contact' | 'user-profile';

import UserProfilePage from './components/UserProfilePage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });
  const [oobCode, setOobCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('oobCode');
  });
  const [currentView, setCurrentView] = useState<View>(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCodeParam = params.get('oobCode');
    
    if ((mode === 'resetPassword' || mode === 'action') && oobCodeParam) {
      return 'reset-password';
    }

    const viewParam = params.get('view') as View;
    const productIdParam = params.get('id') || params.get('productId');
    const validViews: View[] = ['home', 'cart', 'favorites', 'checkout', 'order-success', 'product-detail', 'orders', 'terminal', 'terminal-login', 'customer-login', 'category-page', 'profile', 'flash-offers', 'reset-password', 'about', 'terms', 'support', 'contact', 'user-profile'];
    
    const userIdParam = params.get('userId');
    if (userIdParam && viewParam === 'user-profile') {
      return 'user-profile';
    }

    // Se temos ID de produto, forçamos a view product-detail
    if (productIdParam && !viewParam) {
      return 'product-detail';
    }
    
    return validViews.includes(viewParam) ? viewParam : 'home';
  });
  const [useExternalButton, setUseExternalButton] = useState<boolean>(() => {
    return localStorage.getItem('persistent_use_external_button') === 'true';
  });
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('userId');
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [promotionEndTime, setPromotionEndTime] = useState<number | null>(null);
  const [isFlashOfferActive, setIsFlashOfferActive] = useState<boolean>(true);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoSize, setLogoSize] = useState<number>(64);
  const [footerName, setFooterName] = useState<string>('');
  const [copyrightName, setCopyrightName] = useState<string>('Envazzy');
  const [footerQRCode, setFooterQRCode] = useState<string>('');
  const [loginLogoUrl, setLoginLogoUrl] = useState<string>('');
  const [loginBannerUrl, setLoginBannerUrl] = useState<string>('');
  const [navbarColor, setNavbarColor] = useState<string>('#ffffff');
  const [storeName, setStoreName] = useState<string>('');
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [pageTitles, setPageTitles] = useState<Record<string, string>>({
    home: 'Início',
    cart: 'Carrinho',
    favorites: 'Favoritos',
    checkout: 'Finalizar Compra',
    'order-success': 'Pedido Concluído',
    'product-detail': 'Detalhes do Produto',
    orders: 'Meus Pedidos',
    terminal: 'Terminal de Controle',
    'terminal-login': 'Acesso Restrito',
    'customer-login': 'Entrar / Cadastrar',
    'category-page': 'Categoria',
    profile: 'Meu Perfil',
    'flash-offers': 'Ofertas Relâmpago',
    'reset-password': 'Recuperar Senha',
    about: 'Sobre Nós',
    terms: 'Termos de Uso',
    support: 'Suporte',
    contact: 'Contato',
    'user-profile': 'Perfil do Usuário'
  });
  const [pageLinks, setPageLinks] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<{
    pix: string;
    picpay: string;
    nubank: string;
    visa: string;
    mastercard: string;
    extras?: string[];
  }>({
    pix: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_pix.png',
    picpay: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PicPay_logo.svg/1280px-PicPay_logo.svg.png',
    nubank: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nubank_logo_2021.svg/1200px-Nubank_logo_2021.svg.png',
    visa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png',
    mastercard: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png',
    extras: []
  });
  const [checkoutConfig, setCheckoutConfig] = useState<{
    bannerUrl: string;
    videoUrl?: string;
  }>({
    bannerUrl: '',
    videoUrl: '',
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [homeBannerUrl, setHomeBannerUrl] = useState<string>('');
  const isAdmin = user?.email?.toLowerCase() === "kwaigames2000@gmail.com";
  const [isEditingHomeBanner, setIsEditingHomeBanner] = useState(false);
  const [tempHomeBannerUrl, setTempHomeBannerUrl] = useState('');
  const homeBannerFileInputRef = useRef<HTMLInputElement>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('guest_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    isOpen: boolean;
  }>({
    message: '',
    type: 'success',
    isOpen: false,
  });
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type, isOpen: true });
    setTimeout(() => setNotification(prev => ({ ...prev, isOpen: false })), 3000);
  };

  const confirmAction = (config: { title: string, message: string, onConfirm: () => void, type?: 'danger' | 'info' }) => {
    setConfirmModal({ ...config, isOpen: true });
  };

  const [pendingProductAction, setPendingProductAction] = useState<Product | null>(null);
  const isPopStateNavigation = useRef(false);
  const internalHistoryCount = useRef(0);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentView === 'home') {
      url.searchParams.delete('view');
    } else if (currentView !== 'reset-password') {
      url.searchParams.set('view', currentView);
    }
    
    const safeProduct = selectedProduct ? JSON.parse(JSON.stringify(selectedProduct)) : null;
    
    if (selectedProduct) {
      url.searchParams.set('id', selectedProduct.id);
    } else if (currentView !== 'product-detail') {
      url.searchParams.delete('id');
      url.searchParams.delete('productId');
    }

    if (searchTerm) {
      url.searchParams.set('q', searchTerm);
    } else {
      url.searchParams.delete('q');
    }
    
    if (isPopStateNavigation.current) {
      window.history.replaceState({ view: currentView, product: safeProduct, category: activeCategory }, '', url.toString());
    } else {
      const currentState = window.history.state;
      const isSameState = currentState && 
        currentState.view === currentView && 
        currentState.product?.id === selectedProduct?.id && 
        currentState.category === activeCategory;
        
      if (!isSameState) {
        window.history.pushState({ view: currentView, product: safeProduct, category: activeCategory }, '', url.toString());
        internalHistoryCount.current++;
      }
    }
  }, [currentView, selectedProduct, activeCategory]);

  useEffect(() => {
    if (products.length > 0 && currentView === 'product-detail' && !selectedProduct) {
      const params = new URLSearchParams(window.location.search);
      const productId = params.get('id') || params.get('productId');
      if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
          setSelectedProduct(product);
        }
      }
    }
  }, [products, currentView, selectedProduct]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      isPopStateNavigation.current = true;
      if (internalHistoryCount.current > 0) internalHistoryCount.current--;
      
      const params = new URLSearchParams(window.location.search);
      setSearchTerm(params.get('q') || '');

      if (event.state) {
        if (event.state.view) setCurrentView(event.state.view);
        if (event.state.product !== undefined) setSelectedProduct(event.state.product);
        if (event.state.category !== undefined) setActiveCategory(event.state.category);
      } else {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view') as View;
        const validViews: View[] = ['home', 'cart', 'favorites', 'checkout', 'order-success', 'product-detail', 'orders', 'terminal', 'terminal-login', 'customer-login', 'category-page', 'profile', 'flash-offers', 'reset-password', 'about', 'terms', 'support', 'contact'];
        if (validViews.includes(viewParam)) {
          setCurrentView(viewParam);
        } else {
          setCurrentView('home');
          setSelectedProduct(null);
          setActiveCategory('');
        }
      }
      
      // Use a slightly longer timeout to ensure all state updates are processed
      setTimeout(() => {
        isPopStateNavigation.current = false;
      }, 100);
    };

    window.addEventListener('popstate', handlePopState);
    
    const url = new URL(window.location.href);
    const safeProduct = selectedProduct ? JSON.parse(JSON.stringify(selectedProduct)) : null;
    window.history.replaceState({ view: currentView, product: safeProduct, category: activeCategory }, '', url.toString());
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        isActive: true,
        ...doc.data(),
        id: doc.id
      })) as Product[];
      setProducts(productsData);
      setIsLoadingProducts(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "config", "pageTitles"), (doc) => {
      if (doc.exists()) {
        setPageTitles(prev => ({ ...prev, ...doc.data() }));
      }
    });

    const unsubscribeLinks = onSnapshot(doc(db, "config", "pageLinks"), (doc) => {
      if (doc.exists()) {
        setPageLinks(doc.data() as Record<string, string>);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeLinks();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "config", "paymentMethods"), (doc) => {
      if (doc.exists()) {
        setPaymentMethods(prev => ({ ...prev, ...doc.data() }));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (pageLinks[currentView]) {
      const link = pageLinks[currentView].trim();
      // Only redirect if it's NOT a full HTML block
      if (!link.toLowerCase().includes('<!doctype html>')) {
        if (link.startsWith('http') || link.startsWith('https://') || link.startsWith('wa.me')) {
          let finalLink = link;
          if (link.startsWith('wa.me')) finalLink = `https://${link}`;
          window.open(finalLink, '_blank');
          setCurrentView('home'); 
        }
      }
    }
  }, [currentView, pageLinks]);

  useEffect(() => {
    if (currentView === 'product-detail' && selectedProduct) {
      document.title = selectedProduct.name;
    } else if (currentView === 'category-page' && activeCategory) {
      document.title = `Categorias | ${activeCategory}`;
    } else {
      const currentTitle = pageTitles[currentView];
      if (currentTitle) {
        document.title = currentTitle;
      } else {
        document.title = storeName || '';
      }
    }
  }, [currentView, pageTitles, storeName, selectedProduct, activeCategory, categories]);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Category[];
      setCategories(categoriesData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bannersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Banner[];
      setBanners(bannersData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "footer_links"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as FooterLink[];
      setFooterLinks(linksData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "orders"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Order[];
        ordersData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setOrders(ordersData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Order[];
      setAllOrders(ordersData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const settingsDoc = doc(db, "settings", "promotion");
    const unsubscribePromotion = onSnapshot(settingsDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPromotionEndTime(data.endTime || null);
        setIsFlashOfferActive(data.isActive !== false);
      }
    });
    
    const logoDoc = doc(db, "settings", "logo");
    const unsubscribeLogo = onSnapshot(logoDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setLogoUrl(data.url || '');
        setFaviconUrl(data.faviconUrl || '');
        setLogoSize(data.size || 64);
        setFooterName(data.footerName !== undefined ? data.footerName : '');
        setCopyrightName(data.copyrightName !== undefined ? data.copyrightName : 'Envazzy');
        setFooterQRCode(data.footerQRCode || '');
        setLoginLogoUrl(data.loginUrl || '');
        setLoginBannerUrl(data.loginBannerUrl || '');
        setNavbarColor(data.navbarColor || '#ffffff');
        setStoreName(data.name || '');
      } else {
        setLogoUrl('');
        setLogoSize(64);
        setFooterName('');
        setCopyrightName('Envazzy');
        setFooterQRCode('');
        setLoginLogoUrl('');
        setLoginBannerUrl('');
        setNavbarColor('#ffffff');
        setStoreName('');
      }
    });

    const checkoutDoc = doc(db, "config", "checkout");
    const unsubscribeCheckout = onSnapshot(checkoutDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCheckoutConfig({
          bannerUrl: data.bannerUrl || '',
          videoUrl: data.videoUrl || '',
        });
      }
    });

    const homeDoc = doc(db, "settings", "home");
    const unsubscribeHome = onSnapshot(homeDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setHomeBannerUrl(data.bannerUrl || '');
      }
    });

    return () => {
      unsubscribePromotion();
      unsubscribeLogo();
      unsubscribeCheckout();
      unsubscribeHome();
    };
  }, []);

  useEffect(() => {
    const q = collection(db, "reviews");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const productId = data.productId;
        if (productId) {
          counts[productId] = (counts[productId] || 0) + 1;
        }
      });
      setReviewCounts(counts);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const favDocRef = doc(db, "user_favorites", user.uid);
      const unsubscribe = onSnapshot(favDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setFavorites(docSnap.data().productIds || []);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('guest_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (user) {
      const cartDocRef = doc(db, "user_carts", user.uid);
      const unsubscribe = onSnapshot(cartDocRef, (docSnap) => {
        let cloudItems: CartItem[] = [];
        if (docSnap.exists()) {
          cloudItems = docSnap.data().items || [];
        }

        const savedCartJson = localStorage.getItem('guest_cart');
        const localItems: CartItem[] = savedCartJson ? JSON.parse(savedCartJson) : [];

        // LÓGICA DE MERGE ROBUSTA:
        // Se a nuvem está vazia mas temos itens locais, estamos provavelmente em uma nova aba
        // ou acabamos de logar. Devemos manter os itens locais e sincronizar para a nuvem.
        if (cloudItems.length === 0 && localItems.length > 0) {
          setCart(localItems);
          syncCartToCloud(localItems);
        } else if (cloudItems.length > 0) {
          // Se a nuvem tem itens, vamos garantir que unimos com os locais (se houver algum novo)
          // mas priorizamos a estrutura da nuvem para evitar duplicatas.
          const mergedItems = [...cloudItems];
          localItems.forEach(localItem => {
            const isAlreadyInCloud = mergedItems.some(cloudItem => 
              cloudItem.id === localItem.id && 
              cloudItem.selectedImage === localItem.selectedImage && 
              cloudItem.selectedSize === localItem.selectedSize
            );
            if (!isAlreadyInCloud) {
              mergedItems.push(localItem);
            }
          });

          if (mergedItems.length > cloudItems.length) {
            setCart(mergedItems);
            syncCartToCloud(mergedItems);
          } else {
            setCart(cloudItems);
          }
        } else {
          setCart([]);
        }
        
        setIsCartLoading(false);
      });
      return () => unsubscribe();
    } else if (!isAuthLoading) {
      setIsCartLoading(false);
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setIsCartLoading(true);
      setIsAuthLoading(false);
      if (currentUser && pendingProductAction) {
        setSelectedProduct(pendingProductAction);
        setCurrentView('product-detail');
        setPendingProductAction(null);
      }
    });
    return () => unsubscribe();
  }, [pendingProductAction]);

  const handleSaveHomeBanner = async () => {
    try {
      await setDoc(doc(db, "settings", "home"), { bannerUrl: tempHomeBannerUrl }, { merge: true });
      showNotification('Banner da home atualizado com sucesso!', 'success');
      setIsEditingHomeBanner(false);
    } catch (err) {
      showNotification('Erro ao salvar banner.', 'error');
    }
  };

  const handleHomeBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const compressed = await resizeImage(base64);
      setTempHomeBannerUrl(compressed);
    };
    reader.readAsDataURL(file);
  };

  const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200; // Increased for banners
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width / height > MAX_WIDTH / MAX_HEIGHT) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    });
  };
  const handleLogout = async () => {
    await signOut(auth);
    setCart([]);
    setFavorites([]);
    setCurrentView('home');
  };

  const handleToggleExternalButton = (value: boolean) => {
    setUseExternalButton(value);
    localStorage.setItem('persistent_use_external_button', String(value));
  };

  const handleLogoClick = () => {
    window.location.href = '/';
  };

  const handleGoHome = () => {
    setSearchTerm('');
    setActiveCategory('');
    setActiveTag(null);
    setCurrentView('home');
    setSelectedProduct(null);
    setIsCartOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromFlashOffers = () => {
    setSearchTerm('');
    setActiveCategory('');
    setCurrentView('home');
    setSelectedProduct(null);
    setIsCartOpen(false);
    
    // Pequeno delay para garantir que o componente foi renderizado na home antes de scroll
    setTimeout(() => {
      const element = document.getElementById('flash-offers-section');
      if (element) {
        const offset = -100; // Ajuste para navbar fixa
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition + offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term) {
      setCurrentView('home');
    }
  };

  const handleCategoryClick = (category: string, tag?: string) => {
    setActiveCategory(category);
    setActiveTag(tag || null);
    setCurrentView('category-page');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      // Remover campos undefined que podem causar erros no Firestore
      const cleanedProduct = JSON.parse(JSON.stringify(newProduct));
      
      await addDoc(collection(db, "products"), {
        ...cleanedProduct,
        createdAt: serverTimestamp(),
      });
      showNotification('Produto adicionado com sucesso!');
    } catch (error) {
      console.error('Erro detalhado ao adicionar produto:', error);
      showNotification('Erro ao sincronizar. Verifique os campos ou sua conexão.', 'error');
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const cleanedUpdates = JSON.parse(JSON.stringify(updates));
      await updateDoc(doc(db, "products", id), cleanedUpdates);
      showNotification('Produto atualizado!');
    } catch (error) {
      console.error('Erro detalhado ao atualizar produto:', error);
      showNotification('Erro ao atualizar. Verifique os campos ou sua conexão.', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Deletar Produto',
      message: 'Tem certeza que deseja deletar este produto permanentemente? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          // Delete product
          await deleteDoc(doc(db, "products", id));
          
          // Delete associated reviews
          const reviewsQuery = query(collection(db, "reviews"), where("productId", "==", id));
          const reviewsSnapshot = await getDocs(reviewsQuery);
          const deletePromises = reviewsSnapshot.docs.map(reviewDoc => deleteDoc(reviewDoc.ref));
          await Promise.all(deletePromises);
          
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const handleDeleteAllProducts = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Deletar Todos os Produtos',
      message: 'TEM CERTEZA? Isso apagará TODOS os produtos do estoque permanentemente. Esta ação é IRREVERSÍVEL.',
      onConfirm: async () => {
        try {
          const productsSnapshot = await getDocs(collection(db, "products"));
          const deletePromises = productsSnapshot.docs.map(productDoc => deleteDoc(productDoc.ref));
          await Promise.all(deletePromises);
          
          // Also delete all reviews
          const reviewsSnapshot = await getDocs(collection(db, "reviews"));
          const deleteReviewPromises = reviewsSnapshot.docs.map(reviewDoc => deleteDoc(reviewDoc.ref));
          await Promise.all(deleteReviewPromises);
          
          showNotification('Todos os produtos foram removidos!');
        } catch (error) {
          console.error(error);
          showNotification('Erro ao remover produtos.', 'error');
        }
      }
    });
  };

  const handleAddBanner = async (newBanner: Omit<Banner, 'id'>) => {
    try {
      await addDoc(collection(db, "banners"), {
        ...newBanner,
        createdAt: serverTimestamp()
      });
      showNotification('Banner criado!');
    } catch (error) {
      showNotification('Erro ao criar banner.', 'error');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Banner',
      message: 'Deseja realmente excluir este banner?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "banners", id));
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  useEffect(() => {
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [faviconUrl]);

  const handleSaveAppearance = async (url: string, name: string, loginUrl?: string, navColor?: string, size?: number, fName?: string, cName?: string, favUrl?: string, loginBanner?: string, footerQR?: string) => {
    try {
      await setDoc(doc(db, "settings", "logo"), { 
        url, 
        name, 
        loginUrl: loginUrl || '', 
        loginBannerUrl: loginBanner || '',
        navbarColor: navColor || '#ffffff',
        size: size || 64,
        footerName: fName !== undefined ? fName : '',
        copyrightName: cName !== undefined ? cName : 'Envazzy',
        faviconUrl: favUrl || '',
        footerQRCode: footerQR || ''
      }, { merge: true });
      showNotification('Identidade visual salva!');
    } catch (error) {
      showNotification('Erro ao salvar identidade visual.', 'error');
    }
  };

  const handleAddFooterLink = async (newLink: Omit<FooterLink, 'id' | 'order'>) => {
    try {
      const order = footerLinks.length > 0 ? Math.max(...footerLinks.map(l => l.order || 0)) + 1 : 0;
      await addDoc(collection(db, "footer_links"), {
        ...newLink,
        order,
        createdAt: serverTimestamp()
      });
      showNotification('Link adicionado!');
    } catch (error) {
      showNotification('Erro ao criar link.', 'error');
    }
  };

  const handleUpdateFooterLink = async (id: string, updates: Partial<FooterLink>) => {
    try {
      await updateDoc(doc(db, "footer_links", id), updates);
      showNotification('Link atualizado!');
    } catch (error) {
      showNotification('Erro ao atualizar link.', 'error');
    }
  };

  const handleUpdateFooterLinkOrder = async (id: string, newOrder: number) => {
    try {
      await updateDoc(doc(db, "footer_links", id), { order: newOrder });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteFooterLink = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Link',
      message: 'Deseja excluir este link do rodapé?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "footer_links", id));
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const handleAddCategory = async (name: string, subnames: string = '', image: string = '', bannerUrl: string = '', showAsHomeSection: boolean = false) => {
    try {
      const order = categories.length > 0 ? Math.max(...categories.map(c => c.order)) + 1 : 0;
      await addDoc(collection(db, "categories"), { 
        name, 
        order, 
        subnames, 
        image, 
        bannerUrl,
        showAsHomeSection 
      });
      showNotification('Categoria criada!');
    } catch (error) {
      showNotification('Erro ao criar categoria.', 'error');
    }
  };

  const handleUpdateCategory = async (categoryId: string, updates: Partial<Category>) => {
    try {
      await updateDoc(doc(db, "categories", categoryId), updates);
      showNotification('Categoria atualizada!');
    } catch (error) {
      showNotification('Erro ao atualizar categoria.', 'error');
    }
  };

  const handleUpdateCategoryOrder = async (categoryId: string, newOrder: number) => {
    try {
      await updateDoc(doc(db, "categories", categoryId), { order: newOrder });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Categoria',
      message: 'Tem certeza que deseja excluir esta categoria?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "categories", id));
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const handleUpdatePromotionTimer = async (hours: number, isActive: boolean = true) => {
    const endTime = Date.now() + hours * 3600000;
    try {
      await setDoc(doc(db, "settings", "promotion"), { endTime, isActive });
      showNotification('Timer configurado!');
    } catch (error) {
      showNotification('Erro ao configurar timer.', 'error');
    }
  };

  const handleTogglePromotion = async (isActive: boolean) => {
    try {
      await setDoc(doc(db, "settings", "promotion"), { isActive }, { merge: true });
      showNotification(isActive ? 'Promoção ativada!' : 'Promoção desativada!');
    } catch (error) {
      showNotification('Erro ao alternar promoção.', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      showNotification('Status atualizado!');
    } catch (error) {
      showNotification('Erro ao atualizar status.', 'error');
    }
  };

  const handleUpdateCheckoutConfig = async (config: any) => {
    try {
      await setDoc(doc(db, "config", "checkout"), config);
      // Notificação removida para salvamento silencioso conforme solicitado
    } catch (error) {
      showNotification('Erro ao salvar configurações.', 'error');
    }
  };

  const handleArchiveOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { archivedByTerminal: true });
      showNotification('Pedido arquivado!');
    } catch (error) {
      showNotification('Erro ao arquivar.', 'error');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Pedido',
      message: 'Deseja realmente excluir este pedido do seu histórico?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "orders", orderId));
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const handleProductClick = (product: Product) => {
    if (!user) {
      setPendingProductAction(product);
      setCurrentView('customer-login');
      return;
    }
    // Abrir em nova aba quando estiver logado
    const url = new URL(window.location.origin);
    url.searchParams.set('view', 'product-detail');
    url.searchParams.set('id', product.id);
    window.open(url.toString(), '_blank');
  };

  const handleUserProfileClick = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView('user-profile');
  };

  const syncCartToCloud = async (newItems: CartItem[]) => {
    if (!user) return;
    const cartDocRef = doc(db, "user_carts", user.uid);
    try {
      await setDoc(cartDocRef, { items: newItems }, { merge: true });
    } catch (error) {
      console.error(error);
    }
  };

  const addToCart = async (product: Product, quantity: number = 1, selectedImage?: string, selectedVersionUrl?: string, selectedSize?: string, customPrice?: number) => {
    if (!user) {
      setCurrentView('customer-login');
      return;
    }
    const finalPrice = customPrice !== undefined ? customPrice : product.price;
    const existing = cart.find(item => 
      item.id === product.id && 
      item.selectedImage === (selectedImage || product.image) &&
      item.selectedSize === selectedSize &&
      item.price === finalPrice
    );
    let newCart: CartItem[];
    if (existing) {
      newCart = cart.map(item => 
        (item.id === product.id && item.selectedImage === (selectedImage || product.image) && item.selectedSize === selectedSize && item.price === finalPrice) 
        ? { ...item, quantity: item.quantity + quantity, selectedVersionUrl: selectedVersionUrl || item.selectedVersionUrl } 
        : item
      );
    } else {
      newCart = [...cart, { ...product, price: finalPrice, quantity, selectedImage: selectedImage || product.image, selectedVersionUrl, selectedSize }];
    }
    setCart(newCart);
    await syncCartToCloud(newCart);
    setIsCartOpen(true);
  };

  const handleBuyNow = (product: Product, quantity: number, selectedImage?: string, selectedVersionUrl?: string, _isExternal?: boolean, selectedSize?: string, customPrice?: number) => {
    const finalPrice = customPrice !== undefined ? customPrice : product.price;
    // Verificar se é Redirecionamento de WhatsApp
    const isWhatsApp = product.useExternalButton && (
      product.externalButtonText?.toLowerCase().includes('whatsapp') || 
      product.externalButtonText?.toLowerCase().includes('whats')
    );

    if (isWhatsApp && product.whatsappNumber) {
      let cleanNumber = product.whatsappNumber.replace(/\D/g, '');
      // Se já tiver o DDI 55, não precisa adicionar
      // Se tiver 10 ou 11 dígitos, é um número brasileiro sem DDI
      if (cleanNumber.length === 10 || cleanNumber.length === 11) {
        cleanNumber = `55${cleanNumber}`;
      }
      const sizeText = selectedSize ? `*Tipo:* ${selectedSize}` : '';
      const checkoutLink = product.whatsappCheckoutLink || selectedVersionUrl || product.externalCheckoutLink || `${window.location.origin}/?view=product-detail&productId=${product.id}`;
      const priceText = finalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      
      const messageText = `\u{1F44B} Olá! Tudo bem? Gostaria de fazer um pedido:\n\n*Produto:* ${product.name}\n${sizeText ? sizeText + '\n' : ''}*Quantidade:* ${quantity}\n*Preço:* ${priceText}\n\n\u{1F4CD} Finalizar seu pedido pelo checkout abaixo:\n\n*CHECKOUT*\n\u{1F517} ${checkoutLink}\n\nObrigado!`;
      
      const message = encodeURIComponent(messageText);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${message}`;
      
      // No mobile, window.open pode ser bloqueado por popups
      // Usamos window.location.href para redirecionar diretamente
      window.location.href = whatsappUrl;
      return;
    }

    const checkoutLink = selectedVersionUrl || product.externalCheckoutLink;
    
    if (checkoutLink) {
      window.open(checkoutLink, '_blank');
      return;
    }
    
    if (!user) {
      setPendingProductAction(product);
      setCurrentView('customer-login');
      return;
    }

    // Usamos o selectedImage passado ou a imagem principal do produto
    const img = selectedImage || product.image;
    
    // ATUALIZAÇÃO SÍNCRONA: Garantir que o carrinho seja persistido antes da nova aba
    const existingIndex = cart.findIndex(item => 
      item.id === product.id && 
      item.selectedImage === img && 
      item.selectedSize === selectedSize
    );

    let newCart: CartItem[];
    if (existingIndex > -1) {
      newCart = cart.map((item, idx) => idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item);
    } else {
      newCart = [...cart, { ...product, quantity, selectedImage: img, selectedVersionUrl, selectedSize }];
    }

    setCart(newCart);
    localStorage.setItem('guest_cart', JSON.stringify(newCart));
    syncCartToCloud(newCart);
    window.open(window.location.origin + '?view=checkout', '_blank');
  };

  const handleGoToCheckout = () => {
    // Verificar se algum item no carrinho tem o botão substituído por WhatsApp
    const whatsAppItem = cart.find(item => 
      item.useExternalButton && (
        item.externalButtonText?.toLowerCase().includes('whatsapp') || 
        item.externalButtonText?.toLowerCase().includes('whats')
      ) && item.whatsappNumber
    );

    if (whatsAppItem) {
      let cleanNumber = whatsAppItem.whatsappNumber!.replace(/\D/g, '');
      // Se já tiver o DDI 55, não precisa adicionar
      if (cleanNumber.length === 10 || cleanNumber.length === 11) {
        cleanNumber = `55${cleanNumber}`;
      }
      const itemsList = cart.map(item => {
        const sizeText = item.selectedSize ? ` [Tam: ${item.selectedSize}]` : '';
        return `*Produto:* ${item.name}${sizeText}\n*Quantidade:* ${item.quantity}\n*Preço:* ${item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      }).join('\n\n');
      
      const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const checkoutLink = cart.length === 1 
        ? (cart[0].whatsappCheckoutLink || cart[0].selectedVersionUrl || cart[0].externalCheckoutLink || `${window.location.origin}/?view=checkout`)
        : `${window.location.origin}/?view=checkout`;

      const messageText = `\u{1F44B} Olá! Tudo bem? Gostaria de fazer um pedido:\n\n` +
        `*PEDIDO*\n${itemsList}\n\n` +
        `*Total Geral: ${totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n\n` +
        `\u{1F4CD} Finalizar seu pedido pelo checkout abaixo:\n\n` +
        `*CHECKOUT*\n\u{1F517} ${checkoutLink}\n\n` +
        `Obrigado!`;

      const message = encodeURIComponent(messageText);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${message}`;
      
      window.location.href = whatsappUrl;
      return;
    }

    // SÓ redirecionar para checkout externo se houver APENAS 1 item no carrinho.
    // Se for um "Kit" (mais de 1 item), usamos o nosso checkout interno para mostrar todos os produtos.
    if (cart.length === 1) {
      const itemWithLink = cart[0];
      const checkoutLink = itemWithLink.selectedVersionUrl || itemWithLink.externalCheckoutLink;
      
      if (checkoutLink) {
        window.open(checkoutLink, '_blank');
        return;
      }
    }

    setIsCartOpen(false);
    localStorage.setItem('guest_cart', JSON.stringify(cart));
    window.open(window.location.origin + '?view=checkout', '_blank');
  };

  const removeFromCart = async (id: string, selectedImage?: string, selectedSize?: string) => {
    if (!user) return;
    const newCart = cart.filter(item => !(item.id === id && item.selectedImage === selectedImage && item.selectedSize === selectedSize));
    setCart(newCart);
    await syncCartToCloud(newCart);
  };

  const updateQuantity = async (id: string, delta: number, selectedImage?: string, selectedSize?: string) => {
    if (!user) return;
    const newCart = cart.map(item => 
      (item.id === id && item.selectedImage === selectedImage && item.selectedSize === selectedSize) 
      ? { ...item, quantity: Math.max(1, item.quantity + delta) } 
      : item
    );
    setCart(newCart);
    await syncCartToCloud(newCart);
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      setCurrentView('customer-login');
      return;
    }
    const favDocRef = doc(db, "user_favorites", user.uid);
    const newFavorites = favorites.includes(productId) ? favorites.filter(id => id !== productId) : [...favorites, productId];
    try {
      await setDoc(favDocRef, { productIds: newFavorites }, { merge: true });
    } catch (error) {
      console.error(error);
    }
  };

  const finalizePurchase = async (checkoutData: { name: string, email: string, phone: string, cpf: string, address: any }) => {
    if (!user) return;
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    try {
      const orderData = {
        userId: user.uid,
        customerName: checkoutData.name,
        customerPhone: checkoutData.phone,
        customerEmail: checkoutData.email,
        customerCpf: checkoutData.cpf,
        address: checkoutData.address,
        date: new Date().toLocaleDateString('pt-BR'),
        items: [...cart],
        total: subtotal,
        status: 'Pendente' as const,
        createdAt: serverTimestamp(),
        archivedByTerminal: false
      };
      const docRef = await addDoc(collection(db, "orders"), orderData);
      setLastOrder({ ...orderData, id: docRef.id });
      setCart([]);
      setIsOrderSuccessOpen(true);
    } catch (error) {
      showNotification('Erro ao finalizar.', 'error');
    }
  };

  const updatePaymentMethods = async (newMethods: any) => {
    try {
      await setDoc(doc(db, "config", "paymentMethods"), newMethods);
      showNotification('Formas de pagamento atualizadas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar formas de pagamento:', error);
      showNotification('Erro ao atualizar formas de pagamento.', 'error');
    }
  };

  const updatePageTitles = async (titles: Record<string, string>) => {
    try {
      await setDoc(doc(db, "config", "pageTitles"), titles);
      showNotification('Títulos das abas atualizados!');
    } catch (error) {
      showNotification('Erro ao atualizar títulos.', 'error');
    }
  };

  const updatePageLinks = async (links: Record<string, string>) => {
    try {
      await setDoc(doc(db, "config", "pageLinks"), links);
      showNotification('Links das páginas atualizados!');
    } catch (error) {
      showNotification('Erro ao atualizar links.', 'error');
    }
  };

  const isHideGlobalUI = currentView === 'terminal-login' || currentView === 'customer-login' || currentView === 'terminal' || currentView === 'reset-password' || currentView === 'checkout' || (new URLSearchParams(window.location.search).get('hideUI') === 'true');
  const isShowAnnouncement = !isHideGlobalUI && currentView !== 'cart' && !isCartOpen;
  const visibleProducts = products.filter(p => p.isActive !== false);
  const flashOfferProducts = visibleProducts.filter(p => p.isFlashOffer);
  
  const brasileiraoCategory = categories.find(c => c.name === 'Camisa Torcedor');
  const showBrasileirao = brasileiraoCategory?.showAsHomeSection && !brasileiraoCategory?.isHidden;
  const brasileiraoProducts = showBrasileirao ? visibleProducts.filter(p => p.category === 'Camisa Torcedor').slice(0, 5) : [];
  
  const regularProducts = visibleProducts.filter(p => !p.isFlashOffer);

  const dynamicCategorySections = categories
    .filter(c => c.showAsHomeSection && !c.isHidden && c.name !== 'Camisa Torcedor' && !['Início', 'Promoção', 'Ofertas'].includes(c.name))
    .map(category => ({
      title: category.name,
      products: visibleProducts.filter(p => p.category === category.name).slice(0, 5),
      id: category.id
    }))
    .filter(section => section.products.length > 0);

  const renderContent = () => {
    if ((isLoadingProducts && currentView === 'home') || isAuthLoading) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-black animate-spin" />
        </div>
      );
    }

    // Check if there is custom HTML for this view
    if (pageLinks[currentView] && pageLinks[currentView].trim().toLowerCase().includes('<!doctype html>')) {
      return (
        <div className="fixed inset-0 z-[9999] bg-white">
          <iframe 
            srcDoc={pageLinks[currentView]} 
            className="w-full h-full border-none"
            title="Custom Page Content"
          />
          <button 
            onClick={() => setCurrentView('home')}
            className="fixed bottom-6 right-6 bg-black text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl z-[10000] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para a Loja
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'profile':
        if (!user) {
          setCurrentView('home');
          return null;
        }
        return <ProfileSettings user={user} onBack={handleGoHome} onUpdate={() => {}} onLogout={handleLogout} confirmAction={confirmAction} showNotification={showNotification} />;
      case 'user-profile':
        if (!selectedUserId) {
          setCurrentView('home');
          return null;
        }
        return <UserProfilePage userId={selectedUserId} onBack={handleGoHome} showNotification={showNotification} />;
      case 'reset-password':
        return (
          <ResetPasswordPage 
            oobCode={oobCode || ''}
            onBack={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('mode');
              url.searchParams.delete('oobCode');
              url.searchParams.delete('apiKey');
              url.searchParams.delete('lang');
              window.history.replaceState({}, '', url.toString());
              setCurrentView('customer-login');
            }} 
          />
        );
      case 'customer-login':
        return (
          <UserLogin 
            onLogin={() => {
              handleGoHome();
            }} 
            onBack={handleGoHome} 
            logoUrl={loginLogoUrl || logoUrl}
            bannerUrl={loginBannerUrl}
            footerLinks={footerLinks}
          />
        );
      case 'terminal-login':
        return <TerminalLogin onLogin={() => setCurrentView('terminal')} logoUrl={loginLogoUrl || logoUrl} bannerUrl={loginBannerUrl} />;
      case 'terminal':
        if (!user || user.email?.toLowerCase() !== "kwaigames2000@gmail.com") {
          setCurrentView('terminal-login');
          return null;
        }
        return (
          <Terminal 
            onAddProduct={handleAddProduct} 
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct} 
            onDeleteAllProducts={handleDeleteAllProducts}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdateCategoryOrder={handleUpdateCategoryOrder}
            onUpdatePromotionTimer={handleUpdatePromotionTimer}
            onTogglePromotion={handleTogglePromotion}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onArchiveOrder={handleArchiveOrder}
            onAddBanner={handleAddBanner}
            onDeleteBanner={handleDeleteBanner}
            onAddFooterLink={handleAddFooterLink}
            onUpdateFooterLink={handleUpdateFooterLink}
            onUpdateFooterLinkOrder={handleUpdateFooterLinkOrder}
            onDeleteFooterLink={handleDeleteFooterLink}
            products={products}
            categories={categories}
            banners={banners}
            footerLinks={footerLinks}
            orders={allOrders}
            promotionEndTime={promotionEndTime}
            isFlashOfferActive={isFlashOfferActive}
            logoUrl={logoUrl}
            faviconUrl={faviconUrl}
            loginLogoUrl={loginLogoUrl}
            loginBannerUrl={loginBannerUrl}
            navbarColor={navbarColor}
            storeName={storeName}
            logoSize={logoSize}
            footerName={footerName}
            copyrightName={copyrightName}
            footerQRCode={footerQRCode}
            pageTitles={pageTitles}
            onUpdatePageTitles={updatePageTitles}
            pageLinks={pageLinks}
            onUpdatePageLinks={updatePageLinks}
            onSaveAppearance={handleSaveAppearance}
            paymentMethods={paymentMethods}
            onUpdatePaymentMethods={updatePaymentMethods}
            checkoutConfig={checkoutConfig}
            onUpdateCheckoutConfig={handleUpdateCheckoutConfig}
            onUseExternalButtonChange={handleToggleExternalButton}
          />
        );
      case 'flash-offers':
        return <FlashOffersPage products={flashOfferProducts} onAddToCart={addToCart} favorites={favorites} onToggleFavorite={toggleFavorite} onProductClick={handleProductClick} onBack={handleBackFromFlashOffers} reviewCounts={reviewCounts} />;
      case 'category-page':
        if (!activeCategory) {
          setCurrentView('home');
          return null;
        }
        const activeCatData = categories.find(c => c.name === activeCategory);
        return <CategoryPageView category={activeCategory} subnames={activeCatData?.subnames} bannerUrl={activeCatData?.bannerUrl} products={visibleProducts.filter(p => p.category === activeCategory)} initialTag={activeTag} onAddToCart={addToCart} favorites={favorites} onToggleFavorite={toggleFavorite} onProductClick={handleProductClick} onBack={handleGoHome} reviewCounts={reviewCounts} />;
      case 'product-detail':
        if (!selectedProduct) {
          const params = new URLSearchParams(window.location.search);
          const productId = params.get('id') || params.get('productId');
          if (productId) {
            if (products.length > 0) {
              const product = products.find(p => p.id === productId);
              if (product) {
                return (
                  <ProductDetailPage 
                    product={product} 
                    allProducts={visibleProducts} 
                    isFavorite={favorites.includes(product.id)} 
                    onToggleFavorite={toggleFavorite} 
                    onAddToCart={addToCart} 
                    onBuyNow={handleBuyNow} 
                    onBack={handleGoHome} 
                    onCategoryClick={handleCategoryClick} 
                    onProductClick={handleProductClick} 
                    onUserProfileClick={handleUserProfileClick}
                    reviewCounts={reviewCounts} 
                    showNotification={showNotification} 
                    paymentMethods={paymentMethods} 
                    categories={categories}
                  />
                );
              } else {
                setCurrentView('home');
                return null;
              }
            } else if (isLoadingProducts) {
              return (
                <div className="min-h-screen bg-white flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-zinc-100 border-t-zinc-800 rounded-full animate-spin" />
                </div>
              );
            }
          }
          setCurrentView('home');
          return null;
        }
        return <ProductDetailPage product={selectedProduct} allProducts={visibleProducts} categories={categories} isFavorite={favorites.includes(selectedProduct.id)} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} onBuyNow={handleBuyNow} onBack={handleGoHome} onCategoryClick={handleCategoryClick} onProductClick={handleProductClick} onUserProfileClick={handleUserProfileClick} reviewCounts={reviewCounts} showNotification={showNotification} paymentMethods={paymentMethods} />;
      case 'cart':
        return <CartPage cart={cart} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} onContinueShopping={handleGoHome} onGoToCheckout={handleGoToCheckout} onProductClick={handleProductClick} />;
      case 'favorites':
        if (!user) {
          setCurrentView('home');
          return null;
        }
        return <FavoritesPage favoriteIds={favorites} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} onProductClick={handleProductClick} onContinueShopping={handleGoHome} allProducts={visibleProducts} />;
      case 'orders':
        if (!user) {
          setCurrentView('home');
          return null;
        }
        return <OrdersPage orders={orders} onContinueShopping={handleGoHome} onProductClick={handleProductClick} onDeleteOrder={handleDeleteOrder} />;
      case 'checkout':
        return (
          <div className="relative min-h-screen">
            {user ? (
              <CheckoutPage 
                cart={cart} 
                isLoading={isCartLoading}
                onBackToCart={() => setCurrentView('cart')} 
                onOrderComplete={finalizePurchase} 
                showNotification={showNotification} 
                paymentMethods={paymentMethods} 
                checkoutConfig={checkoutConfig} 
                logoUrl={logoUrl}
                storeName={storeName}
              />
            ) : (
              <UserLogin onLogin={() => setCurrentView('checkout')} onBack={handleGoHome} logoUrl={loginLogoUrl || logoUrl} bannerUrl={loginBannerUrl} />
            )}

            {isOrderSuccessOpen && lastOrder && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-scale-in">
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-black mb-2">Pedido Realizado!</h1>
                    <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-[280px]">Seu pedido foi registrado com sucesso. Finalize o pagamento para garantir sua reserva.</p>
                  </div>

                  {(() => {
                    const firstItemWithPix = lastOrder.items.find(item => item.pixQRCode || item.pixUrl);
                    const pixQRCode = firstItemWithPix?.pixQRCode;
                    const pixUrl = firstItemWithPix?.pixUrl;

                    return (pixQRCode || pixUrl) && (
                      <div className="space-y-4 mb-8">
                        <div className="bg-zinc-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Escaneie o QR Code Pix</span>
                          {pixQRCode ? (
                            <div className="bg-white p-3 rounded-2xl shadow-sm mb-4 border border-gray-100">
                              <img 
                                src={pixQRCode} 
                                alt="QR Code Pix" 
                                className="w-48 h-48 object-contain select-none pointer-events-none" 
                                referrerPolicy="no-referrer" 
                                draggable="false"
                                onContextMenu={(e) => e.preventDefault()}
                              />
                            </div>
                          ) : (
                            <div className="w-48 h-48 bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
                              <Zap className="w-10 h-10 text-gray-400" />
                            </div>
                          )}
                          
                          {pixUrl && (
                            <div className="w-full space-y-3">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <span className="h-px bg-gray-200 flex-1"></span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ou copie o código</span>
                                <span className="h-px bg-gray-200 flex-1"></span>
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  readOnly 
                                  value={pixUrl} 
                                  className="flex-grow bg-white border border-gray-200 px-4 py-3 rounded-xl text-[10px] font-mono text-gray-600 outline-none focus:border-black transition-colors"
                                />
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(pixUrl);
                                    showNotification('Código copiado!');
                                  }}
                                  className="bg-black text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors active:scale-95"
                                >
                                  Copiar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        const message = "Pedido Realizado";
                        const phone = "5521998726891";
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                        
                        showNotification('Verificando pagamento... Redirecionando suporte.', 'success');
                        setTimeout(() => {
                          setIsOrderSuccessOpen(false);
                          setCurrentView('orders');
                        }, 2000);
                      }} 
                      className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black uppercase text-[12px] tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      <img 
                        src="https://img.icons8.com/?size=50&id=16712&format=png&color=ffffff" 
                        alt="WhatsApp" 
                        className="w-5 h-5"
                      />
                      Verificar Pagamento
                    </button>
                    <button 
                      onClick={() => setIsOrderSuccessOpen(false)}
                      className="w-full py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
                    >
                      Depois eu pago
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'order-success':
        return null; // Handled as overlay in checkout
      case 'about':
        return <AboutPage />;
      case 'terms':
        return <TermsPage />;
      case 'support':
        return <SupportPage />;
      case 'contact':
        return <ContactPage />;
      case 'categories':
        return <CategoryGridPage categories={categories} onCategoryClick={handleCategoryClick} onBack={handleGoHome} />;
      default:
        return (
          <>
            {!searchTerm && <AutoBanner banners={banners} />}
            
            {/* Seção de Benefícios Limpa Estilo Marketplace */}
            {!searchTerm && (
              <section className="bg-[#f8f8f8] pt-4 pb-0 md:pt-8 md:pb-0">
                <div className="container mx-auto px-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-wrap md:flex-nowrap divide-x divide-gray-100 overflow-hidden">
                    {/* Frete Grátis */}
                    <div className="flex-1 min-w-[50%] md:min-w-0 flex items-center justify-center py-4 md:py-8 px-2 md:px-6 hover:bg-gray-50/50 transition-colors group">
                      <Truck className="w-5 h-5 md:w-8 md:h-8 text-gray-400 group-hover:text-black transition-colors shrink-0 mr-2 md:mr-4" />
                      <div className="flex flex-col">
                        <h3 className="text-[10px] md:text-sm font-bold text-gray-800 leading-tight">Frete Grátis</h3>
                        <p className="text-[8px] md:text-xs text-gray-400 font-medium">Entrega em todo Brasil</p>
                      </div>
                    </div>

                    {/* Suporte WhatsApp */}
                    <div className="flex-1 min-w-[50%] md:min-w-0 flex items-center justify-center py-4 md:py-8 px-2 md:px-6 hover:bg-gray-50/50 transition-colors group border-l md:border-l-0 border-gray-100">
                      <img 
                        src="https://img.icons8.com/?size=50&id=16712&format=png" 
                        alt="WhatsApp" 
                        className="w-5 h-5 md:w-8 md:h-8 text-gray-400 group-hover:text-black transition-all opacity-40 group-hover:opacity-100 shrink-0 mr-2 md:mr-4"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col">
                        <h3 className="text-[10px] md:text-sm font-bold text-gray-800 leading-tight">Não achou seu Manto!</h3>
                        <p className="text-[8px] md:text-xs text-gray-400 font-medium">Fale com nossa equipe</p>
                      </div>
                    </div>

                    {/* Pagamento à Vista */}
                    <div className="flex-1 min-w-[50%] md:min-w-0 flex items-center justify-center py-4 md:py-8 px-2 md:px-6 hover:bg-gray-50/50 transition-colors group border-t md:border-t-0 border-gray-100 md:border-l">
                      <img 
                        src="https://img.icons8.com/?size=50&id=CuUOYOfd3Dy9&format=png" 
                        alt="PIX" 
                        className="w-5 h-5 md:w-8 md:h-8 text-gray-400 group-hover:text-black transition-all opacity-40 group-hover:opacity-100 shrink-0 mr-2 md:mr-4"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col">
                        <h3 className="text-[10px] md:text-sm font-bold text-gray-800 leading-tight">Pagamento à vista</h3>
                        <p className="text-[8px] md:text-xs text-gray-400 font-medium">10% de desconto no PIX</p>
                      </div>
                    </div>

                    {/* Segurança */}
                    <div className="flex-1 min-w-[50%] md:min-w-0 flex items-center justify-center py-4 md:py-8 px-2 md:px-6 hover:bg-gray-50/50 transition-colors group border-t md:border-t-0 border-gray-100 md:border-l">
                      <Lock className="w-5 h-5 md:w-8 md:h-8 text-gray-400 group-hover:text-black transition-colors shrink-0 mr-2 md:mr-4" />
                      <div className="flex flex-col">
                        <h3 className="text-[10px] md:text-sm font-bold text-gray-800 leading-tight">Segurança</h3>
                        <p className="text-[8px] md:text-xs text-gray-400 font-medium">Loja com SSL de proteção</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {!searchTerm && (
              <div id="categories-section">
                <CategorySection categories={categories.filter(c => !c.isHidden)} onCategoryClick={handleCategoryClick} />
              </div>
            )}

            {!searchTerm && (
              <div className="mb-8 md:mb-10 relative">
                {homeBannerUrl ? (
                  <div className="w-full h-40 md:h-80 overflow-hidden bg-gray-100">
                    <img 
                      src={homeBannerUrl} 
                      alt="Banner Principal" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  isAdmin && (
                    <div className="container mx-auto px-4">
                      <div className="w-full h-40 md:h-80 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 bg-white">
                        <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest text-center px-4">
                          Nenhum banner configurado. Clique para adicionar.
                        </span>
                      </div>
                    </div>
                  )
                )}

                {isAdmin && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => {
                        setTempHomeBannerUrl(homeBannerUrl);
                        setIsEditingHomeBanner(true);
                      }}
                      className="p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-black hover:bg-white transition-all shadow-lg"
                      title="Editar banner"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {!searchTerm && (
              <div className="mb-8 w-full h-auto overflow-hidden">
                <img 
                  src="/banners/banner_002.png" 
                  alt="Banner Promocional" 
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
                />
              </div>
            )}
            {!searchTerm && isFlashOfferActive && flashOfferProducts.length > 0 && (
              <div id="flash-offers-section">
                <PromotionSection 
                  products={flashOfferProducts} 
                  onAddToCart={addToCart} 
                  onProductClick={handleProductClick} 
                  endTime={promotionEndTime} 
                  onSeeAll={() => setCurrentView('flash-offers')} 
                  reviewCounts={reviewCounts} 
                  showRating={false}
                />
              </div>
            )}

            <main className={`flex-grow container mx-auto px-4 ${searchTerm ? 'py-8' : 'pt-0 md:pt-8 pb-8'}`} id="search-results-anchor">
              <div className="flex flex-col md:flex-row gap-8">
                {searchTerm && (
                  <aside className="hidden md:block w-full md:w-64 shrink-0 animate-fade-in">
                    <div className="bg-white p-6 border border-gray-200 rounded shadow-sm sticky top-28">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                        {searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase()}
                      </h2>
                      
                      <h4 className="text-base font-semibold text-gray-900 mb-4 px-1">
                        Resultados Relacionados
                      </h4>
                      
                      <div className="flex flex-col gap-3">
                        {(() => {
                          const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                          const filterNormalized = normalize(searchTerm);
                          const terms = filterNormalized.split(/\s+/).filter(w => w.length > 2 || !['do', 'da', 'de', 'o', 'a', 'com', 'para'].includes(w));
                          
                          // Get matching products
                          const filtered = visibleProducts.filter(p => {
                            const nameNormalized = normalize(p.name);
                            if (terms.length === 0) return nameNormalized.includes(filterNormalized);
                            return terms.every(t => nameNormalized.includes(t));
                          });

                          if (filtered.length === 0) return null;

                          // Helper to clean names and get unique list
                          const uniqueLabels = new Map<string, Product>();
                          
                          filtered.forEach(p => {
                            const fillerWords = [
                              ...terms, 
                              'camisa', 'camiseta', 'tshirt', 'oficial', 'manto', 'jogo', 
                              'torcedor', 'tailandesa', 'premium', 'luxo', 
                              'masculina', 'feminina', 'infantil', 'unissex', 'do', 'da', 'de', 'e', 'com',
                              'retro', 'classic', 'clássica', 'versão', 'edição', 'especial',
                              'home', 'away', 'third', 'titular', 'reserva', 'terceira', 'terceiro',
                              'goleiro', 'treino', 'aquecimento', 'pre-jogo', 'azul', 'branca', 'preta', 
                              'vermelha', 'verde', 'amarela', 'rosa', 'roxa', 'cinza', 'laranja', 'vinho',
                              'adidas', 'nike', 'puma', 'umbro', 'kappa', 'mizuno', 'reebok', 'jordan',
                              'new balance', 'under armour', 'marinho', 'celeste', 'grená', 'dourada', 'prata'
                            ];
                            
                            let label = p.name.toLowerCase();
                            
                            // Remove patterns like 24/25, 2024, etc.
                            label = label.replace(/\b\d{2,4}(\/\d{2,4})?\b/g, '');
                            
                            // Remove Roman numerals like I, II, III
                            label = label.replace(/\b(I|II|III|IV|V)\b/gi, '');
                            
                            fillerWords.forEach(word => {
                              const regex = new RegExp(`\\b${word}\\b`, 'gi');
                              label = label.replace(regex, '');
                            });
                            
                            // Remove punctuation and extra spaces
                            label = label.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
                            
                            // Take only the first significant part (if it's a team name it's usually 1-2 words)
                            const words = label.split(' ');
                            if (words.length > 2) {
                              label = words.slice(0, 2).join(' ');
                            }
                            
                            if (!label || label.length < 2) label = p.name;
                            
                            const finalLabel = label.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                            if (!uniqueLabels.has(finalLabel) && finalLabel.length > 1) {
                              uniqueLabels.set(finalLabel, p);
                            }
                          });

                          return Array.from(uniqueLabels.entries()).slice(0, 15).map(([label, p]) => (
                            <button 
                              key={p.id} 
                              onClick={() => handleSearch(label)}
                              className={`text-sm text-left transition-colors px-1 py-0.5 ${normalize(searchTerm) === normalize(label) ? 'font-bold text-black border-l-4 border-red-600 pl-3' : 'text-gray-600 hover:text-red-600'}`}
                            >
                              {label}
                            </button>
                          ));
                        })()}
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4 px-1">
                          Custo-benefício
                        </h4>
                        <button className="text-sm text-[#3483fa] hover:underline block mb-2 px-1">
                          Menores Preços
                        </button>
                        <button className="text-sm text-gray-600 hover:text-gray-900 block px-1">
                          Mais Vendidos
                        </button>
                      </div>
                    </div>
                  </aside>
                )}
                
                <div className="flex-grow">
                  {searchTerm && (
                    <div className="md:hidden mb-6 flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-1">Resultado da pesquisa para</span>
                        <span className="text-sm font-black text-black uppercase tracking-tight">
                          "{searchTerm}"
                        </span>
                      </div>
                      <button 
                        onClick={() => setIsFilterDrawerOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                      >
                        <Menu className="w-3.5 h-3.5" />
                        Opções
                      </button>
                    </div>
                  )}


                  {!searchTerm && brasileiraoProducts.length > 0 && (
                    <div className="mb-12">
                      <ProductCarouselSection 
                        title="Brasileirão"
                        products={brasileiraoProducts} 
                        onProductClick={handleProductClick} 
                        onSeeMore={() => handleCategoryClick('Camisa Torcedor')}
                      />
                    </div>
                  )}

                  {!searchTerm && dynamicCategorySections.map((section, idx) => (
                    <div key={section.id || idx} className="mb-12">
                      <ProductCarouselSection 
                        title={section.title}
                        products={section.products} 
                        onProductClick={handleProductClick} 
                        onSeeMore={() => handleCategoryClick(section.title)}
                      />
                    </div>
                  ))}

                  <header className={`mb-6 ${searchTerm ? 'hidden md:flex' : 'flex'} flex-col sm:flex-row sm:items-end justify-between gap-4`}>
                    <div className="w-full">
                      {searchTerm ? (
                        <div className="flex flex-col gap-8">
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <span className="flex items-center gap-2">
                              <span className="text-gray-400">Resultado da pesquisa para</span>
                              <span className="text-black font-bold text-lg">"{searchTerm}"</span>
                            </span>
                          </div>
                          
                          <div className="mt-12 border-l-4 border-black pl-3">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Resultados</h2>
                          </div>
                        </div>
                      ) : (
                        <div id="featured-products-section">
                          <div className="flex items-center gap-2 mb-6 relative">
                            <div className="flex items-center gap-3">
                              <img 
                                src="https://img.icons8.com/?size=80&id=8WQPUWuO9x9b&format=png" 
                                alt="Destaque Icon" 
                                className="w-12 h-12 object-contain"
                              />
                              <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-[#1a1a1a]">
                                Produtos em Destaque
                              </h2>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </header>
                  
                  <ProductGrid 
                    products={searchTerm ? visibleProducts : regularProducts} 
                    filter={searchTerm} 
                    onAddToCart={addToCart} 
                    favorites={favorites} 
                    onToggleFavorite={toggleFavorite} 
                    onProductClick={handleProductClick} 
                    reviewCounts={reviewCounts} 
                    showRating={false}
                    isSearchResultsPage={!!searchTerm}
                    hideFavorites={true}
                  />
                </div>
              </div>
            </main>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 overflow-x-hidden" style={{ zoom: 0.9 }}>
      {!isHideGlobalUI && (
        <>
          {isShowAnnouncement && (
            <div className="fixed top-0 left-0 right-0 z-[1001] bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] h-8 flex items-center justify-center text-center">
              Frete grátis em compras acima de R$250,00!
            </div>
          )}
          <Navbar 
            onSearch={handleSearch} 
          onViewChange={(view) => {
            if (view === 'cart') {
              setIsCartOpen(true);
            } else {
              setCurrentView(view);
            }
          }} 
          onGoHome={handleGoHome} 
          onLogoClick={handleLogoClick} 
          cartCount={cart.length} 
          favoritesCount={favorites.length} 
          user={user} 
          onLogout={handleLogout} 
          profileVersion={0} 
          masterEmail="kwaigames2000@gmail.com" 
          logoUrl={logoUrl} 
          logoSize={logoSize}
          navbarColor={navbarColor} 
          storeName={storeName} 
          useExternalButton={useExternalButton}
          onToggleExternalButton={handleToggleExternalButton}
          onMenuToggle={setIsUserMenuOpen}
          suggestions={[...products.map(p => p.name), ...categories.map(c => c.name)]}
          isOffset={isShowAnnouncement}
        />
      </>
      )}
      <div className={!isHideGlobalUI ? (isShowAnnouncement ? "pt-[107px] md:pt-[122px]" : "pt-[75px] md:pt-[90px]") : ""}>
        {renderContent()}
      </div>
      
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart} 
        onRemove={removeFromCart} 
        onUpdateQuantity={updateQuantity} 
        onGoToCheckout={() => {
          setIsCartOpen(false);
          handleGoToCheckout();
        }} 
        onViewCart={() => {
          setIsCartOpen(false);
          setCurrentView('cart');
        }}
        onProductClick={handleProductClick} 
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
      />

      <Notification 
        isOpen={notification.isOpen}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />

      {!isHideGlobalUI && (
        <div id="footer-section">
          <footer className="bg-white border-t pt-16 pb-8 mt-20 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                {/* Logo Centralizado no Topo */}
                <div className="flex flex-col items-center mb-16">
                  <div onClick={handleLogoClick} className="flex flex-col items-center cursor-pointer group">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt={storeName} 
                        className="h-16 object-contain select-none pointer-events-none" 
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg border-2 border-black flex items-center justify-center font-black text-sm text-black bg-white group-hover:bg-black group-hover:text-white transition-colors">
                        {storeName ? storeName.substring(0, 2).toUpperCase() : 'EV'}
                      </div>
                    )}
                    {footerName && (
                      <span className="font-black tracking-tight text-3xl uppercase text-black mt-2">
                        {footerName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid Principal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 items-start">
                  
                  {/* Seção Institucional - Box Arredondado Cinza */}
                  <div className="bg-[#fcfcfc] p-10 rounded-[2rem] border border-gray-50 shadow-sm h-full flex flex-col items-center md:items-start text-center md:text-left">
                    <h3 className="text-[12px] font-black italic uppercase tracking-[0.4em] text-black mb-10 w-full">Institucional</h3>
                    <nav className="flex flex-col gap-6 text-[13px] font-normal text-[#666666] w-full">
                        <button onClick={handleGoHome} className="hover:text-black transition-colors text-left flex items-center justify-center md:justify-start gap-2 group relative pb-1 overflow-hidden w-fit">
                          Home
                          <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-red-600 transition-all duration-300 group-hover:w-full"></span>
                        </button>
                        <button onClick={() => setCurrentView('about')} className="hover:text-black transition-colors text-left flex items-center justify-center md:justify-start gap-2 group relative pb-1 overflow-hidden w-fit">
                          Sobre Nós
                          <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-red-600 transition-all duration-300 group-hover:w-full"></span>
                        </button>
                        <button onClick={() => setCurrentView('terms')} className="hover:text-black transition-colors text-left flex items-center justify-center md:justify-start gap-2 group relative pb-1 overflow-hidden w-fit">
                          Termos de Uso
                          <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-red-600 transition-all duration-300 group-hover:w-full"></span>
                        </button>
                        <button onClick={() => setCurrentView('support')} className="hover:text-black transition-colors text-left flex items-center justify-center md:justify-start gap-2 group relative pb-1 overflow-hidden w-fit">
                          Suporte
                          <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-red-600 transition-all duration-300 group-hover:w-full"></span>
                        </button>
                        <button onClick={() => setCurrentView('contact')} className="hover:text-black transition-colors text-left flex items-center justify-center md:justify-start gap-2 group relative pb-1 overflow-hidden w-fit">
                          Fale Conosco
                          <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-red-600 transition-all duration-300 group-hover:w-full"></span>
                        </button>
                    </nav>
                  </div>

                  {/* Seção Categorias - Centralizado */}
                  <div className="flex flex-col items-center pt-2">
                    <h3 className="text-[12px] font-black italic uppercase tracking-[0.4em] text-black mb-10 text-center">Categorias</h3>
                    <div className="grid grid-cols-1 gap-y-6 items-center text-center">
                      {categories.filter(cat => !cat.isHidden).slice(0, 12).map((cat) => (
                        <button 
                          key={cat.id} 
                          onClick={() => handleCategoryClick(cat.name)}
                          className="text-[13px] font-normal text-[#666666] hover:text-black transition-colors group relative pb-1 overflow-hidden"
                        >
                          {cat.name}
                          <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-red-600 transition-all duration-300 group-hover:w-full"></span>
                        </button>
                      ))}
                      {categories.length === 0 && (
                        <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest italic">Nenhuma categoria criada</p>
                      )}
                    </div>
                  </div>

                  {/* Seção Siga-nos - Direita com Linha */}
                  <div className="flex flex-col items-center md:items-end w-full pt-2">
                    <div className="w-full flex items-center gap-4 mb-8">
                       <div className="flex-grow h-[1px] bg-gray-200"></div>
                       <p className="text-[10px] font-black italic uppercase tracking-[0.4em] text-black whitespace-nowrap">Siga-nos</p>
                    </div>
                    <div className="flex gap-4">
                      {footerLinks.slice(0, 5).map(link => (
                        <a 
                          key={link.id} 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-gray-100 text-gray-400 transition-all transform hover:-translate-y-1 shadow-sm hover:border-red-600 hover:text-red-600 hover:bg-red-50"
                        >
                          {link.iconUrl ? (
                            <div 
                              style={{ 
                                maskImage: `url(${link.iconUrl})`, 
                                WebkitMaskImage: `url(${link.iconUrl})`,
                                maskSize: 'contain',
                                WebkitMaskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                WebkitMaskRepeat: 'no-repeat',
                                backgroundColor: 'currentColor'
                              }}
                              className="w-6 h-6"
                            />
                          ) : (
                            getFooterIcon(link.platform)
                          )}
                        </a>
                      ))}
                      {footerLinks.length === 0 && (
                        <>
                          <div className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-400 transition-all cursor-pointer hover:border-red-600 hover:text-red-600 hover:bg-red-50"><Facebook className="w-5 h-5" /></div>
                          <div className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-400 transition-all cursor-pointer hover:border-red-600 hover:text-red-600 hover:bg-red-50"><Instagram className="w-5 h-5" /></div>
                          <div className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-400 transition-all cursor-pointer hover:border-red-600 hover:text-red-600 hover:bg-red-50">
                            <div 
                              style={{ 
                                maskImage: 'url(https://img.icons8.com/?size=50&id=16712&format=png&color=000000)', 
                                WebkitMaskImage: 'url(https://img.icons8.com/?size=50&id=16712&format=png&color=000000)',
                                maskSize: 'contain',
                                WebkitMaskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                WebkitMaskRepeat: 'no-repeat',
                                backgroundColor: 'currentColor'
                              }}
                              className="w-6 h-6"
                            />
                          </div>
                          <div className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-400 transition-all cursor-pointer hover:border-red-600 hover:text-red-600 hover:bg-red-50">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.052-.102.001-.226-.113-.269a13.194 13.194 0 0 1-1.872-.894.078.078 0 0 1-.008-.13c.126-.094.252-.192.372-.29a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .077.01c.12.098.246.196.373.29a.078.078 0 0 1-.006.131 12.861 12.861 0 0 1-1.873.894.077.077 0 0 0-.11.27c.357.698.763 1.362 1.23 1.993.05.07.124.1.201.07a19.853 19.853 0 0 0 6.027-3.03.077.077 0 0 0 .032-.056c.465-5.19-.842-9.674-3.588-13.66a.066.066 0 0 0-.032-.027ZM8.02 15.33c-1.182 0-2.156-1.085-2.156-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.156 2.419 0 1.334-.956 2.419-2.156 2.419Zm7.974 0c-1.182 0-2.156-1.085-2.156-2.419 0-1.333.946-2.419 2.156-2.419 1.21 0 2.175 1.096 2.156 2.419 0 1.334-.946 2.419-2.156 2.419Z"/></svg>
                          </div>
                          <div className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-400 transition-all cursor-pointer hover:border-red-600 hover:text-red-600 hover:bg-red-50"><X className="w-5 h-5" /></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Linha Final: Pagamento e Copyright */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12">
                  {/* Pagamento */}
                  <div className="bg-[#fcfcfc] px-10 py-6 rounded-2xl border border-gray-50 flex flex-col items-center">
                    <p className="text-[9px] font-black italic uppercase tracking-[0.3em] text-black mb-4">Meios de pagamento</p>
                    <div className="flex flex-wrap items-center justify-center gap-6 max-w-lg">
                      {paymentMethods.pix && <img src={paymentMethods.pix} alt="PIX" className="h-3.5 object-contain" referrerPolicy="no-referrer" />}
                      {paymentMethods.picpay && <img src={paymentMethods.picpay} alt="PicPay" className="h-3.5 object-contain" referrerPolicy="no-referrer" />}
                      {paymentMethods.nubank && <img src={paymentMethods.nubank} alt="Nubank" className="h-3.5 object-contain" referrerPolicy="no-referrer" />}
                      {paymentMethods.visa && <img src={paymentMethods.visa} alt="Visa" className="h-3.5 object-contain" referrerPolicy="no-referrer" />}
                      {paymentMethods.mastercard && <img src={paymentMethods.mastercard} alt="Mastercard" className="h-3.5 object-contain" referrerPolicy="no-referrer" />}
                      {paymentMethods.extras?.map((url, idx) => (
                        url && <img key={idx} src={url} alt={`Pagamento ${idx + 1}`} className="h-3.5 object-contain" referrerPolicy="no-referrer" />
                      ))}
                    </div>
                  </div>

                  {/* Copyright */}
                  <div className="text-center md:text-right">
                    <p className="text-[10px] text-black font-black italic uppercase tracking-widest">
                      © 2025 {copyrightName || storeName}. Todos os direitos reservados.
                    </p>
                  </div>
                </div>
            </div>
          </footer>
        </div>
      )}
      {!isUserMenuOpen && (
        <ScrollToTop bottom={!isHideGlobalUI ? "bottom-24 md:bottom-8" : "bottom-8"} />
      )}

      {/* Edit Home Banner Modal */}
      <AnimatePresence>
        {isEditingHomeBanner && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black uppercase tracking-tight">Editar Banner Home</h3>
                <button onClick={() => setIsEditingHomeBanner(false)} className="text-gray-400 hover:text-black">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Imagem do Banner</label>
                  <div className="flex flex-col gap-4">
                    <button 
                      type="button"
                      onClick={() => homeBannerFileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-black transition-colors text-xs font-bold text-gray-700"
                    >
                      <Camera className="w-5 h-5" />
                      Upload do Computador
                    </button>
                    <input 
                      type="file" 
                      ref={homeBannerFileInputRef} 
                      onChange={handleHomeBannerImageUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-gray-100"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-400 text-[8px] font-black uppercase tracking-widest">OU</span>
                      <div className="flex-grow border-t border-gray-100"></div>
                    </div>

                    <input 
                      type="text" 
                      value={tempHomeBannerUrl}
                      onChange={(e) => setTempHomeBannerUrl(e.target.value)}
                      placeholder="Link da imagem (URL)"
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-all text-sm"
                    />
                    
                    {tempHomeBannerUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
                        <img src={tempHomeBannerUrl} className="w-full h-32 object-cover" alt="Preview" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    onClick={() => setIsEditingHomeBanner(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveHomeBanner}
                    className="flex-1 py-4 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/10"
                  >
                    Salvar Banner
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Search Filters Drawer */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-[1001] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsFilterDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[320px] bg-white h-full shadow-2xl flex flex-col overflow-hidden rounded-l-[1.5rem]"
            >
              <div className="flex items-center justify-between px-6 py-8 border-b border-gray-50">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Filtrar</span>
                  <h3 className="font-black tracking-tighter text-2xl uppercase">Opções</h3>
                </div>
                <button 
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {searchTerm && (
                  <div className="space-y-8">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
                        Relacionados
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const filter = searchTerm.toLowerCase();
                          const terms = filter.split(/\s+/).filter(w => w.length > 2 || !['do', 'da', 'de', 'o', 'a', 'com', 'para'].includes(w));
                          
                          const filtered = visibleProducts.filter(p => {
                            if (terms.length === 0) return p.name.toLowerCase().includes(filter);
                            return terms.every(t => p.name.toLowerCase().includes(t));
                          });

                          if (filtered.length === 0) return <p className="text-xs text-gray-400 italic">Nenhum termo relacionado encontrado.</p>;

                          const uniqueLabels = new Map<string, Product>();
                          filtered.forEach(p => {
                            const fillerWords = [...terms, 'camisa', 'camiseta', 'oficial', 'manto', 'jogo', 'torcedor', 'premium', 'luxo', 'masculina', 'feminina', 'infantil', 'retro', 'versão', 'edição', 'especial', 'titular', 'reserva', 'terceira', 'nike', 'adidas', 'puma'];
                            let label = p.name.toLowerCase();
                            label = label.replace(/\b\d{2,4}(\/\d{2,4})?\b/g, '');
                            fillerWords.forEach(word => {
                              const regex = new RegExp(`\\b${word}\\b`, 'gi');
                              label = label.replace(regex, '');
                            });
                            label = label.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
                            const words = label.split(' ');
                            if (words.length > 2) label = words.slice(0, 2).join(' ');
                            const finalLabel = label.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                            if (!uniqueLabels.has(finalLabel) && finalLabel.length > 1) {
                              uniqueLabels.set(finalLabel, p);
                            }
                          });

                          return Array.from(uniqueLabels.entries()).slice(0, 15).map(([label, p]) => (
                            <button 
                              key={p.id} 
                              onClick={() => {
                                handleSearch(label);
                                setIsFilterDrawerOpen(false);
                              }}
                              className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:border-black active:scale-95 transition-all shadow-sm"
                            >
                              {label}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 mb-2">
                        Custo-benefício
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <button className="text-left px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-bold text-gray-700 hover:border-black transition-all">
                          Menores Preços
                        </button>
                        <button className="text-left px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-bold text-gray-700 hover:border-black transition-all">
                          Mais Vendidos
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!isHideGlobalUI && (
        <MobileNavbar 
          currentView={currentView} 
          onViewChange={(view) => {
            if (view === 'home') {
              handleGoHome();
            } else if (view === 'cart') {
              setIsCartOpen(true);
            } else {
              setCurrentView(view);
            }
          }} 
          cartCount={cart.length} 
          favoritesCount={favorites.length}
          user={user}
        />
      )}
    </div>
  );
};

export default App;
