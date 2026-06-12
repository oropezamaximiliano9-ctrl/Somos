import { Link, useNavigate } from "react-router-dom";
import { QrCode, ClipboardList, CheckCircle2, ChevronDown, ChevronsDown, ArrowDown, Sparkles, Loader2, ArrowRight, Package, Clock, Plus, Minus, Info, Shirt, User, Phone, MapPin, Truck, Gift, Map, Building, Banknote, Coins, DollarSign, Tag, ShoppingBag, X, FileText, Car } from "lucide-react";
import { useState, useContext, useRef, FormEvent, useEffect } from "react";
import { RoleContext } from "../App";
import { motion, AnimatePresence } from "motion/react";
import canvasLaundryBag from "../assets/images/bag_real_minimal_environment_1780510413096.png";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, updateDoc, setDoc, query, where } from "firebase/firestore";

const AnimatedTruck = () => (
  <div className="relative w-16 h-16 flex items-center justify-center mb-1">
    {/* Clean gradient background pulse */}
    <motion.div 
      className="absolute inset-0 bg-blue-50/60 rounded-full -z-10"
      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
    />
    
    {/* Micro motion speed lines behind truck */}
    <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 pt-1">
      <motion.div 
        className="w-4 h-1 bg-gradient-to-r from-blue-100 to-[#0f55d8]/40 rounded-full"
        animate={{ x: [0, -15], opacity: [0, 0.8, 0], scaleX: [0.6, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
      />
      <motion.div 
        className="w-3 h-[3px] bg-gradient-to-r from-blue-100 to-[#0f55d8]/30 rounded-full"
        animate={{ x: [3, -12], opacity: [0, 0.7, 0], scaleX: [0.5, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "easeOut", delay: 0.3 }}
      />
    </div>

    {/* Elegant Truck Icon with bobbing effect */}
    <motion.div
      animate={{ 
        y: [0, -2, 0, -1, 0],
        rotate: [0, 1, -1, 0]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 1.6, 
        ease: "easeInOut" 
      }}
    >
      <Truck className="w-8 h-8 text-[#0f55d8] filter drop-shadow-[0_2px_4px_rgba(15,85,216,0.15)]" />
    </motion.div>
  </div>
);

const AnimatedClock = () => (
  <div className="relative w-16 h-16 flex items-center justify-center mb-1">
    {/* Glowing spinning aura ring */}
    <motion.div 
      className="absolute inset-1 border border-dashed border-[#0f55d8]/20 rounded-full -z-10"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
    />
    
    <motion.div 
      className="absolute inset-0 bg-blue-50/60 rounded-full -z-10"
      animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.6, 0.4] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
    />

    {/* Beautifully rotating clock face representation */}
    <motion.div
      animate={{ 
        scale: [1, 1.04, 1],
        rotate: [0, 3, -3, 0]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 2.2, 
        ease: "easeInOut" 
      }}
      className="relative flex items-center justify-center"
    >
      <Clock className="w-8 h-8 text-[#0f55d8] filter drop-shadow-[0_2px_4px_rgba(15,85,216,0.15)]" />
    </motion.div>
  </div>
);

const AnimatedLocation = () => (
  <div className="relative w-16 h-16 flex items-center justify-center mb-1">
    {/* Glowing background pulsing aura */}
    <motion.div 
      className="absolute inset-0 bg-blue-50/70 rounded-full -z-10"
      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.8, 0.3] }}
      transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
    />

    {/* Location ripple rings underneath */}
    <motion.div 
      className="absolute bottom-2 w-8 h-2 bg-blue-500/10 rounded-full"
      animate={{ scale: [0.7, 1.5], opacity: [0.8, 0] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
    />

    {/* Elegant Pin bounce animation */}
    <motion.div
      animate={{ 
        y: [-3, 3, -3],
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 2.0, 
        ease: "easeInOut" 
      }}
    >
      <MapPin className="w-8 h-8 text-[#0f55d8] filter drop-shadow-[0_2.5px_5px_rgba(15,85,216,0.2)]" />
    </motion.div>
  </div>
);

const AnimatedMoney = () => (
  <div className="relative w-16 h-16 flex items-center justify-center mb-1">
    {/* Glowing background pulsing aura */}
    <motion.div 
      className="absolute inset-0 bg-emerald-50/80 rounded-full -z-10"
      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.8, 0.3] }}
      transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
    />

    {/* Floating tiny shiny sparkles */}
    <motion.div 
      className="absolute top-2 right-2 flex items-center justify-center"
      animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0], y: [0, -6] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
    >
      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
    </motion.div>

    <motion.div 
      className="absolute bottom-1 left-2 flex items-center justify-center"
      animate={{ scale: [0, 1, 0], opacity: [0, 0.9, 0], y: [0, -4] }}
      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut", delay: 0.6 }}
    >
      <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
    </motion.div>

    {/* Premium Banknote cash icon floating and tilting */}
    <motion.div
      animate={{ 
        y: [-2, 2, -2],
        rotate: [-3, 3, -3],
        scale: [1, 1.05, 1]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 2.4, 
        ease: "easeInOut" 
      }}
    >
      <Banknote className="w-8 h-8 text-emerald-600 filter drop-shadow-[0_2.5px_5px_rgba(16,185,129,0.2)]" />
    </motion.div>
  </div>
);

const drillVariants = {
  enter: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? 8 : -8,
    opacity: 0.85,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? -8 : 8,
    opacity: 0,
  }),
};

const drillTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.12,
};

const ROTATING_WORDS = ["haz más", "disfruta", "relájate", "descansa"];

const TypewriterTitle = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const delay = ROTATING_WORDS[index] === "haz más" ? 3500 : 1500; // "haz más" is prioritized for 3.5s, others for 1.5s
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, delay);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className="w-full text-center pt-8 pb-10 select-none" id="rotating-title-container">
      <h1 
        className="font-geist font-bold text-[#181818] text-[26px] sm:text-[30px] leading-none tracking-tight flex items-center justify-center w-full h-[40px]"
        style={{ fontFamily: '"Geist", sans-serif' }}
      >
        <span>Lava menos,</span>
        <span className="relative inline-flex h-[32px] sm:h-[40px] items-center overflow-hidden w-[126px] sm:w-[145px] text-left justify-start ml-1.5">
          <AnimatePresence initial={false}>
            <motion.span
              key={index}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className={`absolute left-0 text-[#0f55d8] whitespace-nowrap will-change-transform ${
                ROTATING_WORDS[index] === "haz más" ? "font-bold" : "font-medium"
              }`}
            >
              {ROTATING_WORDS[index]}
            </motion.span>
          </AnimatePresence>
        </span>
      </h1>
    </div>
  );
};

export default function Landing() {
  const { role } = useContext(RoleContext);
  const navigate = useNavigate();

  const [activeFeature, setActiveFeature] = useState(0);

  const [name, setName] = useState(() => localStorage.getItem("user_name") || "");
  const [phone, setPhone] = useState(() => localStorage.getItem("user_phone") || "");
  const [deliveryPreference, setDeliveryPreference] = useState(() => localStorage.getItem("user_delivery_preference") || "");
  
  const [addressColonia, setAddressColonia] = useState(() => localStorage.getItem("user_address_colonia") || "");
  const [addressCalle, setAddressCalle] = useState(() => localStorage.getItem("user_address_calle") || "");
  const [preferredTime, setPreferredTime] = useState(() => localStorage.getItem("user_preferred_time") || "");
  
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(() => localStorage.getItem("user_registered") === "true");
  const [isWaitlisted, setIsWaitlisted] = useState(() => localStorage.getItem("user_is_waitlisted") === "true");
  const [formStep, setFormStep] = useState<1 | 2 | "eligible_result" | "not_eligible_result">(1);

  useEffect(() => {
    localStorage.setItem("user_name", name);
    localStorage.setItem("user_phone", phone);
    localStorage.setItem("user_delivery_preference", deliveryPreference);
    localStorage.setItem("user_address_colonia", addressColonia);
    localStorage.setItem("user_address_calle", addressCalle);
    localStorage.setItem("user_preferred_time", preferredTime);
    localStorage.setItem("user_registered", registered ? "true" : "false");
    localStorage.setItem("user_is_waitlisted", isWaitlisted ? "true" : "false");
  }, [name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime, registered, isWaitlisted]);

  const [copied, setCopied] = useState(false);
  const [isNavigatingGPS, setIsNavigatingGPS] = useState(false);
  const [gpsLoadingStep, setGpsLoadingStep] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(17);

  const handleNavigationAndGPS = () => {
    const DEST_ADDRESS = "Paseo de las Palmas 209, Coatzacoalcos, Veracruz";

    if (!navigator.geolocation) {
      setGeoError("Tu dispositivo o navegador no soporta geolocalización directa.");
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEST_ADDRESS)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    setIsNavigatingGPS(true);
    setGpsLoadingStep("Solicitando acceso a tu ubicación...");
    setGeoError(null);

    // Small delay to make state transitions feel stable and natural
    setTimeout(() => {
      setGpsLoadingStep("Determinando la ubicación exacta...");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setGpsLoadingStep("Ubicación obtenida. Abriendo Google Maps...");
          
          setTimeout(() => {
            setIsNavigatingGPS(false);
            setGpsLoadingStep(null);
            // High precision route using real-time coordinates obtained from device
            const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${encodeURIComponent(DEST_ADDRESS)}`;
            window.open(url, "_blank", "noopener,noreferrer");
          }, 1000);
        },
        (error) => {
          setIsNavigatingGPS(false);
          setGpsLoadingStep(null);
          
          // Revert to reliable fallback
          const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DEST_ADDRESS)}`;
          window.open(url, "_blank", "noopener,noreferrer");

          if (error.code === error.PERMISSION_DENIED) {
            setGeoError("Permiso de ubicación denegado. Se abrió la ruta estándar hacia Paseo de las Palmas 209 en Google Maps.");
          } else {
            setGeoError("No se pudo obtener tu ubicación actual. Se abrió la ruta estándar hacia Paseo de las Palmas 209.");
          }
        },
        { 
          enableHighAccuracy: true, // Forces exact hardware GPS positioning
          timeout: 10000, 
          maximumAge: 0 // Disable cache for 100% real-time coordinates
        }
      );
    }, 600);
  };

  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationName, setSelectedLocationName] = useState<string>("Ubicación Palmas");
  
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [activeFormStep, setActiveFormStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [formError, setFormError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const isNameError = formError ? formError.toLowerCase().includes("nombre") : false;
  const isPhoneError = formError ? (
    formError.toLowerCase().includes("teléfono") || 
    formError.toLowerCase().includes("caracteres") || 
    formError.toLowerCase().includes("letras")
  ) : false;
  const isCalleError = formError ? formError.toLowerCase().includes("calle") : false;
  const isColoniaError = formError ? formError.toLowerCase().includes("colonia") : false;

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const formRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const calleInputRef = useRef<HTMLInputElement>(null);
  const coloniaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = 0;
    }
  }, [activeFormStep]);

  useEffect(() => {
    if (isBottomSheetOpen) {
      const timer = setTimeout(() => {
        if (viewportRef.current) {
          viewportRef.current.scrollLeft = 0;
        }
        if (activeFormStep === 1) {
          nameInputRef.current?.focus();
        } else if (activeFormStep === 2) {
          calleInputRef.current?.focus();
        }
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [activeFormStep, isBottomSheetOpen]);
  
  useEffect(() => {
    getDocs(collection(db, "locations"))
      .then(snap => {
        const list: any[] = [];
        snap.forEach(d => {
          const data = d.data();
          if (data.isActive === 1 || data.isActive === true) {
            list.push(data);
          }
        });
        if (list.length === 0) throw new Error("No active locations in DB");
        setLocations(list);
        setSelectedLocationName(list[0].name);
      })
      .catch((err) => {
        console.warn("Using offline fallback for locations:", err);
        const mockLocations = [{ id: "loc_1", name: "Ubicación Palmas", address: "Paseo de las Palmas 209, Coatzacoalcos, Veracruz", isActive: 1, latitude: 18.1404, longitude: -94.4632 }];
        setLocations(mockLocations);
        setSelectedLocationName(mockLocations[0].name);
      });
  }, []);

  const openBottomSheet = () => {
    setIsBottomSheetOpen(true);
    setRegistered(false);
    setFormStep(1);
    setActiveFormStep(1);
    setDirection("forward");
    setFormError(null);
  };

  const handlePhoneBlur = async () => {
    if (!phone || phone.length < 5) return;
    try {
      const q = query(collection(db, "users"), where("phone", "==", phone.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        if (data.name) setName(data.name);
        if (data.deliveryPreference) setDeliveryPreference(data.deliveryPreference);
        if (data.addressColonia) setAddressColonia(data.addressColonia);
        if (data.addressCalle) setAddressCalle(data.addressCalle);
        if (data.preferredTime) setPreferredTime(data.preferredTime);
      } else {
        throw new Error("Phone not found in DB");
      }
    } catch(e) {
      // Offline fallback: try reading from localStorage of simulated user database
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        const user = savedUsers[phone];
        if (user) {
          if (user.name) setName(user.name);
          if (user.deliveryPreference) setDeliveryPreference(user.deliveryPreference);
          if (user.addressColonia) setAddressColonia(user.addressColonia);
          if (user.addressCalle) setAddressCalle(user.addressCalle);
          if (user.preferredTime) setPreferredTime(user.preferredTime);
        }
      } catch (err) {}
    }
  };

  const goToStep2 = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedPhone = phone.trim();
    if (!name.trim()) {
      setFormError("Por favor ingresa tu nombre completo.");
      triggerShake();
      nameInputRef.current?.focus();
      return;
    }
    
    if (!trimmedPhone) {
      setFormError("Por favor ingresa tu teléfono.");
      triggerShake();
      phoneInputRef.current?.focus();
      return;
    }

    if (trimmedPhone.length !== 10) {
      setFormError("El número de teléfono debe tener exactamente 10 caracteres.");
      triggerShake();
      phoneInputRef.current?.focus();
      return;
    }

    if (/[a-zA-Z]/i.test(trimmedPhone)) {
      setFormError("El número de teléfono no puede contener letras.");
      triggerShake();
      phoneInputRef.current?.focus();
      return;
    }

    setDirection("forward");
    setActiveFormStep(2);
  };

  const dbPreregister = async () => {
    const usersQuery = query(collection(db, "users"), where("phone", "==", phone.trim()));
    const usersSnap = await getDocs(usersQuery);
    let userId;

    if (!usersSnap.empty) {
      const docSnap = usersSnap.docs[0];
      userId = docSnap.id;
      const existingUser = docSnap.data();

      const pref = deliveryPreference !== undefined ? deliveryPreference : (existingUser.deliveryPreference || "");
      const col = addressColonia !== undefined ? addressColonia : (existingUser.addressColonia || null);
      const calle = addressCalle !== undefined ? addressCalle : (existingUser.addressCalle || null);
      const prefTime = preferredTime !== undefined ? preferredTime : (existingUser.preferredTime || "");

      await updateDoc(doc(db, "users", userId), {
        name,
        deliveryPreference: pref,
        addressColonia: col,
        addressCalle: calle,
        preferredTime: prefTime
      });
    } else {
      userId = "USR-" + Math.random().toString(36).substr(2, 9);
      const pref = deliveryPreference !== undefined ? deliveryPreference : "";
      const prefTime = preferredTime || "";

      await setDoc(doc(db, "users", userId), {
        id: userId,
        name,
        phone: phone.trim(),
        deliveryPreference: pref,
        addressColonia: addressColonia || null,
        addressCalle: addressCalle || null,
        addressNumero: "",
        preferredTime: prefTime,
        addressReferences: "",
        credits: 0.0,
        createdAt: new Date().toISOString()
      });
    }
    return { success: true, userId };
  };

  const submitStep2AndVerify = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Guard: Validate Step 1 fields
    const trimmedPhone = phone.trim();
    if (!name.trim()) {
      setFormError("Por favor ingresa tu nombre en el paso 1.");
      triggerShake();
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => nameInputRef.current?.focus(), 150);
      return;
    }
    if (!trimmedPhone) {
      setFormError("Por favor ingresa tu teléfono en el paso 1.");
      triggerShake();
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
      return;
    }
    if (trimmedPhone.length !== 10) {
      setFormError("El número de teléfono debe tener exactamente 10 caracteres.");
      triggerShake();
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
      return;
    }
    if (/[a-zA-Z]/i.test(trimmedPhone)) {
      setFormError("El número de teléfono no puede contener letras.");
      triggerShake();
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
      return;
    }

    // Guard: Validate Step 2 fields
    if (!addressCalle.trim()) {
      setFormError("Por favor ingresa tu calle y número.");
      triggerShake();
      calleInputRef.current?.focus();
      return;
    }
    if (!addressColonia.trim()) {
      setFormError("Por favor ingresa tu colonia.");
      triggerShake();
      coloniaInputRef.current?.focus();
      return;
    }

    setLoading(true);
    const eligible = addressColonia.toLowerCase().includes("palmas");

    try {
      await dbPreregister();

      // Save simulated user details locally for subsequent loads
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      if (eligible) {
        setIsWaitlisted(false);
        setDirection("forward");
        setRegistered(true);
      } else {
        setDirection("forward");
        setFormStep("not_eligible_result");
      }
    } catch (err: any) {
      console.warn("API preregister failed, falling back to seamless client-side experience:", err);
      // Seamless LocalStorage Fallback!
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      if (eligible) {
        setIsWaitlisted(false);
        setDirection("forward");
        setRegistered(true);
      } else {
        setDirection("forward");
        setFormStep("not_eligible_result");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !phone.trim() || !addressCalle.trim() || !addressColonia.trim()) {
      setFormError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    const eligible = addressColonia.toLowerCase().includes("palmas");

    try {
      await dbPreregister();
      setFormStep(eligible ? 2 : "not_eligible_result");
    } catch (err: any) {
      // Offline fallback
      setFormStep(eligible ? 2 : "not_eligible_result");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEligible = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    // Validate Step 1
    if (!name.trim()) {
      setFormError("Por favor ingresa tu nombre en el paso 1.");
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => nameInputRef.current?.focus(), 150);
      return;
    }
    if (!phone.trim()) {
      setFormError("Por favor ingresa tu teléfono en el paso 1.");
      setDirection("backward");
      setActiveFormStep(1);
      setTimeout(() => phoneInputRef.current?.focus(), 150);
      return;
    }

    // Validate Step 2
    if (!addressCalle.trim() || !addressColonia.trim()) {
      setFormError("Por favor ingresa tu dirección en el paso 2.");
      setDirection("backward");
      setActiveFormStep(2);
      setTimeout(() => {
        if (!addressCalle.trim()) calleInputRef.current?.focus();
        else coloniaInputRef.current?.focus();
      }, 150);
      return;
    }

    setLoading(true);
    try {
      await dbPreregister();

      // Save simulated user details locally for subsequent loads
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(false);
      setDirection("forward");
      setRegistered(true);
    } catch (err: any) {
      console.warn("Offline confirmation fallback:", err);
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(false);
      setDirection("forward");
      setRegistered(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWaitlist = async () => {
    setFormError(null);
    setLoading(true);
    try {
      await dbPreregister();

      // Save simulated user details locally for subsequent loads
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(true);
      setDirection("forward");
      setRegistered(true);
    } catch (err: any) {
      console.warn("Offline waitlist confirmation fallback:", err);
      try {
        const savedUsers = JSON.parse(localStorage.getItem("simulated_users") || "{}");
        savedUsers[phone] = { name, phone, deliveryPreference, addressColonia, addressCalle, preferredTime };
        localStorage.setItem("simulated_users", JSON.stringify(savedUsers));
      } catch(e) {}

      setIsWaitlisted(true);
      setDirection("forward");
      setRegistered(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-[#f6eedd]">
      {/* Hero Section */}
      <section className="relative w-full px-0 pt-4 pb-12 flex flex-col items-start text-left justify-center snap-start snap-always" style={{ scrollSnapAlign: 'start', height: '100vh' }}>

        <div className="relative z-10 w-full max-w-sm mx-auto pt-0">

          <TypewriterTitle />

          {/* Tarjeta Unica de Pasos */}
          <div className="w-full bg-[#FAF9F6] border border-[#EBE6DB] rounded-none pt-3.5 pb-3.5 pl-2.5 pr-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] mt-10 text-left relative overflow-hidden">
            <div className="flex flex-col">
              {/* Item 1 */}
              <div className="flex items-start gap-3 pb-3">
                <span className="font-inter font-semibold text-[18px] text-black shrink-0 w-9 h-9 flex items-center justify-center select-none" style={{ fontFamily: '"Inter", sans-serif' }}>1</span>
                <div className="space-y-0.5 pt-1.5">
                  <h4 className="font-geist font-semibold text-[#181818] text-[16px] sm:text-[17px] leading-tight" style={{ fontFamily: '"Geist", sans-serif' }}>
                    Pide tu cesto gratis
                  </h4>
                  <p className="font-geist text-[#6A6A6A] text-[14px] sm:text-[15px] font-medium leading-snug" style={{ fontFamily: '"Geist", sans-serif' }}>
                    Recíbelo en casa
                  </p>
                </div>
              </div>

               {/* Item 2 */}
              <div className="w-full flex flex-col">
                {/* Separador 1 */}
                <div className="border-t border-[#EDE9E0] w-full" />

                <div className="flex items-start gap-3 py-3">
                  <span className="font-inter font-semibold text-[18px] text-black shrink-0 w-9 h-9 flex items-center justify-center select-none" style={{ fontFamily: '"Inter", sans-serif' }}>2</span>
                  <div className="space-y-0.5 pt-1.5">
                    <h4 className="font-geist font-semibold text-[#181818] text-[16px] sm:text-[17px] leading-tight" style={{ fontFamily: '"Geist", sans-serif' }}>
                      Llénalo a tu ritmo
                    </h4>
                    <p className="font-geist text-[#6A6A6A] text-[14px] sm:text-[15px] font-medium leading-snug" style={{ fontFamily: '"Geist", sans-serif' }}>
                      Toda la ropa que quepa por $90
                    </p>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="w-full flex flex-col">
                {/* Separador 2 */}
                <div className="border-t border-[#EDE9E0] w-full" />

                <div className="flex items-start gap-3 pt-3">
                  <span className="font-inter font-semibold text-[18px] text-black shrink-0 w-9 h-9 flex items-center justify-center select-none" style={{ fontFamily: '"Inter", sans-serif' }}>3</span>
                  <div className="space-y-0.5 pt-1.5">
                    <h4 className="font-geist font-semibold text-[#181818] text-[16px] sm:text-[17px] leading-tight" style={{ fontFamily: '"Geist", sans-serif' }}>
                      Déjalo en el punto de recolección
                    </h4>
                    <p className="font-geist text-[#6A6A6A] text-[14px] sm:text-[15px] font-medium leading-snug" style={{ fontFamily: '"Geist", sans-serif' }}>
                      Nuevo punto en palmas{' '}
                      <span 
                         onClick={(e) => {
                           e.stopPropagation();
                           document.getElementById('editorial-location-section')?.scrollIntoView({ behavior: 'smooth' });
                         }} 
                        className="text-black hover:text-slate-700 underline cursor-pointer font-semibold inline-flex items-center gap-0.5"
                      >
                        ver ubicación
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical dashed connector line connecting the steps card to the reward card - aligned with left steps */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.5, duration: 0.30, ease: "easeOut" }}
            className="relative select-none pointer-events-none w-full h-[56px] my-0" 
            id="flow-connector-bridge"
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 56 }}
              transition={{ duration: 1.2, delay: 4.5, ease: "easeInOut" }}
              style={{ transformOrigin: "top" }}
              className="absolute inset-0 overflow-hidden"
            >
              <svg className="absolute left-[28px] w-4 h-[56px] -translate-x-1/2 overflow-visible" style={{ top: '0px', bottom: '0px' }}>
                <motion.line
                  x1="8"
                  y1="0"
                  x2="8"
                  y2="56"
                  stroke="#0f55d8"
                  strokeWidth="3"
                  strokeDasharray="7 5"
                  animate={{ strokeDashoffset: [0, -12] }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                />
              </svg>
            </motion.div>
          </motion.div>

          {/* Moved card (Te llevamos tu ropa) directly where the icon was physically stationed in the chain */}
          <motion.div 
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 5.8, duration: 0.30, ease: "easeOut" }}
            style={{ transform: "translate3d(0,0,0)", backfaceVisibility: "hidden" }}
            className="w-full bg-[#FAF9F6] border border-[#EBE6DB] rounded-none pt-3.5 pb-3.5 pl-2.5 pr-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] mb-6 text-left flex items-start gap-3 select-none transform-gpu" 
            id="flow-reward-banner"
          >
            <div 
              className="shrink-0 w-9 h-9 text-[#0f55d8] bg-blue-50/70 rounded-full flex items-center justify-center transform-gpu" 
              style={{ transform: "translate3d(0,0,0)", backfaceVisibility: "hidden" }}
              id="flow-reward-icon-container"
            >
              <Truck className="w-5 h-5" strokeWidth={2.1} />
            </div>
            <div className="flex flex-col text-left space-y-0.5 pt-1.5">
              <p className="font-geist font-semibold text-[#0f55d8] text-[16px] sm:text-[17px] leading-tight" style={{ fontFamily: '"Geist", sans-serif' }}>
                Tu ropa limpia de vuelta en casa
              </p>
              <p className="font-geist text-[#6A6A6A] font-medium text-[14px] sm:text-[15px] leading-snug" style={{ fontFamily: '"Geist", sans-serif' }}>
                Al siguiente día sin costo extra
              </p>
            </div>
          </motion.div>

          <div className="pt-4 px-4 sm:px-0">
            <button 
              onClick={openBottomSheet}
              className="w-full py-4 bg-[#0f55d8] hover:bg-[#0d4bc0] active:scale-[0.98] text-white rounded-2xl font-bold text-lg font-geist transition-all flex items-center justify-center gap-2 select-none shadow-[0_5px_20px_rgba(15,85,216,0.18)] cursor-pointer disabled:opacity-85 group"
              style={{ fontFamily: '"Geist", sans-serif' }}
            >
              <div className="flex items-center space-x-2">
                <span>Quiero mi cesto gratis</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </section>



      {/* Sección Exclusiva: El cesto SOMOS */}
      <section className="w-full pt-16 pb-12 flex flex-col justify-center bg-transparent snap-start snap-always" id="conoce-tu-cesto-section" style={{ scrollSnapAlign: 'start', height: '100vh' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-sm mx-auto pt-0 font-sans"
        >
          {/* Título de la sección */}
          <div className="w-full">
            <h2 className="text-center text-[23px] sm:text-[27px] font-semibold tracking-tight text-gray-800  leading-tight px-4">
              De tu hogar a cada entrega
            </h2>
            <p className="text-center text-[16px] sm:text-[18px] text-[#6A6A6A] mt-3.5 font-medium px-4">
              Recibe y entrega tu ropa fácilmente
            </p>
          </div>

          {/* Cesto grande centrado en ambiente real minimal */}
          <div className="px-4 sm:px-0 mt-4">
            <div className="relative w-full h-[310px] select-none overflow-hidden rounded-[32px] border border-slate-200/55 shadow-[0_10px_35px_rgba(0,0,0,0.04)] bg-slate-50/20">
              <img 
                src={canvasLaundryBag} 
                alt="Cesto de lona premium SOMOS en ambiente real minimal" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-[center_55%]"
              />
            </div>
          </div>

          {/* Tarjeta unificada de características (idéntica a la imagen, sin redondeado, mismo ancho que pasos) */}
          <div className="w-full bg-[#FAF9F6] border border-[#EBE6DB] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] mt-5 text-left overflow-hidden">
            <div className="flex flex-col">
              
              {/* Item 1 */}
              <div 
                className={`flex flex-col overflow-hidden transition-all duration-300 cursor-pointer px-4 py-2.5 border-b border-[#EBE6DB] ${activeFeature === 0 ? 'bg-white' : 'bg-transparent hover:bg-[#F2EDDF]/40'}`}
                onClick={() => setActiveFeature(0)}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                    <Tag className={`w-5 h-5 transition-colors ${activeFeature === 0 ? 'text-[#181818]' : 'text-[#6A6A6A]'}`} strokeWidth={2} />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center w-full min-h-[28px]">
                      <h4 className={`font-geist font-semibold ${activeFeature === 0 ? 'text-[#181818] text-[16px] sm:text-[17px]' : 'text-[#6A6A6A] text-[15px] sm:text-[16px]'} transition-colors leading-tight`} style={{ fontFamily: '"Geist", sans-serif' }}>
                        Sin costo
                      </h4>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 shrink-0 ${activeFeature === 0 ? 'rotate-180 text-[#181818]' : 'text-[#A0A0A0]'}`} />
                    </div>
                    <AnimatePresence>
                      {activeFeature === 0 && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="font-geist text-[#6A6A6A] text-[14px] sm:text-[15px] font-medium leading-snug mt-0.5 mb-1" style={{ fontFamily: '"Geist", sans-serif' }}>
                            Incluido con nuestro servicio
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div 
                className={`flex flex-col overflow-hidden transition-all duration-300 cursor-pointer px-4 py-2.5 border-b border-[#EBE6DB] ${activeFeature === 1 ? 'bg-white' : 'bg-transparent hover:bg-[#F2EDDF]/40'}`}
                onClick={() => setActiveFeature(1)}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                    <ShoppingBag className={`w-5 h-5 transition-colors ${activeFeature === 1 ? 'text-[#181818]' : 'text-[#6A6A6A]'}`} strokeWidth={2} />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center w-full min-h-[28px]">
                      <h4 className={`font-geist font-semibold ${activeFeature === 1 ? 'text-[#181818] text-[16px] sm:text-[17px]' : 'text-[#6A6A6A] text-[15px] sm:text-[16px]'} transition-colors leading-tight`} style={{ fontFamily: '"Geist", sans-serif' }}>
                        Fácil de transportar
                      </h4>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 shrink-0 ${activeFeature === 1 ? 'rotate-180 text-[#181818]' : 'text-[#A0A0A0]'}`} />
                    </div>
                    <AnimatePresence>
                      {activeFeature === 1 && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="font-geist text-[#6A6A6A] text-[14px] sm:text-[15px] font-medium leading-snug mt-0.5 mb-1" style={{ fontFamily: '"Geist", sans-serif' }}>
                            Asas para moverlo con comodidad.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div 
                className={`flex flex-col overflow-hidden transition-all duration-300 cursor-pointer px-4 py-2.5 ${activeFeature === 2 ? 'bg-white' : 'bg-transparent hover:bg-[#F2EDDF]/40'}`}
                onClick={() => setActiveFeature(2)}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                    <div className={`relative w-4 h-4 flex items-center justify-center transition-colors ${activeFeature === 2 ? 'text-[#181818]' : 'text-[#6A6A6A]'}`}>
                      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-current rounded-tl-[1px]" />
                      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-current rounded-tr-[1px]" />
                      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-current rounded-bl-[1px]" />
                      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-current rounded-br-[1px]" />
                      <QrCode className="w-2.5 h-2.5" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center w-full min-h-[28px]">
                      <h4 className={`font-geist font-semibold ${activeFeature === 2 ? 'text-[#181818] text-[16px] sm:text-[17px]' : 'text-[#6A6A6A] text-[15px] sm:text-[16px]'} transition-colors leading-tight`} style={{ fontFamily: '"Geist", sans-serif' }}>
                        Vinculado a tu cuenta
                      </h4>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 shrink-0 ${activeFeature === 2 ? 'rotate-180 text-[#181818]' : 'text-[#A0A0A0]'}`} />
                    </div>
                    <AnimatePresence>
                      {activeFeature === 2 && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="font-geist text-[#6A6A6A] text-[14px] sm:text-[15px] font-medium leading-snug mt-0.5 mb-1" style={{ fontFamily: '"Geist", sans-serif' }}>
                            Recibimos tu ropa al instante
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Nueva Sección: Ubicación Dinámica Interactiva sin Clave de API */}
      <section className="w-full px-0 pt-16 flex flex-col justify-center pb-10 bg-[#f6eedd] snap-start snap-always" id="editorial-location-section" style={{ scrollSnapAlign: 'start', height: '100vh' }}>
        <div className="w-full max-w-sm mx-auto space-y-4 text-left">
          
          {/* Header directly in the layout, extremely bold and crisp */}
          <div id="location-editorial-head" className="w-full">
            <h2 className="text-center text-[23px] sm:text-[27px] font-semibold tracking-tight text-gray-800 leading-tight px-4">
              Punto de recolección palmas
            </h2>
            <p className="text-center text-[16px] sm:text-[18px] text-slate-500 mt-3.5 font-medium leading-relaxed tracking-tight px-4">
              Paseo de las Palmas 209, Las Palmas
            </p>
          </div>



          {/* Premium Map Frame with elegant border radii */}
          <div className="px-4 sm:px-0">
            <div className="relative w-full h-[260px] border border-slate-200/55 rounded-[32px] overflow-hidden bg-slate-100 shadow-sm" id="location-dynamic-map-frame-container">
              <iframe
                src={`https://maps.google.com/maps?q=Paseo%20de%20las%20Palmas%20209,%20Coatzacoalcos,%20Veracruz&t=m&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`}
                style={{
                  width: 'calc(100% + 300px)',
                  height: 'calc(100% + 300px)',
                  top: '-150px',
                  left: '-150px'
                }}
                className="absolute border-0 select-all pointer-events-none"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Interactive Location Map"
              ></iframe>

              {/* Controles de Zoom Personalizados con pointer-events-auto */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
                <button
                  type="button"
                  onClick={() => setMapZoom(prev => Math.min(prev + 1, 20))}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur border border-slate-200/80 shadow-md flex items-center justify-center text-slate-800 hover:bg-slate-50 active:scale-95 transition-all pointer-events-auto"
                  title="Acercar"
                >
                  <Plus className="w-5 h-5 text-slate-700" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setMapZoom(prev => Math.max(prev - 1, 10))}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur border border-slate-200/80 shadow-md flex items-center justify-center text-slate-800 hover:bg-slate-50 active:scale-95 transition-all pointer-events-auto"
                  title="Alejar"
                >
                  <Minus className="w-5 h-5 text-slate-700" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Polished Horarios de Atención Card styled to match steps card exactly in width and look */}
          <div className="w-full bg-[#FAF9F6] border border-[#EBE6DB] rounded-none shadow-[0_4px_24px_rgba(0,0,0,0.02)] pt-3.5 pb-3.5 pl-2.5 pr-2.5" id="hours-grid-card">
            
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-[38px] h-[38px] flex items-center justify-center">
                <Clock className="w-[21px] h-[21px] text-black" strokeWidth={2} />
              </div>
              
              <div className="space-y-1.5 flex-1 text-left">
                <h4 className="font-geist font-semibold text-[#181818] text-[16px] sm:text-[17px] leading-tight" style={{ fontFamily: '"Geist", sans-serif' }}>
                  Horarios de Atención
                </h4>

                {/* 3 columns specifications split - left aligned */}
                <div className="grid grid-cols-3 text-left pt-0.5 bg-transparent w-full">
                  <div className="border-r border-[#EDE9E0] pr-1">
                    <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-geist" style={{ fontFamily: '"Geist", sans-serif' }}>Lun-Vie</span>
                    <span className="block text-[11.5px] sm:text-[12.5px] font-bold text-[#0F233C] leading-snug whitespace-nowrap font-geist" style={{ fontFamily: '"Geist", sans-serif' }}>8 AM - 8 PM</span>
                  </div>
                  <div className="border-r border-[#EDE9E0] px-1">
                    <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-geist" style={{ fontFamily: '"Geist", sans-serif' }}>Sáb</span>
                    <span className="block text-[11.5px] sm:text-[12.5px] font-bold text-[#0F233C] leading-snug whitespace-nowrap font-geist" style={{ fontFamily: '"Geist", sans-serif' }}>9 AM - 6 PM</span>
                  </div>
                  <div className="pl-1">
                    <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-geist" style={{ fontFamily: '"Geist", sans-serif' }}>Dom</span>
                    <span className="block text-[11.5px] sm:text-[12.5px] font-bold text-[#0F233C] leading-snug whitespace-nowrap font-geist" style={{ fontFamily: '"Geist", sans-serif' }}>Cerrado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Route CTA helper */}
          <div className="space-y-2 pt-1 px-4 sm:px-0">
            <button 
              type="button"
              onClick={handleNavigationAndGPS}
              disabled={isNavigatingGPS}
              className="w-full py-4 bg-[#0f55d8] hover:bg-[#0d4bc0] active:scale-[0.98] text-white rounded-2xl font-bold text-lg font-geist transition-all flex items-center justify-center gap-2 select-none shadow-[0_5px_20px_rgba(15,85,216,0.18)] cursor-pointer disabled:opacity-85"
              style={{ fontFamily: '"Geist", sans-serif' }}
              id="location-cta-navigation-button"
            >
              {isNavigatingGPS ? (
                <span>Conectando...</span>
              ) : (
                <span>¿Cómo llegar?</span>
              )}
            </button>

            {isNavigatingGPS && gpsLoadingStep && (
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl text-center text-[12px] text-[#0f55d8] font-bold animate-pulse flex items-center justify-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-[#0f55d8]" />
                <span>{gpsLoadingStep}</span>
              </div>
            )}

            {geoError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-left text-[11.5px] text-rose-600 font-semibold leading-relaxed" id="gps-status-error">
                ⚠️ {geoError}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Bottom Sheet sliding panel modal */}
      <AnimatePresence>
        {isBottomSheetOpen && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none"
          >
            {/* Backdrop with elegant, lightweight opacity fade and static blur */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={() => setIsBottomSheetOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[1px] cursor-pointer pointer-events-auto"
            />

            {/* Sliding sheet container with buttery smooth premium decelerating curve */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
              className="bottom-sheet-contents relative bg-white w-full max-w-sm h-[390px] rounded-t-[28px] shadow-2xl overflow-hidden flex flex-col pointer-events-auto z-10 mx-auto transform-gpu will-change-transform"
              style={{ maxHeight: "88vh" }}
            >
            {/* Close Button X on top-right */}
            <button
              onClick={() => setIsBottomSheetOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-50 transition-colors rounded-full pointer-events-auto z-20"
            >
              <X className="w-4 h-4" />
            </button>


            {formError && (
              <div className="mx-5 mt-2.5 p-2 bg-red-50 border border-red-100 text-red-650 rounded-xl text-[11px] font-bold flex items-center gap-2 select-none shrink-0">
                <Info className="w-4.5 h-4.5 text-red-500 shrink-0" />
                <span className="leading-tight">{formError}</span>
              </div>
            )}

            {/* Form Inner Content Scroller with static height */}
            <div className="flex-1 overflow-hidden min-h-0 relative">
              <AnimatePresence mode="wait" initial={false}>
                {registered ? (
                  <motion.div 
                    key="step-registered"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-center flex flex-col items-center justify-center h-full w-full p-5 pb-6"
                  >
                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 mt-1">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                      ¡Listo, {name.split(' ')[0]}!
                    </h2>

                    {isWaitlisted ? (
                      <>
                        <p className="text-gray-550 text-xs leading-relaxed mb-5">
                          Hemos asignado y reservado tu cesto premium gratis. Aunque no contamos con reparto a domicilio en tu zona, te esperamos en nuestro mostrador para recibir y entregar tu ropa limpia.
                        </p>

                        {/* simulated coupon notches */}
                        <div className="w-full border-t border-dashed border-gray-200 my-2 relative">
                          <div className="absolute -left-[30px] -top-1.5 w-3 h-3 rounded-full bg-white border-r border-[#ebecef]"></div>
                          <div className="absolute -right-[30px] -top-1.5 w-3 h-3 rounded-full bg-white border-l border-[#ebecef]"></div>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl w-full text-left space-y-1.5 mt-2">
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                              Punto de Entrega y Recepción
                            </p>
                            <p className="font-extrabold text-gray-800 text-xs">
                              {selectedLocationName || 'Ubicación Palmas (Mostrador)'}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                              Tu colonia ({addressColonia}) queda fuera de reparto, ¡pero tu cesto te espera en mostrador!
                            </p>
                          </div>
                          
                          <div className="border-t border-slate-150 pt-1.5 flex justify-between items-center text-[10px]">
                            <span className="text-slate-500 font-semibold">Pre-registro:</span>
                            <span className="bg-[#EBECEF] text-slate-800 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">Activo — Mostrador</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsBottomSheetOpen(false)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all mt-4 select-none active:scale-[0.98]"
                        >
                          Entendido, ¡gracias!
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500 text-xs leading-relaxed mb-5">
                          Hemos asignado y guardado un cesto premium exclusivo a tu número. Tu ropa limpia llegará directo a tu puerta en <span className="font-bold text-gray-800">{addressColonia}</span>.
                        </p>

                        {/* simulated coupon notches */}
                        <div className="w-full border-t border-dashed border-gray-200 my-2 relative">
                          <div className="absolute -left-[30px] -top-1.5 w-3 h-3 rounded-full bg-white border-r border-[#ebecef]"></div>
                          <div className="absolute -right-[30px] -top-1.5 w-3 h-3 rounded-full bg-white border-l border-[#ebecef]"></div>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl w-full text-left space-y-1.5 mt-2">
                           <div>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                               Dirección Registrada
                             </p>
                             <p className="font-extrabold text-gray-800 text-xs text-slate-800">
                               {addressCalle}, {addressColonia}
                             </p>
                           </div>
                           
                           <div className="border-t border-slate-150 pt-1.5 flex justify-between items-center text-[10px]">
                             <span className="text-slate-500 font-semibold">Pre-registro:</span>
                             <span className="bg-[#EBECEF] text-slate-800 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">Activo</span>
                           </div>
                         </div>

                         <button
                           type="button"
                           onClick={() => setIsBottomSheetOpen(false)}
                           className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all mt-4 select-none active:scale-[0.98]"
                         >
                           Listo, ¡muchas gracias!
                         </button>
                       </>
                     )}
                   </motion.div>
                ) : formStep === "not_eligible_result" ? (
                  <motion.div 
                    key="step-not-eligible"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-center flex flex-col items-center justify-center h-full w-full p-5 pb-6"
                  >
                    <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 mt-1 shadow-sm shrink-0">
                      <MapPin className="w-6 h-6 text-blue-500" />
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2 leading-tight">
                      ¡Recoge gratis en sucursal!
                    </h2>
                    
                    <p className="text-gray-550 text-xs leading-relaxed mb-5 max-w-sm">
                      Por ahora no contamos con entregas a domicilio en tu zona, pero aún puedes pedir tu cesto gratis y manejar tus prendas directamente en nuestro mostrador.
                    </p>

                    <button
                      type="button"
                      onClick={handleConfirmWaitlist}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-[#0f55d8] hover:bg-[#0d4bc0] text-white font-extrabold text-sm font-geist transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-[#0f55d8]/10 pointer-events-auto shadow-lg shadow-[#0f55d8]/20"
                      style={{ fontFamily: '"Geist", sans-serif' }}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                          <span>Pedir mi cesto gratis</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setDirection("backward"); setFormStep(1); setActiveFormStep(2); setTimeout(() => { coloniaInputRef.current?.focus(); }, 40); }}
                      className="text-gray-400 hover:text-gray-650 text-xs font-semibold mt-3.5 font-geist transition-colors text-center pointer-events-auto w-full block"
                      style={{ fontFamily: '"Geist", sans-serif' }}
                    >
                      Probar con otra dirección
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="active-steps-slider"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-full h-full overflow-hidden relative flex flex-col p-5 pb-6"
                  >
                    {/* Elegant Segmented Progress Indicator */}
                    <div className="flex gap-2 shrink-0 justify-center mb-1">
                      {[1, 2].map((step) => {
                        const isActive = step <= activeFormStep;
                        return (
                          <button 
                            key={step}
                            type="button"
                            onClick={() => {
                              setFormError(null);
                              setDirection(step > activeFormStep ? "forward" : "backward");
                              setActiveFormStep(step as 1 | 2);
                              setTimeout(() => {
                                if (step === 1) {
                                  nameInputRef.current?.focus();
                                } else if (step === 2) {
                                  calleInputRef.current?.focus();
                                }
                              }, 40);
                            }}
                            className="h-5 flex-1 relative group focus:outline-none pointer-events-auto"
                            title={`Ir al Paso ${step}`}
                          >
                            <div className="h-1.5 w-full bg-slate-105 rounded-full overflow-hidden transition-all duration-300 group-hover:bg-slate-200">
                              <motion.div
                                 className="h-full bg-[#0f55d8] rounded-full"
                                initial={{ width: isActive ? "100%" : "0%" }}
                                animate={{ width: isActive ? "100%" : "0%" }}
                                transition={{ duration: step === 1 ? 0 : 0.35, ease: "easeInOut" }}
                              />
                            </div>
                            <span className="sr-only">Paso {step}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Static Title/Subtitle block (does not slide) */}
                    <div className="pt-2 pb-1 shrink-0 select-none">
                      <h2 className="text-[19px] font-semibold text-slate-800 tracking-tight leading-snug">
                        {activeFormStep === 1 && "Tu cesto SOMOS te espera"}
                        {activeFormStep === 2 && "Tu dirección de entrega"}
                      </h2>
                      <p className="text-gray-550 text-xs mt-0.5 font-medium">
                        {activeFormStep === 1 && "Pedirla toma menos de un minuto."}
                        {activeFormStep === 2 && "¿A dónde te llevamos tu cesto?"}
                      </p>
                    </div>

                    {/* Slider viewport */}
                    <div className="flex-1 relative mt-3 overflow-hidden min-h-0">
                      <AnimatePresence mode="wait" initial={false}>
                        {activeFormStep === 1 ? (
                          <motion.div
                            key="step-form-1"
                            initial={{ x: direction === "forward" ? "10%" : "-10%", opacity: 0 }}
                            animate={{ x: "0%", opacity: 1 }}
                            exit={{ x: direction === "forward" ? "-10%" : "10%", opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="w-full h-full flex flex-col justify-between select-none"
                          >
                            <form onSubmit={goToStep2} className="space-y-3 h-full flex flex-col justify-between">
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-0.5">Nombre Completo</label>
                                  <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      ref={nameInputRef}
                                      type="text"
                                      required
                                      autoComplete="name"
                                      value={name}
                                      onChange={(e) => { setName(e.target.value); setFormError(null); }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          phoneInputRef.current?.focus();
                                        }
                                      }}
                                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white rounded-xl transition-all outline-none font-semibold text-base focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                                      placeholder=""
                                    />
                                  </div>
                                </div>
           
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-0.5">Teléfono (WhatsApp)</label>
                                  <div className={`relative ${isShaking ? "animate-shake" : ""}`}>
                                    <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isPhoneError ? "text-red-500" : "text-slate-400"}`} />
                                    <input
                                      ref={phoneInputRef}
                                      type="tel"
                                      required
                                      autoComplete="tel"
                                      value={phone}
                                      onChange={(e) => { setPhone(e.target.value); setFormError(null); }}
                                      onBlur={handlePhoneBlur}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          goToStep2(e);
                                        }
                                      }}
                                      className={`w-full pl-9 pr-4 py-2 rounded-xl transition-all outline-none font-semibold text-base focus:ring-2 ${
                                        isPhoneError
                                          ? "bg-red-50/30 border border-red-300 text-red-900 focus:border-red-500 focus:ring-red-100"
                                          : "bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white focus:ring-blue-100 placeholder:text-slate-400"
                                      }`}
                                      placeholder=""
                                    />
                                  </div>
                                </div>
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2.5 rounded-xl bg-[#0f55d8] hover:bg-[#0d4bc0] text-white font-extrabold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-md shadow-[#0f55d8]/10 cursor-pointer"
                              >
                                <span className="font-geist" style={{ fontFamily: '"Geist", sans-serif' }}>Continuar</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </form>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="step-form-2"
                            initial={{ x: direction === "forward" ? "10%" : "-10%", opacity: 0 }}
                            animate={{ x: "0%", opacity: 1 }}
                            exit={{ x: direction === "forward" ? "-10%" : "10%", opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="w-full h-full flex flex-col justify-between select-none"
                          >
                            <form onSubmit={submitStep2AndVerify} className="space-y-3 h-full flex flex-col justify-between">
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-0.5">Calle y número</label>
                                  <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      ref={calleInputRef}
                                      type="text"
                                      required
                                      autoComplete="street-address"
                                      value={addressCalle}
                                      onChange={(e) => { setAddressCalle(e.target.value); setFormError(null); }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          coloniaInputRef.current?.focus();
                                        }
                                      }}
                                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white rounded-xl transition-all outline-none font-semibold text-base focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                                      placeholder=""
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-0.5">Colonia</label>
                                  <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      ref={coloniaInputRef}
                                      type="text"
                                      required
                                      autoComplete="address-level2"
                                      value={addressColonia}
                                      onChange={(e) => { setAddressColonia(e.target.value); setFormError(null); }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          submitStep2AndVerify(e);
                                        }
                                      }}
                                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 focus:border-[#0f55d8] focus:bg-white rounded-xl transition-all outline-none font-semibold text-base focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                                      placeholder=""
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setFormError(null); setDirection("backward"); setActiveFormStep(1); }}
                                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm font-geist transition-all shrink-0 cursor-pointer"
                                  style={{ fontFamily: '"Geist", sans-serif' }}
                                >
                                  Atrás
                                </button>
                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="flex-1 py-2.5 rounded-xl bg-[#0f55d8] hover:bg-[#0d4bc0] text-white font-extrabold text-sm font-geist transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-[#0f55d8]/10 cursor-pointer"
                                  style={{ fontFamily: '"Geist", sans-serif' }}
                                >
                                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                      <span>Pedir mi cesto gratis</span>
                                      <ArrowRight className="w-4 h-4" />
                                    </>
                                  )}
                                </button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

    </div>
  );
}

