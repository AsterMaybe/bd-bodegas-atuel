import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "../components/ui";
import { loginSchema } from "../utils/validation";
import { authApi } from "../api/api";
import { Eye, EyeOff, ShieldCheck, User, Lock, ChevronRight, Check } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@bodegasatuel.com",
      password: "admin123",
      rememberMe: true,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data) => {
    setError("");
    setIsLoading(true);

    // Only send email and password to backend
    const loginData = { email: data.email, password: data.password };

    try {
      const result = await authApi.login(loginData);
      localStorage.setItem("auth_token", result.access_token);
      localStorage.setItem("user", JSON.stringify(result.usuario));
      navigate("/");
    } catch (err) {
      setError(err.data?.detail || err.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3f0] flex">
      {/* Left Panel - Estate Introduction */}
      <div className="relative w-[640px] flex-shrink-0 hidden lg:flex flex-col h-screen">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/mendoza-vineyard.jpg"
            alt="Mendoza vineyard"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(25,18,24,0.35)] via-[rgba(25,18,24,0.15)] to-[rgba(25,18,24,0.85)]" />
        
        {/* Winery Identity - Top Left */}
        <div className="absolute top-[48px] left-[48px] z-10 flex items-center gap-[10px]">
          <div className="w-[36px] h-[40px] bg-white/15 rounded-[4px] flex items-center justify-center shrink-0">
            <svg className="w-[23px] h-[23px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="flex flex-col items-start">
            <p className="text-[16px] font-semibold text-white">Bodegas del Atuel</p>
            <p className="text-[10px] font-medium text-[#e6d8da] uppercase tracking-widest">MENDOZA · ARGENTINA</p>
          </div>
        </div>

        {/* Estate Story - Bottom Left */}
        <div className="absolute bottom-[48px] left-[48px] right-[48px] z-10 flex flex-col gap-[20px] text-white">
          {/* Location */}
          <div className="flex items-center gap-[8px]">
            <div className="w-[28px] h-px bg-[#d4c4b8] shrink-0" />
            <p className="text-[11px] font-normal text-[#d8cfc4] uppercase tracking-wide">San Rafael, Mendoza</p>
          </div>

          {/* Headline - Slogan */}
          <div className="text-[64px] font-bold leading-[1.0] min-w-fit text-white">
            <p className="mb-[4px]">Arraigado en nuestra tierra.</p>
            <p className="mt-[-4px]">Perfeccionado por el conocimiento.</p>
          </div>

          {/* Description */}
          <p className="text-[16px] font-normal leading-[1.6] text-[#e8ded7] max-w-[520px] leading-relaxed">
            Un espacio de trabajo conectado para nuestros vinos, nuestros viñedos y las personas detras de cada añada.
          </p>

          {/* Signature */}
          <div className="border-t border-white/15 pt-[20px] flex items-start justify-between text-[10px] font-normal leading-[1.45] text-[#c8bdb2]">
            <div className="flex items-center gap-[4px]">
              <div className="w-[18px] h-[18px] bg-[#742d40] rounded-[3px] flex items-center justify-center shrink-0">
                <svg className="w-[10px] h-[10px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <p className="ml-[4px] font-semibold text-white">Bodegas del Atuel</p>
            </div>
            <p>Sistema de gestion de la finca</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Secure Sign In */}
      <div className="flex-1 flex flex-col h-screen overflow-auto bg-[#faf7f3]">
        {/* Header - Access Type */}
        <div className="px-[64px] pt-[42px] flex items-center justify-end">
          <div className="flex items-center gap-[7px]">
            <ShieldCheck className="w-[14px] h-[14px] text-[#742d40] shrink-0" />
            <p className="text-[11px] font-normal leading-[1.45] text-[#79736e] whitespace-nowrap">Acceso seguro para el personal</p>
          </div>
        </div>

        {/* Login Form - centered */}
        <div className="flex-1 flex items-start justify-center px-[64px] py-[16px]">
          <div className="w-full max-w-[392px]">
            {/* Welcome Section */}
            <div className="mb-[30px]">
              <div className="w-[42px] h-[42px] bg-[#f3e9ec] rounded-[10px] flex items-center justify-center mb-[12px] shrink-0">
                <svg className="w-[23px] h-[23px] text-[#742d40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h1 className="text-[32px] font-semibold leading-[1.2] text-[#292523] whitespace-normal">Bienvenido de vuelta</h1>
              <p className="text-[14px] font-normal leading-[1.5] text-[#79736e] max-w-[340px]">
                Inicia sesión en tu espacio de trabajo de la finca.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-[24px]">
              {error && (
                <div className="p-3 bg-[#fbecec] border border-[#c0392b] rounded-lg text-sm text-[#c0392b] flex items-center gap-2 mb-[24px]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-[8px]">
                <label className="block text-[12px] font-semibold leading-[1.45] text-[#292523] mb-[8px]">Correo electrónico</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="lucia.martinez@bodegasatuel.com"
                    className="w-full h-[48px] pl-[44px] pr-[14px] rounded-[6px] border border-[#e7e3dd] bg-white text-[#292523] placeholder:text-[#a8a29c] text-[13px] leading-[1.45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#742d40] focus-visible:ring-offset-2"
                    {...register("email")}
                    autoComplete="email"
                  />
                  <User className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-[#a8a29c] shrink-0 pointer-events-none" />
                </div>
                {errors.email && (
                  <p className="mt-[6px] text-[12px] text-[#c0392b]">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-[8px]">
                <label className="block text-[12px] font-semibold leading-[1.45] text-[#292523] mb-[8px]">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full h-[48px] pl-[44px] pr-[44px] rounded-[6px] border border-[#e7e3dd] bg-white text-[#292523] placeholder:text-[#a8a29c] text-[14px] leading-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#742d40] focus-visible:ring-offset-2"
                    {...register("password")}
                    autoComplete="current-password"
                  />
                  <Lock className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-[#a8a29c] shrink-0 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#a8a29c] hover:text-[#79736e] transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-[6px] text-[12px] text-[#c0392b]">{errors.password.message}</p>
                )}
              </div>

              {/* Sign In Options */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("rememberMe")}
                    className="w-[16px] h-[16px] rounded-[3px] border border-[#e7e3dd] bg-white appearance-none cursor-pointer checked:bg-[#742d40] checked:border-[#742d40] focus-visible:ring-2 focus-visible:ring-[#742d40] focus-visible:ring-offset-2 relative"
                  />
                  {rememberMe && (
                    <Check className="absolute w-[12px] h-[12px] text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                  <span className="text-[12px] font-normal leading-[1.45] text-[#292523] whitespace-nowrap">Recordarme</span>
                </label>
                <button
                  type="button"
                  className="text-[12px] font-medium leading-[1.45] text-[#742d40] hover:underline whitespace-nowrap"
                  onClick={() => setError("Contacta a tu administrador para recuperar contraseña")}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Log In Button */}
              <Button
                type="submit"
                className="w-full h-[48px] text-[14px] font-semibold bg-[#742d40] text-white rounded-[6px] hover:bg-[#5a2430] active:bg-[#5a2430]/90 transition-colors flex items-center justify-center gap-[6px]"
                loading={isLoading}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>

              {/* Support */}
              <div className="border-t border-[#e7e3dd] pt-[20px] flex items-center justify-center gap-[4px] text-[12px] leading-[1.45] text-[#79736e]">
                <span>¿Necesitas acceso?</span>
                <button
                  type="button"
                  className="font-medium text-[#742d40] hover:underline whitespace-nowrap"
                  onClick={() => setError("Contacta a tu administrador para obtener acceso")}
                >
                  Contacta a tu administrador
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-[32px] left-[64px] right-[64px] flex items-center justify-between text-[10px] font-normal leading-[1.45] text-[#79736e] whitespace-nowrap">
          <p>© 2026 bodegas del atuel</p>
          <div className="flex items-center gap-[20px]">
            <button className="hover:text-[#742d40] transition-colors">Política de privacidad</button>
          </div>
        </div>
      </div>
    </div>
  );
}