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
  platform_fee?: number;
  host_amount?: number;
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
  ["© 2026 Book4Me — Find your perfect stay", "© 2026 Book4Me — Trouvez le séjour parfait", "© 2026 Book4Me — Encuentra tu estancia perfecta", "© 2026 Book4Me — Finde deinen perfekten Aufenthalt", "© 2026 Book4Me — Trova il soggiorno perfetto", "© 2026 Book4Me — Encontre a estadia perfeita"],
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
  const [authModal, setAuthModal] = useState<null | "login" | "register">(null);
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
          <ProfilePage user={user} onNavigate={navigate} showToast={showToast} />
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
        {page !== "" && !["search","listing","favorites","bookings","booking","host","admin","profile","messages","host-profile","notifications"].includes(page) && (
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
          <span>Book4Me</span>
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
        <label>{t("Where")}</label>
        <input
          type="text"
          placeholder={t("Search destinations")}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button className="search-btn" onClick={handleSearch} aria-label={t("Search")}>
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
            <h4>{t("Support")}</h4>
            <a onClick={() => onNavigate("/")}>{t("Help Center")}</a>
            <a onClick={() => onNavigate("/")}>{t("Safety information")}</a>
            <a onClick={() => onNavigate("/")}>{t("Cancellation options")}</a>
          </div>
          <div className="footer-col">
            <h4>{t("Hosting")}</h4>
            <a onClick={() => onNavigate("/host")}>{t("Become a host")}</a>
            <a onClick={() => onNavigate("/host")}>{t("Host your home")}</a>
            <a onClick={() => onNavigate("/host")}>{t("Responsible hosting")}</a>
          </div>
          <div className="footer-col">
            <h4>Book4Me</h4>
            <a onClick={() => onNavigate("/")}>{t("About us")}</a>
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
          <span>{t("© 2026 Book4Me — Find your perfect stay")}</span>
          <span>{t("Privacy · Terms · Sitemap")}</span>
        </div>
      </div>
    </footer>
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

  const heroImg = "https://images.pexels.com/photos/2476632/pexels-photo-2476632.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";

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

          {listing.reviews && listing.reviews.length > 0 && (
            <div className="detail-section">
              <h3>{t("Reviews ({n})", { n: listing.review_count ?? listing.reviews.length })}</h3>
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
      </div>

      {filtered.length === 0 ? (
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
        <h4>{booking.listing?.title || t("Listing")}</h4>
        <p>{booking.listing?.city}, {booking.listing?.country}</p>
        <p>
          {booking.check_in} → {booking.check_out} · {t("{n} nights", { n: booking.nights })} · {t(booking.guests === 1 ? "{n} guest" : "{n} guests", { n: booking.guests })}
        </p>
        <div className="flex items-center gap-12 mt-16">
          <span className={`status-badge status-${booking.status}`}>{t(booking.status)}</span>
          <span style={{ fontWeight: 600 }}>${booking.total.toFixed(2)}</span>
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
        <button
          className="btn btn-primary btn-sm"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          {t("View details")}
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

      {paymentStatus === "success" && (
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

          {booking.status === "pending" && (
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
