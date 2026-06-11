import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, RefreshCw, Check, ArrowRight, QrCode, HelpCircle, UserCheck, Link, ShoppingBag, Send, Loader2 } from "lucide-react";

export default function FlowSimulator() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Simulation states
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [bagStatus, setBagStatus] = useState<string>("unassigned");
  const [activeOrderId, setActiveOrderId] = useState<string>("");

  // Fetch initial state of BOLSA-001 to sync step correctly on load
  const checkStatus = async () => {
    try {
      const res = await fetch("/api/bags/BOLSA-001");
      if (res.ok) {
        const data = await res.json();
        setBagStatus(data.status);
        if (data.status === "assigned") {
          setRegisteredUser(data.user);
          if (data.activeOrder) {
            setActiveOrderId(data.activeOrder.id);
            setCurrentStep(4); // Order is active/confirmed
          } else {
            // Check if there are completed orders for this bag in the system
            const ordersRes = await fetch("/api/orders");
            let hasCompleted = false;
            if (ordersRes.ok) {
              const orders = await ordersRes.json();
              const b001Orders = orders.filter((o: any) => o.bagId === "BOLSA-001" && o.status === "completed");
              if (b001Orders.length > 0) {
                hasCompleted = true;
              }
            }
            if (hasCompleted) {
              setActiveOrderId("");
              setCurrentStep(5); // Completed & Delivered
            } else {
              setActiveOrderId("");
              setCurrentStep(3); // Linked but order not confirmed yet
            }
          }
        } else {
          setActiveOrderId("");
          // Check if preregistered user exists in DB by querying the phone
          const uRes = await fetch("/api/users/phone/9212393938");
          if (uRes.ok) {
            const uData = await uRes.json();
            setRegisteredUser(uData);
            setCurrentStep(2); // Registered but bag unassigned
          } else {
            setRegisteredUser(null);
            setCurrentStep(1); // Not registered
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [location.pathname]); // Update status when navigating

  // Step 1: Pre-register user in the server
  const runStep1 = async () => {
    setLoading(true);
    setStatusMsg("Pre-registrando a Jaime...");
    try {
      const res = await fetch("/api/preregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Jaime Hernández",
          phone: "9212393938",
          deliveryPreference: "",
          addressColonia: "Las Palmas",
          addressCalle: "Paseo de las Palmas",
          addressNumero: "209",
          preferredTime: ""
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRegisteredUser({ name: "Jaime Hernández", phone: "9212393938" });
        setCurrentStep(2);
        setStatusMsg("✅ Jaime Hernández pre-registrado con éxito en el servidor.");
        // Only navigate automatically if they aren't on the dedicated simulator page
        if (location.pathname !== "/simulator") {
          navigate("/associate/link?bagId=BOLSA-001&phone=9212393938");
        }
      } else {
        setStatusMsg(`❌ Error: ${data.error}`);
      }
    } catch (e: any) {
      setStatusMsg(`❌ Error de red: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Auto-link Bag directly or navigate
  const runStep2Auto = async () => {
    setLoading(true);
    setStatusMsg("Bypasseando: Vinculando BOLSA-001 a Jaime...");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bagId: "BOLSA-001",
          name: "Jaime Hernández",
          phone: "9212393938",
          deliveryPreference: "",
          addressColonia: "Las Palmas",
          addressCalle: "Paseo de las Palmas",
          addressNumero: "209",
          preferredTime: ""
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBagStatus("assigned");
        setCurrentStep(3);
        setStatusMsg("🔗 BOLSA-001 asignada con éxito.");
        // Only navigate automatically if they aren't on the dedicated simulator page
        if (location.pathname !== "/simulator") {
          navigate("/bolsa/BOLSA-001");
        }
      } else {
        setStatusMsg(`❌ Error: ${data.error}`);
      }
    } catch (e: any) {
      setStatusMsg(`❌ Error de red: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Trigger order creation directly without touching UI
  const runStep3Auto = async () => {
    setLoading(true);
    setStatusMsg("Recibiendo prendas y generando Orden en base de datos...");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bagId: "BOLSA-001",
          deliveryType: "Estándar (48 h)"
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveOrderId(data.orderId);
        setCurrentStep(4);
        setStatusMsg("🎉 ¡Orden # " + data.orderId + " creada para Jaime!");
        // Only navigate automatically or reload if not on dedicated simulator page
        if (location.pathname !== "/simulator") {
          navigate("/bolsa/BOLSA-001");
          window.location.reload();
        }
      } else {
        setStatusMsg(`❌ Error al crear orden: ${data.error}`);
      }
    } catch (e: any) {
      setStatusMsg(`❌ Error de red: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Deliver garments and release/free bag (1-touch)
  const runStep4Auto = async () => {
    let orderIdToComplete = activeOrderId;
    if (!orderIdToComplete) {
      // Look up if there's any pending/active order for BOLSA-001
      try {
        const res = await fetch("/api/bags/BOLSA-001");
        if (res.ok) {
          const bagData = await res.json();
          if (bagData.activeOrder) {
            orderIdToComplete = bagData.activeOrder.id;
          }
        }
      } catch (err) {}
    }

    if (!orderIdToComplete) {
      setStatusMsg("❌ Error: No se encontró una orden activa para entregar y liberar.");
      return;
    }

    setLoading(true);
    setStatusMsg(`Entregando prendas para Orden #${orderIdToComplete} y liberando BOLSA-001...`);
    try {
      const res = await fetch(`/api/orders/${orderIdToComplete}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentStep(5);
        setActiveOrderId("");
        setStatusMsg("✅ ¡Prendas entregadas al cliente! Bolsa liberada con éxito.");
        if (location.pathname !== "/simulator") {
          navigate("/bolsa/BOLSA-001");
        }
      } else {
        setStatusMsg(`❌ Error al entregar orden: ${data.error}`);
      }
    } catch (e: any) {
      setStatusMsg(`❌ Error de red: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset demo back to unassigned
  const resetDemo = async () => {
    setLoading(true);
    setStatusMsg("Restableciendo base de datos...");
    try {
      const res = await fetch("/api/simulation/reset", { method: "POST" });
      if (res.ok) {
        setRegisteredUser(null);
        setBagStatus("unassigned");
        setActiveOrderId("");
        setCurrentStep(1);
        setStatusMsg("🔄 Simulación reiniciada. Bolsa 1 puesta a 'unassigned'.");
        // Only navigate automatically if they aren't on the dedicated simulator page
        if (location.pathname !== "/simulator") {
          navigate("/scanner");
        }
      } else {
        setStatusMsg("❌ Error al reiniciar base de datos.");
      }
    } catch (e) {
      setStatusMsg("❌ Error de comunicación con servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Detect current active view descriptions for associate guide
  const getViewGuide = () => {
    const path = location.pathname;
    if (path.startsWith("/scanner")) {
      return {
        title: "Escáner de Bolsa",
        desc: "El asociado inicia aquí. Normalmente escanea el código QR de la bolsa vacía con la cámara. Con el simulador, puedes automatizarlo para pre-registrar al cliente Jaime."
      };
    } else if (path.startsWith("/associate/link")) {
      return {
        title: "Vincular Pre-registro",
        desc: "Aquí el asociado busca al cliente por teléfono. Para simularlo, ingresa el celular de Jaime (9212393938), dale 'Buscar', y luego da clic al gran botón azul de 'Confirmar Vinculación'."
      };
    } else if (path.startsWith("/bolsa/BOLSA-001")) {
      if (currentStep < 4) {
        return {
          title: "Recepción de Prendas",
          desc: "BOLSA-001 está vinculada a Jaime. Verifica que las prendas quepan y dale 'Confirmar Recepción' para habilitar tus bonitos tickets digitales."
        };
      } else {
        return {
          title: "Ticket Emitido para Jaime",
          desc: "¡La orden está lista! Prueba dar clic en 'Enviar Ticket por WhatsApp' para copiar el ticket en imagen al portapapeles y abrir el chat de Jaime Hernández."
        };
      }
    }
    return null;
  };

  const activeGuide = getViewGuide();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white text-slate-800 p-5 flex flex-col items-stretch space-y-4 font-sans select-none"
    >
      {/* Simulation Deck Header */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <div className="flex flex-col text-left">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#0f55d8] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0f55d8] animate-pulse"></span>
            Área de Simulación (Bolsa 1)
          </span>
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            SOMOS Lavandería
          </span>
        </div>
        <button
          onClick={resetDemo}
          disabled={loading}
          type="button"
          className="p-1.5 px-3 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100/75 border border-red-100 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          <span>Reiniciar Flujo</span>
        </button>
      </div>

      {/* Guide Badge depending on the current route */}
      {activeGuide && (
        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/60 text-left space-y-1">
          <span className="text-[9px] font-bold text-[#0f55d8] uppercase tracking-wider block">GUÍA PANTALLA: {activeGuide.title}</span>
          <p className="text-[11px] text-slate-600 leading-normal">{activeGuide.desc}</p>
        </div>
      )}

      {/* Step list Timeline */}
      <div className="space-y-4 pt-1">
        {/* Step 1: Pre-register client */}
        <div className="flex items-start gap-3">
          <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] border mt-0.5 ${
            currentStep > 1 
              ? "bg-[#0f55d8] text-white border-[#0f55d8]" 
              : "bg-slate-100 text-slate-400 border-slate-200"
          }`}>
            {currentStep > 1 ? <Check className="w-3 h-3" /> : "1"}
          </span>
          <div className="flex-1 flex flex-col text-left">
            <div className="flex justify-between items-start">
              <span className={`text-xs font-bold leading-non ${currentStep === 1 ? "text-slate-900" : "text-slate-400"}`}>
                Pre-registro de Jaime
              </span>
              {currentStep === 1 && (
                <button
                  onClick={runStep1}
                  disabled={loading}
                  className="text-[10px] font-bold px-2.5 py-1 bg-[#0f55d8] hover:bg-[#0d4bc0] text-white rounded-lg transition-colors flex items-center gap-1 active:scale-95 disabled:opacity-45 cursor-pointer select-none"
                >
                  <span>Pre-registrar</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              {currentStep > 1 
                ? "✓ Jaime (9212393938) registrado en el sistema." 
                : "Simula que Jaime se registra en línea con sus preferencias."}
            </span>
          </div>
        </div>

        {/* Step 2: Assign bag */}
        <div className="flex items-start gap-4">
          <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] border mt-0.5 ${
            currentStep > 2 
              ? "bg-[#0f55d8] text-white border-[#0f55d8]" 
              : currentStep === 2
              ? "bg-blue-50 text-[#0f55d8] border-[#0f55d8]"
              : "bg-slate-100 text-slate-400 border-slate-200"
          }`}>
            {currentStep > 2 ? <Check className="w-3 h-3" /> : "2"}
          </span>
          <div className="flex-1 flex flex-col text-left space-y-1">
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold ${currentStep === 2 ? "text-slate-900" : "text-slate-400"}`}>
                Vincular BOLSA-001 en pantalla
              </span>
              {currentStep === 2 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigate("/associate/link?bagId=BOLSA-001&phone=9212393938")}
                    className="text-[9px] font-bold px-2 py-0.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors bg-white cursor-pointer"
                  >
                    Ir a Pantalla 🔍
                  </button>
                  <button
                    onClick={runStep2Auto}
                    disabled={loading}
                    className="text-[9px] font-bold px-2 py-0.5 bg-[#0f55d8] hover:bg-[#0d4bc0] text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Auto-Vincular ⚡
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              {currentStep > 2
                ? "✓ Bolsa 1 exitosamente asociada a Jaime."
                : "Abre la pantalla de búsqueda con los campos pre-llenados o vincúlalo instantáneamente con el bypass."}
            </span>
          </div>
        </div>

        {/* Step 3: Scan bag & confirm receipt */}
        <div className="flex items-start gap-4">
          <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] border mt-0.5 ${
            currentStep > 3 
              ? "bg-[#0f55d8] text-white border-[#0f55d8]" 
              : currentStep === 3
              ? "bg-blue-50 text-[#0f55d8] border-[#0f55d8]"
              : "bg-slate-100 text-slate-400 border-slate-200"
          }`}>
            {currentStep > 3 ? <Check className="w-3 h-3" /> : "3"}
          </span>
          <div className="flex-1 flex flex-col text-left space-y-1">
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold ${currentStep === 3 ? "text-slate-900" : "text-slate-400"}`}>
                Recibir prendas (Confirmación)
              </span>
              {currentStep === 3 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigate("/bolsa/BOLSA-001")}
                    className="text-[9px] font-bold px-2 py-0.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors bg-white cursor-pointer"
                  >
                    Ver Pantalla 🧺
                  </button>
                  <button
                    onClick={runStep3Auto}
                    disabled={loading}
                    className="text-[9px] font-bold px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Auto-Recibir ⚡
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              {currentStep > 3
                ? "✓ Orden ingresada. Ticket generado."
                : "Revisa la pantalla de recepción para firmar de recibido o utiliza el botón para recibir de forma directa."}
            </span>
          </div>
        </div>

        {/* Step 4: Digital ticket & share preview */}
        <div className="flex items-start gap-4">
          <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] border mt-0.5 ${
            currentStep > 4 
              ? "bg-emerald-600 border-emerald-600 text-white font-black" 
              : currentStep === 4
              ? "bg-blue-50 text-[#0f55d8] border-[#0f55d8]"
              : "bg-slate-100 text-slate-400 border-slate-200"
          }`}>
            {currentStep > 4 ? <Check className="w-3 h-3" /> : "4"}
          </span>
          <div className="flex-1 flex flex-col text-left space-y-1">
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold ${currentStep === 4 ? "text-slate-900" : currentStep > 4 ? "text-emerald-700" : "text-slate-400"}`}>
                Pantalla de Entrega 📦
              </span>
              {currentStep === 4 && (
                <button
                  type="button"
                  onClick={() => navigate("/bolsa/BOLSA-001")}
                  className="text-[9px] font-bold px-2.5 py-0.5 bg-[#0f55d8] hover:bg-[#0d4bc0] text-white rounded-lg transition-colors cursor-pointer"
                >
                  Ir a Entrega 📦
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              {currentStep === 5 
                ? "🎉 ¡Entrega finalizada! Bolsa vacía liberada automáticamente para volver a usarse sin trabas."
                : currentStep === 4
                ? "✓ Escanear la bolsa con orden activa ahora abre la nueva pantalla dedicada de Entrega de Ropa."
                : "Disponible una vez confirmada la recepción."}
            </span>
          </div>
        </div>
      </div>

      {/* Status log panel */}
      {statusMsg && (
        <div className="bg-slate-50 rounded-xl p-3 text-[10px] font-mono text-left border border-slate-100 flex items-start gap-1 text-[#0f55d8]">
          <span className="text-slate-400 select-none">&gt;</span>
          <p className="flex-1 leading-normal">{statusMsg}</p>
        </div>
      )}

      {/* Extra guide tip */}
      <div className="text-[10px] text-slate-400 text-left flex items-start gap-1 pt-2.5 border-t border-slate-100">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
        <span>Usa este panel compañero para moverte con fluidez entre las pantallas reales de tu flujo y ver cómo responde el sistema sin depender de una cámara real.</span>
      </div>
    </motion.div>
  );
}
