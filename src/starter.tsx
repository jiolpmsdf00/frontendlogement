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
  Bell,
  Send,
  MessageSquare,
  Volume2,
  VolumeX,
  ExternalLink,
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
  language?: string;
  stripe_ready?: boolean;
  totp_enabled?: boolean;
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
  check_in_time?: string;
  check_out_time?: string;
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  parties_allowed?: boolean;
  events_allowed?: boolean;
  children_allowed?: boolean;
  arrival_instructions?: string | null;
  additional_rules?: string | null;
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
  platform_fee?: number;
  host_amount?: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  stripe_payment_intent_id?: string;
  stripe_checkout_session_id?: string;
  created_at?: string;
  has_review?: boolean;
  review?: { id: number; rating: number; comment?: string | null } | null;
  cancellation?: {
    id: number;
    status: CancellationStatus;
    refund_percent: number;
    refundable_amount: number;
    refunded_amount: number | null;
  } | null;
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

type CancellationStatus = "pending" | "approved" | "rejected" | "processing" | "refunded" | "failed";

interface CancellationRequest {
  id: number;
  booking_id: number;
  status: CancellationStatus;
  reason?: string | null;
  refund_percent: number;
  total_paid: number;
  already_refunded: number;
  refundable_amount: number;
  approved_amount: number | null;
  refunded_amount: number | null;
  admin_note?: string | null;
  failure_reason?: string | null;
  created_at?: string;
  booking?: { id: number; check_in: string; check_out: string; status: string; total: number };
  listing?: { id: number; title: string; city: string; country: string };
  guest?: { first_name: string; last_name: string; email: string };
}

interface CancellationPreview {
  eligible: boolean;
  reason: string | null;
  refund_percent: number;
  hours_before_arrival: number;
  total_paid: number;
  already_refunded: number;
  refundable_amount: number;
}

const cancellationBadgeClass = (s: CancellationStatus) =>
  s === "approved" ? "paid"
  : s === "rejected" ? "cancelled"
  : s === "processing" ? "pending"
  : s; // pending, refunded, failed

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

interface StripeStatus {
  has_account: boolean;
  ready: boolean;
  onboarding_completed: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements_due: string[];
  commission_percent: number;
}

interface PaymentRow {
  id: number;
  booking_id?: number | null;
  type: "payment" | "refund" | "failed";
  amount: number;
  platform_fee: number;
  host_amount: number;
  currency: string;
  created_at?: string;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  read_at?: string | null;
  created_at?: string;
  sender?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface Conversation {
  id: number;
  guest_id: number;
  host_id: number;
  other_user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  unread_count: number;
  last_message?: Message | null;
  created_at?: string;
  updated_at?: string;
  messages?: Message[];
}

interface AppNotification {
  id: number;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read_at?: string | null;
  created_at?: string;
}

interface HostProfile {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  host_bio?: string;
  created_at?: string;
  avg_rating?: number;
  review_count?: number;
  listings: Listing[];
  reviews?: Review[];
}

// ─── Internationalisation (EN / FR / ES / DE / IT / PT) ─────────

type Lang = "en" | "fr" | "es" | "de" | "it" | "pt";

const LANG_KEY = "stayhaven_lang";
const SOUND_KEY = "stayhaven_sound";

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
];

const LOCALES: Record<Lang, string> = {
  en: "en-US", fr: "fr-FR", es: "es-ES", de: "de-DE", it: "it-IT", pt: "pt-PT",
};

function isLang(v: any): v is Lang {
  return LANGUAGES.some((l) => l.code === v);
}

function getStoredLang(): Lang | null {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return isLang(v) ? v : null;
  } catch {
    return null;
  }
}

function getStoredSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

// Langue courante (mise à jour par le composant racine à chaque rendu)
let currentLang: Lang = getStoredLang() || "en";

// Chaque ligne : [anglais (clé), français, espagnol, allemand, italien, portugais]
const TRANSLATION_ROWS: string[][] = [
  ["Language", "Langue", "Idioma", "Sprache", "Lingua", "Idioma"],
  ["Welcome back, {name}!", "Bon retour, {name} !", "¡Bienvenido de nuevo, {name}!", "Willkommen zurück, {name}!", "Bentornato, {name}!", "Bem-vindo de volta, {name}!"],
  ["You have been logged out", "Vous avez été déconnecté", "Has cerrado sesión", "Sie wurden abgemeldet", "Sei stato disconnesso", "Você saiu da conta"],
  ["Page not found", "Page introuvable", "Página no encontrada", "Seite nicht gefunden", "Pagina non trovata", "Página não encontrada"],
  ["The page you're looking for doesn't exist.", "La page que vous recherchez n'existe pas.", "La página que buscas no existe.", "Die gesuchte Seite existiert nicht.", "La pagina che cerchi non esiste.", "A página que você procura não existe."],
  ["Back to home", "Retour à l'accueil", "Volver al inicio", "Zurück zur Startseite", "Torna alla home", "Voltar ao início"],
  ["Explore", "Explorer", "Explorar", "Entdecken", "Esplora", "Explorar"],
  ["Become a host", "Devenir hôte", "Hazte anfitrión", "Gastgeber werden", "Diventa host", "Torne-se anfitrião"],
  ["User menu", "Menu utilisateur", "Menú de usuario", "Benutzermenü", "Menu utente", "Menu do usuário"],
  ["Host", "Hôte", "Anfitrión", "Gastgeber", "Host", "Anfitrião"],
  ["Menu", "Menu", "Menú", "Menü", "Menu", "Menu"],
  ["Favorites", "Favoris", "Favoritos", "Favoriten", "Preferiti", "Favoritos"],
  ["My bookings", "Mes réservations", "Mis reservas", "Meine Buchungen", "Le mie prenotazioni", "Minhas reservas"],
  ["Profile", "Profil", "Perfil", "Profil", "Profilo", "Perfil"],
  ["Host dashboard", "Espace hôte", "Panel de anfitrión", "Gastgeber-Dashboard", "Dashboard host", "Painel do anfitrião"],
  ["Admin panel", "Panneau admin", "Panel de administración", "Admin-Bereich", "Pannello admin", "Painel de administração"],
  ["Log out", "Se déconnecter", "Cerrar sesión", "Abmelden", "Esci", "Sair"],
  ["Sign up", "S'inscrire", "Registrarse", "Registrieren", "Registrati", "Cadastrar-se"],
  ["Log in", "Se connecter", "Iniciar sesión", "Anmelden", "Accedi", "Entrar"],
  ["Where", "Où", "Dónde", "Wo", "Dove", "Onde"],
  ["Search destinations", "Rechercher une destination", "Buscar destinos", "Reiseziele suchen", "Cerca destinazioni", "Buscar destinos"],
  ["Search", "Rechercher", "Buscar", "Suchen", "Cerca", "Buscar"],
  ["Support", "Assistance", "Ayuda", "Support", "Assistenza", "Suporte"],
  ["Help Center", "Centre d'aide", "Centro de ayuda", "Hilfecenter", "Centro assistenza", "Central de ajuda"],
  ["Safety information", "Informations de sécurité", "Información de seguridad", "Sicherheitsinformationen", "Informazioni sulla sicurezza", "Informações de segurança"],
  ["Cancellation options", "Options d'annulation", "Opciones de cancelación", "Stornierungsoptionen", "Opzioni di cancellazione", "Opções de cancelamento"],
  ["Hosting", "Hébergement", "Anfitriones", "Gastgeben", "Ospitare", "Hospedagem"],
  ["Host your home", "Accueillez dans votre logement", "Alquila tu casa", "Vermiete dein Zuhause", "Metti in affitto la tua casa", "Anuncie sua casa"],
  ["Responsible hosting", "Hébergement responsable", "Alojamiento responsable", "Verantwortungsvolles Gastgeben", "Ospitalità responsabile", "Hospedagem responsável"],
  ["About us", "À propos", "Sobre nosotros", "Über uns", "Chi siamo", "Sobre nós"],
  ["Newsroom", "Presse", "Sala de prensa", "Presse", "Sala stampa", "Imprensa"],
  ["Careers", "Carrières", "Empleo", "Karriere", "Lavora con noi", "Carreiras"],
  ["Discover", "Découvrir", "Descubrir", "Entdecken", "Scopri", "Descobrir"],
  ["All listings", "Toutes les annonces", "Todos los anuncios", "Alle Unterkünfte", "Tutti gli annunci", "Todos os anúncios"],
  ["Paris", "Paris", "París", "Paris", "Parigi", "Paris"],
  ["Tokyo", "Tokyo", "Tokio", "Tokio", "Tokyo", "Tóquio"],
  ["New York", "New York", "Nueva York", "New York", "New York", "Nova York"],
  ["© 2026 GetBookForMe — Find your perfect stay", "© 2026 GetBookForMe — Trouvez le séjour parfait", "© 2026 GetBookForMe — Encuentra tu estancia perfecta", "© 2026 GetBookForMe — Finde deinen perfekten Aufenthalt", "© 2026 GetBookForMe — Trova il soggiorno perfetto", "© 2026 GetBookForMe — Encontre a estadia perfeita"],
  ["Privacy · Terms · Sitemap", "Confidentialité · Conditions · Plan du site", "Privacidad · Términos · Mapa del sitio", "Datenschutz · AGB · Sitemap", "Privacy · Termini · Mappa del sito", "Privacidade · Termos · Mapa do site"],
  ["Trips", "Voyages", "Viajes", "Reisen", "Viaggi", "Viagens"],
  ["Account", "Compte", "Cuenta", "Konto", "Account", "Conta"],
  ["Create your account", "Créez votre compte", "Crea tu cuenta", "Konto erstellen", "Crea il tuo account", "Crie sua conta"],
  ["Welcome back", "Bon retour", "Bienvenido de nuevo", "Willkommen zurück", "Bentornato", "Bem-vindo de volta"],
  ["Close", "Fermer", "Cerrar", "Schließen", "Chiudi", "Fechar"],
  ["First name", "Prénom", "Nombre", "Vorname", "Nome", "Nome"],
  ["Last name", "Nom", "Apellidos", "Nachname", "Cognome", "Sobrenome"],
  ["Email", "E-mail", "Correo electrónico", "E-Mail", "Email", "E-mail"],
  ["Password", "Mot de passe", "Contraseña", "Passwort", "Password", "Senha"],
  ["At least 6 characters", "Au moins 6 caractères", "Al menos 6 caracteres", "Mindestens 6 Zeichen", "Almeno 6 caratteri", "Pelo menos 6 caracteres"],
  ["Phone (optional)", "Téléphone (facultatif)", "Teléfono (opcional)", "Telefon (optional)", "Telefono (facoltativo)", "Telefone (opcional)"],
  ["Phone", "Téléphone", "Teléfono", "Telefon", "Telefono", "Telefone"],
  ["Something went wrong", "Une erreur est survenue", "Algo salió mal", "Etwas ist schiefgelaufen", "Qualcosa è andato storto", "Algo deu errado"],
  ["Already have an account?", "Vous avez déjà un compte ?", "¿Ya tienes una cuenta?", "Sie haben bereits ein Konto?", "Hai già un account?", "Já tem uma conta?"],
  ["Don't have an account?", "Vous n'avez pas de compte ?", "¿No tienes una cuenta?", "Noch kein Konto?", "Non hai un account?", "Não tem uma conta?"],
  ["Invalid email or password", "E-mail ou mot de passe invalide", "Correo o contraseña no válidos", "Ungültige E-Mail oder ungültiges Passwort", "Email o password non validi", "E-mail ou senha inválidos"],
  ["An account with this email already exists", "Un compte avec cet e-mail existe déjà", "Ya existe una cuenta con este correo", "Ein Konto mit dieser E-Mail existiert bereits", "Esiste già un account con questa email", "Já existe uma conta com este e-mail"],
  ["Removed from favorites", "Retiré des favoris", "Eliminado de favoritos", "Aus Favoriten entfernt", "Rimosso dai preferiti", "Removido dos favoritos"],
  ["Added to favorites", "Ajouté aux favoris", "Añadido a favoritos", "Zu Favoriten hinzugefügt", "Aggiunto ai preferiti", "Adicionado aos favoritos"],
  ["Failed to update favorites", "Échec de la mise à jour des favoris", "No se pudieron actualizar los favoritos", "Favoriten konnten nicht aktualisiert werden", "Impossibile aggiornare i preferiti", "Falha ao atualizar os favoritos"],
  ["Beautiful destination", "Magnifique destination", "Hermoso destino", "Wunderschönes Reiseziel", "Bellissima destinazione", "Destino lindo"],
  ["Find your next stay", "Trouvez votre prochain séjour", "Encuentra tu próxima estancia", "Finde deinen nächsten Aufenthalt", "Trova il tuo prossimo soggiorno", "Encontre sua próxima estadia"],
  ["Discover unique places to stay from local hosts worldwide", "Découvrez des hébergements uniques proposés par des hôtes locaux dans le monde entier", "Descubre alojamientos únicos de anfitriones locales de todo el mundo", "Entdecke einzigartige Unterkünfte von lokalen Gastgebern weltweit", "Scopri alloggi unici da host locali in tutto il mondo", "Descubra hospedagens únicas de anfitriões locais em todo o mundo"],
  ["Start exploring", "Commencer l'exploration", "Empieza a explorar", "Jetzt entdecken", "Inizia a esplorare", "Comece a explorar"],
  ["All", "Tous", "Todos", "Alle", "Tutti", "Todos"],
  ["Apartments", "Appartements", "Apartamentos", "Apartments", "Appartamenti", "Apartamentos"],
  ["Houses", "Maisons", "Casas", "Häuser", "Case", "Casas"],
  ["Cabins", "Cabanes", "Cabañas", "Hütten", "Baite", "Cabanas"],
  ["Villas", "Villas", "Villas", "Villen", "Ville", "Vilas"],
  ["Lofts", "Lofts", "Lofts", "Lofts", "Loft", "Lofts"],
  ["Studios", "Studios", "Estudios", "Studios", "Monolocali", "Estúdios"],
  ["Cottages", "Cottages", "Casas de campo", "Landhäuser", "Cottage", "Casas de campo"],
  ["Chalets", "Chalets", "Chalés", "Chalets", "Chalet", "Chalés"],
  ["Apartment", "Appartement", "Apartamento", "Apartment", "Appartamento", "Apartamento"],
  ["House", "Maison", "Casa", "Haus", "Casa", "Casa"],
  ["Cabin", "Cabane", "Cabaña", "Hütte", "Baita", "Cabana"],
  ["Villa", "Villa", "Villa", "Villa", "Villa", "Vila"],
  ["Loft", "Loft", "Loft", "Loft", "Loft", "Loft"],
  ["Studio", "Studio", "Estudio", "Studio", "Monolocale", "Estúdio"],
  ["Cottage", "Cottage", "Casa de campo", "Landhaus", "Cottage", "Casa de campo"],
  ["Chalet", "Chalet", "Chalé", "Chalet", "Chalet", "Chalé"],
  ["No listings found", "Aucune annonce trouvée", "No se encontraron anuncios", "Keine Unterkünfte gefunden", "Nessun annuncio trovato", "Nenhum anúncio encontrado"],
  ["Try a different category or check back later.", "Essayez une autre catégorie ou revenez plus tard.", "Prueba otra categoría o vuelve más tarde.", "Probiere eine andere Kategorie oder schau später wieder vorbei.", "Prova un'altra categoria o torna più tardi.", "Tente outra categoria ou volte mais tarde."],
  ["Remove from favorites", "Retirer des favoris", "Quitar de favoritos", "Aus Favoriten entfernen", "Rimuovi dai preferiti", "Remover dos favoritos"],
  ["Add to favorites", "Ajouter aux favoris", "Añadir a favoritos", "Zu Favoriten hinzufügen", "Aggiungi ai preferiti", "Adicionar aos favoritos"],
  ["/ night", "/ nuit", "/ noche", "/ Nacht", "/ notte", "/ noite"],
  ["/night", "/nuit", "/noche", "/Nacht", "/notte", "/noite"],
  ["Stays in {destination}", "Séjours à {destination}", "Estancias en {destination}", "Unterkünfte in {destination}", "Soggiorni a {destination}", "Estadias em {destination}"],
  ["Explore stays", "Explorer les séjours", "Explorar estancias", "Unterkünfte entdecken", "Esplora i soggiorni", "Explorar estadias"],
  ["Price range (per night)", "Fourchette de prix (par nuit)", "Rango de precio (por noche)", "Preisspanne (pro Nacht)", "Fascia di prezzo (a notte)", "Faixa de preço (por noite)"],
  ["Min $", "Min $", "Mín. $", "Min. $", "Min $", "Mín. $"],
  ["Max $", "Max $", "Máx. $", "Max. $", "Max $", "Máx. $"],
  ["Property type", "Type de logement", "Tipo de alojamiento", "Unterkunftsart", "Tipo di alloggio", "Tipo de propriedade"],
  ["Any type", "Tous types", "Cualquier tipo", "Alle Arten", "Qualsiasi tipo", "Qualquer tipo"],
  ["Rooms", "Pièces", "Habitaciones", "Zimmer", "Stanze", "Cômodos"],
  ["Bedrooms", "Chambres", "Dormitorios", "Schlafzimmer", "Camere da letto", "Quartos"],
  ["Beds", "Lits", "Camas", "Betten", "Letti", "Camas"],
  ["Bathrooms", "Salles de bain", "Baños", "Bäder", "Bagni", "Banheiros"],
  ["Any bathrooms", "Toutes salles de bain", "Cualquier baño", "Beliebig viele Bäder", "Qualsiasi bagno", "Qualquer banheiro"],
  ["1+ bathrooms", "1+ salle de bain", "1+ baños", "1+ Bäder", "1+ bagni", "1+ banheiros"],
  ["2+ bathrooms", "2+ salles de bain", "2+ baños", "2+ Bäder", "2+ bagni", "2+ banheiros"],
  ["3+ bathrooms", "3+ salles de bain", "3+ baños", "3+ Bäder", "3+ bagni", "3+ banheiros"],
  ["Amenities", "Équipements", "Servicios", "Ausstattung", "Servizi", "Comodidades"],
  ["Clear all filters", "Effacer tous les filtres", "Borrar todos los filtros", "Alle Filter zurücksetzen", "Cancella tutti i filtri", "Limpar todos os filtros"],
  ["Where to?", "Où allez-vous ?", "¿A dónde?", "Wohin?", "Dove vai?", "Para onde?"],
  ["Any guests", "Nombre de voyageurs indifférent", "Cualquier nº de huéspedes", "Beliebig viele Gäste", "Qualsiasi numero di ospiti", "Qualquer nº de hóspedes"],
  ["1+ guests", "1+ voyageur", "1+ huéspedes", "1+ Gäste", "1+ ospiti", "1+ hóspedes"],
  ["2+ guests", "2+ voyageurs", "2+ huéspedes", "2+ Gäste", "2+ ospiti", "2+ hóspedes"],
  ["4+ guests", "4+ voyageurs", "4+ huéspedes", "4+ Gäste", "4+ ospiti", "4+ hóspedes"],
  ["6+ guests", "6+ voyageurs", "6+ huéspedes", "6+ Gäste", "6+ ospiti", "6+ hóspedes"],
  ["8+ guests", "8+ voyageurs", "8+ huéspedes", "8+ Gäste", "8+ ospiti", "8+ hóspedes"],
  ["Filters", "Filtres", "Filtros", "Filter", "Filtri", "Filtros"],
  ["No stays found", "Aucun séjour trouvé", "No se encontraron estancias", "Keine Aufenthalte gefunden", "Nessun soggiorno trovato", "Nenhuma estadia encontrada"],
  ["Try adjusting your search or filters.", "Essayez de modifier votre recherche ou vos filtres.", "Prueba a ajustar tu búsqueda o los filtros.", "Passe deine Suche oder die Filter an.", "Prova a modificare la ricerca o i filtri.", "Tente ajustar sua busca ou os filtros."],
  ["{n} stay available", "{n} séjour disponible", "{n} estancia disponible", "{n} Aufenthalt verfügbar", "{n} soggiorno disponibile", "{n} estadia disponível"],
  ["{n} stays available", "{n} séjours disponibles", "{n} estancias disponibles", "{n} Aufenthalte verfügbar", "{n} soggiorni disponibili", "{n} estadias disponíveis"],
  ["Pool", "Piscine", "Piscina", "Pool", "Piscina", "Piscina"],
  ["Parking", "Parking", "Aparcamiento", "Parkplatz", "Parcheggio", "Estacionamento"],
  ["Air conditioning", "Climatisation", "Aire acondicionado", "Klimaanlage", "Aria condizionata", "Ar-condicionado"],
  ["Kitchen", "Cuisine", "Cocina", "Küche", "Cucina", "Cozinha"],
  ["Washing machine", "Lave-linge", "Lavadora", "Waschmaschine", "Lavatrice", "Máquina de lavar"],
  ["Television", "Télévision", "Televisión", "Fernseher", "Televisione", "Televisão"],
  ["Workspace", "Espace de travail", "Espacio de trabajo", "Arbeitsplatz", "Spazio di lavoro", "Espaço de trabalho"],
  ["Heating", "Chauffage", "Calefacción", "Heizung", "Riscaldamento", "Aquecimento"],
  ["Hot tub", "Jacuzzi", "Jacuzzi", "Whirlpool", "Vasca idromassaggio", "Jacuzzi"],
  ["Gym", "Salle de sport", "Gimnasio", "Fitnessraum", "Palestra", "Academia"],
  ["Breakfast", "Petit-déjeuner", "Desayuno", "Frühstück", "Colazione", "Café da manhã"],
  ["Fireplace", "Cheminée", "Chimenea", "Kamin", "Camino", "Lareira"],
  ["Sea view", "Vue sur la mer", "Vistas al mar", "Meerblick", "Vista mare", "Vista para o mar"],
  ["Garden", "Jardin", "Jardín", "Garten", "Giardino", "Jardim"],
  ["Listing not found", "Annonce introuvable", "Anuncio no encontrado", "Unterkunft nicht gefunden", "Annuncio non trovato", "Anúncio não encontrado"],
  ["Please select check-in and check-out dates", "Veuillez sélectionner les dates d'arrivée et de départ", "Selecciona las fechas de entrada y salida", "Bitte Check-in- und Check-out-Datum wählen", "Seleziona le date di check-in e check-out", "Selecione as datas de check-in e check-out"],
  ["Check-out must be after check-in", "Le départ doit être après l'arrivée", "La salida debe ser posterior a la entrada", "Check-out muss nach dem Check-in liegen", "Il check-out deve essere dopo il check-in", "O check-out deve ser depois do check-in"],
  ["Maximum {n} guests", "{n} voyageurs maximum", "Máximo {n} huéspedes", "Maximal {n} Gäste", "Massimo {n} ospiti", "Máximo de {n} hóspedes"],
  ["Failed to create booking", "Échec de la création de la réservation", "No se pudo crear la reserva", "Buchung konnte nicht erstellt werden", "Impossibile creare la prenotazione", "Falha ao criar a reserva"],
  ["These dates are no longer available", "Ces dates ne sont plus disponibles", "Estas fechas ya no están disponibles", "Diese Termine sind nicht mehr verfügbar", "Queste date non sono più disponibili", "Essas datas não estão mais disponíveis"],
  ["Back", "Retour", "Volver", "Zurück", "Indietro", "Voltar"],
  ["{n} guests", "{n} voyageurs", "{n} huéspedes", "{n} Gäste", "{n} ospiti", "{n} hóspedes"],
  ["{n} guest", "{n} voyageur", "{n} huésped", "{n} Gast", "{n} ospite", "{n} hóspede"],
  ["{n} bedrooms", "{n} chambres", "{n} dormitorios", "{n} Schlafzimmer", "{n} camere", "{n} quartos"],
  ["{n} beds", "{n} lits", "{n} camas", "{n} Betten", "{n} letti", "{n} camas"],
  ["{n} baths", "{n} salles de bain", "{n} baños", "{n} Bäder", "{n} bagni", "{n} banheiros"],
  ["Hosted by {name}", "Hôte : {name}", "Anfitrión: {name}", "Gastgeber: {name}", "Host: {name}", "Anfitrião: {name}"],
  ["Superhost", "Superhôte", "Superanfitrión", "Superhost", "Superhost", "Superanfitrião"],
  ["About this place", "À propos de ce logement", "Acerca de este alojamiento", "Über diese Unterkunft", "Informazioni su questo alloggio", "Sobre este lugar"],
  ["No description provided.", "Aucune description fournie.", "No se proporcionó descripción.", "Keine Beschreibung vorhanden.", "Nessuna descrizione fornita.", "Nenhuma descrição fornecida."],
  ["What this place offers", "Ce que propose ce logement", "Lo que ofrece este alojamiento", "Das bietet diese Unterkunft", "Cosa offre questo alloggio", "O que este lugar oferece"],
  ["Reviews ({n})", "Avis ({n})", "Reseñas ({n})", "Bewertungen ({n})", "Recensioni ({n})", "Avaliações ({n})"],
  ["per guest / night", "par voyageur / nuit", "por huésped / noche", "pro Gast / Nacht", "per ospite / notte", "por hóspede / noite"],
  ["Check-in", "Arrivée", "Entrada", "Check-in", "Check-in", "Check-in"],
  ["Check-out", "Départ", "Salida", "Check-out", "Check-out", "Check-out"],
  ["Guests", "Voyageurs", "Huéspedes", "Gäste", "Ospiti", "Hóspedes"],
  ["{price} × {nights} nights × {guests} guests", "{price} × {nights} nuits × {guests} voyageurs", "{price} × {nights} noches × {guests} huéspedes", "{price} × {nights} Nächte × {guests} Gäste", "{price} × {nights} notti × {guests} ospiti", "{price} × {nights} noites × {guests} hóspedes"],
  ["{price} × {nights} nights × {guests} guest", "{price} × {nights} nuits × {guests} voyageur", "{price} × {nights} noches × {guests} huésped", "{price} × {nights} Nächte × {guests} Gast", "{price} × {nights} notti × {guests} ospite", "{price} × {nights} noites × {guests} hóspede"],
  ["Cleaning fee", "Frais de ménage", "Tarifa de limpieza", "Reinigungsgebühr", "Costo di pulizia", "Taxa de limpeza"],
  ["Service fee", "Frais de service", "Tarifa de servicio", "Servicegebühr", "Commissione di servizio", "Taxa de serviço"],
  ["Total", "Total", "Total", "Gesamt", "Totale", "Total"],
  ["Reserve", "Réserver", "Reservar", "Reservieren", "Prenota", "Reservar"],
  ["You won't be charged yet", "Vous ne serez pas encore débité", "Todavía no se te cobrará", "Es wird noch nichts berechnet", "Non ti verrà ancora addebitato nulla", "Você ainda não será cobrado"],
  ["Please log in to view favorites", "Connectez-vous pour voir vos favoris", "Inicia sesión para ver tus favoritos", "Bitte melde dich an, um Favoriten zu sehen", "Accedi per vedere i preferiti", "Faça login para ver seus favoritos"],
  ["Browse listings", "Parcourir les annonces", "Ver anuncios", "Unterkünfte durchsuchen", "Sfoglia gli annunci", "Ver anúncios"],
  ["Your favorites", "Vos favoris", "Tus favoritos", "Deine Favoriten", "I tuoi preferiti", "Seus favoritos"],
  ["No favorites yet", "Aucun favori pour l'instant", "Aún no hay favoritos", "Noch keine Favoriten", "Ancora nessun preferito", "Nenhum favori ainda"],
  ["Save your favorite places by tapping the heart icon.", "Enregistrez vos lieux préférés en appuyant sur le cœur.", "Guarda tus lugares favoritos pulsando el icono del corazón.", "Speichere deine Lieblingsorte mit dem Herz-Symbol.", "Salva i tuoi posti preferiti toccando il cuore.", "Salve seus lugares favoritos tocando no coração."],
  ["Booking cancelled", "Réservation annulée", "Reserva cancelada", "Buchung storniert", "Prenotazione annullata", "Reserva cancelada"],
  ["Please log in to view your bookings", "Connectez-vous pour voir vos réservations", "Inicia sesión para ver tus reservas", "Bitte melde dich an, um deine Buchungen zu sehen", "Accedi per vedere le tue prenotazioni", "Faça login para ver suas reservas"],
  ["Your trips", "Vos voyages", "Tus viajes", "Deine Reisen", "I tuoi viaggi", "Suas viagens"],
  ["Upcoming", "À venir", "Próximas", "Bevorstehend", "In arrivo", "Próximas"],
  ["Past", "Passés", "Pasadas", "Vergangen", "Passati", "Passadas"],
  ["No trips yet", "Aucun voyage pour l'instant", "Aún no hay viajes", "Noch keine Reisen", "Ancora nessun viaggio", "Nenhuma viagem ainda"],
  ["Start exploring and book your first stay.", "Explorez et réservez votre premier séjour.", "Empieza a explorar y reserva tu primera estancia.", "Entdecke Unterkünfte und buche deinen ersten Aufenthalt.", "Inizia a esplorare e prenota il tuo primo soggiorno.", "Comece a explorar e reserve sua primeira estadia."],
  ["Find a stay", "Trouver un séjour", "Buscar una estancia", "Unterkunft finden", "Trova un soggiorno", "Encontrar uma estadia"],
  ["Listing", "Annonce", "Anuncio", "Unterkunft", "Annuncio", "Anúncio"],
  ["{n} nights", "{n} nuits", "{n} noches", "{n} Nächte", "{n} notti", "{n} noites"],
  ["Cancel", "Annuler", "Cancelar", "Stornieren", "Annulla", "Cancelar"],
  ["View details", "Voir les détails", "Ver detalles", "Details ansehen", "Vedi dettagli", "Ver detalhes"],
  ["Booking not found", "Réservation introuvable", "Reserva no encontrada", "Buchung nicht gefunden", "Prenotazione non trovata", "Reserva não encontrada"],
  ["View all bookings", "Voir toutes les réservations", "Ver todas las reservas", "Alle Buchungen ansehen", "Vedi tutte le prenotazioni", "Ver todas as reservas"],
  ["Back to trips", "Retour aux voyages", "Volver a viajes", "Zurück zu Reisen", "Torna ai viaggi", "Voltar às viagens"],
  ["Verifying payment...", "Vérification du paiement...", "Verificando el pago...", "Zahlung wird überprüft...", "Verifica del pagamento...", "Verificando o pagamento..."],
  ["Please wait a few seconds, do not pay again.", "Veuillez patienter quelques secondes, ne payez pas à nouveau.", "Espera unos segundos, no vuelvas a pagar.", "Bitte warten Sie einige Sekunden, zahlen Sie nicht erneut.", "Attendi qualche secondo, non pagare di nuovo.", "Aguarde alguns segundos, não pague novamente."],
  ["Payment is being confirmed", "Paiement en cours de confirmation", "Pago en proceso de confirmación", "Zahlung wird bestätigt", "Pagamento in fase di conferma", "Pagamento em confirmação"],
  ["Your payment was received by Stripe. Refresh this page in a moment; do not pay again.", "Votre paiement a été reçu par Stripe. Actualisez cette page dans un instant ; ne payez pas à nouveau.", "Stripe recibió tu pago. Actualiza la página en un momento; no vuelvas a pagar.", "Ihre Zahlung wurde von Stripe empfangen. Aktualisieren Sie die Seite gleich; zahlen Sie nicht erneut.", "Stripe ha ricevuto il pagamento. Aggiorna la pagina tra poco; non pagare di nuovo.", "O Stripe recebeu seu pagamento. Atualize a página em instantes; não pague novamente."],
  ["Payment successful!", "Paiement réussi !", "¡Pago realizado con éxito!", "Zahlung erfolgreich!", "Pagamento riuscito!", "Pagamento realizado com sucesso!"],
  ["Your booking is confirmed. A receipt has been sent to your email.", "Votre réservation est confirmée. Un reçu a été envoyé par e-mail.", "Tu reserva está confirmada. Se ha enviado un recibo a tu correo.", "Deine Buchung ist bestätigt. Eine Quittung wurde per E-Mail gesendet.", "La tua prenotazione è confermata. Una ricevuta è stata inviata via email.", "Sua reserva está confirmada. Um recibo foi enviado para seu e-mail."],
  ["Payment cancelled", "Paiement annulé", "Pago cancelado", "Zahlung abgebrochen", "Pagamento annullato", "Pagamento cancelado"],
  ["You can try again at any time.", "Vous pouvez réessayer à tout moment.", "Puedes intentarlo de nuevo en cualquier momento.", "Du kannst es jederzeit erneut versuchen.", "Puoi riprovare in qualsiasi momento.", "Você pode tentar novamente a qualquer momento."],
  ["Booking #{id}", "Réservation n°{id}", "Reserva n.º {id}", "Buchung Nr. {id}", "Prenotazione n. {id}", "Reserva nº {id}"],
  ["Trip details", "Détails du voyage", "Detalles del viaje", "Reisedetails", "Dettagli del viaggio", "Detalhes da viagem"],
  ["Nights", "Nuits", "Noches", "Nächte", "Notti", "Noites"],
  ["Status", "Statut", "Estado", "Status", "Stato", "Status"],
  ["Price breakdown", "Détail du prix", "Desglose del precio", "Preisaufschlüsselung", "Dettaglio del prezzo", "Detalhamento do preço"],
  ["Pay {amount}", "Payer {amount}", "Pagar {amount}", "{amount} bezahlen", "Paga {amount}", "Pagar {amount}"],
  ["Payment confirmed — your stay is booked!", "Paiement confirmé — votre séjour est réservé !", "Pago confirmado: ¡tu estancia está reservada!", "Zahlung bestätigt – dein Aufenthalt ist gebucht!", "Pagamento confermato — il tuo soggiorno è prenotato!", "Pagamento confirmado — sua estadia está reservada!"],
  ["This booking was cancelled.", "Cette réservation a été annulée.", "Esta reserva fue cancelada.", "Diese Buchung wurde storniert.", "Questa prenotazione è stata annullata.", "Esta reserva foi cancelada."],
  ["This booking was refunded.", "Cette réservation a été remboursée.", "Esta reserva fue reembolsada.", "Diese Buchung wurde erstattet.", "Questa prenotazione è stata rimborsata.", "Esta reserva foi reembolsada."],
  ["View listing", "Voir l'annonce", "Ver anuncio", "Unterkunft ansehen", "Vedi annuncio", "Ver anúncio"],
  ["Please log in to access the host dashboard", "Connectez-vous pour accéder à l'espace hôte", "Inicia sesión para acceder al panel de anfitrión", "Bitte melde dich an, um das Gastgeber-Dashboard zu öffnen", "Accedi per accedere al dashboard host", "Faça login para acessar o painel do anfitrião"],
  ["Go home", "Aller à l'accueil", "Ir al inicio", "Zur Startseite", "Vai alla home", "Ir para o início"],
  ["Join our community of hosts by sharing your space. Create and manage your listings and follow the reservations you receive.", "Rejoignez notre communauté d'hôtes en partageant votre espace. Créez et gérez vos annonces et suivez les réservations reçues.", "Únete a nuestra comunidad de anfitriones compartiendo tu espacio. Crea y gestiona tus anuncios y sigue las reservas que recibas.", "Werde Teil unserer Gastgeber-Community und teile deinen Wohnraum. Erstelle und verwalte Anzeigen und verfolge eingehende Buchungen.", "Unisciti alla nostra community di host condividendo il tuo spazio. Crea e gestisci i tuoi annunci e segui le prenotazioni ricevute.", "Junte-se à nossa comunidade de anfitriões compartilhando seu espaço. Crie e gerencie seus anúncios e acompanhe as reservas recebidas."],
  ["Get started as a host", "Devenir hôte maintenant", "Empieza como anfitrión", "Als Gastgeber starten", "Inizia come host", "Comece como anfitrião"],
  ["You are now a host!", "Vous êtes maintenant hôte !", "¡Ya eres anfitrión!", "Du bist jetzt Gastgeber!", "Ora sei un host!", "Agora você é anfitrião!"],
  ["Create listing", "Créer une annonce", "Crear anuncio", "Anzeige erstellen", "Crea annuncio", "Criar anúncio"],
  ["Total listings", "Total des annonces", "Total de anuncios", "Anzeigen gesamt", "Annunci totali", "Total de anúncios"],
  ["Total bookings", "Total des réservations", "Total de reservas", "Buchungen gesamt", "Prenotazioni totali", "Total de reservas"],
  ["Published", "Publiées", "Publicados", "Veröffentlicht", "Pubblicati", "Publicados"],
  ["Your listings", "Vos annonces", "Tus anuncios", "Deine Anzeigen", "I tuoi annunci", "Seus anúncios"],
  ["No listings yet", "Aucune annonce pour l'instant", "Aún no hay anuncios", "Noch keine Anzeigen", "Ancora nessun annuncio", "Nenhum anúncio ainda"],
  ["Create your first listing to start hosting.", "Créez votre première annonce pour commencer à accueillir.", "Crea tu primer anuncio para empezar a alojar.", "Erstelle deine erste Anzeige, um loszulegen.", "Crea il tuo primo annuncio per iniziare a ospitare.", "Crie seu primeiro anúncio para começar a hospedar."],
  ["View", "Voir", "Ver", "Ansehen", "Vedi", "Ver"],
  ["Edit", "Modifier", "Editar", "Bearbeiten", "Modifica", "Editar"],
  ["Delete", "Supprimer", "Eliminar", "Löschen", "Elimina", "Excluir"],
  ["Delete this listing?", "Supprimer cette annonce ?", "¿Eliminar este anuncio?", "Diese Anzeige löschen?", "Eliminare questo annuncio?", "Excluir este anúncio?"],
  ["Listing deleted", "Annonce supprimée", "Anuncio eliminado", "Anzeige gelöscht", "Annuncio eliminato", "Anúncio excluído"],
  ["Reservations", "Réservations", "Reservas", "Reservierungen", "Prenotazioni", "Reservas"],
  ["pending", "en attente", "pendiente", "ausstehend", "in sospeso", "pendente"],
  ["paid", "payée", "pagada", "bezahlt", "pagata", "paga"],
  ["failed", "échouée", "fallida", "fehlgeschlagen", "non riuscita", "falhou"],
  ["cancelled", "annulée", "cancelada", "storniert", "annullata", "cancelada"],
  ["refunded", "remboursée", "reembolsada", "erstattet", "rimborsata", "reembolsada"],
  ["draft", "brouillon", "borrador", "Entwurf", "bozza", "rascunho"],
  ["published", "publiée", "publicado", "veröffentlicht", "pubblicato", "publicado"],
  ["unpublished", "non publiée", "no publicado", "nicht veröffentlicht", "non pubblicato", "não publicado"],
  ["user", "utilisateur", "usuario", "Nutzer", "utente", "usuário"],
  ["host", "hôte", "anfitrión", "Gastgeber", "host", "anfitrião"],
  ["Stripe Connect setup required", "Configuration Stripe Connect requise", "Configuración de Stripe Connect requerida", "Stripe-Connect-Einrichtung erforderlich", "Configurazione Stripe Connect richiesta", "Configuração do Stripe Connect necessária"],
  ["You must finish setting up your Stripe Connect account before you can publish a listing. Until then, your listings stay as drafts.", "Vous devez terminer la configuration de votre compte Stripe Connect avant de pouvoir publier une annonce. D'ici là, vos annonces restent en brouillon.", "Debes terminar la configuración de tu cuenta de Stripe Connect antes de poder publicar un anuncio. Hasta entonces, tus anuncios seguirán como borrador.", "Du musst die Einrichtung deines Stripe-Connect-Kontos abschließen, bevor du eine Anzeige veröffentlichen kannst. Bis dahin bleiben deine Anzeigen Entwürfe.", "Devi completare la configurazione del tuo account Stripe Connect prima di pubblicare un annuncio. Fino ad allora i tuoi annunci restano in bozza.", "Você precisa concluir a configuração da sua conta Stripe Connect antes de publicar um anúncio. Até lá, seus anúncios permanecem como rascunho."],
  ["Set up Stripe Connect", "Configurer Stripe Connect", "Configurar Stripe Connect", "Stripe Connect einrichten", "Configura Stripe Connect", "Configurar o Stripe Connect"],
  ["Continue Stripe setup", "Continuer la configuration Stripe", "Continuar la configuración de Stripe", "Stripe-Einrichtung fortsetzen", "Continua la configurazione Stripe", "Continuar a configuração do Stripe"],
  ["Stripe Connect account active — you can publish listings and receive payouts.", "Compte Stripe Connect actif — vous pouvez publier des annonces et recevoir vos versements.", "Cuenta de Stripe Connect activa: puedes publicar anuncios y recibir pagos.", "Stripe-Connect-Konto aktiv – du kannst Anzeigen veröffentlichen und Auszahlungen erhalten.", "Account Stripe Connect attivo — puoi pubblicare annunci e ricevere i pagamenti.", "Conta Stripe Connect ativa — você pode publicar anúncios e receber repasses."],
  ["Platform commission: {pct}% per booking. You receive {host}%.", "Commission de la plateforme : {pct} % par réservation. Vous recevez {host} %.", "Comisión de la plataforma: {pct} % por reserva. Tú recibes el {host} %.", "Plattformprovision: {pct} % pro Buchung. Du erhältst {host} %.", "Commissione della piattaforma: {pct}% per prenotazione. Ricevi il {host}%.", "Comissão da plataforma: {pct}% por reserva. Você recebe {host}%."],
  ["Still required by Stripe: {items}", "Encore requis par Stripe : {items}", "Stripe aún requiere: {items}", "Von Stripe noch benötigt: {items}", "Ancora richiesto da Stripe: {items}", "Ainda exigido pelo Stripe: {items}"],
  ["Stripe Connect setup is required to publish a listing. Please complete it from your host dashboard.", "La configuration de Stripe Connect est requise pour publier une annonce. Terminez-la depuis votre espace hôte.", "Se requiere configurar Stripe Connect para publicar un anuncio. Complétala desde tu panel de anfitrión.", "Zum Veröffentlichen einer Anzeige ist die Einrichtung von Stripe Connect erforderlich. Bitte schließe sie in deinem Gastgeber-Dashboard ab.", "Per pubblicare un annuncio è necessario configurare Stripe Connect. Completa la configurazione dal dashboard host.", "A configuração do Stripe Connect é necessária para publicar um anúncio. Conclua-a no painel do anfitrião."],
  ["Could not verify your Stripe account. Please try again.", "Impossible de vérifier votre compte Stripe. Veuillez réessayer.", "No se pudo verificar tu cuenta de Stripe. Inténtalo de nuevo.", "Dein Stripe-Konto konnte nicht überprüft werden. Bitte versuche es erneut.", "Impossibile verificare il tuo account Stripe. Riprova.", "Não foi possível verificar sua conta Stripe. Tente novamente."],
  ["This host cannot accept payments yet.", "Cet hôte ne peut pas encore recevoir de paiements.", "Este anfitrión aún no puede recibir pagos.", "Dieser Gastgeber kann noch keine Zahlungen empfangen.", "Questo host non può ancora ricevere pagamenti.", "Este anfitrião ainda não pode receber pagamentos."],
  ["Payments history", "Historique des paiements", "Historial de pagos", "Zahlungsverlauf", "Cronologia dei pagamenti", "Histórico de pagamentos"],
  ["Date", "Date", "Fecha", "Datum", "Data", "Data"],
  ["Booking", "Réservation", "Reserva", "Buchung", "Prenotazione", "Reserva"],
  ["Type", "Type", "Tipo", "Typ", "Tipo", "Tipo"],
  ["Amount", "Montant", "Importe", "Betrag", "Importo", "Valor"],
  ["Commission", "Commission", "Comisión", "Provision", "Commissione", "Comissão"],
  ["Your payout", "Votre versement", "Tu pago", "Deine Auszahlung", "Il tuo pagamento", "Seu repasse"],
  ["payment", "paiement", "pago", "Zahlung", "pagamento", "pagamento"],
  ["refund", "remboursement", "reembolso", "Erstattung", "rimborso", "reembolso"],
  ["Net received: {net} · Total commission: {fee}", "Net reçu : {net} · Commission totale : {fee}", "Neto recibido: {net} · Comisión total: {fee}", "Netto erhalten: {net} · Provision gesamt: {fee}", "Netto ricevuto: {net} · Commissione totale: {fee}", "Líquido recebido: {net} · Comissão total: {fee}"],
  ["Edit listing", "Modifier l'annonce", "Editar anuncio", "Anzeige bearbeiten", "Modifica annuncio", "Editar anúncio"],
  ["Create new listing", "Créer une nouvelle annonce", "Crear nuevo anuncio", "Neue Anzeige erstellen", "Crea nuovo annuncio", "Criar novo anúncio"],
  ["Title", "Titre", "Título", "Titel", "Titolo", "Título"],
  ["Cozy apartment in the city center", "Appartement cosy en centre-ville", "Apartamento acogedor en el centro", "Gemütliche Wohnung im Stadtzentrum", "Accogliente appartamento in centro", "Apartamento aconchegante no centro"],
  ["Description", "Description", "Descripción", "Beschreibung", "Descrizione", "Descrição"],
  ["Describe your place...", "Décrivez votre logement...", "Describe tu alojamiento...", "Beschreibe deine Unterkunft...", "Descrivi il tuo alloggio...", "Descreva seu espaço..."],
  ["Country", "Pays", "País", "Land", "Paese", "País"],
  ["City", "Ville", "Ciudad", "Stadt", "Città", "Cidade"],
  ["Address", "Adresse", "Dirección", "Adresse", "Indirizzo", "Endereço"],
  ["Price per night per guest ($)", "Prix par nuit et par voyageur ($)", "Precio por noche y huésped ($)", "Preis pro Nacht und Gast ($)", "Prezzo per notte e ospite ($)", "Preço por noite e hóspede ($)"],
  ["Cleaning fee ($)", "Frais de ménage ($)", "Tarifa de limpieza ($)", "Reinigungsgebühr ($)", "Costo di pulizia ($)", "Taxa de limpeza ($)"],
  ["Service fee ($)", "Frais de service ($)", "Tarifa de servicio ($)", "Servicegebühr ($)", "Commissione di servizio ($)", "Taxa de serviço ($)"],
  ["Max guests", "Voyageurs max.", "Máx. huéspedes", "Max. Gäste", "Ospiti max", "Máx. de hóspedes"],
  ["Images (paste URLs)", "Images (collez des URL)", "Imágenes (pega URLs)", "Bilder (URLs einfügen)", "Immagini (incolla URL)", "Imagens (cole URLs)"],
  ["Add", "Ajouter", "Añadir", "Hinzufügen", "Aggiungi", "Adicionar"],
  ["Save changes", "Enregistrer", "Guardar cambios", "Änderungen speichern", "Salva modifiche", "Salvar alterações"],
  ["Listing updated", "Annonce mise à jour", "Anuncio actualizado", "Anzeige aktualisiert", "Annuncio aggiornato", "Anúncio atualizado"],
  ["Listing created", "Annonce créée", "Anuncio creado", "Anzeige erstellt", "Annuncio creato", "Anúncio criado"],
  ["Admin access required", "Accès administrateur requis", "Se requiere acceso de administrador", "Admin-Zugriff erforderlich", "Accesso admin richiesto", "Acesso de administrador necessário"],
  ["Users ({n})", "Utilisateurs ({n})", "Usuarios ({n})", "Nutzer ({n})", "Utenti ({n})", "Usuários ({n})"],
  ["Listings ({n})", "Annonces ({n})", "Anuncios ({n})", "Anzeigen ({n})", "Annunci ({n})", "Anúncios ({n})"],
  ["Bookings ({n})", "Réservations ({n})", "Reservas ({n})", "Buchungen ({n})", "Prenotazioni ({n})", "Reservas ({n})"],
  ["Name", "Nom", "Nombre", "Name", "Nome", "Nome"],
  ["Role", "Rôle", "Rol", "Rolle", "Ruolo", "Função"],
  ["Created", "Créé le", "Creado", "Erstellt", "Creato", "Criado em"],
  ["Role updated", "Rôle mis à jour", "Rol actualizado", "Rolle aktualisiert", "Ruolo aggiornato", "Função atualizada"],
  ["Owner", "Propriétaire", "Propietario", "Eigentümer", "Proprietario", "Proprietário"],
  ["Guest", "Voyageur", "Huésped", "Gast", "Ospite", "Hóspede"],
  ["Dates", "Dates", "Fechas", "Daten", "Date", "Datas"],
  ["Please log in to view your profile", "Connectez-vous pour voir votre profil", "Inicia sesión para ver tu perfil", "Bitte melde dich an, um dein Profil zu sehen", "Accedi per vedere il tuo profilo", "Faça login para ver seu perfil"],
  ["Your profile", "Votre profil", "Tu perfil", "Dein Profil", "Il tuo profilo", "Seu perfil"],
  ["Account details", "Détails du compte", "Detalles de la cuenta", "Kontodetails", "Dettagli dell'account", "Detalhes da conta"],
  ["Go to host dashboard", "Aller à l'espace hôte", "Ir al panel de anfitrión", "Zum Gastgeber-Dashboard", "Vai al dashboard host", "Ir ao painel do anfitrião"],
  // ── Nouvelles traductions ──
  ["Messages", "Messages", "Mensajes", "Nachrichten", "Messaggi", "Mensagens"],
  ["Notifications", "Notifications", "Notificaciones", "Benachrichtigungen", "Notifiche", "Notificações"],
  ["No conversations yet", "Aucune conversation pour l'instant", "Aún no hay conversaciones", "Noch keine Konversationen", "Nessuna conversazione ancora", "Nenhuma conversa ainda"],
  ["Start a conversation by booking a stay.", "Démarrez une conversation en réservant un séjour.", "Inicia una conversación reservando una estancia.", "Starte eine Konversation, indem du buchst.", "Avvia una conversazione prenotando un soggiorno.", "Inicie uma conversa reservando uma estadia."],
  ["Type a message...", "Écrivez un message...", "Escribe un mensaje...", "Nachricht schreiben...", "Scrivi un messaggio...", "Digite uma mensagem..."],
  ["Send", "Envoyer", "Enviar", "Senden", "Invia", "Enviar"],
  ["No messages yet", "Aucun message pour l'instant", "Aún no hay mensajes", "Noch keine Nachrichten", "Nessun messaggio ancora", "Nenhuma mensagem ainda"],
  ["View profile", "Voir le profil", "Ver perfil", "Profil ansehen", "Vedi profilo", "Ver perfil"],
  ["About this host", "À propos de cet hôte", "Sobre este anfitrión", "Über diesen Gastgeber", "Su questo host", "Sobre este anfitrião"],
  ["Host's listings", "Annonces de l'hôte", "Anuncios del anfitrión", "Anzeigen des Gastgebers", "Annunci dell'host", "Anúncios do anfitrião"],
  ["No listings available", "Aucune annonce disponible", "No hay anuncios disponibles", "Keine Anzeigen verfügbar", "Nessun annuncio disponibile", "Nenhum anúncio disponível"],
  ["Manage my Stripe account", "Gérer mon compte Stripe", "Gestionar mi cuenta Stripe", "Mein Stripe-Konto verwalten", "Gestisci il mio conto Stripe", "Gerenciar minha conta Stripe"],
  ["Access your Stripe Express Dashboard to view transactions, balance, payouts and bank details.", "Accédez à votre tableau de bord Stripe Express pour consulter vos transactions, solde, virements et informations bancaires.", "Accede a tu panel de Stripe Express para ver transacciones, saldo, pagos y datos bancarios.", "Greife auf dein Stripe Express Dashboard zu, um Transaktionen, Guthaben, Auszahlungen und Bankdaten einzusehen.", "Accedi alla tua dashboard Stripe Express per visualizzare transazioni, saldo, pagamenti e dati bancari.", "Acesse seu painel do Stripe Express para ver transações, saldo, repasses e dados bancários."],
  ["Mark all as read", "Tout marquer comme lu", "Marcar todo como leído", "Alle als gelesen markieren", "Segna tutto come letto", "Marcar tudo como lido"],
  ["No notifications", "Aucune notification", "Sin notificaciones", "Keine Benachrichtigungen", "Nessuna notifica", "Sem notificações"],
  ["Sound on", "Son activé", "Sonido activado", "Ton an", "Audio attivo", "Som ativado"],
  ["Sound off", "Son désactivé", "Sonido desactivado", "Ton aus", "Audio disattivato", "Som desativado"],
  ["Messages", "Messages", "Mensajes", "Nachrichten", "Messaggi", "Mensagens"],
  ["Message sent", "Message envoyé", "Mensaje enviado", "Nachricht gesendet", "Messaggio inviato", "Mensagem enviada"],
  ["Failed to send message", "Échec de l'envoi du message", "Error al enviar el mensaje", "Nachricht konnte nicht gesendet werden", "Invio del messaggio fallito", "Falha ao enviar a mensagem"],
  // ── Profil : nom, mot de passe, authentificateur ──
  ["Edit profile", "Modifier le profil", "Editar perfil", "Profil bearbeiten", "Modifica profilo", "Editar perfil"],
  ["Profile updated", "Profil mis à jour", "Perfil actualizado", "Profil aktualisiert", "Profilo aggiornato", "Perfil atualizado"],
  ["Change password", "Changer le mot de passe", "Cambiar contraseña", "Passwort ändern", "Cambia password", "Alterar senha"],
  ["Current password", "Mot de passe actuel", "Contraseña actual", "Aktuelles Passwort", "Password attuale", "Senha atual"],
  ["New password", "Nouveau mot de passe", "Nueva contraseña", "Neues Passwort", "Nuova password", "Nova senha"],
  ["Confirm new password", "Confirmer le nouveau mot de passe", "Confirmar nueva contraseña", "Neues Passwort bestätigen", "Conferma nuova password", "Confirmar nova senha"],
  ["Passwords do not match", "Les mots de passe ne correspondent pas", "Las contraseñas no coinciden", "Die Passwörter stimmen nicht überein", "Le password non corrispondono", "As senhas não coincidem"],
  ["Password updated", "Mot de passe mis à jour", "Contraseña actualizada", "Passwort aktualisiert", "Password aggiornata", "Senha atualizada"],
  ["Current password is incorrect", "Le mot de passe actuel est incorrect", "La contraseña actual es incorrecta", "Das aktuelle Passwort ist falsch", "La password attuale non è corretta", "A senha atual está incorreta"],
  ["Password must be at least 6 characters", "Le mot de passe doit contenir au moins 6 caractères", "La contraseña debe tener al menos 6 caracteres", "Das Passwort muss mindestens 6 Zeichen lang sein", "La password deve contenere almeno 6 caratteri", "A senha deve ter pelo menos 6 caracteres"],
  ["First and last name are required", "Le prénom et le nom sont obligatoires", "El nombre y los apellidos son obligatorios", "Vor- und Nachname sind erforderlich", "Nome e cognome sono obbligatori", "Nome e sobrenome são obrigatórios"],
  ["Security", "Sécurité", "Seguridad", "Sicherheit", "Sicurezza", "Segurança"],
  ["Authenticator app (password recovery)", "Application d'authentification (récupération du mot de passe)", "Aplicación de autenticación (recuperación de contraseña)", "Authenticator-App (Passwort-Wiederherstellung)", "App di autenticazione (recupero password)", "Aplicativo autenticador (recuperação de senha)"],
  ["Link an authenticator app such as Google Authenticator or Authy. It will let you reset your password if you forget it.", "Associez une application d'authentification comme Google Authenticator ou Authy. Elle vous permettra de réinitialiser votre mot de passe en cas d'oubli.", "Vincula una aplicación de autenticación como Google Authenticator o Authy. Te permitirá restablecer tu contraseña si la olvidas.", "Verknüpfe eine Authenticator-App wie Google Authenticator oder Authy. Damit kannst du dein Passwort zurücksetzen, falls du es vergisst.", "Collega un'app di autenticazione come Google Authenticator o Authy. Ti permetterà di reimpostare la password se la dimentichi.", "Vincule um aplicativo autenticador como o Google Authenticator ou o Authy. Ele permitirá redefinir sua senha caso você a esqueça."],
  ["Enable authenticator", "Activer l'authentificateur", "Activar autenticador", "Authenticator aktivieren", "Attiva autenticatore", "Ativar autenticador"],
  ["Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.", "Scannez ce QR code avec votre application d'authentification, puis saisissez le code à 6 chiffres pour confirmer.", "Escanea este código QR con tu aplicación de autenticación y luego introduce el código de 6 dígitos para confirmar.", "Scanne diesen QR-Code mit deiner Authenticator-App und gib dann den 6-stelligen Code zur Bestätigung ein.", "Scansiona questo codice QR con la tua app di autenticazione, poi inserisci il codice a 6 cifre per confermare.", "Escaneie este QR code com seu aplicativo autenticador e digite o código de 6 dígitos para confirmar."],
  ["Can't scan? Enter this key manually:", "Impossible de scanner ? Saisissez cette clé manuellement :", "¿No puedes escanear? Introduce esta clave manualmente:", "Scannen nicht möglich? Gib diesen Schlüssel manuell ein:", "Non riesci a scansionare? Inserisci questa chiave manualmente:", "Não consegue escanear? Digite esta chave manualmente:"],
  ["6-digit code", "Code à 6 chiffres", "Código de 6 dígitos", "6-stelliger Code", "Codice a 6 cifre", "Código de 6 dígitos"],
  ["Verify and enable", "Vérifier et activer", "Verificar y activar", "Prüfen und aktivieren", "Verifica e attiva", "Verificar e ativar"],
  ["Authenticator enabled", "Authentificateur activé", "Autenticador activado", "Authenticator aktiviert", "Autenticatore attivato", "Autenticador ativado"],
  ["Authenticator is active. You can use it to reset your password.", "L'authentificateur est actif. Vous pouvez l'utiliser pour réinitialiser votre mot de passe.", "El autenticador está activo. Puedes usarlo para restablecer tu contraseña.", "Der Authenticator ist aktiv. Du kannst ihn nutzen, um dein Passwort zurückzusetzen.", "L'autenticatore è attivo. Puoi usarlo per reimpostare la password.", "O autenticador está ativo. Você pode usá-lo para redefinir sua senha."],
  ["Disable authenticator", "Désactiver l'authentificateur", "Desactivar autenticador", "Authenticator deaktivieren", "Disattiva autenticatore", "Desativar autenticador"],
  ["Authenticator disabled", "Authentificateur désactivé", "Autenticador desactivado", "Authenticator deaktiviert", "Autenticatore disattivato", "Autenticador desativado"],
  ["Invalid verification code", "Code de vérification invalide", "Código de verificación no válido", "Ungültiger Bestätigungscode", "Codice di verifica non valido", "Código de verificação inválido"],
  // ── Mot de passe oublié ──
  ["Forgot your password?", "Mot de passe oublié ?", "¿Olvidaste tu contraseña?", "Passwort vergessen?", "Password dimenticata?", "Esqueceu sua senha?"],
  ["Reset your password", "Réinitialiser votre mot de passe", "Restablece tu contraseña", "Passwort zurücksetzen", "Reimposta la password", "Redefina sua senha"],
  ["Enter your email, the 6-digit code shown in your authenticator app (Google Authenticator, Authy…) and your new password.", "Saisissez votre e-mail, le code à 6 chiffres affiché dans votre application d'authentification (Google Authenticator, Authy…) et votre nouveau mot de passe.", "Introduce tu correo, el código de 6 dígitos que aparece en tu aplicación de autenticación (Google Authenticator, Authy…) y tu nueva contraseña.", "Gib deine E-Mail, den 6-stelligen Code deiner Authenticator-App (Google Authenticator, Authy …) und dein neues Passwort ein.", "Inserisci la tua email, il codice a 6 cifre mostrato nell'app di autenticazione (Google Authenticator, Authy…) e la nuova password.", "Informe seu e-mail, o código de 6 dígitos exibido no aplicativo autenticador (Google Authenticator, Authy…) e sua nova senha."],
  ["This only works if you enabled the authenticator in your profile beforehand.", "Cela ne fonctionne que si vous avez activé l'authentificateur dans votre profil au préalable.", "Solo funciona si activaste previamente el autenticador en tu perfil.", "Das funktioniert nur, wenn du den Authenticator zuvor in deinem Profil aktiviert hast.", "Funziona solo se hai già attivato l'autenticatore nel tuo profilo.", "Só funciona se você tiver ativado o autenticador no seu perfil anteriormente."],
  ["Verification code", "Code de vérification", "Código de verificación", "Bestätigungscode", "Codice di verifica", "Código de verificação"],
  ["Reset password", "Réinitialiser le mot de passe", "Restablecer contraseña", "Passwort zurücksetzen", "Reimposta password", "Redefinir senha"],
  ["Password reset successfully. You can now log in.", "Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.", "Contraseña restablecida. Ya puedes iniciar sesión.", "Passwort zurückgesetzt. Du kannst dich jetzt anmelden.", "Password reimpostata. Ora puoi accedere.", "Senha redefinida. Agora você pode entrar."],
  ["Back to login", "Retour à la connexion", "Volver a iniciar sesión", "Zurück zur Anmeldung", "Torna all'accesso", "Voltar ao login"],
  ["Invalid email or verification code", "E-mail ou code de vérification invalide", "Correo o código de verificación no válidos", "Ungültige E-Mail oder ungültiger Bestätigungscode", "Email o codice di verifica non validi", "E-mail ou código de verificação inválidos"],
  ["Too many attempts. Please try again later.", "Trop de tentatives. Veuillez réessayer plus tard.", "Demasiados intentos. Inténtalo de nuevo más tarde.", "Zu viele Versuche. Bitte versuche es später erneut.", "Troppi tentativi. Riprova più tardi.", "Muitas tentativas. Tente novamente mais tarde."],
  // ── Avis clients ──
  ["Leave a review", "Laisser un avis", "Dejar una reseña", "Bewertung abgeben", "Lascia una recensione", "Deixar uma avaliação"],
  ["How was your stay?", "Comment s'est passé votre séjour ?", "¿Qué tal tu estancia?", "Wie war dein Aufenthalt?", "Com'è andato il tuo soggiorno?", "Como foi sua estadia?"],
  ["Your rating", "Votre note", "Tu puntuación", "Deine Bewertung", "Il tuo voto", "Sua nota"],
  ["Your comment (optional)", "Votre commentaire (facultatif)", "Tu comentario (opcional)", "Dein Kommentar (optional)", "Il tuo commento (facoltativo)", "Seu comentário (opcional)"],
  ["Share your experience...", "Partagez votre expérience...", "Comparte tu experiencia...", "Teile deine Erfahrung...", "Condividi la tua esperienza...", "Compartilhe sua experiência..."],
  ["Submit review", "Publier l'avis", "Publicar reseña", "Bewertung veröffentlichen", "Pubblica recensione", "Publicar avaliação"],
  ["Thank you for your review!", "Merci pour votre avis !", "¡Gracias por tu reseña!", "Danke für deine Bewertung!", "Grazie per la tua recensione!", "Obrigado pela sua avaliação!"],
  ["Your review", "Votre avis", "Tu reseña", "Deine Bewertung", "La tua recensione", "Sua avaliação"],
  ["Please select a rating", "Veuillez choisir une note", "Selecciona una puntuación", "Bitte wähle eine Bewertung", "Seleziona un voto", "Selecione uma nota"],
  ["You can only review after your stay has ended", "Vous ne pouvez laisser un avis qu'après la fin de votre séjour", "Solo puedes dejar una reseña cuando termine tu estancia", "Du kannst erst nach Ende deines Aufenthalts bewerten", "Puoi lasciare una recensione solo dopo la fine del soggiorno", "Você só pode avaliar após o fim da estadia"],
  ["You have already reviewed this booking", "Vous avez déjà laissé un avis pour cette réservation", "Ya has dejado una reseña para esta reserva", "Du hast diese Buchung bereits bewertet", "Hai già recensito questa prenotazione", "Você já avaliou esta reserva"],
  // ── Calendrier de l'hôte ──
  ["Calendar", "Calendrier", "Calendario", "Kalender", "Calendario", "Calendário"],
  ["Availability calendar", "Calendrier de disponibilités", "Calendario de disponibilidad", "Verfügbarkeitskalender", "Calendario disponibilità", "Calendário de disponibilidade"],
  ["Select the dates to block or unblock, then confirm.", "Sélectionnez les dates à bloquer ou débloquer, puis confirmez.", "Selecciona las fechas a bloquear o desbloquear y confirma.", "Wähle die Daten zum Sperren oder Freigeben und bestätige.", "Seleziona le date da bloccare o sbloccare, poi conferma.", "Selecione as datas para bloquear ou desbloquear e confirme."],
  ["Block selected dates ({n})", "Bloquer les dates sélectionnées ({n})", "Bloquear fechas seleccionadas ({n})", "Ausgewählte Daten sperren ({n})", "Blocca le date selezionate ({n})", "Bloquear datas selecionadas ({n})"],
  ["Unblock selected dates ({n})", "Débloquer les dates sélectionnées ({n})", "Desbloquear fechas seleccionadas ({n})", "Ausgewählte Daten freigeben ({n})", "Sblocca le date selezionate ({n})", "Desbloquear datas selecionadas ({n})"],
  ["Available", "Disponible", "Disponible", "Verfügbar", "Disponibile", "Disponível"],
  ["Blocked", "Bloqué", "Bloqueado", "Gesperrt", "Bloccato", "Bloqueado"],
  ["Booked", "Réservé", "Reservado", "Gebucht", "Prenotato", "Reservado"],
  ["Dates blocked", "Dates bloquées", "Fechas bloqueadas", "Daten gesperrt", "Date bloccate", "Datas bloqueadas"],
  ["Dates unblocked", "Dates débloquées", "Fechas desbloqueadas", "Daten freigegeben", "Date sbloccate", "Datas desbloqueadas"],
  ["Previous month", "Mois précédent", "Mes anterior", "Vorheriger Monat", "Mese precedente", "Mês anterior"],
  ["Next month", "Mois suivant", "Mes siguiente", "Nächster Monat", "Mese successivo", "Próximo mês"],
  ["Some of these dates are already booked", "Certaines de ces dates sont déjà réservées", "Algunas de estas fechas ya están reservadas", "Einige dieser Daten sind bereits gebucht", "Alcune di queste date sono già prenotate", "Algumas dessas datas já estão reservadas"],
  ["Past dates cannot be blocked", "Les dates passées ne peuvent pas être bloquées", "Las fechas pasadas no se pueden bloquear", "Vergangene Daten können nicht gesperrt werden", "Le date passate non possono essere bloccate", "Datas passadas não podem ser bloqueadas"],
  // ── Annulation & remboursement ──
  ["Cancel my booking", "Annuler ma réservation", "Cancelar mi reserva", "Meine Buchung stornieren", "Annulla la mia prenotazione", "Cancelar minha reserva"],
  ["Cancellation request", "Demande d'annulation", "Solicitud de cancelación", "Stornierungsanfrage", "Richiesta di annullamento", "Pedido de cancelamento"],
  ["Cancellations", "Annulations", "Cancelaciones", "Stornierungen", "Annullamenti", "Cancelamentos"],
  ["Refund policy", "Politique de remboursement", "Política de reembolso", "Erstattungsrichtlinie", "Politica di rimborso", "Política de reembolso"],
  ["More than 7 days before arrival: 100% refund", "Plus de 7 jours avant l'arrivée : remboursement de 100 %", "Más de 7 días antes de la llegada: reembolso del 100 %", "Mehr als 7 Tage vor Anreise: 100 % Erstattung", "Più di 7 giorni prima dell'arrivo: rimborso del 100%", "Mais de 7 dias antes da chegada: reembolso de 100%"],
  ["Between 24 hours and 7 days: 50% refund", "Entre 24 heures et 7 jours : remboursement de 50 %", "Entre 24 horas y 7 días: reembolso del 50 %", "Zwischen 24 Stunden und 7 Tagen: 50 % Erstattung", "Tra 24 ore e 7 giorni: rimborso del 50%", "Entre 24 horas e 7 dias: reembolso de 50%"],
  ["Less than 24 hours: no automatic refund", "Moins de 24 heures : aucun remboursement automatique", "Menos de 24 horas: sin reembolso automático", "Weniger als 24 Stunden: keine automatische Erstattung", "Meno di 24 ore: nessun rimborso automatico", "Menos de 24 horas: sem reembolso automático"],
  ["Refund rate", "Taux de remboursement", "Porcentaje de reembolso", "Erstattungsquote", "Percentuale di rimborso", "Percentual de reembolso"],
  ["Estimated refund", "Remboursement estimé", "Reembolso estimado", "Voraussichtliche Erstattung", "Rimborso stimato", "Reembolso estimado"],
  ["Refund", "Remboursement", "Reembolso", "Erstattung", "Rimborso", "Reembolso"],
  ["Reason (optional)", "Motif (facultatif)", "Motivo (opcional)", "Grund (optional)", "Motivo (facoltativo)", "Motivo (opcional)"],
  ["Your request will be reviewed by our team. You will be notified at each step.", "Votre demande sera examinée par notre équipe. Vous serez notifié à chaque étape.", "Nuestro equipo revisará tu solicitud. Se te notificará en cada paso.", "Unser Team prüft deine Anfrage. Du wirst bei jedem Schritt benachrichtigt.", "Il nostro team esaminerà la tua richiesta. Riceverai una notifica a ogni passaggio.", "Nossa equipe analisará seu pedido. Você será notificado a cada etapa."],
  ["Send cancellation request", "Envoyer la demande d'annulation", "Enviar solicitud de cancelación", "Stornierungsanfrage senden", "Invia richiesta di annullamento", "Enviar pedido de cancelamento"],
  ["Cancellation request sent", "Demande d'annulation envoyée", "Solicitud de cancelación enviada", "Stornierungsanfrage gesendet", "Richiesta di annullamento inviata", "Pedido de cancelamento enviado"],
  ["No cancellation requests", "Aucune demande d'annulation", "Sin solicitudes de cancelación", "Keine Stornierungsanfragen", "Nessuna richiesta di annullamento", "Nenhum pedido de cancelamento"],
  ["Cancellation requests ({n})", "Demandes d'annulation ({n})", "Solicitudes de cancelación ({n})", "Stornierungsanfragen ({n})", "Richieste di annullamento ({n})", "Pedidos de cancelamento ({n})"],
  ["All statuses", "Tous les statuts", "Todos los estados", "Alle Status", "Tutti gli stati", "Todos os status"],
  ["Approve", "Accepter", "Aprobar", "Genehmigen", "Approva", "Aprovar"],
  ["Reject", "Refuser", "Rechazar", "Ablehnen", "Rifiuta", "Recusar"],
  ["Sync with Stripe", "Synchroniser avec Stripe", "Sincronizar con Stripe", "Mit Stripe synchronisieren", "Sincronizza con Stripe", "Sincronizar com o Stripe"],
  ["Actions", "Actions", "Acciones", "Aktionen", "Azioni", "Ações"],
  ["Note for the customer (optional)", "Note pour le client (facultatif)", "Nota para el cliente (opcional)", "Notiz für den Kunden (optional)", "Nota per il cliente (facoltativa)", "Nota para o cliente (opcional)"],
  ["Request processed", "Demande traitée", "Solicitud procesada", "Anfrage bearbeitet", "Richiesta elaborata", "Pedido processado"],
  ["Refunded: {amount}", "Remboursé : {amount}", "Reembolsado: {amount}", "Erstattet: {amount}", "Rimborsato: {amount}", "Reembolsado: {amount}"],
  ["Already refunded: {amount}", "Déjà remboursé : {amount}", "Ya reembolsado: {amount}", "Bereits erstattet: {amount}", "Già rimborsato: {amount}", "Já reembolsado: {amount}"],
  ["Note: {note}", "Note : {note}", "Nota: {note}", "Notiz: {note}", "Nota: {note}", "Nota: {note}"],
  ["approved", "approuvée", "aprobada", "genehmigt", "approvata", "aprovada"],
  ["rejected", "refusée", "rechazada", "abgelehnt", "rifiutata", "recusada"],
  ["processing", "en cours", "en curso", "in Bearbeitung", "in corso", "em andamento"],
  // ── Règles du logement ──
  ["House rules", "Règles du logement", "Normas del alojamiento", "Hausregeln", "Regole della casa", "Regras da casa"],
  ["Check-in time", "Heure d'arrivée", "Hora de llegada", "Check-in-Zeit", "Orario di check-in", "Horário de check-in"],
  ["Check-out time", "Heure de départ", "Hora de salida", "Check-out-Zeit", "Orario di check-out", "Horário de check-out"],
  ["Check-in from {time}", "Arrivée à partir de {time}", "Llegada a partir de las {time}", "Check-in ab {time}", "Check-in dalle {time}", "Check-in a partir de {time}"],
  ["Check-out before {time}", "Départ avant {time}", "Salida antes de las {time}", "Check-out bis {time}", "Check-out entro le {time}", "Check-out até {time}"],
  ["Pets allowed", "Animaux acceptés", "Se admiten mascotas", "Haustiere erlaubt", "Animali ammessi", "Animais permitidos"],
  ["No pets", "Animaux interdits", "No se admiten mascotas", "Keine Haustiere", "Animali non ammessi", "Animais não permitidos"],
  ["Smoking allowed", "Tabac autorisé", "Se permite fumar", "Rauchen erlaubt", "Fumo consentito", "Fumar permitido"],
  ["No smoking", "Tabac interdit", "Prohibido fumar", "Rauchen verboten", "Vietato fumare", "Proibido fumar"],
  ["Parties allowed", "Fêtes autorisées", "Se permiten fiestas", "Partys erlaubt", "Feste consentite", "Festas permitidas"],
  ["No parties", "Fêtes interdites", "Prohibidas las fiestas", "Keine Partys", "Feste vietate", "Festas proibidas"],
  ["Events allowed", "Événements autorisés", "Se permiten eventos", "Veranstaltungen erlaubt", "Eventi consentiti", "Eventos permitidos"],
  ["No events", "Événements interdits", "Prohibidos los eventos", "Keine Veranstaltungen", "Eventi vietati", "Eventos proibidos"],
  ["Children welcome", "Enfants acceptés", "Se admiten niños", "Kinder willkommen", "Bambini ammessi", "Crianças bem-vindas"],
  ["Children not allowed", "Enfants non acceptés", "No se admiten niños", "Keine Kinder", "Bambini non ammessi", "Crianças não permitidas"],
  ["Arrival instructions", "Instructions d'arrivée", "Instrucciones de llegada", "Anreiseinformationen", "Istruzioni per l'arrivo", "Instruções de chegada"],
  ["Additional rules", "Règles supplémentaires", "Normas adicionales", "Zusätzliche Regeln", "Regole aggiuntive", "Regras adicionais"],
  // ── Page « Qu'est-ce que GetBookForMe ? » ──
  ["What is GetBookForMe?", "Qu'est-ce que GetBookForMe ?", "¿Qué es GetBookForMe?", "Was ist GetBookForMe?", "Che cos'è GetBookForMe?", "O que é o GetBookForMe?"],
  ["About GetBookForMe", "À propos de GetBookForMe", "Sobre GetBookForMe", "Über GetBookForMe", "Su GetBookForMe", "Sobre o GetBookForMe"],
  ["GetBookForMe is a marketplace that connects travelers with hosts offering apartments, houses, villas, cabins and more, for a simple, transparent and secure booking experience.", "GetBookForMe est une place de marché qui met en relation des voyageurs et des hôtes proposant appartements, maisons, villas, cabanes et bien plus, pour une réservation simple, transparente et sécurisée.", "GetBookForMe es un marketplace que conecta a viajeros con anfitriones que ofrecen apartamentos, casas, villas, cabañas y mucho más, para una reserva sencilla, transparente y segura.", "GetBookForMe ist ein Marktplatz, der Reisende mit Gastgebern von Apartments, Häusern, Villen, Hütten und mehr verbindet – für eine einfache, transparente und sichere Buchung.", "GetBookForMe è un marketplace che mette in contatto viaggiatori e host che offrono appartamenti, case, ville, baite e altro, per una prenotazione semplice, trasparente e sicura.", "O GetBookForMe é um marketplace que conecta viajantes a anfitriões que oferecem apartamentos, casas, vilas, cabanas e muito mais, para uma reserva simples, transparente e segura."],
  ["Our mission", "Notre mission", "Nuestra misión", "Unsere Mission", "La nostra missione", "Nossa missão"],
  ["We want booking a stay to be as easy as it is reassuring. Travelers find the right place with clear prices, honest reviews and a fair cancellation policy. Hosts get professional tools to share their space and be paid securely.", "Nous voulons que réserver un séjour soit aussi simple que rassurant. Les voyageurs trouvent le bon logement grâce à des prix clairs, des avis honnêtes et une politique d'annulation équitable. Les hôtes disposent d'outils professionnels pour partager leur espace et être payés en toute sécurité.", "Queremos que reservar una estancia sea tan fácil como tranquilizador. Los viajeros encuentran el lugar adecuado con precios claros, reseñas honestas y una política de cancelación justa. Los anfitriones disponen de herramientas profesionales para compartir su espacio y cobrar con seguridad.", "Wir möchten, dass das Buchen eines Aufenthalts so einfach wie beruhigend ist. Reisende finden die passende Unterkunft mit klaren Preisen, ehrlichen Bewertungen und fairen Stornierungsbedingungen. Gastgeber erhalten professionelle Werkzeuge, um ihren Wohnraum zu teilen und sicher bezahlt zu werden.", "Vogliamo che prenotare un soggiorno sia semplice e rassicurante. I viaggiatori trovano l'alloggio giusto con prezzi chiari, recensioni oneste e una politica di cancellazione equa. Gli host dispongono di strumenti professionali per condividere il proprio spazio e ricevere pagamenti in sicurezza.", "Queremos que reservar uma estadia seja tão fácil quanto tranquilizador. Os viajantes encontram o lugar certo com preços claros, avaliações honestas e uma política de cancelamento justa. Os anfitriões têm ferramentas profissionais para compartilhar seu espaço e receber com segurança."],
  ["How it works", "Comment ça marche", "Cómo funciona", "So funktioniert es", "Come funziona", "Como funciona"],
  ["For travelers", "Pour les voyageurs", "Para viajeros", "Für Reisende", "Per i viaggiatori", "Para viajantes"],
  ["For hosts", "Pour les hôtes", "Para anfitriones", "Für Gastgeber", "Per gli host", "Para anfitriões"],
  ["Find your place", "Trouvez votre logement", "Encuentra tu alojamiento", "Finde deine Unterkunft", "Trova il tuo alloggio", "Encontre seu lugar"],
  ["Search by destination, dates and number of guests, then refine with price, rooms and amenities.", "Recherchez par destination, dates et nombre de voyageurs, puis affinez par prix, pièces et équipements.", "Busca por destino, fechas y número de huéspedes y afina por precio, habitaciones y servicios.", "Suche nach Reiseziel, Datum und Gästezahl und verfeinere nach Preis, Zimmern und Ausstattung.", "Cerca per destinazione, date e numero di ospiti, poi affina per prezzo, stanze e servizi.", "Pesquise por destino, datas e número de hóspedes e refine por preço, cômodos e comodidades."],
  ["Compare with confidence", "Comparez en confiance", "Compara con confianza", "Vergleiche mit Vertrauen", "Confronta con fiducia", "Compare com confiança"],
  ["Browse photos, amenities, house rules and reviews from real guests.", "Consultez les photos, les équipements, les règles du logement et les avis de vrais voyageurs.", "Consulta fotos, servicios, normas del alojamiento y reseñas de huéspedes reales.", "Sieh dir Fotos, Ausstattung, Hausregeln und Bewertungen echter Gäste an.", "Consulta foto, servizi, regole della casa e recensioni di ospiti reali.", "Veja fotos, comodidades, regras da casa e avaliações de hóspedes reais."],
  ["Book and pay securely", "Réservez et payez en sécurité", "Reserva y paga con seguridad", "Sicher buchen und bezahlen", "Prenota e paga in sicurezza", "Reserve e pague com segurança"],
  ["Pay by card through Stripe Checkout. Your booking is confirmed once the payment is verified.", "Votre réservation est confirmée dès que le paiement est vérifié.", "Paga con tarjeta mediante Stripe Checkout. Tu reserva se confirma cuando se verifica el pago.", "Bezahle per Karte über Stripe Checkout. Deine Buchung ist bestätigt, sobald die Zahlung geprüft wurde.", "Paga con carta tramite Stripe Checkout. La prenotazione è confermata dopo la verifica del pagamento.", "Pague com cartão pelo Stripe Checkout. Sua reserva é confirmada assim que o pagamento é verificado."],
  ["Stay and share", "Séjournez et partagez", "Disfruta y comparte", "Genieße und teile", "Soggiorna e condividi", "Hospede-se e compartilhe"],
  ["Message your host, enjoy your stay, then leave a review to help the community.", "Échangez avec votre hôte, profitez de votre séjour, puis laissez un avis pour aider la communauté.", "Escribe a tu anfitrión, disfruta de tu estancia y deja una reseña para ayudar a la comunidad.", "Schreibe deinem Gastgeber, genieße deinen Aufenthalt und hinterlasse eine Bewertung für die Community.", "Scrivi al tuo host, goditi il soggiorno e lascia una recensione per aiutare la community.", "Converse com seu anfitrião, aproveite a estadia e deixe uma avaliação para ajudar a comunidade."],
  ["Create your host account", "Créez votre compte hôte", "Crea tu cuenta de anfitrión", "Erstelle dein Gastgeberkonto", "Crea il tuo account host", "Crie sua conta de anfitrião"],
  ["Become a host in one click and access your host dashboard.", "Devenez hôte en un clic et accédez à votre espace hôte.", "Hazte anfitrión con un clic y accede a tu panel de anfitrión.", "Werde mit einem Klick Gastgeber und öffne dein Gastgeber-Dashboard.", "Diventa host con un clic e accedi al tuo dashboard host.", "Torne-se anfitrião com um clique e acesse seu painel do anfitrião."],
  ["Connect Stripe", "Connectez Stripe", "Conecta Stripe", "Stripe verbinden", "Collega Stripe", "Conecte o Stripe"],
  ["Complete your Stripe Connect setup to publish listings and receive payouts.", "Terminez la configuration de Stripe Connect pour publier des annonces et recevoir vos versements.", "Completa la configuración de Stripe Connect para publicar anuncios y recibir pagos.", "Schließe die Stripe-Connect-Einrichtung ab, um Anzeigen zu veröffentlichen und Auszahlungen zu erhalten.", "Completa la configurazione di Stripe Connect per pubblicare annunci e ricevere i pagamenti.", "Conclua a configuração do Stripe Connect para publicar anúncios e receber repasses."],
  ["Publish your listing", "Publiez votre annonce", "Publica tu anuncio", "Veröffentliche deine Anzeige", "Pubblica il tuo annuncio", "Publique seu anúncio"],
  ["Add photos, price, amenities and house rules, then publish when you are ready.", "Ajoutez photos, prix, équipements et règles du logement, puis publiez quand vous êtes prêt.", "Añade fotos, precio, servicios y normas del alojamiento y publica cuando estés listo.", "Füge Fotos, Preis, Ausstattung und Hausregeln hinzu und veröffentliche, wenn du bereit bist.", "Aggiungi foto, prezzo, servizi e regole della casa, poi pubblica quando sei pronto.", "Adicione fotos, preço, comodidades e regras da casa e publique quando estiver pronto."],
  ["Manage and get paid", "Gérez et soyez payé", "Gestiona y cobra", "Verwalte und werde bezahlt", "Gestisci e vieni pagato", "Gerencie e receba"],
  ["Follow reservations, block dates in your calendar, chat with guests and track your payouts.", "Suivez les réservations, bloquez des dates dans votre calendrier, échangez avec les voyageurs et suivez vos versements.", "Sigue las reservas, bloquea fechas en tu calendario, chatea con los huéspedes y controla tus pagos.", "Verfolge Buchungen, sperre Daten im Kalender, chatte mit Gästen und behalte deine Auszahlungen im Blick.", "Segui le prenotazioni, blocca le date nel calendario, chatta con gli ospiti e controlla i tuoi pagamenti.", "Acompanhe reservas, bloqueie datas no calendário, converse com hóspedes e controle seus repasses."],
  ["Why choose GetBookForMe", "Pourquoi choisir GetBookForMe", "Por qué elegir GetBookForMe", "Warum GetBookForMe", "Perché scegliere GetBookForMe", "Por que escolher o GetBookForMe"],
  ["Honest reviews", "Des avis honnêtes", "Reseñas honestas", "Ehrliche Bewertungen", "Recensioni oneste", "Avaliações honestas"],
  ["Only guests with a paid booking can review, and only after their stay has ended.", "Seuls les voyageurs ayant une réservation payée peuvent laisser un avis, et uniquement après la fin de leur séjour.", "Solo los huéspedes con una reserva pagada pueden dejar una reseña, y únicamente cuando termina su estancia.", "Nur Gäste mit bezahlter Buchung können bewerten, und zwar erst nach Ende ihres Aufenthalts.", "Solo gli ospiti con una prenotazione pagata possono recensire, e solo dopo la fine del soggiorno.", "Somente hóspedes com reserva paga podem avaliar, e apenas depois do fim da estadia."],
  ["Secure payments", "Paiements sécurisés", "Pagos seguros", "Sichere Zahlungen", "Pagamenti sicuri", "Pagamentos seguros"],
  ["Payments are processed by Stripe. GetBookForMe never sees or stores your card details.", "Les paiements sont traités par Stripe. GetBookForMe ne conserve jamais vos données de carte.", "Los pagos los procesa Stripe. GetBookForMe nunca ve ni almacena los datos de tu tarjeta.", "Zahlungen werden von Stripe abgewickelt. GetBookForMe sieht oder speichert deine Kartendaten nie.", "I pagamenti sono elaborati da Stripe. GetBookForMe non vede né conserva mai i dati della tua carta.", "Os pagamentos são processados pelo Stripe. O GetBookForMe nunca vê nem armazena os dados do seu cartão."],
  ["Fair cancellation policy", "Politique d'annulation équitable", "Política de cancelación justa", "Faire Stornierungsbedingungen", "Politica di cancellazione equa", "Política de cancelamento justa"],
  ["A clear policy applies to every listing: 100% refund more than 7 days before arrival and 50% between 24 hours and 7 days.", "Une politique claire s'applique à chaque logement remboursement de 100 % plus de 7 jours avant l'arrivée et de 50 % entre 24 heures et 7 jours.", "Una política clara se aplica a cada alojamiento: reembolso del 100 % con más de 7 días de antelación y del 50 % entre 24 horas y 7 días.", "Für jede Unterkunft gilt eine klare Regel: 100 % Erstattung mehr als 7 Tage vor Anreise und 50 % zwischen 24 Stunden und 7 Tagen.", "A ogni alloggio si applica una politica chiara: rimborso del 100% oltre 7 giorni prima dell'arrivo e del 50% tra 24 ore e 7 giorni.", "Uma política clara vale para cada anúncio: reembolso de 100% com mais de 7 dias de antecedência e de 50% entre 24 horas e 7 dias."],
  ["Direct messaging", "Messagerie directe", "Mensajería directa", "Direkte Nachrichten", "Messaggi diretti", "Mensagens diretas"],
  ["Once a booking is confirmed, you can chat directly with your host or guest, with instant notifications.", "Une fois la réservation confirmée, échangez directement avec votre hôte ou votre voyageur, avec des notifications instantanées.", "Una vez confirmada la reserva, puedes chatear directamente con tu anfitrión o huésped, con notificaciones instantáneas.", "Sobald die Buchung bestätigt ist, kannst du direkt mit Gastgeber oder Gast chatten – mit sofortigen Benachrichtigungen.", "Una volta confermata la prenotazione, puoi chattare direttamente con host o ospite, con notifiche istantanee.", "Com a reserva confirmada, você conversa diretamente com anfitrião ou hóspede, com notificações instantâneas."],
  ["Six languages", "Six langues", "Seis idiomas", "Sechs Sprachen", "Sei lingue", "Seis idiomas"],
  ["Use the platform in English, French, Spanish, German, Italian or Portuguese.", "Utilisez la plateforme en anglais, français, espagnol, allemand, italien ou portugais.", "Usa la plataforma en inglés, francés, español, alemán, italiano o portugués.", "Nutze die Plattform auf Englisch, Französisch, Spanisch, Deutsch, Italienisch oder Portugiesisch.", "Usa la piattaforma in inglese, francese, spagnolo, tedesco, italiano o portoghese.", "Use a plataforma em inglês, francês, espanhol, alemão, italiano ou português."],
  ["Powerful host tools", "Des outils d'hôte complets", "Herramientas completas para anfitriones", "Leistungsstarke Gastgeber-Tools", "Strumenti completi per gli host", "Ferramentas completas para anfitriões"],
  ["Availability calendar, payment history, house rules and a public host profile.", "Calendrier de disponibilités, historique des paiements, règles du logement et profil public d'hôte.", "Calendario de disponibilidad, historial de pagos, normas del alojamiento y perfil público de anfitrión.", "Verfügbarkeitskalender, Zahlungsverlauf, Hausregeln und ein öffentliches Gastgeberprofil.", "Calendario di disponibilità, cronologia dei pagamenti, regole della casa e profilo host pubblico.", "Calendário de disponibilidade, histórico de pagamentos, regras da casa e perfil público do anfitrião."],
  ["Ready to get started?", "Prêt à commencer ?", "¿Listo para empezar?", "Bereit loszulegen?", "Pronto a iniziare?", "Pronto para começar?"],
  ["Find your next stay or start hosting today.", "Trouvez votre prochain séjour ou commencez à accueillir dès aujourd'hui.", "Encuentra tu próxima estancia o empieza a alojar hoy mismo.", "Finde deinen nächsten Aufenthalt oder werde noch heute Gastgeber.", "Trova il tuo prossimo soggiorno o inizia a ospitare oggi stesso.", "Encontre sua próxima estadia ou comece a hospedar hoje mesmo."],
  // ── Page « Sécurité et confidentialité » ──
  ["Security & privacy", "Sécurité et confidentialité", "Seguridad y privacidad", "Sicherheit und Datenschutz", "Sicurezza e privacy", "Segurança e privacidade"],
  ["Here is how GetBookForMe protects your account, your personal data and your payments.", "Voici comment GetBookForMe protège votre compte, vos données personnelles et vos paiements.", "Así protege GetBookForMe tu cuenta, tus datos personales y tus pagos.", "So schützt GetBookForMe dein Konto, deine persönlichen Daten und deine Zahlungen.", "Ecco come GetBookForMe protegge il tuo account, i tuoi dati personali e i tuoi pagamenti.", "Veja como o GetBookForMe protege sua conta, seus dados pessoais e seus pagamentos."],
  ["Account protection", "Protection du compte", "Protección de la cuenta", "Kontoschutz", "Protezione dell'account", "Proteção da conta"],
  ["Secure passwords", "Mots de passe sécurisés", "Contraseñas seguras", "Sichere Passwörter", "Password sicure", "Senhas seguras"],
  ["Passwords are never stored in clear text: they are hashed with a strong one-way algorithm before being saved.", "Les mots de passe ne sont jamais stockés ils sont hachés avec un algorithme à sens unique robuste avant d'être enregistrés.", "Las contraseñas nunca se guardan en texto claro: se procesan con un algoritmo unidireccional robusto antes de almacenarse.", "Passwörter werden nie im Klartext gespeichert: Sie werden vor dem Speichern mit einem starken Einwegverfahren gehasht.", "Le password non vengono mai salvate in chiaro: sono cifrate con un robusto algoritmo a senso unico prima di essere memorizzate.", "As senhas nunca são guardadas em texto simples: passam por um algoritmo robusto de via única antes de serem salvas."],
  ["Protected sessions", "Sessions protégées", "Sesiones protegidas", "Geschützte Sitzungen", "Sessioni protette", "Sessões protegidas"],
  ["Each session uses a signed token that expires automatically, and private pages require you to be logged in.", "Chaque session utilise un jeton signé qui expire automatiquement, et les pages privées exigent d'être connecté.", "Cada sesión usa un token firmado que caduca automáticamente, y las páginas privadas requieren haber iniciado sesión.", "Jede Sitzung nutzt ein signiertes Token, das automatisch abläuft, und private Seiten erfordern eine Anmeldung.", "Ogni sessione usa un token firmato che scade automaticamente e le pagine private richiedono l'accesso.", "Cada sessão usa um token assinado que expira automaticamente, e as páginas privadas exigem login."],
  ["Authenticator app", "Application d'authentification", "Aplicación de autenticación", "Authenticator-App", "App di autenticazione", "Aplicativo autenticador"],
  ["Enable an authenticator app such as Google Authenticator or Authy to reset your password safely. Each code works only once.", "Activez une application d'authentification comme Google Authenticator ou Authy pour réinitialiser votre mot de passe en toute sécurité.", "Activa una aplicación de autenticación como Google Authenticator o Authy para restablecer tu contraseña con seguridad. Cada código funciona solo una vez.", "Aktiviere eine Authenticator-App wie Google Authenticator oder Authy, um dein Passwort sicher zurückzusetzen. Jeder Code funktioniert nur einmal.", "Attiva un'app di autenticazione come Google Authenticator o Authy per reimpostare la password in sicurezza. Ogni codice funziona una sola volta.", "Ative um aplicativo autenticador como o Google Authenticator ou o Authy para redefinir sua senha com segurança. Cada código funciona só uma vez."],
  ["Brute-force protection", "Protection contre les attaques", "Protección contra ataques", "Schutz vor Angriffen", "Protezione dagli attacchi", "Proteção contra ataques"],
  ["Password reset attempts are limited, and error messages never reveal whether an email address has an account.", "Les tentatives de réinitialisation du mot de passe sont limitées, et les messages d'erreur ne révèlent jamais si une adresse e-mail possède un compte.", "Los intentos de restablecer la contraseña están limitados y los mensajes de error nunca revelan si un correo tiene cuenta.", "Versuche zum Zurücksetzen des Passworts sind begrenzt, und Fehlermeldungen verraten nie, ob eine E-Mail-Adresse ein Konto hat.", "I tentativi di reimpostazione della password sono limitati e i messaggi di errore non rivelano mai se un indirizzo email ha un account.", "As tentativas de redefinição de senha são limitadas e as mensagens de erro nunca revelam se um e-mail possui conta."],
  ["Personal data", "Données personnelles", "Datos personales", "Persönliche Daten", "Dati personali", "Dados pessoais"],
  ["Private by default", "Privées par défaut", "Privados por defecto", "Standardmäßig privat", "Privati per impostazione predefinita", "Privados por padrão"],
  ["Your email address and phone number are never shown on public pages, including host profiles.", "Votre adresse e-mail et votre numéro de téléphone ne sont jamais affichés sur les pages publiques, profils d'hôtes compris.", "Tu correo y tu teléfono nunca se muestran en páginas públicas, incluidos los perfiles de anfitrión.", "Deine E-Mail-Adresse und Telefonnummer werden nie auf öffentlichen Seiten angezeigt, auch nicht in Gastgeberprofilen.", "Il tuo indirizzo email e il tuo numero di telefono non sono mai mostrati nelle pagine pubbliche, profili host inclusi.", "Seu e-mail e seu telefone nunca aparecem em páginas públicas, incluindo perfis de anfitriões."],
  ["Shared only when needed", "Partagées seulement si nécessaire", "Compartidos solo si es necesario", "Nur bei Bedarf geteilt", "Condivisi solo se necessario", "Compartilhados só quando necessário"],
  ["When a booking is confirmed, your name and contact details are shared with the host so they can prepare your stay.", "Quand une réservation est confirmée, votre nom et vos coordonnées sont transmis à l'hôte pour qu'il puisse préparer votre séjour.", "Cuando se confirma una reserva, tu nombre y datos de contacto se comparten con el anfitrión para que prepare tu estancia.", "Sobald eine Buchung bestätigt ist, werden dein Name und deine Kontaktdaten an den Gastgeber weitergegeben, damit er deinen Aufenthalt vorbereiten kann.", "Quando una prenotazione è confermata, il tuo nome e i tuoi contatti vengono condivisi con l'host per preparare il soggiorno.", "Quando uma reserva é confirmada, seu nome e seus contatos são compartilhados com o anfitrião para que ele prepare a estadia."],
  ["Restricted access", "Accès restreint", "Acceso restringido", "Eingeschränkter Zugriff", "Accesso limitato", "Acesso restrito"],
  ["Only the guest and the host concerned can read a conversation or open a booking. Administrators only handle support and cancellation requests.", "Seuls le voyageur et l'hôte concernés peuvent lire une conversation ou ouvrir une réservation. Les administrateurs ne traitent que le support et les demandes d'annulation.", "Solo el huésped y el anfitrión implicados pueden leer una conversación o abrir una reserva. Los administradores solo gestionan el soporte y las solicitudes de cancelación.", "Nur der betroffene Gast und Gastgeber können eine Konversation lesen oder eine Buchung öffnen. Administratoren bearbeiten nur Support- und Stornierungsanfragen.", "Solo l'ospite e l'host interessati possono leggere una conversazione o aprire una prenotazione. Gli amministratori gestiscono solo assistenza e richieste di annullamento.", "Somente o hóspede e o anfitrião envolvidos podem ler uma conversa ou abrir uma reserva. Os administradores tratam apenas de suporte e pedidos de cancelamento."],
  ["Your choices", "Vos choix", "Tus decisiones", "Deine Entscheidungen", "Le tue scelte", "Suas escolhas"],
  ["You can update your name and password at any time from your profile, and disable the authenticator app whenever you want.", "Vous pouvez modifier votre nom et votre mot de passe à tout moment depuis votre profil, et désactiver l'application d'authentification quand vous le souhaitez.", "Puedes cambiar tu nombre y tu contraseña en cualquier momento desde tu perfil y desactivar la aplicación de autenticación cuando quieras.", "Du kannst deinen Namen und dein Passwort jederzeit im Profil ändern und die Authenticator-App jederzeit deaktivieren.", "Puoi modificare nome e password in qualsiasi momento dal tuo profilo e disattivare l'app di autenticazione quando vuoi.", "Você pode alterar seu nome e sua senha a qualquer momento no perfil e desativar o aplicativo autenticador quando quiser."],
  ["Payments", "Paiements", "Pagos", "Zahlungen", "Pagamenti", "Pagamentos"],
  ["Card details handled by Stripe", "Données de carte gérées par Stripe", "Datos de tarjeta gestionados por Stripe", "Kartendaten werden von Stripe verarbeitet", "Dati della carta gestiti da Stripe", "Dados do cartão tratados pelo Stripe"],
  ["You pay on Stripe's secure checkout page. GetBookForMe never sees or stores your card number.", "Vous payez sur la page de paiement sécurisée de Stripe. GetBookForMe ne conserve jamais votre numéro de carte.", "Pagas en la página de pago segura de Stripe. GetBookForMe nunca ve ni almacena tu número de tarjeta.", "Du bezahlst auf der sicheren Checkout-Seite von Stripe. GetBookForMe sieht oder speichert deine Kartennummer nie.", "Paghi sulla pagina di pagamento sicura di Stripe. GetBookForMe non vede né conserva mai il numero della tua carta.", "Você paga na página de pagamento segura do Stripe. O GetBookForMe nunca vê nem armazena o número do seu cartão."],
  ["Verified confirmations", "Confirmations vérifiées", "Confirmaciones verificadas", "Geprüfte Bestätigungen", "Conferme verificate", "Confirmações verificadas"],
  ["A booking is marked as paid only after Stripe confirms the payment, and Stripe notifications are signature-checked.", "Une réservation n'est marquée payée qu'après confirmation du paiement par Stripe, et les notifications de Stripe sont vérifiées par signature.", "Una reserva se marca como pagada solo cuando Stripe confirma el pago, y las notificaciones de Stripe se verifican mediante firma.", "Eine Buchung gilt erst als bezahlt, wenn Stripe die Zahlung bestätigt, und Stripe-Benachrichtigungen werden per Signatur geprüft.", "Una prenotazione è segnata come pagata solo dopo la conferma di Stripe e le notifiche di Stripe sono verificate tramite firma.", "Uma reserva só é marcada como paga depois que o Stripe confirma o pagamento, e as notificações do Stripe têm a assinatura verificada."],
  ["Protected payouts", "Versements protégés", "Pagos protegidos", "Geschützte Auszahlungen", "Pagamenti protetti", "Repasses protegidos"],
  ["Hosts are paid through Stripe Connect, once they have completed Stripe's account verification.", "Les hôtes sont payés via Stripe Connect, une fois la vérification de leur compte par Stripe terminée.", "Los anfitriones cobran mediante Stripe Connect, una vez completada la verificación de su cuenta por Stripe.", "Gastgeber werden über Stripe Connect bezahlt, sobald sie die Kontoverifizierung von Stripe abgeschlossen haben.", "Gli host vengono pagati tramite Stripe Connect, dopo aver completato la verifica dell'account da parte di Stripe.", "Os anfitriões recebem via Stripe Connect, depois de concluírem a verificação da conta pelo Stripe."],
  ["Refunds you can trust", "Des remboursements fiables", "Reembolsos fiables", "Verlässliche Erstattungen", "Rimborsi affidabili", "Reembolsos confiáveis"],
  ["Approved cancellations are refunded through Stripe to your original payment method, following the cancellation policy.", "Les annulations approuvées sont remboursées via Stripe sur votre moyen de paiement d'origine, selon la politique d'annulation.", "Las cancelaciones aprobadas se reembolsan a través de Stripe a tu método de pago original, según la política de cancelación.", "Genehmigte Stornierungen werden über Stripe auf deine ursprüngliche Zahlungsmethode erstattet, gemäß den Stornierungsbedingungen.", "Gli annullamenti approvati sono rimborsati tramite Stripe sul metodo di pagamento originale, secondo la politica di cancellazione.", "Os cancelamentos aprovados são reembolsados pelo Stripe no seu meio de pagamento original, conforme a política de cancelamento."],
  ["Good practices", "Bonnes pratiques", "Buenas prácticas", "Empfehlungen", "Buone pratiche", "Boas práticas"],
  ["Use a long, unique password for your GetBookForMe account.", "Utilisez un mot de passe long et unique pour votre compte GetBookForMe.", "Usa una contraseña larga y única para tu cuenta de GetBookForMe.", "Verwende ein langes, einzigartiges Passwort für dein GetBookForMe-Konto.", "Usa una password lunga e unica per il tuo account GetBookForMe.", "Use uma senha longa e única para sua conta GetBookForMe."],
  ["Enable the authenticator app in your profile so you can recover your account.", "Activez l'application d'authentification dans votre profil pour pouvoir récupérer votre compte.", "Activa la aplicación de autenticación en tu perfil para poder recuperar tu cuenta.", "Aktiviere die Authenticator-App in deinem Profil, um dein Konto wiederherstellen zu können.", "Attiva l'app di autenticazione nel tuo profilo per poter recuperare il tuo account.", "Ative o aplicativo autenticador no seu perfil para poder recuperar sua conta."],
  ["Never share your verification codes with anyone.", "Ne communiquez jamais vos codes de vérification à qui que ce soit.", "No compartas nunca tus códigos de verificación con nadie.", "Gib deine Bestätigungscodes niemals an andere weiter.", "Non condividere mai i tuoi codici di verifica con nessuno.", "Nunca compartilhe seus códigos de verificação com ninguém."],
  ["Pay only through the GetBookForMe checkout and keep your conversations on the platform.", "Payez uniquement via le paiement GetBookForMe et gardez vos échanges sur la plateforme.", "Paga solo a través del pago de GetBookForMe y mantén tus conversaciones en la plataforma.", "Bezahle nur über den GetBookForMe-Checkout und führe deine Gespräche auf der Plattform.", "Paga solo tramite il checkout di GetBookForMe e mantieni le conversazioni sulla piattaforma.", "Pague apenas pelo checkout do GetBookForMe e mantenha suas conversas na plataforma."],
  ["Manage my security", "Gérer ma sécurité", "Gestionar mi seguridad", "Meine Sicherheit verwalten", "Gestisci la mia sicurezza", "Gerenciar minha segurança"],
];

const LANG_ORDER: Lang[] = ["fr", "es", "de", "it", "pt"];

const DICT: Record<Lang, Record<string, string>> = {
  en: {}, fr: {}, es: {}, de: {}, it: {}, pt: {},
};
TRANSLATION_ROWS.forEach((row) => {
  LANG_ORDER.forEach((code, i) => {
    DICT[code][row[0]] = row[i + 1];
  });
});

// Traduction : la clé est le texte anglais ; sans traduction, le texte anglais est conservé.
function t(key: string, vars?: Record<string, string | number>): string {
  let s = (currentLang !== "en" && DICT[currentLang][key]) || key;
  if (vars) {
    for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]));
  }
  return s;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ─── API Helper ─────────────────────────────────────────────────

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

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

// ─── Notification Sound ─────────────────────────────────────────

// Un seul AudioContext partagé : les navigateurs bloquent le son tant qu'aucune
// interaction utilisateur n'a eu lieu, il est donc "débloqué" au premier clic / touche.
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      sharedAudioCtx = new Ctor();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

// Carillon de notification : deux notes (si6 puis mi7) avec une enveloppe douce
function playNotificationSound() {
  try {
    if (!getStoredSound()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const play = () => {
      const start = ctx.currentTime + 0.02;
      const notes = [
        { freq: 987.77, at: 0 },
        { freq: 1318.51, at: 0.16 },
      ];
      notes.forEach(({ freq, at }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start + at);
        gain.gain.setValueAtTime(0.0001, start + at);
        gain.gain.exponentialRampToValueAtTime(0.35, start + at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + at + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start + at);
        osc.stop(start + at + 0.55);
      });
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch {}
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
  const [authModal, setAuthModal] = useState<null | "login" | "register" | "forgot">(null);
  const [lang, setLang] = useState<Lang>(currentLang);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [soundOn, setSoundOn] = useState(getStoredSound());
  const wsRef = useRef<WebSocket | null>(null);
  // Dernier nombre de notifications non lues connu côté serveur (pour détecter les nouvelles)
  const lastUnreadRef = useRef(0);
  const unreadReadyRef = useRef(false);

  // La langue courante est lue par t() pendant tout le rendu de l'arbre
  currentLang = lang;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Déblocage de l'audio du navigateur dès la première interaction de l'utilisateur
  useEffect(() => {
    const events = ["pointerdown", "keydown", "touchstart"];
    const handler = () => unlockAudio();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, []);

  // Changement de langue : mémorisé localement et sur le compte (si connecté)
  const changeLanguage = (l: Lang) => {
    currentLang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch {}
    setLang(l);
    const token = getToken();
    if (token) {
      api("/api/auth/language", {
        method: "PUT",
        body: JSON.stringify({ language: l }),
      }, token).catch(() => {});
    }
  };

  const toggleSound = () => {
    const newVal = !soundOn;
    setSoundOn(newVal);
    try { localStorage.setItem(SOUND_KEY, newVal ? "on" : "off"); } catch {}
  };

  // À la connexion : le choix fait sur cet appareil est conservé (et envoyé au compte),
  // sinon on reprend la langue enregistrée sur le compte.
  const syncLanguageWithUser = (u: User) => {
    const stored = getStoredLang();
    if (stored) {
      if (u.language !== stored) {
        api("/api/auth/language", {
          method: "PUT",
          body: JSON.stringify({ language: stored }),
        }, getToken() || undefined).catch(() => {});
      }
    } else if (u.language && isLang(u.language)) {
      currentLang = u.language;
      try { localStorage.setItem(LANG_KEY, u.language); } catch {}
      setLang(u.language);
    }
  };

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
        .then((d) => { setUser(d.user); syncLanguageWithUser(d.user); })
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── WebSocket: temps réel ──
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    const wsUrl = `${API_URL.replace("http", "ws")}/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Chaque nouvelle notification (message, réservation...) déclenche UN son.
        // L'événement "new_message" accompagne toujours une notification : il ne
        // déclenche donc ni son ni incrément supplémentaire.
        if (data.type === "notification" && data.notification) {
          playNotificationSound();
          lastUnreadRef.current += 1;
          setUnreadNotifs((prev) => prev + 1);
        }
      } catch {}
    };

    ws.onclose = () => {
      // Reconnect after 3s
      setTimeout(() => {
        if (wsRef.current === ws && getToken()) {
          // trigger reconnect by changing state
          setUnreadNotifs((prev) => prev);
        }
      }, 3000);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [user]);

  // ── Notifications: poll unread count ──
  // Si le nombre de notifications non lues augmente (et que le WebSocket ne l'a pas
  // déjà signalé), on joue aussi le son.
  useEffect(() => {
    if (!user) return;
    unreadReadyRef.current = false;
    const loadUnread = () => {
      api<{ count: number }>("/api/notifications/unread-count", {}, getToken() || undefined)
        .then((d) => {
          if (unreadReadyRef.current && d.count > lastUnreadRef.current) {
            playNotificationSound();
          }
          lastUnreadRef.current = d.count;
          unreadReadyRef.current = true;
          setUnreadNotifs(d.count);
        })
        .catch(() => {});
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Auth handlers
  const handleLogin = (token: string, u: User) => {
    setToken(token);
    setUser(u);
    syncLanguageWithUser(u);
    setAuthModal(null);
    showToast(t("Welcome back, {name}!", { name: u.first_name }));
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setUnreadNotifs(0);
    lastUnreadRef.current = 0;
    unreadReadyRef.current = false;
    navigate("/");
    showToast(t("You have been logged out"));
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
  const conversationIdParam = routeParts[0] === "messages" ? parseInt(routeParts[1]) : null;
  const hostIdParam = routeParts[0] === "host-profile" ? parseInt(routeParts[1]) : null;

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
        lang={lang}
        onChangeLang={changeLanguage}
        unreadNotifs={unreadNotifs}
        soundOn={soundOn}
        onToggleSound={toggleSound}
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
          <ProfilePage
            user={user}
            onNavigate={navigate}
            showToast={showToast}
            onUserUpdate={setUser}
          />
        )}
        {page === "messages" && !conversationIdParam && (
          <MessagesListPage user={user} onNavigate={navigate} />
        )}
        {page === "messages" && conversationIdParam && (
          <ChatPage
            conversationId={conversationIdParam}
            user={user}
            onNavigate={navigate}
            showToast={showToast}
          />
        )}
        {page === "host-profile" && hostIdParam && (
          <HostProfilePage hostId={hostIdParam} onNavigate={navigate} />
        )}
        {page === "notifications" && (
          <NotificationsPage
            user={user}
            onNavigate={navigate}
            onReadUpdate={() => { lastUnreadRef.current = 0; setUnreadNotifs(0); }}
          />
        )}
        {page === "about" && (
          <AboutPage onNavigate={navigate} />
        )}
        {page === "security" && (
          <SecurityPage onNavigate={navigate} />
        )}
        {page !== "" && !["search","listing","favorites","bookings","booking","host","admin","profile","messages","host-profile","notifications","about","security"].includes(page) && (
          <div className="empty-state">
            <h3>{t("Page not found")}</h3>
            <p>{t("The page you're looking for doesn't exist.")}</p>
            <button className="btn btn-primary mt-24" onClick={() => navigate("/")}>
              {t("Back to home")}
            </button>
          </div>
        )}
      </main>

      <Footer onNavigate={navigate} />

      {authModal && authModal !== "forgot" && (
        <AuthModal
          mode={authModal}
          onClose={() => {
            setAuthModal(null);
            setPendingAction(null);
          }}
          onSwitch={(m) => setAuthModal(m)}
          onSuccess={handleLogin}
          onForgot={() => setAuthModal("forgot")}
          showToast={showToast}
        />
      )}

      {authModal === "forgot" && (
        <ForgotPasswordModal
          onClose={() => {
            setAuthModal(null);
            setPendingAction(null);
          }}
          onBack={() => setAuthModal("login")}
          showToast={showToast}
        />
      )}

      {toast && <div className="toast">{toast}</div>}

      <MobileNav user={user} route={route} onNavigate={navigate} unreadNotifs={unreadNotifs} />
    </>
  );
}

// ─── Language Selector ──────────────────────────────────────────

function LanguageSelect({
  lang, onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <label
      style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
      title={t("Language")}
    >
      <Globe size={18} />
      <select
        aria-label={t("Language")}
        value={lang}
        onChange={(e) => onChange(e.target.value as Lang)}
        style={{
          border: "1px solid var(--neutral-200)",
          borderRadius: "var(--radius-md)",
          padding: "6px 8px",
          background: "transparent",
          color: "inherit",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  );
}

// ─── Notification Bell ──────────────────────────────────────────

function NotificationBell({
  unreadCount, onNavigate, soundOn, onToggleSound,
}: {
  unreadCount: number;
  onNavigate: (to: string) => void;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={() => onToggleSound()}
        title={soundOn ? t("Sound on") : t("Sound off")}
        className="header-nav-btn"
        style={{ padding: 6 }}
      >
        {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
      <button
        onClick={() => onNavigate("/notifications")}
        className="header-nav-btn"
        style={{ position: "relative", padding: 6 }}
        aria-label={t("Notifications")}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            background: "var(--error)", color: "#fff",
            borderRadius: "50%", minWidth: 18, height: 18,
            fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────

function Header({
  user, onNavigate, onLogout, onOpenAuth, route, lang, onChangeLang, unreadNotifs, soundOn, onToggleSound,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
  onLogout: () => void;
  onOpenAuth: (m: "login" | "register") => void;
  route: string;
  lang: Lang;
  onChangeLang: (l: Lang) => void;
  unreadNotifs: number;
  soundOn: boolean;
  onToggleSound: () => void;
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
          <span>GetBookForMe</span>
        </div>

        <div className="header-search-wrap">
          <SearchPill onNavigate={onNavigate} />
        </div>

        <nav className="header-nav">
          <button className="header-nav-btn" onClick={() => onNavigate("/")}>
            {t("Explore")}
          </button>
          <button className="header-nav-btn" onClick={() => onNavigate("/host")}>
            {t("Become a host")}
          </button>
        </nav>

        <div className="header-actions">
          <LanguageSelect lang={lang} onChange={onChangeLang} />
          {user && (
            <NotificationBell
              unreadCount={unreadNotifs}
              onNavigate={onNavigate}
              soundOn={soundOn}
              onToggleSound={onToggleSound}
            />
          )}
          {user && (
            <button
              className="header-nav-btn"
              onClick={() => onNavigate("/messages")}
              style={{ position: "relative", padding: 6 }}
              aria-label={t("Messages")}
            >
              <MessageSquare size={18} />
            </button>
          )}
          {user ? (
            <div className="user-menu">
              <button
                className="user-avatar"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={t("User menu")}
                aria-expanded={menuOpen}
              >
                <span className="text-sm" style={{ fontWeight: 600 }}>
                  {user.role === "admin" ? "Admin" : user.role === "host" ? t("Host") : t("Menu")}
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
                      <Heart size={18} /> {t("Favorites")}
                    </button>
                    <button className="dropdown-item" onClick={() => { onNavigate("/bookings"); setMenuOpen(false); }}>
                      <Calendar size={18} /> {t("My bookings")}
                    </button>
                    <button className="dropdown-item" onClick={() => { onNavigate("/messages"); setMenuOpen(false); }}>
                      <MessageSquare size={18} /> {t("Messages")}
                    </button>
                    <button className="dropdown-item" onClick={() => { onNavigate("/notifications"); setMenuOpen(false); }}>
                      <Bell size={18} /> {t("Notifications")}
                    </button>
                    <button className="dropdown-item" onClick={() => { onNavigate("/profile"); setMenuOpen(false); }}>
                      <User size={18} /> {t("Profile")}
                    </button>
                    {user.role === "host" || user.role === "admin" ? (
                      <button className="dropdown-item" onClick={() => { onNavigate("/host"); setMenuOpen(false); }}>
                        <Building2 size={18} /> {t("Host dashboard")}
                      </button>
                    ) : (
                      <button className="dropdown-item" onClick={() => { onNavigate("/host"); setMenuOpen(false); }}>
                        <Sparkles size={18} /> {t("Become a host")}
                      </button>
                    )}
                    {user.role === "admin" && (
                      <button className="dropdown-item" onClick={() => { onNavigate("/admin"); setMenuOpen(false); }}>
                        <Shield size={18} /> {t("Admin panel")}
                      </button>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={onLogout}>
                      <LogOut size={18} /> {t("Log out")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <button className="header-nav-btn" onClick={() => onNavigate("/host")}>
                {t("Become a host")}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => onOpenAuth("register")}>
                {t("Sign up")}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => onOpenAuth("login")}>
                {t("Log in")}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Barre de recherche combinée : destination + dates + voyageurs.
// Repliée dans l'en-tête (résumé des critères) ; un clic ouvre le panneau complet.
function SearchPill({ onNavigate }: { onNavigate: (to: string) => void }) {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split("T")[0];

  // Fermeture du panneau : clic à l'extérieur ou touche Échap
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination.trim()) params.set("destination", destination.trim());
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (guests) params.set("guests", guests);
    setOpen(false);
    onNavigate(`/search?${params.toString()}`);
  };

  const fmtShort = (s: string) =>
    new Date(`${s}T00:00:00`).toLocaleDateString(LOCALES[currentLang], { day: "numeric", month: "short" });

  const datesSummary =
    checkIn && checkOut ? `${fmtShort(checkIn)} → ${fmtShort(checkOut)}`
    : checkIn ? `${fmtShort(checkIn)} →`
    : checkOut ? `→ ${fmtShort(checkOut)}`
    : "—";

  const guestsSummary = guests ? t(`${guests}+ guests`) : t("Any guests");

  const summaryStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--neutral-600)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const fieldLabel: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    color: "var(--neutral-800)",
  };

  return (
    <div ref={wrapRef}>
      {/* Barre repliée : résumé destination · dates · voyageurs */}
      <div
        className="search-bar"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter") setOpen(true); }}
      >
        <div className="search-segment" style={{ flex: 1, maxWidth: 170 }}>
          <label>{t("Where")}</label>
          <span style={summaryStyle}>{destination || t("Search destinations")}</span>
        </div>
        <div className="search-segment" style={{ maxWidth: 150 }}>
          <label>{t("Dates")}</label>
          <span style={summaryStyle}>{datesSummary}</span>
        </div>
        <div className="search-segment" style={{ maxWidth: 130 }}>
          <label>{t("Guests")}</label>
          <span style={summaryStyle}>{guestsSummary}</span>
        </div>
        <button
          className="search-btn"
          onClick={(e) => { e.stopPropagation(); handleSearch(); }}
          aria-label={t("Search")}
        >
          <Search size={18} />
        </button>
      </div>

      {/* Panneau complet : tous les critères en même temps */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 160,
            background: "#fff",
            borderBottom: "1px solid var(--neutral-200)",
            boxShadow: "var(--shadow-lg)",
            padding: "16px 0",
          }}
        >
          <div
            className="container"
            style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}
          >
            <div style={{ flex: "2 1 220px", minWidth: 0 }}>
              <label style={fieldLabel}>{t("Where")}</label>
              <input
                className="filter-input"
                type="text"
                autoFocus
                placeholder={t("Search destinations")}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div style={{ flex: "1 1 150px", minWidth: 0 }}>
              <label style={fieldLabel}>{t("Check-in")}</label>
              <input
                className="filter-input"
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => {
                  const v = e.target.value;
                  setCheckIn(v);
                  if (v && checkOut && checkOut <= v) setCheckOut("");
                }}
              />
            </div>
            <div style={{ flex: "1 1 150px", minWidth: 0 }}>
              <label style={fieldLabel}>{t("Check-out")}</label>
              <input
                className="filter-input"
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <div style={{ flex: "1 1 150px", minWidth: 0 }}>
              <label style={fieldLabel}>{t("Guests")}</label>
              <select
                className="filter-input"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              >
                <option value="">{t("Any guests")}</option>
                <option value="1">{t("1+ guests")}</option>
                <option value="2">{t("2+ guests")}</option>
                <option value="4">{t("4+ guests")}</option>
                <option value="6">{t("6+ guests")}</option>
                <option value="8">{t("8+ guests")}</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleSearch}>
              <Search size={18} /> {t("Search")}
            </button>
          </div>
        </div>
      )}
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
            <h4>{t("Support")}</h4>
            <a onClick={() => onNavigate("/")}>{t("Help Center")}</a>
            <a onClick={() => onNavigate("/security")}>{t("Safety information")}</a>
            <a onClick={() => onNavigate("/")}>{t("Cancellation options")}</a>
          </div>
          <div className="footer-col">
            <h4>{t("Hosting")}</h4>
            <a onClick={() => onNavigate("/host")}>{t("Become a host")}</a>
            <a onClick={() => onNavigate("/host")}>{t("Host your home")}</a>
            <a onClick={() => onNavigate("/host")}>{t("Responsible hosting")}</a>
          </div>
          <div className="footer-col">
            <h4>GetBookForMe</h4>
            <a onClick={() => onNavigate("/about")}>{t("What is GetBookForMe?")}</a>
            <a onClick={() => onNavigate("/security")}>{t("Security & privacy")}</a>
            <a onClick={() => onNavigate("/")}>{t("Newsroom")}</a>
            <a onClick={() => onNavigate("/")}>{t("Careers")}</a>
          </div>
          <div className="footer-col">
            <h4>{t("Discover")}</h4>
            <a onClick={() => onNavigate("/search")}>{t("All listings")}</a>
            <a onClick={() => onNavigate("/search?destination=Paris")}>{t("Paris")}</a>
            <a onClick={() => onNavigate("/search?destination=Tokyo")}>{t("Tokyo")}</a>
            <a onClick={() => onNavigate("/search?destination=New%20York")}>{t("New York")}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t("© 2026 GetBookForMe — Find your perfect stay")}</span>
          <span>{t("Privacy · Terms · Sitemap")}</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Pages d'information : Qu'est-ce que GetBookForMe ? / Sécurité et confidentialité ───

function InfoCard({
  icon: Icon, title, text,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  text: string;
}) {
  return (
    <div className="info-card">
      <div className="info-card-icon"><Icon size={22} /></div>
      <h3>{t(title)}</h3>
      <p>{t(text)}</p>
    </div>
  );
}

function InfoSteps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <div className="info-steps">
      {steps.map((s, i) => (
        <div key={s.title} className="info-step">
          <div className="info-step-num">{i + 1}</div>
          <h3>{t(s.title)}</h3>
          <p>{t(s.text)}</p>
        </div>
      ))}
    </div>
  );
}

function AboutPage({ onNavigate }: { onNavigate: (to: string) => void }) {
  const travelerSteps = [
    {
      title: "Find your place",
      text: "Search by destination, dates and number of guests, then refine with price, rooms and amenities.",
    },
    {
      title: "Compare with confidence",
      text: "Browse photos, amenities, house rules and reviews from real guests.",
    },
    {
      title: "Book and pay securely",
      text: "Pay by card through Stripe Checkout. Your booking is confirmed once the payment is verified.",
    },
    {
      title: "Stay and share",
      text: "Message your host, enjoy your stay, then leave a review to help the community.",
    },
  ];

  const hostSteps = [
    {
      title: "Create your host account",
      text: "Become a host in one click and access your host dashboard.",
    },
    {
      title: "Connect Stripe",
      text: "Complete your Stripe Connect setup to publish listings and receive payouts.",
    },
    {
      title: "Publish your listing",
      text: "Add photos, price, amenities and house rules, then publish when you are ready.",
    },
    {
      title: "Manage and get paid",
      text: "Follow reservations, block dates in your calendar, chat with guests and track your payouts.",
    },
  ];

  const advantages = [
    {
      icon: Star,
      title: "Honest reviews",
      text: "Only guests with a paid booking can review, and only after their stay has ended.",
    },
    {
      icon: CreditCard,
      title: "Secure payments",
      text: "Payments are processed by Stripe. GetBookForMe never sees or stores your card details.",
    },
    {
      icon: Calendar,
      title: "Fair cancellation policy",
      text: "A clear policy applies to every listing: 100% refund more than 7 days before arrival and 50% between 24 hours and 7 days.",
    },
    {
      icon: MessageSquare,
      title: "Direct messaging",
      text: "Once a booking is confirmed, you can chat directly with your host or guest, with instant notifications.",
    },
    {
      icon: Globe,
      title: "Six languages",
      text: "Use the platform in English, French, Spanish, German, Italian or Portuguese.",
    },
    {
      icon: Building2,
      title: "Powerful host tools",
      text: "Availability calendar, payment history, house rules and a public host profile.",
    },
  ];

  return (
    <div className="container info-page">
      <section className="info-hero">
        <span className="info-eyebrow">{t("About GetBookForMe")}</span>
        <h1>{t("What is GetBookForMe?")}</h1>
        <p className="info-lead">
          {t("GetBookForMe is a marketplace that connects travelers with hosts offering apartments, houses, villas, cabins and more, for a simple, transparent and secure booking experience.")}
        </p>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">{t("Our mission")}</h2>
        <p className="info-section-sub">
          {t("We want booking a stay to be as easy as it is reassuring. Travelers find the right place with clear prices, honest reviews and a fair cancellation policy. Hosts get professional tools to share their space and be paid securely.")}
        </p>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">{t("How it works")}</h2>
        <h3 className="info-subtitle">{t("For travelers")}</h3>
        <InfoSteps steps={travelerSteps} />
        <h3 className="info-subtitle">{t("For hosts")}</h3>
        <InfoSteps steps={hostSteps} />
      </section>

      <section className="info-section">
        <h2 className="info-section-title">{t("Why choose GetBookForMe")}</h2>
        <div className="info-grid">
          {advantages.map((a) => (
            <InfoCard key={a.title} icon={a.icon} title={a.title} text={a.text} />
          ))}
        </div>
      </section>

      <section className="info-cta">
        <h2>{t("Ready to get started?")}</h2>
        <p>{t("Find your next stay or start hosting today.")}</p>
        <div className="info-cta-actions">
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate("/search")}>
            <Search size={20} /> {t("Start exploring")}
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => onNavigate("/host")}>
            <Sparkles size={20} /> {t("Become a host")}
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => onNavigate("/security")}>
            <Shield size={20} /> {t("Security & privacy")}
          </button>
        </div>
      </section>
    </div>
  );
}

function SecurityPage({ onNavigate }: { onNavigate: (to: string) => void }) {
  const accountItems = [
    {
      icon: Lock,
      title: "Secure passwords",
      text: "Passwords are never stored in clear text: they are hashed with a strong one-way algorithm before being saved.",
    },
    {
      icon: Shield,
      title: "Protected sessions",
      text: "Each session uses a signed token that expires automatically, and private pages require you to be logged in.",
    },
    {
      icon: Sparkles,
      title: "Authenticator app",
      text: "Enable an authenticator app such as Google Authenticator or Authy to reset your password safely. Each code works only once.",
    },
    {
      icon: AlertCircle,
      title: "Brute-force protection",
      text: "Password reset attempts are limited, and error messages never reveal whether an email address has an account.",
    },
  ];

  const dataItems = [
    {
      icon: EyeOff,
      title: "Private by default",
      text: "Your email address and phone number are never shown on public pages, including host profiles.",
    },
    {
      icon: Users,
      title: "Shared only when needed",
      text: "When a booking is confirmed, your name and contact details are shared with the host so they can prepare your stay.",
    },
    {
      icon: Lock,
      title: "Restricted access",
      text: "Only the guest and the host concerned can read a conversation or open a booking. Administrators only handle support and cancellation requests.",
    },
    {
      icon: User,
      title: "Your choices",
      text: "You can update your name and password at any time from your profile, and disable the authenticator app whenever you want.",
    },
  ];

  const paymentItems = [
    {
      icon: CreditCard,
      title: "Card details handled by Stripe",
      text: "You pay on Stripe's secure checkout page. GetBookForMe never sees or stores your card number.",
    },
    {
      icon: CheckCircle2,
      title: "Verified confirmations",
      text: "A booking is marked as paid only after Stripe confirms the payment, and Stripe notifications are signature-checked.",
    },
    {
      icon: DollarSign,
      title: "Protected payouts",
      text: "Hosts are paid through Stripe Connect, once they have completed Stripe's account verification.",
    },
    {
      icon: TrendingUp,
      title: "Refunds you can trust",
      text: "Approved cancellations are refunded through Stripe to your original payment method, following the cancellation policy.",
    },
  ];

  const practices = [
    "Use a long, unique password for your GetBookForMe account.",
    "Enable the authenticator app in your profile so you can recover your account.",
    "Never share your verification codes with anyone.",
    "Pay only through the GetBookForMe checkout and keep your conversations on the platform.",
  ];

  return (
    <div className="container info-page">
      <section className="info-hero">
        <span className="info-eyebrow">{t("Security")}</span>
        <h1>{t("Security & privacy")}</h1>
        <p className="info-lead">
          {t("Here is how GetBookForMe protects your account, your personal data and your payments.")}
        </p>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">{t("Account protection")}</h2>
        <div className="info-grid">
          {accountItems.map((a) => (
            <InfoCard key={a.title} icon={a.icon} title={a.title} text={a.text} />
          ))}
        </div>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">{t("Personal data")}</h2>
        <div className="info-grid">
          {dataItems.map((a) => (
            <InfoCard key={a.title} icon={a.icon} title={a.title} text={a.text} />
          ))}
        </div>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">{t("Payments")}</h2>
        <div className="info-grid">
          {paymentItems.map((a) => (
            <InfoCard key={a.title} icon={a.icon} title={a.title} text={a.text} />
          ))}
        </div>
      </section>

      <section className="info-section">
        <h2 className="info-section-title">{t("Good practices")}</h2>
        <ul className="info-list">
          {practices.map((p) => (
            <li key={p}>
              <CheckCircle2 size={20} />
              <span>{t(p)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="info-cta">
        <h2>{t("Security & privacy")}</h2>
        <p>{t("Here is how GetBookForMe protects your account, your personal data and your payments.")}</p>
        <div className="info-cta-actions">
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate("/profile")}>
            <Shield size={20} /> {t("Manage my security")}
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => onNavigate("/about")}>
            {t("What is GetBookForMe?")}
          </button>
        </div>
      </section>
    </div>
  );
}

// ─── Mobile Nav ─────────────────────────────────────────────────

function MobileNav({
  user, route, onNavigate, unreadNotifs,
}: {
  user: User | null;
  route: string;
  onNavigate: (to: string) => void;
  unreadNotifs: number;
}) {
  const page = route.split("/").filter(Boolean)[0] || "";
  return (
    <div className="mobile-nav">
      <button
        className={`mobile-nav-item ${page === "" ? "active" : ""}`}
        onClick={() => onNavigate("/") }
      >
        <HomeIcon /> {t("Explore")}
      </button>
      <button
        className={`mobile-nav-item ${page === "search" ? "active" : ""}`}
        onClick={() => onNavigate("/search")}
      >
        <Search /> {t("Search")}
      </button>
      <button
        className={`mobile-nav-item ${page === "favorites" ? "active" : ""}`}
        onClick={() => user ? onNavigate("/favorites") : onNavigate("/")}
      >
        <HeartIcon /> {t("Favorites")}
      </button>
      <button
        className={`mobile-nav-item ${page === "messages" ? "active" : ""}`}
        onClick={() => user ? onNavigate("/messages") : onNavigate("/")}
        style={{ position: "relative" }}
      >
        <MessageSquare /> {t("Messages")}
        {user && unreadNotifs > 0 && (
          <span style={{
            position: "absolute", top: 0, right: "25%",
            background: "var(--error)", color: "#fff",
            borderRadius: "50%", minWidth: 16, height: 16,
            fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
          }}>
            {unreadNotifs > 9 ? "9+" : unreadNotifs}
          </span>
        )}
      </button>
      <button
        className={`mobile-nav-item ${page === "profile" || page === "host" ? "active" : ""}`}
        onClick={() => user ? onNavigate("/profile") : onNavigate("/")}
      >
        <UserIcon /> {t("Account")}
      </button>
    </div>
  );
}

// ─── Auth Modal ─────────────────────────────────────────────────

function AuthModal({
  mode, onClose, onSwitch, onSuccess, onForgot, showToast,
}: {
  mode: "login" | "register";
  onClose: () => void;
  onSwitch: (m: "login" | "register") => void;
  onSuccess: (token: string, user: User) => void;
  onForgot: () => void;
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
      setError(t(err.message || "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === "register" ? t("Create your account") : t("Welcome back")}</h3>
          <button className="modal-close" onClick={onClose} aria-label={t("Close")}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="form-row">
                <div className="form-group">
                  <label>{t("First name")}</label>
                  <input
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="form-group">
                  <label>{t("Last name")}</label>
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
              <label>{t("Email")}</label>
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
              <label>{t("Password")}</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                placeholder={t("At least 6 characters")}
              />
            </div>
            {mode === "login" && (
              <div style={{ textAlign: "right", marginBottom: 12, marginTop: -8 }}>
                <button
                  type="button"
                  onClick={onForgot}
                  style={{
                    color: "var(--primary)", fontWeight: 600, fontSize: 13,
                    textDecoration: "underline",
                  }}
                >
                  {t("Forgot your password?")}
                </button>
              </div>
            )}
            {mode === "register" && (
              <div className="form-group">
                <label>{t("Phone (optional)")}</label>
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
              {mode === "register" ? t("Sign up") : t("Log in")}
            </button>
          </form>
          <div className="form-switch">
            {mode === "register" ? (
              <>{t("Already have an account?")} <button onClick={() => onSwitch("login")}>{t("Log in")}</button></>
            ) : (
              <>{t("Don't have an account?")} <button onClick={() => onSwitch("register")}>{t("Sign up")}</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Forgot Password Modal (réinitialisation par code d'authentificateur) ───

function ForgotPasswordModal({
  onClose, onBack, showToast,
}: {
  onClose: () => void;
  onBack: () => void;
  showToast: (msg: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError(t("Password must be at least 6 characters"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("Passwords do not match"));
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });
      showToast(t("Password reset successfully. You can now log in."));
      onBack();
    } catch (err: any) {
      setError(t(err.message || "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t("Reset your password")}</h3>
          <button className="modal-close" onClick={onClose} aria-label={t("Close")}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: "var(--neutral-600)", fontSize: 14, marginBottom: 8 }}>
            {t("Enter your email, the 6-digit code shown in your authenticator app (Google Authenticator, Authy…) and your new password.")}
          </p>
          <p className="text-sm color-neutral-500" style={{ marginBottom: 16 }}>
            {t("This only works if you enabled the authenticator in your profile beforehand.")}
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t("Email")}</label>
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
              <label>{t("Verification code")}</label>
              <input
                className="form-input"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="123456"
              />
            </div>
            <div className="form-group">
              <label>{t("New password")}</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder={t("At least 6 characters")}
              />
            </div>
            <div className="form-group">
              <label>{t("Confirm new password")}</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
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
              {t("Reset password")}
            </button>
          </form>
          <div className="form-switch">
            <button onClick={onBack}>{t("Back to login")}</button>
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
          showToast(t("Removed from favorites"));
        } else {
          await api(`/api/favorites/${listingId}`, { method: "POST" }, token || undefined);
          setFavorites((prev) => new Set(prev).add(listingId));
          showToast(t("Added to favorites"));
        }
      } catch (err: any) {
        showToast(t(err.message || "Failed to update favorites"));
      }
    });
  };

  const heroImg = "https://i.postimg.cc/bJnBn4RH/e256891e-55e3-4ae3-9593-1b31b0cf1b7c.png";

  return (
    <div>
      <div className="hero">
        <img className="hero-bg" src={heroImg} alt={t("Beautiful destination")} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>{t("Find your next stay")}</h1>
          <p>{t("Discover unique places to stay from local hosts worldwide")}</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onNavigate("/search")}
          >
            <Search size={20} /> {t("Start exploring")}
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
              {t(cat.label)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <h3>{t("No listings found")}</h3>
            <p>{t("Try a different category or check back later.")}</p>
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
          aria-label={isFav ? t("Remove from favorites") : t("Add to favorites")}
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
          ${listing.price_per_night} <span>{t("/ night")}</span>
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

  // Quand l'URL change (ex. nouvelle recherche depuis la barre de l'en-tête alors
  // qu'on est déjà sur cette page), on recharge les critères depuis l'URL.
  useEffect(() => {
    setDestination(initialParams.get("destination") || "");
        setCheckIn(initialParams.get("check_in") || "");
    setCheckOut(initialParams.get("check_out") || "");
    setGuests(initialParams.get("guests") || "");
    setPropertyType(initialParams.get("property_type") || "");
  }, [initialParams]);

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
          showToast(t("Added to favorites"));
        }
      } catch (err: any) { showToast(t(err.message)); }
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
        {destination ? t("Stays in {destination}", { destination }) : t("Explore stays")}
      </h1>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Filter Sidebar */}
        <aside className="filter-sidebar" style={{ display: showFilters ? "block" : undefined }}>
          <div className="filter-group">
            <h4>{t("Price range (per night)")}</h4>
            <div className="filter-row">
              <input
                className="filter-input"
                type="number"
                placeholder={t("Min $")}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                className="filter-input"
                type="number"
                placeholder={t("Max $")}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <h4>{t("Property type")}</h4>
            <select
              className="filter-input"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              <option value="">{t("Any type")}</option>
              <option value="apartment">{t("Apartment")}</option>
              <option value="house">{t("House")}</option>
              <option value="cabin">{t("Cabin")}</option>
              <option value="villa">{t("Villa")}</option>
              <option value="loft">{t("Loft")}</option>
              <option value="studio">{t("Studio")}</option>
              <option value="cottage">{t("Cottage")}</option>
              <option value="chalet">{t("Chalet")}</option>
            </select>
          </div>

          <div className="filter-group">
            <h4>{t("Rooms")}</h4>
            <div className="filter-row" style={{ marginBottom: 8 }}>
              <select className="filter-input" value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)}>
                <option value="">{t("Bedrooms")}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
              <select className="filter-input" value={minBeds} onChange={(e) => setMinBeds(e.target.value)}>
                <option value="">{t("Beds")}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
            <select className="filter-input" value={minBathrooms} onChange={(e) => setMinBathrooms(e.target.value)}>
              <option value="">{t("Any bathrooms")}</option>
              <option value="1">{t("1+ bathrooms")}</option>
              <option value="2">{t("2+ bathrooms")}</option>
              <option value="3">{t("3+ bathrooms")}</option>
            </select>
          </div>

          <div className="filter-group">
            <h4>{t("Amenities")}</h4>
            {allAmenities.map((a) => (
              <label key={a.id} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedAmenities.has(a.id)}
                  onChange={() => toggleAmenity(a.id)}
                />
                {t(a.name)}
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
            {t("Clear all filters")}
          </button>
        </aside>

        {/* Results */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex-between mb-16">
            <div className="flex gap-12 flex-wrap">
              <input
                className="filter-input"
                style={{ width: "auto" }}
                placeholder={t("Where to?")}
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
                <option value="">{t("Any guests")}</option>
                <option value="1">{t("1+ guests")}</option>
                <option value="2">{t("2+ guests")}</option>
                <option value="4">{t("4+ guests")}</option>
                <option value="6">{t("6+ guests")}</option>
                <option value="8">{t("8+ guests")}</option>
              </select>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowFilters(!showFilters)}
              style={{ display: "none" }}
            >
              <Filter size={16} /> {t("Filters")}
            </button>
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : listings.length === 0 ? (
            <div className="empty-state">
              <h3>{t("No stays found")}</h3>
              <p>{t("Try adjusting your search or filters.")}</p>
            </div>
          ) : (
            <>
              <p className="color-neutral-500 mb-16">
                {t(listings.length === 1 ? "{n} stay available" : "{n} stays available", { n: listings.length })}
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
        <h3>{t("Listing not found")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>
          {t("Back to home")}
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
  // Prix par nuit et par voyageur : le sous-total dépend du nombre de Guests
  const subtotal = nights * guests * listing.price_per_night;
  const total = subtotal + listing.cleaning_fee + listing.service_fee;

  const handleReserve = () => {
    setBookingError("");
    if (!checkIn || !checkOut) {
      setBookingError(t("Please select check-in and check-out dates"));
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      setBookingError(t("Check-out must be after check-in"));
      return;
    }
    if (guests > listing.max_guests) {
      setBookingError(t("Maximum {n} guests", { n: listing.max_guests }));
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

        // Go to Stripe checkout (paiement Stripe Connect : 90 % Host / 10 % plateforme)
        const checkout = await api<{ url: string }>("/api/stripe/checkout", {
          method: "POST",
          body: JSON.stringify({ booking_id: booking.id }),
        }, token || undefined);

        sessionStorage.removeItem("pending_booking");
        window.location.href = checkout.url;
      } catch (err: any) {
        setBookingError(t(err.message || "Failed to create booking"));
        sessionStorage.removeItem("pending_booking");
      } finally {
        setCreating(false);
      }
    });
  };

  const today = new Date().toISOString().split("T")[0];

  const ruleItem = (ok: boolean | undefined, yes: string, no: string) => (
    <div className="amenity-item">
      {ok ? <CheckCircle2 /> : <XCircle />} {ok ? t(yes) : t(no)}
    </div>
  );

  return (
    <div className="container listing-detail">
      <button
        className="btn btn-ghost btn-sm mb-16"
        onClick={() => window.history.back()}
      >
        <ArrowLeft size={18} /> {t("Back")}
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
              <Users /> {t("{n} guests", { n: listing.max_guests })}
            </div>
            <div className="feature-item">
              <DoorOpen /> {t("{n} bedrooms", { n: listing.bedrooms })}
            </div>
            <div className="feature-item">
              <Bed /> {t("{n} beds", { n: listing.beds })}
            </div>
            <div className="feature-item">
              <Shower /> {t("{n} baths", { n: listing.bathrooms })}
            </div>
          </div>

          {listing.owner && (
            <div className="detail-host">
              <div className="host-avatar">
                {listing.owner.first_name[0]}{listing.owner.last_name[0]}
              </div>
              <div className="host-info">
                <h4>{t("Hosted by {name}", { name: `${listing.owner.first_name} ${listing.owner.last_name}` })}</h4>
                <p>{t("Superhost")}</p>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ marginLeft: "auto" }}
                onClick={() => onNavigate(`/host-profile/${listing.owner!.id}`)}
              >
                <User size={16} /> {t("View profile")}
              </button>
            </div>
          )}

          <div className="detail-section">
            <h3>{t("About this place")}</h3>
            {/* Description rédigée par le Host : jamais traduite automatiquement */}
            <p style={{ color: "var(--neutral-700)", lineHeight: 1.7 }}>
              {listing.description || t("No description provided.")}
            </p>
          </div>

          {listing.amenities && listing.amenities.length > 0 && (
            <div className="detail-section">
              <h3>{t("What this place offers")}</h3>
              <div className="amenities-grid">
                {listing.amenities.map((a) => {
                  const Icon = getAmenityIcon(a.icon);
                  return (
                    <div key={a.id} className="amenity-item">
                      <Icon /> {t(a.name)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>{t("House rules")}</h3>
            <div className="amenities-grid">
              <div className="amenity-item">
                <Clock /> {t("Check-in from {time}", { time: listing.check_in_time || "15:00" })}
              </div>
              <div className="amenity-item">
                <Clock /> {t("Check-out before {time}", { time: listing.check_out_time || "11:00" })}
              </div>
              {ruleItem(listing.pets_allowed, "Pets allowed", "No pets")}
              {ruleItem(listing.smoking_allowed, "Smoking allowed", "No smoking")}
              {ruleItem(listing.parties_allowed, "Parties allowed", "No parties")}
              {ruleItem(listing.events_allowed, "Events allowed", "No events")}
              {ruleItem(listing.children_allowed !== false, "Children welcome", "Children not allowed")}
            </div>
            {listing.arrival_instructions && (
              <>
                <h4 style={{ marginTop: 16, marginBottom: 6 }}>{t("Arrival instructions")}</h4>
                <p style={{ color: "var(--neutral-700)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {listing.arrival_instructions}
                </p>
              </>
            )}
            {listing.additional_rules && (
              <>
                <h4 style={{ marginTop: 16, marginBottom: 6 }}>{t("Additional rules")}</h4>
                <p style={{ color: "var(--neutral-700)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {listing.additional_rules}
                </p>
              </>
            )}
          </div>

          {listing.reviews && listing.reviews.length > 0 && (
            <div className="detail-section">
              <h3 style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                {listing.avg_rating ? (
                  <span className="rating-badge" style={{ fontSize: 18, fontWeight: 700 }}>
                    <Star /> {listing.avg_rating}
                  </span>
                ) : null}
                <span>{t("Reviews ({n})", { n: listing.review_count ?? listing.reviews.length })}</span>
              </h3>
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
                      <div className="flex items-center gap-8">
                        <span className="rating-badge">
                          <Star /> {r.rating}
                        </span>
                        {r.created_at && (
                          <span className="text-sm color-neutral-500">
                            {new Date(r.created_at).toLocaleDateString(LOCALES[currentLang])}
                          </span>
                        )}
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
              ${listing.price_per_night} <span>{t("per guest / night")}</span>
            </div>

            <div className="date-inputs">
              <div className="date-field">
                <label>{t("Check-in")}</label>
                <input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div className="date-field">
                <label>{t("Check-out")}</label>
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div className="guests-field">
              <label>{t("Guests")}</label>
              <select value={guests} onChange={(e) => setGuests(parseInt(e.target.value))}>
                {Array.from({ length: listing.max_guests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {t(n === 1 ? "{n} guest" : "{n} guests", { n })}
                  </option>
                ))}
              </select>
            </div>

            {nights > 0 && (
              <div className="price-breakdown">
                <div className="price-line">
                  <span>
                    {t(guests === 1
                      ? "{price} × {nights} nights × {guests} guest"
                      : "{price} × {nights} nights × {guests} guests",
                      { price: `$${listing.price_per_night}`, nights, guests })}
                  </span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="price-line">
                  <span>{t("Cleaning fee")}</span>
                  <span>${listing.cleaning_fee.toFixed(2)}</span>
                </div>
                <div className="price-line">
                  <span>{t("Service fee")}</span>
                  <span>${listing.service_fee.toFixed(2)}</span>
                </div>
                <div className="price-total">
                  <span>{t("Total")}</span>
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
              {t("Reserve")}
            </button>
            <p className="text-sm text-center color-neutral-500 mt-16">
              {t("You won't be charged yet")}
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
      showToast(t("Removed from favorites"));
    } catch (err: any) { showToast(t(err.message)); }
  };

  if (!user) {
    return (
      <div className="empty-state">
        <h3>{t("Please log in to view favorites")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>{t("Browse listings")}</button>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="container page-content">
      <h1 className="page-title">{t("Your favorites")}</h1>
      {favorites.length === 0 ? (
        <div className="empty-state">
          <Heart size={48} />
          <h3>{t("No favorites yet")}</h3>
          <p>{t("Save your favorite places by tapping the heart icon.")}</p>
          <button className="btn btn-primary mt-24" onClick={() => onNavigate("/search")}>
            {t("Browse listings")}
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
  const [tab, setTab] = useState<"upcoming" | "past" | "all" | "cancellations">("all");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

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
      showToast(t("Booking cancelled"));
      load();
    } catch (err: any) { showToast(t(err.message)); }
  };

  if (!user) {
    return (
      <div className="empty-state">
        <h3>{t("Please log in to view your bookings")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>{t("Browse listings")}</button>
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
      <h1 className="page-title">{t("Your trips")}</h1>
      <div className="tabs">
        <button className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>{t("All")}</button>
        <button className={`tab ${tab === "upcoming" ? "active" : ""}`} onClick={() => setTab("upcoming")}>{t("Upcoming")}</button>
        <button className={`tab ${tab === "past" ? "active" : ""}`} onClick={() => setTab("past")}>{t("Past")}</button>
        <button className={`tab ${tab === "cancellations" ? "active" : ""}`} onClick={() => setTab("cancellations")}>{t("Cancellations")}</button>
      </div>

      {tab === "cancellations" ? (
        <CancellationHistoryList onNavigate={onNavigate} reloadKey={bookings.length} />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <h3>{t("No trips yet")}</h3>
          <p>{t("Start exploring and book your first stay.")}</p>
          <button className="btn btn-primary mt-24" onClick={() => onNavigate("/search")}>
            {t("Find a stay")}
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
              onRequestCancel={() => setCancelTarget(b)}
            />
          ))}
        </div>
      )}

      {cancelTarget && (
        <CancellationModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onDone={() => { setCancelTarget(null); load(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function BookingItem({
  booking, onClick, onCancel, onRequestCancel,
}: {
  booking: Booking;
  onClick: () => void;
  onCancel?: () => void;
  onRequestCancel?: () => void;
}) {
  const img = booking.listing?.images?.[0]?.image_url || "";
  const todayStr = new Date().toISOString().split("T")[0];
  // Séjour terminé, payé, et pas encore d'avis : on invite à laisser un avis
  const canReview = booking.status === "paid" && booking.check_out <= todayStr && !booking.has_review;
  // Annulation possible : payée, séjour pas commencé, aucune demande active (le serveur revérifie tout)
  const canRequestCancel =
    booking.status === "paid" &&
    booking.check_in >= todayStr &&
    (!booking.cancellation || booking.cancellation.status === "rejected");
  return (
    <div className="booking-item" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="booking-item-img">
        {img && <img src={img} alt={booking.listing?.title} />}
      </div>
      <div className="booking-item-info">
        <h4>{booking.listing?.title || t("Listing")}</h4>
        <p>{booking.listing?.city}, {booking.listing?.country}</p>
        <p>
          {booking.check_in} → {booking.check_out} · {t("{n} nights", { n: booking.nights })} · {t(booking.guests === 1 ? "{n} guest" : "{n} guests", { n: booking.guests })}
        </p>
        <div className="flex items-center gap-12 mt-16" style={{ flexWrap: "wrap" }}>
          <span className={`status-badge status-${booking.status}`}>{t(booking.status)}</span>
          <span style={{ fontWeight: 600 }}>${booking.total.toFixed(2)}</span>
          {booking.cancellation && (
            <span className={`status-badge status-${cancellationBadgeClass(booking.cancellation.status)}`}>
              {t("Cancellation request")}: {t(booking.cancellation.status)}
            </span>
          )}
        </div>
      </div>
      {onCancel && booking.status === "pending" && (
        <button
          className="btn btn-outline btn-sm"
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
        >
          {t("Cancel")}
        </button>
      )}
      {onCancel && booking.status === "paid" && (
        <div className="flex gap-8 flex-col">
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            {canReview ? t("Leave a review") : t("View details")}
          </button>
          {canRequestCancel && onRequestCancel && (
            <button
              className="btn btn-outline btn-sm"
              style={{ color: "var(--error)" }}
              onClick={(e) => { e.stopPropagation(); onRequestCancel(); }}
            >
              {t("Cancel my booking")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Cancellation: modal (client) ───────────────────────────────

function CancellationModal({
  booking, onClose, onDone, showToast,
}: {
  booking: Booking;
  onClose: () => void;
  onDone: () => void;
  showToast: (msg: string) => void;
}) {
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<CancellationPreview>(`/api/bookings/${booking.id}/cancellation-preview`, {}, getToken() || undefined)
      .then(setPreview)
      .catch((err: any) => setError(t(err.message || "Something went wrong")))
      .finally(() => setLoading(false));
  }, [booking.id]);

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api(`/api/bookings/${booking.id}/cancellation-request`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() || null }),
      }, getToken() || undefined);
      showToast(t("Cancellation request sent"));
      onDone();
    } catch (err: any) {
      setError(t(err.message || "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t("Cancel my booking")}</h3>
          <button className="modal-close" onClick={onClose} aria-label={t("Close")}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : (
            <>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>{booking.listing?.title}</p>
              <p className="color-neutral-500 text-sm mb-16">{booking.check_in} → {booking.check_out}</p>

              <h4 style={{ marginBottom: 8 }}>{t("Refund policy")}</h4>
              <ul className="text-sm color-neutral-500" style={{ paddingLeft: 18, marginBottom: 16, lineHeight: 1.7 }}>
                <li>{t("More than 7 days before arrival: 100% refund")}</li>
                <li>{t("Between 24 hours and 7 days: 50% refund")}</li>
                <li>{t("Less than 24 hours: no automatic refund")}</li>
              </ul>

              {preview && (
                <div style={{
                  border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-md)",
                  padding: 16, marginBottom: 16,
                }}>
                  <div className="price-line">
                    <span>{t("Refund rate")}</span><span>{preview.refund_percent}%</span>
                  </div>
                  {preview.already_refunded > 0 && (
                    <div className="price-line">
                      <span>{t("Already refunded: {amount}", { amount: `$${preview.already_refunded.toFixed(2)}` })}</span>
                    </div>
                  )}
                  <div className="price-total">
                    <span>{t("Estimated refund")}</span>
                    <span>${preview.refundable_amount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {preview?.eligible && (
                <>
                  <div className="form-group">
                    <label>{t("Reason (optional)")}</label>
                    <textarea
                      className="form-input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      maxLength={2000}
                    />
                  </div>
                  <p className="text-sm color-neutral-500 mb-16">
                    {t("Your request will be reviewed by our team. You will be notified at each step.")}
                  </p>
                </>
              )}

              {preview && !preview.eligible && preview.reason && (
                <div className="form-error mb-16">
                  <AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} />
                  {t(preview.reason)}
                </div>
              )}
              {error && (
                <div className="form-error mb-16">
                  <AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} />
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={submit}
                disabled={submitting || !preview?.eligible}
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : null}
                {t("Send cancellation request")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cancellation: historique (client) ──────────────────────────

function CancellationHistoryList({
  onNavigate, reloadKey,
}: {
  onNavigate: (to: string) => void;
  reloadKey: number;
}) {
  const [items, setItems] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ requests: CancellationRequest[] }>("/api/cancellations", {}, getToken() || undefined)
      .then((d) => setItems(d.requests))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>{t("No cancellation requests")}</h3>
      </div>
    );
  }

  return (
    <div>
      {items.map((c) => (
        <div
          key={c.id}
          className="booking-item"
          style={{ cursor: "pointer" }}
          onClick={() => onNavigate(`/booking/${c.booking_id}`)}
        >
          <div className="booking-item-info">
            <h4>{c.listing?.title || `${t("Booking")} #${c.booking_id}`}</h4>
            {c.booking && <p>{c.booking.check_in} → {c.booking.check_out}</p>}
            <p>
              {t("Refund rate")}: {c.refund_percent}% · {t("Estimated refund")}: ${c.refundable_amount.toFixed(2)}
            </p>
            {c.refunded_amount !== null && c.refunded_amount > 0 && (
              <p>{t("Refunded: {amount}", { amount: `$${c.refunded_amount.toFixed(2)}` })}</p>
            )}
            {c.admin_note && <p className="text-sm color-neutral-500">{t("Note: {note}", { note: c.admin_note })}</p>}
            <div className="flex items-center gap-12 mt-16">
              <span className={`status-badge status-${cancellationBadgeClass(c.status)}`}>{t(c.status)}</span>
              {c.created_at && (
                <span className="text-sm color-neutral-500">
                  {new Date(c.created_at).toLocaleDateString(LOCALES[currentLang])}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Review widgets (étoiles + formulaire d'avis) ───────────────

function StarRatingInput({
  value, onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div style={{ display: "flex", gap: 4 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}/5`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          style={{ padding: 2, lineHeight: 0 }}
        >
          <Star
            size={30}
            color={n <= shown ? "#F59E0B" : "var(--neutral-300)"}
            fill={n <= shown ? "#F59E0B" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

function BookingReview({
  booking, onSubmitted, showToast,
}: {
  booking: Booking;
  onSubmitted: () => void;
  showToast: (msg: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const ended = booking.check_out <= todayStr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (rating < 1) {
      setError(t("Please select a rating"));
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ booking_id: booking.id, rating, comment: comment.trim() || null }),
      }, getToken() || undefined);
      showToast(t("Thank you for your review!"));
      onSubmitted();
    } catch (err: any) {
      setError(t(err.message || "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  if (booking.status !== "paid") return null;

  // Avis déjà publié : un seul avis par réservation
  if (booking.has_review && booking.review) {
    return (
      <div style={{
        border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-lg)",
        padding: 24, marginTop: 16,
      }}>
        <h3 style={{ marginBottom: 12 }}>{t("Your review")}</h3>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={22}
              color={n <= booking.review!.rating ? "#F59E0B" : "var(--neutral-300)"}
              fill={n <= booking.review!.rating ? "#F59E0B" : "none"}
            />
          ))}
        </div>
        {booking.review.comment && (
          <p style={{ color: "var(--neutral-700)", lineHeight: 1.6 }}>{booking.review.comment}</p>
        )}
      </div>
    );
  }

// // TEST Séjour pas encore terminé : on peut quand meme laisser l'avis
// if (!ended && booking.id !== 3) return null;

  // Séjour pas encore terminé : pas de formulaire
  if (!ended) return null;

  return (
    <div style={{
      border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-lg)",
      padding: 24, marginTop: 16,
    }}>
      <h3 style={{ marginBottom: 4 }}>{t("Leave a review")}</h3>
      <p className="color-neutral-500" style={{ marginBottom: 16 }}>{t("How was your stay?")}</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t("Your rating")}</label>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>
        <div className="form-group">
          <label>{t("Your comment (optional)")}</label>
          <textarea
            className="form-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            placeholder={t("Share your experience...")}
          />
        </div>
        {error && (
          <div className="form-error mb-16">
            <AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} />
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Star size={18} />}
          {t("Submit review")}
        </button>
      </form>
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
  const [reloadKey, setReloadKey] = useState(0);

  const queryStr = route.split("?")[1] || "";
  const queryParams = useMemo(() => new URLSearchParams(queryStr), [queryStr]);
  const paymentStatus = queryParams.get("status");

  // Retour de Stripe Checkout : on interroge le backend (statut réel) jusqu'à "paid".
  // Le retour avec status=success ne prouve rien : seul le statut renvoyé par le backend compte.
  const [verifying, setVerifying] = useState(paymentStatus === "success");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;
    const MAX_TRIES = 12; // ~18 s
    const load = () => {
      api<Booking>(`/api/bookings/${bookingId}`, {}, getToken() || undefined)
        .then((b) => {
          if (cancelled) return;
          setBooking(b);
          if (paymentStatus === "success" && b.status === "pending" && ++tries < MAX_TRIES) {
            setVerifying(true);
            timer = setTimeout(load, 1500);
          } else {
            setVerifying(false);
          }
        })
        .catch(() => { if (!cancelled) { setBooking(null); setVerifying(false); } })
        .finally(() => { if (!cancelled) setLoading(false); });
    };
    load();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [bookingId, paymentStatus, reloadKey]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!booking) {
    return (
      <div className="empty-state">
        <h3>{t("Booking not found")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/bookings")}>
          {t("View all bookings")}
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
    } catch (err: any) { showToast(t(err.message)); }
  };

  return (
    <div className="container page-content">
      <button className="btn btn-ghost btn-sm mb-16" onClick={() => onNavigate("/bookings")}>
        <ArrowLeft size={18} /> {t("Back to trips")}
      </button>

      {paymentStatus === "success" && booking.status === "paid" && (
        <div style={{
          padding: 24, borderRadius: "var(--radius-lg)", background: "#D1FAE5",
          color: "#065F46", marginBottom: 24, display: "flex", alignItems: "center", gap: 12,
        }}>
          <CheckCircle2 size={28} />
          <div>
            <h3>{t("Payment successful!")}</h3>
            <p>{t("Your booking is confirmed. A receipt has been sent to your email.")}</p>
          </div>
        </div>
      )}
      {paymentStatus === "success" && booking.status === "pending" && (
        <div style={{
          padding: 24, borderRadius: "var(--radius-lg)", background: "#FEF3C7",
          color: "#92400E", marginBottom: 24, display: "flex", alignItems: "center", gap: 12,
        }}>
          {verifying ? <div className="spinner" style={{ width: 24, height: 24 }} /> : <Clock size={28} />}
          <div>
            <h3>{verifying ? t("Verifying payment...") : t("Payment is being confirmed")}</h3>
            <p>{verifying
              ? t("Please wait a few seconds, do not pay again.")
              : t("Your payment was received by Stripe. Refresh this page in a moment; do not pay again.")}</p>
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
            <h3>{t("Payment cancelled")}</h3>
            <p>{t("You can try again at any time.")}</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <h1 className="page-title">{t("Booking #{id}", { id: booking.id })}</h1>

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
          <h3 style={{ marginBottom: 16 }}>{t("Trip details")}</h3>
          <div className="price-line"><span>{t("Check-in")}</span><span>{booking.check_in}</span></div>
          <div className="price-line"><span>{t("Check-out")}</span><span>{booking.check_out}</span></div>
          <div className="price-line"><span>{t("Guests")}</span><span>{booking.guests}</span></div>
          <div className="price-line"><span>{t("Nights")}</span><span>{booking.nights}</span></div>

          <div className="price-total" style={{ marginTop: 16 }}>
            <span>{t("Status")}</span>
            <span className={`status-badge status-${booking.status}`}>{t(booking.status)}</span>
          </div>

          <h3 style={{ marginTop: 24, marginBottom: 16 }}>{t("Price breakdown")}</h3>
          <div className="price-line">
            <span>
              {t(booking.guests === 1
                ? "{price} × {nights} nights × {guests} guest"
                : "{price} × {nights} nights × {guests} guests",
                { price: `$${booking.price_per_night}`, nights: booking.nights, guests: booking.guests })}
            </span>
            <span>${booking.subtotal.toFixed(2)}</span>
          </div>
          <div className="price-line"><span>{t("Cleaning fee")}</span><span>${booking.cleaning_fee.toFixed(2)}</span></div>
          <div className="price-line"><span>{t("Service fee")}</span><span>${booking.service_fee.toFixed(2)}</span></div>
          <div className="price-total">
            <span>{t("Total")}</span>
            <span>${booking.total.toFixed(2)}</span>
          </div>

          {booking.status === "pending" && paymentStatus !== "success" && (
            <button className="btn btn-primary btn-block btn-lg mt-24" onClick={payNow}>
              <CreditCard size={20} /> {t("Pay {amount}", { amount: `$${booking.total.toFixed(2)}` })}
            </button>
          )}
          {booking.status === "paid" && (
            <div style={{
              marginTop: 24, padding: 16, borderRadius: "var(--radius-md)",
              background: "#D1FAE5", color: "#065F46", display: "flex", alignItems: "center", gap: 10,
            }}>
              <CheckCircle2 /> {t("Payment confirmed — your stay is booked!")}
            </div>
          )}
          {booking.status === "cancelled" && (
            <div style={{
              marginTop: 24, padding: 16, borderRadius: "var(--radius-md)",
              background: "var(--neutral-100)", color: "var(--neutral-600)", display: "flex", alignItems: "center", gap: 10,
            }}>
              <XCircle /> {t("This booking was cancelled.")}
            </div>
          )}
          {booking.status === "refunded" && (
            <div style={{
              marginTop: 24, padding: 16, borderRadius: "var(--radius-md)",
              background: "var(--neutral-100)", color: "var(--neutral-600)", display: "flex", alignItems: "center", gap: 10,
            }}>
              <XCircle /> {t("This booking was refunded.")}
            </div>
          )}

          <button
            className="btn btn-outline btn-block mt-16"
            onClick={() => booking.listing_id && onNavigate(`/listing/${booking.listing_id}`)}
          >
            {t("View listing")}
          </button>
        </div>

        {/* Avis : formulaire (séjour terminé, un seul avis par réservation) ou avis publié */}
        <BookingReview
          booking={booking}
          showToast={showToast}
          onSubmitted={() => setReloadKey((k) => k + 1)}
        />
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
  const [calendarListing, setCalendarListing] = useState<Listing | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeBusy, setStripeBusy] = useState(false);
  const [dashboardBusy, setDashboardBusy] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [paymentTotals, setPaymentTotals] = useState<{ platform_fee: number; net: number } | null>(null);

  const loadData = useCallback(() => {
    if (!user || user.role === "user") { setLoading(false); return; }
    Promise.all([
      api<{ listings: Listing[] }>("/api/host/listings", {}, getToken() || undefined),
      api<{ bookings: Booking[] }>("/api/host/bookings", {}, getToken() || undefined),
    ]).then(([l, b]) => {
      setListings(l.listings);
      setHostBookings(b.bookings);
    }).catch(() => {}).finally(() => setLoading(false));

    api<{ payments: PaymentRow[]; totals: { platform_fee: number; net: number } }>(
      "/api/host/payments", {}, getToken() || undefined
    ).then((p) => {
      setPayments(p.payments);
      setPaymentTotals(p.totals);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statut Stripe Connect : relu côté serveur (chez Stripe) à chaque visite / retour d'onboarding
  const loadStripeStatus = useCallback(() => {
    if (!user || user.role === "user") return;
    api<StripeStatus>("/api/stripe/connect/status", {}, getToken() || undefined)
      .then(setStripeStatus)
      .catch(() => setStripeStatus(null));
  }, [user, route]);

  useEffect(() => {
    loadStripeStatus();
  }, [loadStripeStatus]);

  const startStripeOnboarding = async () => {
    setStripeBusy(true);
    try {
      const d = await api<{ url: string }>("/api/stripe/connect/onboard", {
        method: "POST",
      }, getToken() || undefined);
      window.location.href = d.url;
    } catch (err: any) {
      showToast(t(err.message));
      setStripeBusy(false);
    }
  };

  const openStripeDashboard = async () => {
    setDashboardBusy(true);
    try {
      const d = await api<{ url: string }>("/api/stripe/connect/dashboard", {
        method: "POST",
      }, getToken() || undefined);
      window.open(d.url, "_blank");
    } catch (err: any) {
      showToast(t(err.message));
    } finally {
      setDashboardBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="empty-state">
        <h3>{t("Please log in to access the host dashboard")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>{t("Go home")}</button>
      </div>
    );
  }

  if (user.role === "user") {
    return (
      <div className="container page-content">
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <Sparkles size={48} color="var(--primary)" />
          <h1 className="page-title">{t("Become a host")}</h1>
          <p style={{ color: "var(--neutral-600)", marginBottom: 24 }}>
            {t("Join our community of hosts by sharing your space. Create and manage your listings and follow the reservations you receive.")}
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={async () => {
              try {
                await api<{ user: User }>("/api/auth/become-host", {
                  method: "POST",
                }, getToken() || undefined);
                // Reload to refresh the user state
                showToast(t("You are now a host!"));
                setTimeout(() => window.location.reload(), 1000);
              } catch (err: any) { showToast(t(err.message)); }
            }}
          >
            {t("Get started as a host")}
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const commissionPct = stripeStatus?.commission_percent ?? 10;
  const stripeReady = !!stripeStatus?.ready;

  return (
    <div className="container page-content">
      <div className="flex-between mb-24">
        <h1 className="page-title" style={{ margin: 0 }}>{t("Host dashboard")}</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
          <Plus size={18} /> {t("Create listing")}
        </button>
      </div>

      {/* Stripe Connect */}
      {stripeStatus && !stripeStatus.ready && (
        <div style={{
          padding: 24, borderRadius: "var(--radius-lg)", background: "#FEF3C7",
          color: "#92400E", marginBottom: 24, display: "flex", alignItems: "center",
          gap: 16, flexWrap: "wrap",
        }}>
          <AlertCircle size={28} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <h3>{t("Stripe Connect setup required")}</h3>
            <p>{t("You must finish setting up your Stripe Connect account before you can publish a listing. Until then, your listings stay as drafts.")}</p>
            {stripeStatus.requirements_due.length > 0 && (
              <p className="text-sm" style={{ marginTop: 8 }}>
                {t("Still required by Stripe: {items}", { items: stripeStatus.requirements_due.slice(0, 6).join(", ") })}
              </p>
            )}
            <p className="text-sm" style={{ marginTop: 8 }}>
              {t("Platform commission: {pct}% per booking. You receive {host}%.", { pct: commissionPct, host: 100 - commissionPct })}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={startStripeOnboarding}
            disabled={stripeBusy}
          >
            {stripeBusy ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
            {stripeStatus.has_account ? t("Continue Stripe setup") : t("Set up Stripe Connect")}
          </button>
        </div>
      )}
      {stripeStatus && stripeStatus.ready && (
        <div style={{
          padding: 16, borderRadius: "var(--radius-lg)", background: "#D1FAE5",
          color: "#065F46", marginBottom: 24, display: "flex", alignItems: "center", gap: 12,
          flexWrap: "wrap",
        }}>
          <CheckCircle2 size={24} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div>{t("Stripe Connect account active — you can publish listings and receive payouts.")}</div>
            <div className="text-sm">
              {t("Platform commission: {pct}% per booking. You receive {host}%.", { pct: commissionPct, host: 100 - commissionPct })}
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={openStripeDashboard}
            disabled={dashboardBusy}
          >
            {dashboardBusy ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
            {t("Manage my Stripe account")}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="host-stat-card">
          <h4>{t("Total listings")}</h4>
          <div className="stat-value">{listings.length}</div>
        </div>
        <div className="host-stat-card">
          <h4>{t("Total bookings")}</h4>
          <div className="stat-value">{hostBookings.length}</div>
        </div>
        <div className="host-stat-card">
          <h4>{t("Published")}</h4>
          <div className="stat-value">{listings.filter((l) => l.status === "published").length}</div>
        </div>
      </div>

      {/* Listings */}
      <h2 className="text-xl mb-16">{t("Your listings")}</h2>
      {listings.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} />
          <h3>{t("No listings yet")}</h3>
          <p>{t("Create your first listing to start hosting.")}</p>
          <button className="btn btn-primary mt-24" onClick={() => setShowCreateForm(true)}>
            <Plus size={18} /> {t("Create listing")}
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
                <p>${l.price_per_night}{t("/night")} · {t(l.max_guests === 1 ? "{n} guest" : "{n} guests", { n: l.max_guests })}</p>
                <span className={`status-badge status-${
                  l.status === "published" ? "paid" : l.status === "draft" ? "pending" : "cancelled"
                }`}>{t(l.status)}</span>
              </div>
              <div className="flex gap-8 flex-col">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => onNavigate(`/listing/${l.id}`)}
                >
                  <Eye size={16} /> {t("View")}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setCalendarListing(l)}
                >
                  <Calendar size={16} /> {t("Calendar")}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditingListing(l)}
                >
                  <Edit2 size={16} /> {t("Edit")}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ color: "var(--error)" }}
                  onClick={async () => {
                    if (!confirm(t("Delete this listing?"))) return;
                    try {
                      await api(`/api/host/listings/${l.id}`, { method: "DELETE" }, getToken() || undefined);
                      showToast(t("Listing deleted"));
                      loadData();
                    } catch (err: any) { showToast(t(err.message)); }
                  }}
                >
                  <Trash2 size={16} /> {t("Delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reservations */}
      {hostBookings.length > 0 && (
        <>
          <h2 className="text-xl mb-16 mt-32">{t("Reservations")}</h2>
          {hostBookings.map((b) => (
            <div key={b.id} className="booking-item" style={{ cursor: "default" }}>
              <div className="booking-item-img">
                {b.listing?.images?.[0] && <img src={b.listing.images[0].image_url} alt="" />}
              </div>
              <div className="booking-item-info">
                <h4>{b.listing?.title}</h4>
                <p>{b.guest?.first_name} {b.guest?.last_name} · {b.guest?.email}</p>
                <p>{b.check_in} → {b.check_out} · {t("{n} nights", { n: b.nights })}</p>
                <div className="flex items-center gap-12 mt-16">
                  <span className={`status-badge status-${b.status}`}>{t(b.status)}</span>
                  <span style={{ fontWeight: 600 }}>${b.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Payments history (commissions & payouts) */}
      {payments.length > 0 && (
        <>
          <h2 className="text-xl mb-16 mt-32">{t("Payments history")}</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("Date")}</th>
                  <th>{t("Booking")}</th>
                  <th>{t("Type")}</th>
                  <th>{t("Amount")}</th>
                  <th>{t("Commission")}</th>
                  <th>{t("Your payout")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.created_at ? new Date(p.created_at).toLocaleDateString(LOCALES[currentLang]) : "—"}</td>
                    <td>{p.booking_id ? `#${p.booking_id}` : "—"}</td>
                    <td>{t(p.type)}</td>
                    <td>{p.type === "refund" ? "-" : ""}${p.amount.toFixed(2)}</td>
                    <td>{p.type === "refund" ? "-" : ""}${p.platform_fee.toFixed(2)}</td>
                    <td>{p.type === "refund" ? "-" : ""}${p.host_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paymentTotals && (
            <p className="text-sm color-neutral-500 mt-16">
              {t("Net received: {net} · Total commission: {fee}", {
                net: `$${paymentTotals.net.toFixed(2)}`,
                fee: `$${paymentTotals.platform_fee.toFixed(2)}`,
              })}
            </p>
          )}
        </>
      )}

      {showCreateForm && (
        <ListingFormModal
          stripeReady={stripeReady}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => { setShowCreateForm(false); loadData(); }}
          showToast={showToast}
        />
      )}

      {editingListing && (
        <ListingFormModal
          listing={editingListing}
          stripeReady={stripeReady}
          onClose={() => setEditingListing(null)}
          onSuccess={() => { setEditingListing(null); loadData(); }}
          showToast={showToast}
        />
      )}

      {calendarListing && (
        <HostCalendarModal
          listing={calendarListing}
          onClose={() => setCalendarListing(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ─── Host Calendar Modal (bloquer / débloquer des dates) ────────

function HostCalendarModal({
  listing, onClose, showToast,
}: {
  listing: Listing;
  onClose: () => void;
  showToast: (msg: string) => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const todayStr = fmt(now.getFullYear(), now.getMonth(), now.getDate());

  useEffect(() => {
    api<{
      blocked: string[];
      bookings: { check_in: string; check_out: string; status: string }[];
    }>(`/api/host/listings/${listing.id}/calendar`, {}, getToken() || undefined)
      .then((d) => {
        setBlocked(new Set(d.blocked));
        // Chaque nuit réservée [check_in, check_out[ est marquée "réservée"
        const b = new Set<string>();
        d.bookings.forEach((bk) => {
          const start = new Date(`${bk.check_in}T00:00:00`);
          const end = new Date(`${bk.check_out}T00:00:00`);
          for (let c = new Date(start); c < end; c.setDate(c.getDate() + 1)) {
            b.add(fmt(c.getFullYear(), c.getMonth(), c.getDate()));
          }
        });
        setBooked(b);
      })
      .catch((err: any) => setError(t(err.message || "Something went wrong")))
      .finally(() => setLoading(false));
  }, [listing.id]);

  const goMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const locale = LOCALES[currentLang];
  const monthTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" })
    .format(new Date(year, month, 1));
  // 1er janvier 2024 = lundi : semaine affichée du lundi au dimanche
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2024, 0, 1 + i))
  );

  const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const toggleDate = (ds: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(ds)) n.delete(ds); else n.add(ds);
      return n;
    });
  };

  const selectedList = Array.from(selected);
  const toBlock = selectedList.filter((d) => !blocked.has(d));
  const toUnblock = selectedList.filter((d) => blocked.has(d));

  const submit = async (action: "block" | "unblock", dates: string[]) => {
    if (dates.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const d = await api<{ blocked: string[] }>(
        `/api/host/listings/${listing.id}/calendar/${action}`,
        { method: "POST", body: JSON.stringify({ dates }) },
        getToken() || undefined
      );
      setBlocked(new Set(d.blocked));
      setSelected(new Set());
      showToast(t(action === "block" ? "Dates blocked" : "Dates unblocked"));
    } catch (err: any) {
      setError(t(err.message || "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  const legendBox = (style: React.CSSProperties): React.CSSProperties => ({
    display: "inline-block", width: 14, height: 14, borderRadius: 4,
    border: "1px solid var(--neutral-300)", ...style,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t("Availability calendar")} — {listing.title}</h3>
          <button className="modal-close" onClick={onClose} aria-label={t("Close")}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p className="color-neutral-500 text-sm mb-16">
            {t("Select the dates to block or unblock, then confirm.")}
          </p>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : (
            <>
              <div className="calendar">
                <div className="calendar-header">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => goMonth(-1)}
                    aria-label={t("Previous month")}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <strong style={{ textTransform: "capitalize" }}>{monthTitle}</strong>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => goMonth(1)}
                    aria-label={t("Next month")}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="calendar-grid">
                  {weekdays.map((w, i) => (
                    <div key={i} className="calendar-day-name">{w}</div>
                  ))}
                  {cells.map((d, i) => {
                    if (d === null) return <div key={`e${i}`} />;
                    const ds = fmt(year, month, d);
                    const isPast = ds < todayStr;
                    const isBooked = booked.has(ds);
                    const isBlocked = blocked.has(ds);
                    const isSel = selected.has(ds);
                    return (
                      <button
                        key={ds}
                        type="button"
                        disabled={isPast || isBooked}
                        className={`calendar-day ${isSel ? "selected" : ""} ${isBooked ? "booked" : ""}`}
                        style={isBlocked && !isSel && !isBooked
                          ? { background: "var(--neutral-800)", color: "#fff" }
                          : undefined}
                        onClick={() => toggleDate(ds)}
                        title={isBooked ? t("Booked") : isBlocked ? t("Blocked") : t("Available")}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Légende */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "12px 0 16px", fontSize: 13 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={legendBox({ background: "#fff" })} /> {t("Available")}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={legendBox({ background: "var(--neutral-800)" })} /> {t("Blocked")}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={legendBox({ background: "var(--neutral-100)" })} /> {t("Booked")}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={legendBox({ background: "var(--primary)" })} /> ✓
                </span>
              </div>

              {error && (
                <div className="form-error mb-16">
                  <AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} />
                  {error}
                </div>
              )}

              <div className="flex gap-12 flex-wrap">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || toBlock.length === 0}
                  onClick={() => submit("block", toBlock)}
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                  {t("Block selected dates ({n})", { n: toBlock.length })}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busy || toUnblock.length === 0}
                  onClick={() => submit("unblock", toUnblock)}
                >
                  <Check size={18} />
                  {t("Unblock selected dates ({n})", { n: toUnblock.length })}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Listing Form Modal ─────────────────────────────────────────

function ListingFormModal({
  listing, stripeReady, onClose, onSuccess, showToast,
}: {
  listing?: Listing | null;
  stripeReady: boolean;
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
  const [checkInTime, setCheckInTime] = useState(listing?.check_in_time || "15:00");
  const [checkOutTime, setCheckOutTime] = useState(listing?.check_out_time || "11:00");
  const [petsAllowed, setPetsAllowed] = useState(!!listing?.pets_allowed);
  const [smokingAllowed, setSmokingAllowed] = useState(!!listing?.smoking_allowed);
  const [partiesAllowed, setPartiesAllowed] = useState(!!listing?.parties_allowed);
  const [eventsAllowed, setEventsAllowed] = useState(!!listing?.events_allowed);
  const [childrenAllowed, setChildrenAllowed] = useState(listing ? listing.children_allowed !== false : true);
  const [arrivalInstructions, setArrivalInstructions] = useState(listing?.arrival_instructions || "");
  const [additionalRules, setAdditionalRules] = useState(listing?.additional_rules || "");
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
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        pets_allowed: petsAllowed,
        smoking_allowed: smokingAllowed,
        parties_allowed: partiesAllowed,
        events_allowed: eventsAllowed,
        children_allowed: childrenAllowed,
        arrival_instructions: arrivalInstructions.trim() || null,
        additional_rules: additionalRules.trim() || null,
      };

      if (listing) {
        await api(`/api/host/listings/${listing.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...body, status }),
        }, getToken() || undefined);
        showToast(t("Listing updated"));
      } else {
        await api("/api/host/listings", {
          method: "POST",
          body: JSON.stringify(body),
        }, getToken() || undefined);
        showToast(t("Listing created"));
      }
      onSuccess();
    } catch (err: any) {
      setError(t(err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{listing ? t("Edit listing") : t("Create new listing")}</h3>
          <button className="modal-close" onClick={onClose} aria-label={t("Close")}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t("Title")}</label>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder={t("Cozy apartment in the city center")} />
            </div>
            <div className="form-group">
              <label>{t("Description")}</label>
              <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("Describe your place...")} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t("Country")}</label>
                <input className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{t("City")}</label>
                <input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>{t("Address")}</label>
              <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t("Price per night per guest ($)")}</label>
                <input className="form-input" type="number" step="0.01" value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{t("Cleaning fee ($)")}</label>
                <input className="form-input" type="number" step="0.01" value={cleaningFee} onChange={(e) => setCleaningFee(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t("Service fee ($)")}</label>
                <input className="form-input" type="number" step="0.01" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t("Max guests")}</label>
                <input className="form-input" type="number" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{t("Bedrooms")}</label>
                <input className="form-input" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t("Beds")}</label>
                <input className="form-input" type="number" value={beds} onChange={(e) => setBeds(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t("Bathrooms")}</label>
                <input className="form-input" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>{t("Property type")}</label>
              <select className="form-input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                <option value="apartment">{t("Apartment")}</option>
                <option value="house">{t("House")}</option>
                <option value="cabin">{t("Cabin")}</option>
                <option value="villa">{t("Villa")}</option>
                <option value="loft">{t("Loft")}</option>
                <option value="studio">{t("Studio")}</option>
                <option value="cottage">{t("Cottage")}</option>
                <option value="chalet">{t("Chalet")}</option>
              </select>
            </div>

            {listing && (
              <div className="form-group">
                <label>{t("Status")}</label>
                <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="draft">{cap(t("draft"))}</option>
                  <option
                    value="published"
                    disabled={!stripeReady && listing.status !== "published"}
                  >
                    {cap(t("published"))}
                  </option>
                  <option value="unpublished">{cap(t("unpublished"))}</option>
                </select>
              </div>
            )}

            {/* House rules */}
            <div className="form-group">
              <label style={{ fontWeight: 700 }}>{t("House rules")}</label>
              <div className="form-row">
                <div className="form-group">
                  <label>{t("Check-in time")}</label>
                  <input className="form-input" type="time" value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>{t("Check-out time")}</label>
                  <input className="form-input" type="time" value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <label className="filter-checkbox">
                  <input type="checkbox" checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} />
                  {t("Pets allowed")}
                </label>
                <label className="filter-checkbox">
                  <input type="checkbox" checked={smokingAllowed} onChange={(e) => setSmokingAllowed(e.target.checked)} />
                  {t("Smoking allowed")}
                </label>
                <label className="filter-checkbox">
                  <input type="checkbox" checked={partiesAllowed} onChange={(e) => setPartiesAllowed(e.target.checked)} />
                  {t("Parties allowed")}
                </label>
                <label className="filter-checkbox">
                  <input type="checkbox" checked={eventsAllowed} onChange={(e) => setEventsAllowed(e.target.checked)} />
                  {t("Events allowed")}
                </label>
                <label className="filter-checkbox">
                  <input type="checkbox" checked={childrenAllowed} onChange={(e) => setChildrenAllowed(e.target.checked)} />
                  {t("Children welcome")}
                </label>
              </div>
              <div className="form-group">
                <label>{t("Arrival instructions")}</label>
                <textarea className="form-input" value={arrivalInstructions}
                  onChange={(e) => setArrivalInstructions(e.target.value)} maxLength={5000} />
              </div>
              <div className="form-group">
                <label>{t("Additional rules")}</label>
                <textarea className="form-input" value={additionalRules}
                  onChange={(e) => setAdditionalRules(e.target.value)} maxLength={5000} />
              </div>
            </div>

            {/* Images */}
            <div className="form-group">
              <label>{t("Images (paste URLs)")}</label>
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
                <button type="button" className="btn btn-secondary" onClick={addImage}>{t("Add")}</button>
              </div>
            </div>

            {/* Amenities */}
            <div className="form-group">
              <label>{t("Amenities")}</label>
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
                    {t(a.name)}
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="form-error mb-16"><AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} />{error}</div>}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? <Loader2 size={20} className="animate-spin" /> : null}
              {listing ? t("Save changes") : t("Create listing")}
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
  const [tab, setTab] = useState<"users" | "listings" | "bookings" | "cancellations">("users");
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
        <h3>{t("Admin access required")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>{t("Go home")}</button>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="container page-content">
      <h1 className="page-title">{t("Admin panel")}</h1>
      <div className="tabs">
        <button className={`tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>{t("Users ({n})", { n: users.length })}</button>
        <button className={`tab ${tab === "listings" ? "active" : ""}`} onClick={() => setTab("listings")}>{t("Listings ({n})", { n: listings.length })}</button>
        <button className={`tab ${tab === "bookings" ? "active" : ""}`} onClick={() => setTab("bookings")}>{t("Bookings ({n})", { n: bookings.length })}</button>
        <button className={`tab ${tab === "cancellations" ? "active" : ""}`} onClick={() => setTab("cancellations")}>{t("Cancellations")}</button>
      </div>

      {tab === "users" && (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>{t("Name")}</th><th>{t("Email")}</th><th>{t("Role")}</th><th>{t("Created")}</th>
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
                          showToast(t("Role updated"));
                          loadAll();
                        } catch (err: any) { showToast(t(err.message)); }
                      }}
                    >
                      <option value="user">{t("user")}</option>
                      <option value="host">{t("host")}</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString(LOCALES[currentLang]) : "—"}</td>
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
                <p>${l.price_per_night}{t("/night")} · {t("Owner")} #{l.owner_id}</p>
                <span className={`status-badge status-${
                  l.status === "published" ? "paid" : l.status === "draft" ? "pending" : "cancelled"
                }`}>{t(l.status)}</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ color: "var(--error)" }}
                onClick={async () => {
                  if (!confirm(t("Delete this listing?"))) return;
                  try {
                    await api(`/api/admin/listings/${l.id}`, { method: "DELETE" }, getToken() || undefined);
                    showToast(t("Listing deleted"));
                    loadAll();
                  } catch (err: any) { showToast(t(err.message)); }
                }}
              >
                <Trash2 size={16} /> {t("Delete")}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "bookings" && (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>{t("Listing")}</th><th>{t("Guest")}</th><th>{t("Dates")}</th><th>{t("Total")}</th><th>{t("Status")}</th></tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.listing?.title || `#${b.listing_id}`}</td>
                  <td>{t("Guest")} #{b.user_id}</td>
                  <td>{b.check_in} → {b.check_out}</td>
                  <td>${b.total.toFixed(2)}</td>
                  <td><span className={`status-badge status-${b.status}`}>{t(b.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "cancellations" && <AdminCancellationsTab showToast={showToast} />}
    </div>
  );
}

// ─── Admin: demandes d'annulation / remboursements ──────────────

function AdminCancellationsTab({ showToast }: { showToast: (msg: string) => void }) {
  const [items, setItems] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    api<{ requests: CancellationRequest[] }>(
      `/api/admin/cancellations${filter ? `?status=${filter}` : ""}`, {}, getToken() || undefined
    )
      .then((d) => setItems(d.requests))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const act = async (id: number, action: "approve" | "reject" | "sync") => {
    let note: string | null = "";
    if (action !== "sync") {
      note = window.prompt(t("Note for the customer (optional)"));
      if (note === null) return;
    }
    setBusyId(id);
    try {
      await api(`/api/admin/cancellations/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }, getToken() || undefined);
      showToast(t("Request processed"));
    } catch (err: any) {
      showToast(t(err.message || "Something went wrong"));
    } finally {
      setBusyId(null);
      load();
    }
  };

  return (
    <div>
      <div className="flex-between mb-16">
        <h2 className="text-xl">{t("Cancellation requests ({n})", { n: items.length })}</h2>
        <select
          className="filter-input"
          style={{ width: "auto" }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">{t("All statuses")}</option>
          {(["pending", "approved", "rejected", "processing", "refunded", "failed"] as const).map((s) => (
            <option key={s} value={s}>{cap(t(s))}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>{t("No cancellation requests")}</h3></div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>{t("Booking")}</th><th>{t("Guest")}</th><th>{t("Dates")}</th>
                <th>{t("Total")}</th><th>{t("Refund rate")}</th><th>{t("Refund")}</th>
                <th>{t("Status")}</th><th>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const amount = c.refunded_amount ?? c.approved_amount ?? c.refundable_amount;
                return (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>
                      #{c.booking_id}<br />
                      <span className="text-sm color-neutral-500">{c.listing?.title}</span>
                    </td>
                    <td>
                      {c.guest?.first_name} {c.guest?.last_name}<br />
                      <span className="text-sm color-neutral-500">{c.guest?.email}</span>
                    </td>
                    <td>{c.booking ? `${c.booking.check_in} → ${c.booking.check_out}` : "—"}</td>
                    <td>${c.total_paid.toFixed(2)}</td>
                    <td>{c.refund_percent}%</td>
                    <td>${amount.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${cancellationBadgeClass(c.status)}`}>{t(c.status)}</span>
                      {c.reason && <div className="text-sm color-neutral-500">{c.reason}</div>}
                      {c.failure_reason && <div className="text-sm" style={{ color: "var(--error)" }}>{c.failure_reason}</div>}
                      {c.admin_note && <div className="text-sm color-neutral-500">{t("Note: {note}", { note: c.admin_note })}</div>}
                    </td>
                    <td>
                      <div className="flex gap-8 flex-col">
                        {(c.status === "pending" || c.status === "failed") && (
                          <>
                            <button className="btn btn-primary btn-sm" disabled={busyId === c.id}
                              onClick={() => act(c.id, "approve")}>
                              {busyId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t("Approve")}
                            </button>
                            <button className="btn btn-outline btn-sm" disabled={busyId === c.id}
                              style={{ color: "var(--error)" }} onClick={() => act(c.id, "reject")}>
                              <XCircle size={14} /> {t("Reject")}
                            </button>
                          </>
                        )}
                        {c.status === "processing" && (
                          <button className="btn btn-outline btn-sm" disabled={busyId === c.id}
                            onClick={() => act(c.id, "sync")}>
                            <Loader2 size={14} /> {t("Sync with Stripe")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Profile Page ───────────────────────────────────────────────

function ProfilePage({
  user, onNavigate, showToast, onUserUpdate,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
  showToast: (msg: string) => void;
  onUserUpdate: (u: User) => void;
}) {
  if (!user) {
    return (
      <div className="empty-state">
        <h3>{t("Please log in to view your profile")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>{t("Go home")}</button>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <h1 className="page-title">{t("Your profile")}</h1>
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
              {t(user.role)}
            </span>
          </div>
        </div>

        <div style={{
          border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-lg)", padding: 24,
        }}>
          <h3 style={{ marginBottom: 16 }}>{t("Account details")}</h3>
          <div className="price-line"><span>{t("First name")}</span><span>{user.first_name}</span></div>
          <div className="price-line"><span>{t("Last name")}</span><span>{user.last_name}</span></div>
          <div className="price-line"><span>{t("Email")}</span><span>{user.email}</span></div>
          <div className="price-line"><span>{t("Phone")}</span><span>{user.phone || "—"}</span></div>
          <div className="price-line"><span>{t("Role")}</span><span>{t(user.role)}</span></div>

          {user.role === "host" && (
            <button
              className="btn btn-outline btn-block mt-16"
              onClick={() => onNavigate("/host")}
            >
              {t("Go to host dashboard")}
            </button>
          )}

          {user.role === "user" && (
            <button
              className="btn btn-primary btn-block mt-24"
              onClick={() => onNavigate("/host")}
            >
              <Sparkles size={18} /> {t("Become a host")}
            </button>
          )}

          {user.role === "admin" && (
            <button
              className="btn btn-outline btn-block mt-16"
              onClick={() => onNavigate("/admin")}
            >
              <Shield size={18} /> {t("Admin panel")}
            </button>
          )}
        </div>

        <ProfileEditForm user={user} onUserUpdate={onUserUpdate} showToast={showToast} />
        <PasswordChangeForm showToast={showToast} />
        <AuthenticatorSection user={user} onUserUpdate={onUserUpdate} showToast={showToast} />

        <div className="flex gap-12 mt-24">
          <button className="btn btn-secondary btn-block" onClick={() => onNavigate("/bookings")}>
            <Calendar size={18} /> {t("My bookings")}
          </button>
          <button className="btn btn-secondary btn-block" onClick={() => onNavigate("/favorites")}>
            <Heart size={18} /> {t("Favorites")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modification du prénom / nom
function ProfileEditForm({
  user, onUserUpdate, showToast,
}: {
  user: User;
  onUserUpdate: (u: User) => void;
  showToast: (msg: string) => void;
}) {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const d = await api<{ user: User }>("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      }, getToken() || undefined);
      onUserUpdate(d.user);
      showToast(t("Profile updated"));
    } catch (err: any) {
      setError(t(err.message || "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-lg)",
      padding: 24, marginTop: 24,
    }}>
      <h3 style={{ marginBottom: 16 }}>{t("Edit profile")}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>{t("First name")}</label>
            <input
              className="form-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              maxLength={80}
              autoComplete="given-name"
            />
          </div>
          <div className="form-group">
            <label>{t("Last name")}</label>
            <input
              className="form-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              maxLength={80}
              autoComplete="family-name"
            />
          </div>
        </div>
        {error && (
          <div className="form-error mb-16">
            <AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} />
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
          {t("Save changes")}
        </button>
      </form>
    </div>
  );
}

// Changement du mot de passe (mot de passe actuel requis)
function PasswordChangeForm({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError(t("Password must be at least 6 characters"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("Passwords do not match"));
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/auth/password", {
        method: "PUT",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      }, getToken() || undefined);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(t("Password updated"));
    } catch (err: any) {
      setError(t(err.message || "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-lg)",
      padding: 24, marginTop: 24,
    }}>
      <h3 style={{ marginBottom: 16 }}>{t("Change password")}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t("Current password")}</label>
          <input
            type="password"
            className="form-input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="form-group">
          <label>{t("New password")}</label>
          <input
            type="password"
            className="form-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder={t("At least 6 characters")}
          />
        </div>
        <div className="form-group">
          <label>{t("Confirm new password")}</label>
          <input
            type="password"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        {error && (
          <div className="form-error mb-16">
            <AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} />
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
          {t("Change password")}
        </button>
      </form>
    </div>
  );
}

// Authentificateur (QR code type Google Authenticator / Authy) pour récupérer le mot de passe
function AuthenticatorSection({
  user, onUserUpdate, showToast,
}: {
  user: User;
  onUserUpdate: (u: User) => void;
  showToast: (msg: string) => void;
}) {
  const [setup, setSetup] = useState<{ secret: string; qr_code: string | null } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const startSetup = async () => {
    setError("");
    setBusy(true);
    try {
      const d = await api<{ secret: string; qr_code: string | null }>("/api/auth/totp/setup", {
        method: "POST",
      }, getToken() || undefined);
      setSetup({ secret: d.secret, qr_code: d.qr_code });
      setCode("");
    } catch (err: any) {
      setError(t(err.message || "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  const confirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const d = await api<{ user: User }>("/api/auth/totp/enable", {
        method: "POST",
        body: JSON.stringify({ code }),
      }, getToken() || undefined);
      onUserUpdate(d.user);
      setSetup(null);
      setCode("");
      showToast(t("Authenticator enabled"));
    } catch (err: any) {
      setError(t(err.message || "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const d = await api<{ user: User }>("/api/auth/totp/disable", {
        method: "POST",
        body: JSON.stringify({ password }),
      }, getToken() || undefined);
      onUserUpdate(d.user);
      setShowDisable(false);
      setPassword("");
      showToast(t("Authenticator disabled"));
    } catch (err: any) {
      setError(t(err.message || "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  const errorBlock = error ? (
    <div className="form-error mb-16">
      <AlertCircle size={14} style={{ display: "inline", marginRight: 4 }} />
      {error}
    </div>
  ) : null;

  return (
    <div style={{
      border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-lg)",
      padding: 24, marginTop: 24,
    }}>
      <h3 style={{ marginBottom: 4 }}>{t("Security")}</h3>
      <p className="color-neutral-500" style={{ fontWeight: 600, marginBottom: 8 }}>
        {t("Authenticator app (password recovery)")}
      </p>

      {user.totp_enabled ? (
        <>
          <div style={{
            padding: 12, borderRadius: "var(--radius-md)", background: "#D1FAE5",
            color: "#065F46", display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
          }}>
            <CheckCircle2 size={20} />
            <span>{t("Authenticator is active. You can use it to reset your password.")}</span>
          </div>
          {!showDisable ? (
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={() => { setShowDisable(true); setError(""); }}
            >
              {t("Disable authenticator")}
            </button>
          ) : (
            <form onSubmit={disable}>
              <div className="form-group">
                <label>{t("Current password")}</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {errorBlock}
              <div className="flex gap-8">
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => { setShowDisable(false); setPassword(""); setError(""); }}
                >
                  {t("Cancel")}
                </button>
                <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                  {busy ? <Loader2 size={18} className="animate-spin" /> : null}
                  {t("Disable authenticator")}
                </button>
              </div>
            </form>
          )}
        </>
      ) : setup ? (
        <form onSubmit={confirmEnable}>
          <p style={{ color: "var(--neutral-600)", fontSize: 14, marginBottom: 16 }}>
            {t("Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.")}
          </p>
          {setup.qr_code && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <img
                src={setup.qr_code}
                alt="QR code"
                style={{
                  width: 200, height: 200, background: "#fff", padding: 8,
                  border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-md)",
                }}
              />
            </div>
          )}
          <p className="text-sm color-neutral-500" style={{ marginBottom: 4 }}>
            {t("Can't scan? Enter this key manually:")}
          </p>
          <code style={{
            display: "block", padding: "8px 12px", marginBottom: 16, borderRadius: "var(--radius-sm)",
            background: "var(--neutral-100)", wordBreak: "break-all", fontSize: 14, letterSpacing: 1,
          }}>
            {setup.secret}
          </code>
          <div className="form-group">
            <label>{t("6-digit code")}</label>
            <input
              className="form-input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="123456"
            />
          </div>
          {errorBlock}
          <div className="flex gap-8">
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => { setSetup(null); setCode(""); setError(""); }}
            >
              {t("Cancel")}
            </button>
            <button type="submit" className="btn btn-primary btn-block" disabled={busy || code.length !== 6}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
              {t("Verify and enable")}
            </button>
          </div>
        </form>
      ) : (
        <>
          <p style={{ color: "var(--neutral-600)", fontSize: 14, marginBottom: 16 }}>
            {t("Link an authenticator app such as Google Authenticator or Authy. It will let you reset your password if you forget it.")}
          </p>
          {errorBlock}
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={startSetup}
            disabled={busy}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
            {t("Enable authenticator")}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Messages List Page ─────────────────────────────────────────

function MessagesListPage({
  user, onNavigate,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api<{ conversations: Conversation[] }>("/api/conversations", {}, getToken() || undefined)
      .then((d) => setConversations(d.conversations))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="empty-state">
        <h3>{t("Please log in to view your bookings")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>{t("Go home")}</button>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="container page-content">
      <h1 className="page-title">{t("Messages")}</h1>
      {conversations.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={48} />
          <h3>{t("No conversations yet")}</h3>
          <p>{t("Start a conversation by booking a stay.")}</p>
          <button className="btn btn-primary mt-24" onClick={() => onNavigate("/search")}>
            {t("Find a stay")}
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {conversations.map((c) => (
            <div
              key={c.id}
              className="booking-item"
              style={{ cursor: "pointer" }}
              onClick={() => onNavigate(`/messages/${c.id}`)}
            >
              <div className="host-avatar" style={{ width: 48, height: 48, flexShrink: 0 }}>
                {c.other_user?.first_name?.[0] || "?"}{c.other_user?.last_name?.[0] || ""}
              </div>
              <div className="booking-item-info">
                <h4>{c.other_user?.first_name} {c.other_user?.last_name}</h4>
                <p style={{
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  maxWidth: 400,
                }}>
                  {c.last_message?.content || t("No messages yet")}
                </p>
              </div>
              {c.unread_count > 0 && (
                <span style={{
                  background: "var(--primary)", color: "#fff",
                  borderRadius: "50%", minWidth: 24, height: 24,
                  fontSize: 12, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 6px",
                }}>
                  {c.unread_count}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chat Page ──────────────────────────────────────────────────

function ChatPage({
  conversationId, user, onNavigate, showToast,
}: {
  conversationId: number;
  user: User | null;
  onNavigate: (to: string) => void;
  showToast: (msg: string) => void;
}) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversation = useCallback(() => {
    api<Conversation>(`/api/conversations/${conversationId}`, {}, getToken() || undefined)
      .then((d) => setConversation(d))
      .catch(() => setConversation(null))
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadConversation();
  }, [user, loadConversation]);

  // Poll for new messages every 5 seconds (in addition to WebSocket)
  useEffect(() => {
    if (!user || !conversationId) return;
    const interval = setInterval(() => {
      loadConversation();
    }, 5000);
    return () => clearInterval(interval);
  }, [user, conversationId, loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  if (!user) {
    return (
      <div className="empty-state">
        <h3>{t("Please log in to view your bookings")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>{t("Go home")}</button>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!conversation) {
    return (
      <div className="empty-state">
        <h3>{t("Page not found")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/messages")}>
          {t("Messages")}
        </button>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await api<Message>(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: input.trim() }),
      }, getToken() || undefined);
      setConversation((prev) => prev ? {
        ...prev,
        messages: [...(prev.messages || []), msg],
      } : prev);
      setInput("");
    } catch (err: any) {
      showToast(t(err.message || "Failed to send message"));
    } finally {
      setSending(false);
    }
  };

  const messages = conversation.messages || [];

  return (
    <div className="container page-content">
      <button className="btn btn-ghost btn-sm mb-16" onClick={() => onNavigate("/messages")}>
        <ArrowLeft size={18} /> {t("Messages")}
      </button>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Conversation header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: 16, borderBottom: "1px solid var(--neutral-200)", marginBottom: 16,
        }}>
          <div className="host-avatar" style={{ width: 40, height: 40 }}>
            {conversation.other_user?.first_name?.[0] || "?"}{conversation.other_user?.last_name?.[0] || ""}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>
              {conversation.other_user?.first_name} {conversation.other_user?.last_name}
            </h3>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          minHeight: 300, maxHeight: "60vh", overflowY: "auto",
          padding: 16, display: "flex", flexDirection: "column", gap: 8,
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--neutral-500)", marginTop: 40 }}>
              {t("No messages yet")}
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === user.id;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: isMine ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={{
                    maxWidth: "75%",
                    padding: "10px 16px",
                    borderRadius: "var(--radius-lg)",
                    background: isMine ? "var(--primary)" : "var(--neutral-100)",
                    color: isMine ? "#fff" : "var(--neutral-900)",
                  }}>
                    {/* pre-wrap : conserve les retours à la ligne (message de réservation automatique) */}
                    <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</p>
                    <span style={{
                      fontSize: 11, opacity: 0.7, display: "block", marginTop: 4,
                    }}>
                      {m.created_at ? new Date(m.created_at).toLocaleTimeString(LOCALES[currentLang], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{
          display: "flex", gap: 8, marginTop: 16,
        }}>
          <input
            className="form-input"
            placeholder={t("Type a message...")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={5000}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || !input.trim()}
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {t("Send")}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Host Profile Page (Public) ─────────────────────────────────

function HostProfilePage({
  hostId, onNavigate,
}: {
  hostId: number;
  onNavigate: (to: string) => void;
}) {
  const [host, setHost] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<HostProfile>(`/api/hosts/${hostId}`)
      .then(setHost)
      .catch(() => setHost(null))
      .finally(() => setLoading(false));
  }, [hostId]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!host) {
    return (
      <div className="empty-state">
        <h3>{t("Page not found")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>
          {t("Back to home")}
        </button>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <button className="btn btn-ghost btn-sm mb-16" onClick={() => window.history.back()}>
        <ArrowLeft size={18} /> {t("Back")}
      </button>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Host header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 20, marginBottom: 32,
        }}>
          <div className="host-avatar" style={{ width: 90, height: 90, fontSize: 32 }}>
            {host.first_name[0]}{host.last_name[0]}
          </div>
          <div>
            <h1 style={{ fontSize: 28, margin: 0 }}>
              {host.first_name} {host.last_name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
              {host.avg_rating && (
                <span className="rating-badge">
                  <Star /> {host.avg_rating} ({host.review_count})
                </span>
              )}
              <span className={`status-badge status-paid`}>{t("Host")}</span>
            </div>
          </div>
        </div>

        {/* About */}
        {host.host_bio && (
          <div style={{
            border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-lg)",
            padding: 24, marginBottom: 24,
          }}>
            <h3 style={{ marginBottom: 12 }}>{t("About this host")}</h3>
            <p style={{ color: "var(--neutral-700)", lineHeight: 1.7 }}>{host.host_bio}</p>
          </div>
        )}

        {/* Listings */}
        <h2 className="text-xl mb-16">{t("Host's listings")}</h2>
        {host.listings.length === 0 ? (
          <p className="color-neutral-500">{t("No listings available")}</p>
        ) : (
          <div className="listing-grid">
            {host.listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFav={false}
                onToggleFav={() => {}}
                onClick={() => onNavigate(`/listing/${listing.id}`)}
              />
            ))}
          </div>
        )}

        {/* Reviews */}
        {host.reviews && host.reviews.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 className="text-xl mb-16">{t("Reviews ({n})", { n: host.review_count ?? host.reviews.length })}</h2>
            {host.reviews.map((r) => (
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
    </div>
  );
}

// ─── Notifications Page ─────────────────────────────────────────

function NotificationsPage({
  user, onNavigate, onReadUpdate,
}: {
  user: User | null;
  onNavigate: (to: string) => void;
  onReadUpdate: () => void;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(() => {
    api<{ notifications: AppNotification[]; unread_count: number }>(
      "/api/notifications", {}, getToken() || undefined
    ).then((d) => {
      setNotifications(d.notifications);
    }).catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadNotifications();
  }, [user, loadNotifications]);

  const markAllRead = async () => {
    try {
      await api("/api/notifications/read", {
        method: "POST",
        body: JSON.stringify({}),
      }, getToken() || undefined);
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      onReadUpdate();
    } catch {}
  };

  if (!user) {
    return (
      <div className="empty-state">
        <h3>{t("Please log in to view your profile")}</h3>
        <button className="btn btn-primary mt-24" onClick={() => onNavigate("/")}>{t("Go home")}</button>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="container page-content">
      <div className="flex-between mb-24">
        <h1 className="page-title" style={{ margin: 0 }}>{t("Notifications")}</h1>
        {notifications.some((n) => !n.read_at) && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>
            <Check size={16} /> {t("Mark all as read")}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <h3>{t("No notifications")}</h3>
        </div>
      ) : (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="booking-item"
              style={{
                cursor: n.link ? "pointer" : "default",
                background: n.read_at ? "transparent" : "rgba(var(--primary-rgb, 59,130,246), 0.04)",
              }}
              onClick={() => {
                if (n.link) {
                  onNavigate(n.link.replace("/#", ""));
                }
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: n.read_at ? "var(--neutral-100)" : "var(--primary)",
                color: n.read_at ? "var(--neutral-500)" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Bell size={18} />
              </div>
              <div className="booking-item-info">
                <h4 style={{ fontWeight: n.read_at ? 400 : 700 }}>{n.title}</h4>
                {n.body && <p style={{ color: "var(--neutral-600)" }}>{n.body}</p>}
                <p className="text-sm color-neutral-500">
                  {n.created_at ? new Date(n.created_at).toLocaleString(LOCALES[currentLang]) : ""}
                </p>
              </div>
              {!n.read_at && (
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: "var(--primary)", flexShrink: 0,
                }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
