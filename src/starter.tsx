import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";

import {
  Search,
  Heart,
  Menu,
  X,
  User,
  LogOut,
  Home,
  Plus,
  MapPin,
  Star,
  Wifi,
  Waves,
  Car,
  Snowflake,
  Utensils,
  Shirt,
  Tv,
  Briefcase,
  Flame,
  Bath,
  Bath as Shower,
  Dumbbell,
  Coffee,
  Sailboat,
  Trees,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  Bed,
  DoorOpen,
  ArrowRight,
  Settings,
  LayoutDashboard,
  Building2,
  DollarSign,
  TrendingUp,
  Shield,
  AlertCircle,
  Loader2,
  Home as HomeIcon,
  Compass,
  Heart as HeartIcon,
  User as UserIcon,
  Stethoscope,
  Globe,
  Sparkles,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Phone,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Filter,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: "user" | "host" | "admin";
  avatar_url?: string;
  created_at?: string;
}

interface ListingImage {
  id?: number;
  image_url: string;
  position?: number;
}

interface Amenity {
  id: number;
  name: string;
  icon: string;
}

interface Listing {
  id: number;
  owner_id: number;
  title: string;
  description?: string;
  country: string;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  price_per_night: number;
  cleaning_fee: number;
  service_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  property_type: string;
  status: string;
  created_at?: string;
  images: ListingImage[];
  amenities: Amenity[];
  owner?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  is_favorite?: boolean;
  reviews?: Review[];
  avg_rating?: number;
  review_count?: number;
}

interface Booking {
  id: number;
  user_id: number;
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  price_per_night: number;
  cleaning_fee: number;
  service_fee: number;
  subtotal: number;
  total: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  stripe_payment_intent_id?: string;
  stripe_checkout_session_id?: string;
  created_at?: string;
  listing?: {
    id: number;
    title: string;
    city: string;
    country: string;
    images: { image_url: string }[];
  };
  guest?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Review {
  id: number;
  user_id: number;
  listing_id: number;
  booking_id?: number;
  rating: number;
  comment?: string;
  created_at?: string;
  user?: { first_name: string; last_name: string };
}

// ─── API Helper ─────────────────────────────────────────────────

const API_URL = (import.meta as any).env?.VITE_API_URL || "https://backend-logement-production.up.railway.app";

async function api<T = any>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return {} as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || `Request failed (${res.status})`);
  }
  return data as T;
}

// ─── Amenity Icons ──────────────────────────────────────────────

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi, waves: Waves, car: Car, snowflake: Snowflake, utensils: Utensils,
  shirt: Shirt, tv: Tv, briefcase: Briefcase, flame: Flame, bath: Bath,
  dumbbell: Dumbbell, coffee: Coffee, sailboat: Sailboat, trees: Trees, check: Check,
};

function getAmenityIcon(iconName: string) {
  return amenityIcons[iconName] || Check;
}

// ─── Category Icons ─────────────────────────────────────────────

const propertyCategories = [
  { type: "", label: "All", icon: Home },
  { type: "apartment", label: "Apartments", icon: Building2 },
  { type: "house", label: "Houses", icon: Home },
  { type: "cabin", label: "Cabins", icon: Trees },
  { type: "villa", label: "Villas", icon: Waves },
  { type: "loft", label: "Lofts", icon: Building2 },
  { type: "studio", label: "Studios", icon: Home },
  { type: "cottage", label: "Cottages", icon: Trees },
  { type: "chalet", label: "Chalets", icon: Snowflake },
];

// ─── Token Storage ──────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem("stayhaven_token");
}
function setToken(t: string) {
  localStorage.setItem("stayhaven_token", t);
}
function clearToken() {
  localStorage.removeItem("stayhaven_token");
}

// ─── Main App ───────────────────────────────────────────────────

export default function StayHavenApp() {
  const [route, setRoute] = useState<string>(window.location.hash.slice(1) || "/");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);
  const [authModal, setAuthModal] = useState<null | "login" | "register">(null);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Routing
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  // Auth: load user on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      api<{ user: User }>("/api/auth/me", {}, token)
        .then((d) => setUser(d.user))
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Auth handlers
  const handleLogin = (token: string, u: User) => {
    setToken(token);
    setUser(u);
    setAuthModal(null);
    showToast(`Welcome back, ${u.first_name}!`);
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    navigate("/");
    showToast("You have been logged out");
  };

  // Auth guard — opens modal if not logged in, stores action
  const requireAuth = (action: () => void): boolean => {
    if (user) {
      action();
      return true;
    }
    setPendingAction(() => action);
    setAuthModal("login");
    return false;
  };

  // After auth modal closes with success, run pending action
  useEffect(() => {
    if (user && pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [user, pendingAction]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  // Parse route
  const routeParts = route.split("?")[0].split("/").filter(Boolean);
  const page = routeParts[0] || "";
  const listingId = routeParts[0] === "listing" ? parseInt(routeParts[1]) : null;
  const bookingIdParam = routeParts[0] === "booking" ? parseInt(routeParts[1]) : null;

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <Header
        user={user}
        onNavigate={navigate}
        onLogout={handleLogout}
        onOpenAuth={(m) => setAuthModal(m)}
        route={route}
      />

      <main>
        {page === "" && (
          <HomePage
            user={user}
            onNavigate={navigate}
            showToast={showToast}
            requireAuth={requireAuth}
          />
        )}
        {page === "search" && (
          <SearchPage
            user={user}
            onNavigate={navigate}
            showToast={showToast}
            requireAuth={requireAuth}
            route={route}
          />
        )}
        {page === "listing" && listingId && (
          <ListingDetailPage
            listingId={listingId}
            user={user}
            onNavigate={navigate}
            showToast={showToast}
            requireAuth={requireAuth}
          />
        )}
        {page === "favorites" && (
          <FavoritesPage
            user={user}
            onNavigate={navigate}
            showToast={showToast}
            requireAuth={requireAuth}
          />
        )}
        {page === "bookings" && (
          <BookingsPage user={user} onNavigate={navigate} showToast={showToast} />
        )}
        {page === "booking" && bookingIdParam && (
          <BookingDetailPage
            bookingId={bookingIdParam}
            user={user}
            onNavigate={navigate}
            showToast={showToast}
            route={route}
          />
        )}
        {page === "host" && (
          <HostDashboardPage
            user={user}
            onNavigate={navigate}
            showToast={showToast}
            route={route}
          />
        )}
        {page === "admin" && (
          <AdminPage user={user} onNavigate={navigate} showToast={showToast} />
        )}
        {page === "profile" && (
          <ProfilePage user={user} onNavigate={navigate} showToast={showToast} />
        )}
        {page !== "" && !["search","listing","favorites","bookings","booking","host","admin","profile"].includes(page) && (
          <div className="empty-state">
            <h3>Page not found</h3>
            <p>The page you're looking for doesn't exist.</p>
            <button className="btn btn-primary mt-24" onClick={() => navigate("/")}>
              Back to home
            </button>
          </div>
        )}
      </main>

      <Footer onNavigate={navigate} />

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => {
            setAuthModal(null);
            setPendingAction(null);
          }}
          onSwitch={(m) => setAuthModal(m)}
          onSuccess={handleLogin}
          showToast={showToast}
        />
      )}

      {toast && <div className="toast">{toast}</div>}

      <MobileNav user={user} route={route} onNavigate={navigate} />
    </>
  );
}

// ─── Header ─────────────────────────────────────────────────────

function Header({
  user, onNavigate, onLogout, onOpenAuth, route,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
  onLogout: () => void;
  onOpenAuth: (m: "login" | "register") => void;
  route: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`}>
      <div className="container header-inner">
        <div className="logo" onClick={() => onNavigate("/")}>
          <Compass size={28} color="var(--primary)" />
          <span>Book4Me</span>
        </div>

        <div className="header-search-wrap">
          <SearchPill onNavigate={onNavigate} />
        </div>

        <nav className="header-nav">
          <button className="header-nav-btn" onClick={() => onNavigate("/")}>
            Explore
          </button>
          <button className="header-nav-btn" onClick={() => onNavigate("/host")}>
            Become a host
          </button>
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="user-menu">
              <button
                className="user-avatar"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="User menu"
                aria-expanded={menuOpen}
              >
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  {user.role === "admin" ? "Admin" : user.role === "host" ? "Host" : "Menu"}
                </span>
                <span className="avatar-circle">
                  {user.first_name[0]}{user.last_name[0]}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 199 }}
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="dropdown">
                    <div className="dropdown-item" style={{ fontWeight: 700 }}>
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={() => { onNavigate("/favorites"); setMenuOpen(false); }}>
                      <Heart size={18} /> Favorites
                    </button>
                    <button className="dropdown-item" onClick={() => { onNavigate("/bookings"); setMenuOpen(false); }}>
                      <Calendar size={18} /> My bookings
                    </button>
                    <button className="dropdown-item" onClick={() => { onNavigate("/profile"); setMenuOpen(false); }}>
                      <User size={18} /> Profile
                    </button>
                    {user.role === "host" || user.role === "admin" ? (
                      <button className="dropdown-item" onClick={() => { onNavigate("/host"); setMenuOpen(false); }}>
                        <Building2 size={18} /> Host dashboard
                      </button>
                    ) : (
                      <button className="dropdown-item" onClick={() => { onNavigate("/host"); setMenuOpen(false); }}>
                        <Sparkles size={18} /> Become a host
                      </button>
                    )}
                    {user.role === "admin" && (
                      <button className="dropdown-item" onClick={() => { onNavigate("/admin"); setMenuOpen(false); }}>
                        <Shield size={18} /> Admin panel
                      </button>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={onLogout}>
                      <LogOut size={18} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <button className="header-nav-btn" onClick={() => onNavigate("/host")}>
                Become a host
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => onOpenAuth("register")}>
                Sign up
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => onOpenAuth("login")}>
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchPill({ onNavigate }: { onNavigate: (to: string) => void }) {
  const [destination, setDestination] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    onNavigate(`/search?${params.toString()}`);
  };

  return (
    <div className="search-bar" onClick={(e) => {
      if (e.target === e.currentTarget) handleSearch();
    }}>
      <div className="search-segment" style={{ flex: 1 }}>
        <label>Where</label>
        <input
          type="text"
          placeholder="Search destinations"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button className="search-btn" onClick={handleSearch} aria-label="Search">
        <Search size={18} />
      </button>
    </div>
  );
}

// ─── Footer ─────────────────────────────────────────────────────

function Footer({ onNavigate }: { onNavigate: (to: string) => void }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>Support</h4>
            <a onClick={() => onNavigate("/")}>Help Center</a>
            <a onClick={() => onNavigate("/")}>Safety information</a>
            <a onClick={() => onNavigate("/")}>Cancellation options</a>
          </div>
          <div className="footer-col">
            <h4>Hosting</h4>
            <a onClick={() => onNavigate("/host")}>Become a host</a>
            <a onClick={() => onNavigate("/host")}>Host your home</a>
            <a onClick={() => onNavigate("/host")}>Responsible hosting</a>
          </div>
          <div className="footer-col">
            <h4>Book4Me</h4>
            <a onClick={() => onNavigate("/")}>About us</a>
            <a onClick={() => onNavigate("/")}>Newsroom</a>
            <a onClick={() => onNavigate("/")}>Careers</a>
          </div>
          <div className="footer-col">
            <h4>Discover</h4>
            <a onClick={() => onNavigate("/search")}>All listings</a>
            <a onClick={() => onNavigate("/search?destination=Paris")}>Paris</a>
            <a onClick={() => onNavigate("/search?destination=Tokyo")}>Tokyo</a>
            <a onClick={() => onNavigate("/search?destination=New%20York")}>New York</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Book4Me — Find your perfect stay</span>
          <span>Privacy · Terms · Sitemap</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Mobile Nav ─────────────────────────────────────────────────

function MobileNav({
  user, route, onNavigate,
}: {
  user: User | null;
  route: string;
  onNavigate: (to: string) => void;
}) {
  const page = route.split("/").filter(Boolean)[0] || "";
  return (
    <div className="mobile-nav">
      <button
        className={`mobile-nav-item ${page === "" ? "active" : ""}`}
        onClick={() => onNavigate("/")}
      >
        <HomeIcon /> Explore
      </button>
      <button
        className={`mobile-nav-item ${page === "search" ? "active" : ""}`}
        onClick={() => onNavigate("/search")}
      >
        <Search /> Search
      </button>
      <button
        className={`mobile-nav-item ${page === "favorites" ? "active" : ""}`}
        onClick={() => user ? onNavigate("/favorites") : onNavigate("/")}
      >
        <HeartIcon /> Favorites
      </button>
      <button
        className={`mobile-nav-item ${page === "bookings" ? "active" : ""}`}
        onClick={() => user ? onNavigate("/bookings") : onNavigate("/")}
      >
        <Calendar /> Trips
      </button>
      <button
        className={`mobile-nav-item ${page === "profile" || page === "host" ? "active" : ""}`}
        onClick={() => user ? onNavigate("/profile") : onNavigate("/")}
      >
        <UserIcon /> Account
      </button>
    </div>
  );
}

// ─── Auth Modal ─────────────────────────────────────────────────

function AuthModal({
  mode, onClose, onSwitch, onSuccess, showToast,
}: {
  mode: "login" | "register";
  onClose: () => void;
  onSwitch: (m: "login" | "register") => void;
  onSuccess: (token: string, user: User) => void;
  showToast: (msg: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "register") {
        const data = await api<{ token: string; user: User }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            first_name: firstName, last_name: lastName, email, password, phone,
          }),
        });
        onSuccess(data.token, data.user);
      } else {
        const data = await api<{ token: string; user: User }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        onSuccess(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === "register" ? "Create your account" : "Welcome back"}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="form-row">
                <div className="form-group">
                  <label>First name</label>
                  <input
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="form-group">
                  <label>Last name</label>
                  <input
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                placeholder="At least 6 characters"
              />
            </div>
            {mode === "register" && (
              <div className="form-group">
                <label>Phone (optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            )}
            {error && (
              <div className="form-error" style={{ marginBottom: 12 }}>
                <AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} />
                {error}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={submitting}
            >
              {submitting ? <Loader2 size={20} className="animate-spin" /> : null}
              {mode === "register" ? "Sign up" : "Log in"}
            </button>
          </form>
          <div className="form-switch">
            {mode === "register" ? (
              <>Already have an account? <button onClick={() => onSwitch("login")}>Log in</button></>
            ) : (
              <>Don't have an account? <button onClick={() => onSwitch("register")}>Sign up</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Home Page ──────────────────────────────────────────────────

function HomePage({
  user, onNavigate, showToast, requireAuth,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
  showToast: (msg: string) => void;
  requireAuth: (action: () => void) => boolean;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    let params = "?limit=12";
    if (category) params += `&property_type=${category}`;
    api<{ listings: Listing[] }>(`/api/listings${params}`)
      .then((d) => setListings(d.listings))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [category]);

  // Load favorites if logged in
  useEffect(() => {
    if (user) {
      api<{ favorites: Listing[] }>("/api/favorites", {}, getToken() || undefined)
        .then((d) => setFavorites(new Set(d.favorites.map((f) => f.id))))
        .catch(() => {});
    }
  }, [user]);

  const toggleFav = (listingId: number) => {
    requireAuth(async () => {
      const token = getToken();
      try {
        if (favorites.has(listingId)) {
          await api(`/api/favorites/${listingId}`, { method: "DELETE" }, token || undefined);
          setFavorites((prev) => {
            const n = new Set(prev);
            n.delete(listingId);
            return n;
          });
          showToast("Removed from favorites");
        } else {
          await api(`/api/favorites/${listingId}`, { method: "POST" }, token || undefined);
          setFavorites((prev) => new Set(prev).add(listingId));
          showToast("Added to favorites");
        }
      } catch (err: any) {
        showToast(err.message || "Failed to update favorites");
      }
    });
  };

  const heroImg = "https://images.pexels.com/photos/2476632/pexels-photo-2476632.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";

  return (
    <div>
      <div className="hero">
        <img className="hero-bg" src={heroImg} alt="Beautiful destination" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Find your next stay</h1>
          <p>Discover unique places to stay from local hosts worldwide</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onNavigate("/search")}
          >
            <Search size={20} /> Start exploring
          </button>
        </div>
      </div>

      <div className="container">
        <div className="category-bar">
          {propertyCategories.map((cat) => (
            <button
              key={cat.type}
              className={`category-chip ${category === cat.type ? "active" : ""}`}
              onClick={() => setCategory(cat.type)}
            >
              <cat.icon />
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <h3>No listings found</h3>
            <p>Try a different category or check back later.</p>
          </div>
        ) : (
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFav={favorites.has(listing.id)}
                onToggleFav={() => toggleFav(listing.id)}
                onClick={() => onNavigate(`/listing/${listing.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Listing Card ───────────────────────────────────────────────

function ListingCard({
  listing, isFav, onToggleFav, onClick,
}: {
  listing: Listing;
  isFav: boolean;
  onToggleFav: () => void;
  onClick: () => void;
}) {
  const img = listing.images?.[0]?.image_url || "https://images.pexels.com/photos/8135492/pexels-photo-8135492.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";
  return (
    <div className="listing-card" onClick={onClick}>
      <div className="listing-card-image">
        <img src={img} alt={listing.title} loading="lazy" />
        <button
          className={`fav-btn ${isFav ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart />
        </button>
      </div>
      <div className="listing-card-info">
        <div className="listing-card-title">
          <span className="text-md">{listing.title}</span>
          {listing.avg_rating && (
            <span className="rating-badge">
              <Star /> {listing.avg_rating}
            </span>
          )}
        </div>
        <div className="listing-card-location">
          {listing.city}, {listing.country}
        </div>
        <div className="listing-card-price">
          ${listing.price_per_night} <span>/ night</span>
        </div>
      </div>
    </div>
  );
}

// ─── Search Page ────────────────────────────────────────────────

function SearchPage({
  user, onNavigate, showToast, requireAuth, route,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
  showToast: (msg: string) => void;
  requireAuth: (action: () => void) => boolean;
  route: string;
}) {
  const queryStr = route.split("?")[1] || "";
  const initialParams = useMemo(() => new URLSearchParams(queryStr), [queryStr]);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState(initialParams.get("destination") || "");
  const [checkIn, setCheckIn] = useState(initialParams.get("check_in") || "");
  const [checkOut, setCheckOut] = useState(initialParams.get("check_out") || "");
  const [guests, setGuests] = useState(initialParams.get("guests") || "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [propertyType, setPropertyType] = useState(initialParams.get("property_type") || "");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [minBeds, setMinBeds] = useState("");
  const [minBathrooms, setMinBathrooms] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<Set<number>>(new Set());
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Load amenities
  useEffect(() => {
    api<{ amenities: Amenity[] }>("/api/amenities")
      .then((d) => setAllAmenities(d.amenities))
      .catch(() => {});
  }, []);

  // Load favorites
  useEffect(() => {
    if (user) {
      api<{ favorites: Listing[] }>("/api/favorites", {}, getToken() || undefined)
        .then((d) => setFavorites(new Set(d.favorites.map((f) => f.id))))
        .catch(() => {});
    }
  }, [user]);

  // Search
  const doSearch = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (guests) params.set("guests", guests);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (propertyType) params.set("property_type", propertyType);
    if (minBedrooms) params.set("bedrooms", minBedrooms);
    if (minBeds) params.set("beds", minBeds);
    if (minBathrooms) params.set("bathrooms", minBathrooms);
    if (selectedAmenities.size > 0)
      params.set("amenities", Array.from(selectedAmenities).join(","));

    api<{ listings: Listing[] }>(`/api/listings?${params.toString()}`)
      .then((d) => setListings(d.listings))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [destination, checkIn, checkOut, guests, minPrice, maxPrice, propertyType, minBedrooms, minBeds, minBathrooms, selectedAmenities]);

  useEffect(() => { doSearch(); }, [doSearch]);

  const toggleFav = (listingId: number) => {
    requireAuth(async () => {
      const token = getToken();
      try {
        if (favorites.has(listingId)) {
          await api(`/api/favorites/${listingId}`, { method: "DELETE" }, token || undefined);
          setFavorites((prev) => { const n = new Set(prev); n.delete(listingId); return n; });
        } else {
          await api(`/api/favorites/${listingId}`, { method: "POST" }, token || undefined);
          setFavorites((prev) => new Set(prev).add(listingId));
          showToast("Added to favorites");
        }
      } catch (err: any) { showToast(err.message); }
    });
  };

  const toggleAmenity = (id: number) => {
    setSelectedAmenities((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className="container page-content">
      <h1 className="page-title">
        {destination ? `Stays in ${destination}` : "Explore stays"}
      </h1>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Filter Sidebar */}
        <aside className="filter-sidebar" style={{ display: showFilters ? "block" : undefined }}>
          <div className="filter-group">
            <h4>Price range (per night)</h4>
            <div className="filter-row">
              <input
                className="filter-input"
                type="number"
                placeholder="Min $"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                className="filter-input"
                type="number"
                placeholder="Max $"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <h4>Property type</h4>
            <select
              className="filter-input"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              <option value="">Any type</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="cabin">Cabin</option>
              <option value="villa">Villa</option>
              <option value="loft">Loft</option>
              <option value="studio">Studio</option>
              <option value="cottage">Cottage</option>
              <option value="chalet">Chalet</option>
            </select>
          </div>

          <div className="filter-group">
            <h4>Rooms</h4>
            <div className="filter-row" style={{ marginBottom: 8 }}>
              <select className="filter-input" value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)}>
                <option value="">Bedrooms</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
              <select className="filter-input" value={minBeds} onChange={(e) => setMinBeds(e.target.value)}>
                <option value="">Beds</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
            <select className="filter-input" value={minBathrooms} onChange={(e) => setMinBathrooms(e.target.value)}>
              <option value="">Any bathrooms</option>
              <option value="1">1+ bathrooms</option>
              <option value="2">2+ bathrooms</option>
              <option value="3">3+ bathrooms</option>
            </select>
          </div>

          <div className="filter-group">
            <h4>Amenities</h4>
            {allAmenities.map((a) => (
              <label key={a.id} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedAmenities.has(a.id)}
                  onChange={() => toggleAmenity(a.id)}
                />
                {a.name}
              </label>
            ))}
          </div>

          <button
            className="btn btn-outline btn-block"
            onClick={() => {
              setMinPrice(""); setMaxPrice(""); setPropertyType("");
              setMinBedrooms(""); setMinBeds(""); setMinBathrooms("");
              setSelectedAmenities(new Set());
            }}
          >
            Clear all filters
          </button>
        </aside>

        {/* Results */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex-between mb-16">
            <div className="flex gap-12 flex-wrap">
              <input
                className="filter-input"
                style={{ width: "auto" }}
                placeholder="Where to?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <input
                className="filter-input"
                style={{ width: "auto" }}
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
              <input
                className="filter-input"
                style={{ width: "auto" }}
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
              <select
                className="filter-input"
                style={{ width: "auto" }}
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              >
                <option value="">Any guests</option>
                <option value="1">1+ guests</option>
                <option value="2">2+ guests</option>
                <option value="4">4+ guests</option>
                <option value="6">6+ guests</option>
                <option value="8">8+ guests</option>
              </select>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowFilters(!showFilters)}
              style={{ display: "none" }}
            >
              <Filter size={16} /> Filters
            </button>
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : listings.length === 0 ? (
            <div className="empty-state">
              <h3>No stays found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <p className="color-neutral-500 mb-16">
                {listings.length} {listings.length === 1 ? "stay" : "stays"} available
              </p>
              <div className="listing-grid">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isFav={favorites.has(listing.id)}
                    onToggleFav={() => toggleFav(listing.id)}
                    onClick={() => onNavigate(`/listing/${listing.id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Listing Detail Page ────────────────────────────────────────

function ListingDetailPage({
  listingId, user, onNavigate, showToast, requireAuth,
}: {
  listingId: number;
  user: User | null;
  onNavigate: (to: string) => void;
  showToast: (msg: string) => void;
  requireAuth: (action: () => void) => boolean;
}) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [bookingError, setBookingError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    api<Listing>(`/api/listings/${listingId}`, {}, getToken() || undefined)
      .then(setListing)
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [listingId]);

  // Restore dates from session if returning from auth
  useEffect(() => {
    const saved = sessionStorage.getItem("pending_booking");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.listingId === listingId) {
          setCheckIn(data.checkIn);
          setCheckOut(data.checkOut);
          setGuests(data.guests);
        }
      } catch {}
    }
  }, [listingId]);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }
  if (!listing) {
    return (
      <div className="empty-state">
        <h3>Listing not found</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>
          Back to home
        </button>
      </div>
    );
  }

  const images = listing.images || [];
  const mainImg = images[0]?.image_url || "";
  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
      ))
    : 0;
  const subtotal = nights * listing.price_per_night;
  const total = subtotal + listing.cleaning_fee + listing.service_fee;

  const handleReserve = () => {
    setBookingError("");
    if (!checkIn || !checkOut) {
      setBookingError("Please select check-in and check-out dates");
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      setBookingError("Check-out must be after check-in");
      return;
    }
    if (guests > listing.max_guests) {
      setBookingError(`Maximum ${listing.max_guests} guests`);
      return;
    }

    requireAuth(async () => {
      // Save context in case of redirect
      sessionStorage.setItem("pending_booking", JSON.stringify({
        listingId, checkIn, checkOut, guests,
      }));
      setCreating(true);
      try {
        const token = getToken();
        const booking = await api<Booking>("/api/bookings", {
          method: "POST",
          body: JSON.stringify({ listing_id: listingId, check_in: checkIn, check_out: checkOut, guests }),
        }, token || undefined);

        // Go to Stripe checkout (paiement sur le compte Stripe principal)
        const checkout = await api<{ url: string }>("/api/stripe/checkout", {
          method: "POST",
          body: JSON.stringify({ booking_id: booking.id }),
        }, token || undefined);

        sessionStorage.removeItem("pending_booking");
        window.location.href = checkout.url;
      } catch (err: any) {
        setBookingError(err.message || "Failed to create booking");
        sessionStorage.removeItem("pending_booking");
      } finally {
        setCreating(false);
      }
    });
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="container listing-detail">
      <button
        className="btn btn-ghost btn-sm mb-16"
        onClick={() => window.history.back()}
      >
        <ArrowLeft size={18} /> Back
      </button>

      {/* Gallery */}
      <div className="gallery">
        <div className="gallery-main">
          <img src={mainImg} alt={listing.title} />
        </div>
        {images.slice(1, 5).map((img, i) => (
          <div key={i} className="gallery-thumb">
            <img src={img.image_url} alt={`${listing.title} ${i + 2}`} />
          </div>
        ))}
      </div>

      <div className="detail-layout">
        {/* Left: Info */}
        <div className="detail-info">
          <h1>{listing.title}</h1>
          <div className="detail-location">
            <MapPin size={16} /> {listing.address}, {listing.city}, {listing.country}
            {listing.avg_rating && (
              <span style={{ marginLeft: 12 }} className="rating-badge">
                <Star /> {listing.avg_rating} ({listing.review_count})
              </span>
            )}
          </div>

          <div className="detail-features">
            <div className="feature-item">
              <Users /> {listing.max_guests} guests
            </div>
            <div className="feature-item">
              <DoorOpen /> {listing.bedrooms} bedrooms
            </div>
            <div className="feature-item">
              <Bed /> {listing.beds} beds
            </div>
            <div className="feature-item">
              <Shower /> {listing.bathrooms} baths
            </div>
          </div>

          {listing.owner && (
            <div className="detail-host">
              <div className="host-avatar">
                {listing.owner.first_name[0]}{listing.owner.last_name[0]}
              </div>
              <div className="host-info">
                <h4>Hosted by {listing.owner.first_name} {listing.owner.last_name}</h4>
                <p>Superhost</p>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>About this place</h3>
            <p style={{ color: "var(--neutral-700)", lineHeight: 1.7 }}>
              {listing.description || "No description provided."}
            </p>
          </div>

          {listing.amenities && listing.amenities.length > 0 && (
            <div className="detail-section">
              <h3>What this place offers</h3>
              <div className="amenities-grid">
                {listing.amenities.map((a) => {
                  const Icon = getAmenityIcon(a.icon);
                  return (
                    <div key={a.id} className="amenity-item">
                      <Icon /> {a.name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {listing.reviews && listing.reviews.length > 0 && (
            <div className="detail-section">
              <h3>Reviews ({listing.review_count})</h3>
              {listing.reviews.map((r) => (
                <div key={r.id} style={{ padding: "16px 0", borderBottom: "1px solid var(--neutral-200)" }}>
                  <div className="flex items-center gap-12 mb-16">
                    <div className="avatar-circle" style={{ width: 40, height: 40 }}>
                      {r.user?.first_name?.[0] || "?"}{r.user?.last_name?.[0] || ""}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {r.user?.first_name} {r.user?.last_name}
                      </div>
                      <div className="rating-badge">
                        <Star /> {r.rating}
                      </div>
                    </div>
                  </div>
                  {r.comment && <p style={{ color: "var(--neutral-700)" }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Booking card */}
        <div>
          <div className="booking-card">
            <div className="booking-price">
              ${listing.price_per_night} <span>per night</span>
            </div>

            <div className="date-inputs">
              <div className="date-field">
                <label>Check-in</label>
                <input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="date-field">
                <label>Check-out</label>
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div className="guests-field">
              <label>Guests</label>
              <select value={guests} onChange={(e) => setGuests(parseInt(e.target.value))}>
                {Array.from({ length: listing.max_guests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </div>

            {nights > 0 && (
              <div className="price-breakdown">
                <div className="price-line">
                  <span>${listing.price_per_night} × {nights} nights</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="price-line">
                  <span>Cleaning fee</span>
                  <span>${listing.cleaning_fee.toFixed(2)}</span>
                </div>
                <div className="price-line">
                  <span>Service fee</span>
                  <span>${listing.service_fee.toFixed(2)}</span>
                </div>
                <div className="price-total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {bookingError && (
              <div className="form-error mb-16">
                <AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} />
                {bookingError}
              </div>
            )}

            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={handleReserve}
              disabled={creating || !checkIn || !checkOut}
            >
              {creating ? <Loader2 size={20} className="animate-spin" /> : null}
              Reserve
            </button>
            <p className="text-sm text-center color-neutral-500 mt-16">
              You won't be charged yet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Favorites Page ─────────────────────────────────────────────

function FavoritesPage({
  user, onNavigate, showToast, requireAuth,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
  showToast: (msg: string) => void;
  requireAuth: (action: () => void) => boolean;
}) {
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(() => {
    api<{ favorites: Listing[] }>("/api/favorites", {}, getToken() || undefined)
      .then((d) => setFavorites(d.favorites))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadFavorites();
  }, [user]);

  const removeFav = async (listingId: number) => {
    try {
      await api(`/api/favorites/${listingId}`, { method: "DELETE" }, getToken() || undefined);
      setFavorites((prev) => prev.filter((f) => f.id !== listingId));
      showToast("Removed from favorites");
    } catch (err: any) { showToast(err.message); }
  };

  if (!user) {
    return (
      <div className="empty-state">
        <h3>Please log in to view favorites</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>Browse listings</button>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="container page-content">
      <h1 className="page-title">Your favorites</h1>
      {favorites.length === 0 ? (
        <div className="empty-state">
          <Heart size={48} />
          <h3>No favorites yet</h3>
          <p>Save your favorite places by tapping the heart icon.</p>
          <button className="btn btn-primary mt-24" onClick={() => onNavigate("/search")}>
            Browse listings
          </button>
        </div>
      ) : (
        <div className="listing-grid">
          {favorites.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFav={true}
              onToggleFav={() => removeFav(listing.id)}
              onClick={() => onNavigate(`/listing/${listing.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bookings Page ──────────────────────────────────────────────

function BookingsPage({
  user, onNavigate, showToast,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
  showToast: (msg: string) => void;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past" | "all">("all");

  const load = useCallback(() => {
    api<{ bookings: Booking[] }>("/api/bookings", {}, getToken() || undefined)
      .then((d) => setBookings(d.bookings))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
  }, [user]);

  const cancelBooking = async (id: number) => {
    try {
      await api(`/api/bookings/${id}/cancel`, { method: "POST" }, getToken() || undefined);
      showToast("Booking cancelled");
      load();
    } catch (err: any) { showToast(err.message); }
  };

  if (!user) {
    return (
      <div className="empty-state">
        <h3>Please log in to view your bookings</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>Browse listings</button>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const today = new Date().toISOString().split("T")[0];
  const filtered = bookings.filter((b) => {
    if (tab === "upcoming") return b.check_out >= today && b.status !== "cancelled";
    if (tab === "past") return b.check_out < today;
    return true;
  });

  return (
    <div className="container page-content">
      <h1 className="page-title">Your trips</h1>
      <div className="tabs">
        <button className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>All</button>
        <button className={`tab ${tab === "upcoming" ? "active" : ""}`} onClick={() => setTab("upcoming")}>Upcoming</button>
        <button className={`tab ${tab === "past" ? "active" : ""}`} onClick={() => setTab("past")}>Past</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <h3>No trips yet</h3>
          <p>Start exploring and book your first stay.</p>
          <button className="btn btn-primary mt-24" onClick={() => onNavigate("/search")}>
            Find a stay
          </button>
        </div>
      ) : (
        <div>
          {filtered.map((b) => (
            <BookingItem
              key={b.id}
              booking={b}
              onClick={() => onNavigate(`/booking/${b.id}`)}
              onCancel={() => cancelBooking(b.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingItem({
  booking, onClick, onCancel,
}: {
  booking: Booking;
  onClick: () => void;
  onCancel?: () => void;
}) {
  const img = booking.listing?.images?.[0]?.image_url || "";
  return (
    <div className="booking-item" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="booking-item-img">
        {img && <img src={img} alt={booking.listing?.title} />}
      </div>
      <div className="booking-item-info">
        <h4>{booking.listing?.title || "Listing"}</h4>
        <p>{booking.listing?.city}, {booking.listing?.country}</p>
        <p>
          {booking.check_in} → {booking.check_out} · {booking.nights} nights · {booking.guests} guests
        </p>
        <div className="flex items-center gap-12 mt-16">
          <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
          <span style={{ fontWeight: 600 }}>${booking.total.toFixed(2)}</span>
        </div>
      </div>
      {onCancel && booking.status === "pending" && (
        <button
          className="btn btn-outline btn-sm"
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
        >
          Cancel
        </button>
      )}
      {onCancel && booking.status === "paid" && (
        <button
          className="btn btn-primary btn-sm"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          View details
        </button>
      )}
    </div>
  );
}

// ─── Booking Detail Page ────────────────────────────────────────

function BookingDetailPage({
  bookingId, user, onNavigate, showToast, route,
}: {
  bookingId: number;
  user: User | null;
  onNavigate: (to: string) => void;
  showToast: (msg: string) => void;
  route: string;
}) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const queryStr = route.split("?")[1] || "";
  const queryParams = useMemo(() => new URLSearchParams(queryStr), [queryStr]);
  const paymentStatus = queryParams.get("status");

  useEffect(() => {
    api<Booking>(`/api/bookings/${bookingId}`, {}, getToken() || undefined)
      .then(setBooking)
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!booking) {
    return (
      <div className="empty-state">
        <h3>Booking not found</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/bookings")}>
          View all bookings
        </button>
      </div>
    );
  }

  const payNow = async () => {
    try {
      const checkout = await api<{ url: string }>("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ booking_id: booking.id }),
      }, getToken() || undefined);
      window.location.href = checkout.url;
    } catch (err: any) { showToast(err.message); }
  };

  return (
    <div className="container page-content">
      <button className="btn btn-ghost btn-sm mb-16" onClick={() => onNavigate("/bookings")}>
        <ArrowLeft size={18} /> Back to trips
      </button>

      {paymentStatus === "success" && (
        <div style={{
          padding: 24, borderRadius: "var(--radius-lg)", background: "#D1FAE5",
          color: "#065F46", marginBottom: 24, display: "flex", alignItems: "center", gap: 12,
        }}>
          <CheckCircle2 size={28} />
          <div>
            <h3>Payment successful!</h3>
            <p>Your booking is confirmed. A receipt has been sent to your email.</p>
          </div>
        </div>
      )}
      {paymentStatus === "cancelled" && (
        <div style={{
          padding: 24, borderRadius: "var(--radius-lg)", background: "#FEE2E2",
          color: "#991B1B", marginBottom: 24, display: "flex", alignItems: "center", gap: 12,
        }}>
          <XCircle size={28} />
          <div>
            <h3>Payment cancelled</h3>
            <p>You can try again at any time.</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <h1 className="page-title">Booking #{booking.id}</h1>

        <div className="booking-item" style={{ cursor: "default" }}>
          {booking.listing?.images?.[0] && (
            <div className="booking-item-img">
              <img src={booking.listing.images[0].image_url} alt={booking.listing.title} />
            </div>
          )}
          <div className="booking-item-info">
            <h4>{booking.listing?.title}</h4>
            <p>{booking.listing?.city}, {booking.listing?.country}</p>
          </div>
        </div>

        <div style={{
          border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-lg)",
          padding: 24, marginTop: 16,
        }}>
          <h3 style={{ marginBottom: 16 }}>Trip details</h3>
          <div className="price-line"><span>Check-in</span><span>{booking.check_in}</span></div>
          <div className="price-line"><span>Check-out</span><span>{booking.check_out}</span></div>
          <div className="price-line"><span>Guests</span><span>{booking.guests}</span></div>
          <div className="price-line"><span>Nights</span><span>{booking.nights}</span></div>

          <div className="price-total" style={{ marginTop: 16 }}>
            <span>Status</span>
            <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
          </div>

          <h3 style={{ marginTop: 24, marginBottom: 16 }}>Price breakdown</h3>
          <div className="price-line">
            <span>${booking.price_per_night} × {booking.nights} nights</span>
            <span>${booking.subtotal.toFixed(2)}</span>
          </div>
          <div className="price-line"><span>Cleaning fee</span><span>${booking.cleaning_fee.toFixed(2)}</span></div>
          <div className="price-line"><span>Service fee</span><span>${booking.service_fee.toFixed(2)}</span></div>
          <div className="price-total">
            <span>Total</span>
            <span>${booking.total.toFixed(2)}</span>
          </div>

          {booking.status === "pending" && (
            <button className="btn btn-primary btn-block btn-lg mt-24" onClick={payNow}>
              <CreditCard size={20} /> Pay ${booking.total.toFixed(2)}
            </button>
          )}
          {booking.status === "paid" && (
            <div style={{
              marginTop: 24, padding: 16, borderRadius: "var(--radius-md)",
              background: "#D1FAE5", color: "#065F46", display: "flex", alignItems: "center", gap: 10,
            }}>
              <CheckCircle2 /> Payment confirmed — your stay is booked!
            </div>
          )}
          {booking.status === "cancelled" && (
            <div style={{
              marginTop: 24, padding: 16, borderRadius: "var(--radius-md)",
              background: "var(--neutral-100)", color: "var(--neutral-600)", display: "flex", alignItems: "center", gap: 10,
            }}>
              <XCircle /> This booking was cancelled.
            </div>
          )}

          <button
            className="btn btn-outline btn-block mt-16"
            onClick={() => booking.listing_id && onNavigate(`/listing/${booking.listing_id}`)}
          >
            View listing
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Host Dashboard ─────────────────────────────────────────────

function HostDashboardPage({
  user, onNavigate, showToast, route,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
  showToast: (msg: string) => void;
  route: string;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const loadData = useCallback(() => {
    if (!user || user.role === "user") { setLoading(false); return; }
    Promise.all([
      api<{ listings: Listing[] }>("/api/host/listings", {}, getToken() || undefined),
      api<{ bookings: Booking[] }>("/api/host/bookings", {}, getToken() || undefined),
    ]).then(([l, b]) => {
      setListings(l.listings);
      setHostBookings(b.bookings);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) {
    return (
      <div className="empty-state">
        <h3>Please log in to access the host dashboard</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>Go home</button>
      </div>
    );
  }

  if (user.role === "user") {
    return (
      <div className="container page-content">
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <Sparkles size={48} color="var(--primary)" />
          <h1 className="page-title">Become a host</h1>
          <p style={{ color: "var(--neutral-600)", marginBottom: 24 }}>
            Join our community of hosts by sharing your space.
            Create and manage your listings and follow the reservations you receive.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={async () => {
              try {
                await api<{ user: User }>("/api/auth/become-host", {
                  method: "POST",
                }, getToken() || undefined);
                // Reload to refresh the user state
                showToast("You are now a host!");
                setTimeout(() => window.location.reload(), 1000);
              } catch (err: any) { showToast(err.message); }
            }}
          >
            Get started as a host
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="container page-content">
      <div className="flex-between mb-24">
        <h1 className="page-title" style={{ margin: 0 }}>Host dashboard</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
          <Plus size={18} /> Create listing
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="host-stat-card">
          <h4>Total listings</h4>
          <div className="stat-value">{listings.length}</div>
        </div>
        <div className="host-stat-card">
          <h4>Total bookings</h4>
          <div className="stat-value">{hostBookings.length}</div>
        </div>
        <div className="host-stat-card">
          <h4>Published</h4>
          <div className="stat-value">{listings.filter((l) => l.status === "published").length}</div>
        </div>
      </div>

      {/* Listings */}
      <h2 className="text-xl mb-16">Your listings</h2>
      {listings.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} />
          <h3>No listings yet</h3>
          <p>Create your first listing to start hosting.</p>
          <button className="btn btn-primary mt-24" onClick={() => setShowCreateForm(true)}>
            <Plus size={18} /> Create listing
          </button>
        </div>
      ) : (
        <div>
          {listings.map((l) => (
            <div key={l.id} className="booking-item" style={{ cursor: "default" }}>
              <div className="booking-item-img">
                {l.images?.[0] && <img src={l.images[0].image_url} alt={l.title} />}
              </div>
              <div className="booking-item-info">
                <h4>{l.title}</h4>
                <p>{l.city}, {l.country}</p>
                <p>${l.price_per_night}/night · {l.max_guests} guests</p>
                <span className={`status-badge status-${
                  l.status === "published" ? "paid" : l.status === "draft" ? "pending" : "cancelled"
                }`}>{l.status}</span>
              </div>
              <div className="flex gap-8 flex-col">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => onNavigate(`/listing/${l.id}`)}
                >
                  <Eye size={16} /> View
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditingListing(l)}
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ color: "var(--error)" }}
                  onClick={async () => {
                    if (!confirm("Delete this listing?")) return;
                    try {
                      await api(`/api/host/listings/${l.id}`, { method: "DELETE" }, getToken() || undefined);
                      showToast("Listing deleted");
                      loadData();
                    } catch (err: any) { showToast(err.message); }
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reservations */}
      {hostBookings.length > 0 && (
        <>
          <h2 className="text-xl mb-16 mt-32">Reservations</h2>
          {hostBookings.map((b) => (
            <div key={b.id} className="booking-item" style={{ cursor: "default" }}>
              <div className="booking-item-img">
                {b.listing?.images?.[0] && <img src={b.listing.images[0].image_url} alt="" />}
              </div>
              <div className="booking-item-info">
                <h4>{b.listing?.title}</h4>
                <p>{b.guest?.first_name} {b.guest?.last_name} · {b.guest?.email}</p>
                <p>{b.check_in} → {b.check_out} · {b.nights} nights</p>
                <div className="flex items-center gap-12 mt-16">
                  <span className={`status-badge status-${b.status}`}>{b.status}</span>
                  <span style={{ fontWeight: 600 }}>${b.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {showCreateForm && (
        <ListingFormModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => { setShowCreateForm(false); loadData(); }}
          showToast={showToast}
        />
      )}

      {editingListing && (
        <ListingFormModal
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSuccess={() => { setEditingListing(null); loadData(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ─── Listing Form Modal ─────────────────────────────────────────

function ListingFormModal({
  listing, onClose, onSuccess, showToast,
}: {
  listing?: Listing | null;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string) => void;
}) {
  const [title, setTitle] = useState(listing?.title || "");
  const [description, setDescription] = useState(listing?.description || "");
  const [country, setCountry] = useState(listing?.country || "");
  const [city, setCity] = useState(listing?.city || "");
  const [address, setAddress] = useState(listing?.address || "");
  const [pricePerNight, setPricePerNight] = useState(String(listing?.price_per_night || ""));
  const [cleaningFee, setCleaningFee] = useState(String(listing?.cleaning_fee || "0"));
  const [serviceFee, setServiceFee] = useState(String(listing?.service_fee || "0"));
  const [maxGuests, setMaxGuests] = useState(String(listing?.max_guests || "1"));
  const [bedrooms, setBedrooms] = useState(String(listing?.bedrooms || "0"));
  const [beds, setBeds] = useState(String(listing?.beds || "0"));
  const [bathrooms, setBathrooms] = useState(String(listing?.bathrooms || "0"));
  const [propertyType, setPropertyType] = useState(listing?.property_type || "apartment");
  const [status, setStatus] = useState(listing?.status || "draft");
  const [imageUrls, setImageUrls] = useState<string[]>(
    listing?.images?.map((i) => i.image_url) || []
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Set<number>>(
    new Set(listing?.amenities?.map((a) => a.id) || [])
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ amenities: Amenity[] }>("/api/amenities")
      .then((d) => setAmenities(d.amenities))
      .catch(() => {});
  }, []);

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImageUrls((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const removeImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const body = {
        title, description, country, city, address,
        price_per_night: parseFloat(pricePerNight),
        cleaning_fee: parseFloat(cleaningFee) || 0,
        service_fee: parseFloat(serviceFee) || 0,
        max_guests: parseInt(maxGuests) || 1,
        bedrooms: parseInt(bedrooms) || 0,
        beds: parseInt(beds) || 0,
        bathrooms: parseInt(bathrooms) || 0,
        property_type: propertyType,
        amenity_ids: Array.from(selectedAmenities),
        image_urls: imageUrls,
      };

      if (listing) {
        await api(`/api/host/listings/${listing.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...body, status }),
        }, getToken() || undefined);
        showToast("Listing updated");
      } else {
        await api("/api/host/listings", {
          method: "POST",
          body: JSON.stringify(body),
        }, getToken() || undefined);
        showToast("Listing created");
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{listing ? "Edit listing" : "Create new listing"}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Cozy apartment in the city center" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your place..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Country</label>
                <input className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>City</label>
                <input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price per night ($)</label>
                <input className="form-input" type="number" step="0.01" value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Cleaning fee ($)</label>
                <input className="form-input" type="number" step="0.01" value={cleaningFee} onChange={(e) => setCleaningFee(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Service fee ($)</label>
                <input className="form-input" type="number" step="0.01" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Max guests</label>
                <input className="form-input" type="number" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Bedrooms</label>
                <input className="form-input" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Beds</label>
                <input className="form-input" type="number" value={beds} onChange={(e) => setBeds(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Bathrooms</label>
                <input className="form-input" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Property type</label>
              <select className="form-input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="cabin">Cabin</option>
                <option value="villa">Villa</option>
                <option value="loft">Loft</option>
                <option value="studio">Studio</option>
                <option value="cottage">Cottage</option>
                <option value="chalet">Chalet</option>
              </select>
            </div>

            {listing && (
              <div className="form-group">
                <label>Status</label>
                <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </div>
            )}

            {/* Images */}
            <div className="form-group">
              <label>Images (paste URLs)</label>
              {imageUrls.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {imageUrls.map((url, i) => (
                    <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        style={{
                          position: "absolute", top: -4, right: -4, width: 20, height: 20,
                          borderRadius: "50%", background: "var(--error)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-8">
                <input
                  className="form-input"
                  placeholder="https://..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
                />
                <button type="button" className="btn btn-secondary" onClick={addImage}>Add</button>
              </div>
            </div>

            {/* Amenities */}
            <div className="form-group">
              <label>Amenities</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {amenities.map((a) => (
                  <label key={a.id} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.has(a.id)}
                      onChange={() => {
                        setSelectedAmenities((prev) => {
                          const n = new Set(prev);
                          if (n.has(a.id)) n.delete(a.id); else n.add(a.id);
                          return n;
                        });
                      }}
                    />
                    {a.name}
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="form-error mb-16"><AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} />{error}</div>}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? <Loader2 size={20} className="animate-spin" /> : null}
              {listing ? "Save changes" : "Create listing"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Page ─────────────────────────────────────────────────

function AdminPage({
  user, onNavigate, showToast,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
  showToast: (msg: string) => void;
}) {
  const [tab, setTab] = useState<"users" | "listings" | "bookings">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") { setLoading(false); return; }
    loadAll();
  }, [user]);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api<{ users: User[] }>("/api/admin/users", {}, getToken() || undefined),
      api<{ listings: Listing[] }>("/api/admin/listings", {}, getToken() || undefined),
      api<{ bookings: Booking[] }>("/api/admin/bookings", {}, getToken() || undefined),
    ]).then(([u, l, b]) => {
      setUsers(u.users); setListings(l.listings); setBookings(b.bookings);
    }).finally(() => setLoading(false));
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="empty-state">
        <Shield size={48} />
        <h3>Admin access required</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>Go home</button>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="container page-content">
      <h1 className="page-title">Admin panel</h1>
      <div className="tabs">
        <button className={`tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>Users ({users.length})</button>
        <button className={`tab ${tab === "listings" ? "active" : ""}`} onClick={() => setTab("listings")}>Listings ({listings.length})</button>
        <button className={`tab ${tab === "bookings" ? "active" : ""}`} onClick={() => setTab("bookings")}>Bookings ({bookings.length})</button>
      </div>

      {tab === "users" && (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="filter-input"
                      style={{ padding: "4px 8px", fontSize: 13 }}
                      value={u.role}
                      onChange={async (e) => {
                        try {
                          await api(`/api/admin/users/${u.id}/role?role=${e.target.value}`, {
                            method: "PUT",
                          }, getToken() || undefined);
                          showToast("Role updated");
                          loadAll();
                        } catch (err: any) { showToast(err.message); }
                      }}
                    >
                      <option value="user">user</option>
                      <option value="host">host</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "listings" && (
        <div>
          {listings.map((l) => (
            <div key={l.id} className="booking-item" style={{ cursor: "default" }}>
              <div className="booking-item-img">
                {l.images?.[0] && <img src={l.images[0].image_url} alt={l.title} />}
              </div>
              <div className="booking-item-info">
                <h4>{l.title}</h4>
                <p>{l.city}, {l.country}</p>
                <p>${l.price_per_night}/night · Owner #{l.owner_id}</p>
                <span className={`status-badge status-${
                  l.status === "published" ? "paid" : l.status === "draft" ? "pending" : "cancelled"
                }`}>{l.status}</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ color: "var(--error)" }}
                onClick={async () => {
                  if (!confirm("Delete this listing?")) return;
                  try {
                    await api(`/api/admin/listings/${l.id}`, { method: "DELETE" }, getToken() || undefined);
                    showToast("Listing deleted");
                    loadAll();
                  } catch (err: any) { showToast(err.message); }
                }}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "bookings" && (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Listing</th><th>Guest</th><th>Dates</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.listing?.title || `#${b.listing_id}`}</td>
                  <td>User #{b.user_id}</td>
                  <td>{b.check_in} → {b.check_out}</td>
                  <td>${b.total.toFixed(2)}</td>
                  <td><span className={`status-badge status-${b.status}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Profile Page ───────────────────────────────────────────────

function ProfilePage({
  user, onNavigate, showToast,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
  showToast: (msg: string) => void;
}) {
  if (!user) {
    return (
      <div className="empty-state">
        <h3>Please log in to view your profile</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>Go home</button>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <h1 className="page-title">Your profile</h1>
      <div style={{ maxWidth: 500 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 16, marginBottom: 32,
        }}>
          <div className="host-avatar" style={{ width: 80, height: 80, fontSize: 28 }}>
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <div>
            <h2 style={{ fontSize: 22 }}>{user.first_name} {user.last_name}</h2>
            <p className="color-neutral-500">{user.email}</p>
            <span className={`status-badge status-${user.role === "admin" ? "refunded" : user.role === "host" ? "paid" : "pending"}`}>
              {user.role}
            </span>
          </div>
        </div>

        <div style={{
          border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-lg)", padding: 24,
        }}>
          <h3 style={{ marginBottom: 16 }}>Account details</h3>
          <div className="price-line"><span>First name</span><span>{user.first_name}</span></div>
          <div className="price-line"><span>Last name</span><span>{user.last_name}</span></div>
          <div className="price-line"><span>Email</span><span>{user.email}</span></div>
          <div className="price-line"><span>Phone</span><span>{user.phone || "—"}</span></div>
          <div className="price-line"><span>Role</span><span>{user.role}</span></div>

          {user.role === "host" && (
            <button
              className="btn btn-outline btn-block mt-16"
              onClick={() => onNavigate("/host")}
            >
              Go to host dashboard
            </button>
          )}

          {user.role === "user" && (
            <button
              className="btn btn-primary btn-block mt-24"
              onClick={() => onNavigate("/host")}
            >
              <Sparkles size={18} /> Become a host
            </button>
          )}

          {user.role === "admin" && (
            <button
              className="btn btn-outline btn-block mt-16"
              onClick={() => onNavigate("/admin")}
            >
              <Shield size={18} /> Admin panel
            </button>
          )}
        </div>

        <div className="flex gap-12 mt-24">
          <button className="btn btn-secondary btn-block" onClick={() => onNavigate("/bookings")}>
            <Calendar size={18} /> My bookings
          </button>
          <button className="btn btn-secondary btn-block" onClick={() => onNavigate("/favorites")}>
            <Heart size={18} /> Favorites
          </button>
        </div>
      </div>
    </div>
  );
}
