import React from 'react';

interface KaiLogoProps {
  size?: number | string;
  className?: string;
  showGlow?: boolean;
}

export const KaiLogo: React.FC<KaiLogoProps> = ({
  size = 36,
  className = '',
  showGlow = true,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {showGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-brand-600 via-emerald-400 to-cyan-400 opacity-40 blur-md pointer-events-none -z-10"
        />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm select-none"
      >
        <defs>
          {/* Nền Squircle Gradient */}
          <linearGradient id="kaiBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B132B" />
            <stop offset="50%" stopColor="#1C2541" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Viền Neon phát sáng */}
          <linearGradient id="kaiBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>

          {/* Cột chữ I (Thân K) - Pillar of Intellect */}
          <linearGradient id="kaiStemGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Nhánh K Trên (Arrow pointing upward) */}
          <linearGradient id="kaiUpperGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Nhánh K Dưới (Foundation) */}
          <linearGradient id="kaiLowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="60%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>

          {/* Glow filter cho ngôi sao / lõi AI */}
          <filter id="kaiCoreGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Nền Squircle cao cấp */}
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="24"
          fill="url(#kaiBgGrad)"
          stroke="url(#kaiBorderGrad)"
          strokeWidth="2.5"
        />

        {/* Lưới tinh thể công nghệ mờ phía sau */}
        <path
          d="M 50 15 L 85 50 L 50 85 L 15 50 Z"
          stroke="#38BDF8"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.2"
        />

        {/* ========================================================
            BIỂU TƯỢNG ĐỘC BẢN KAI (K - A - I Monogram)
            - Chữ I: Cột đứng bên trái (Pillar of Intellect)
            - Chữ A: Hình khối tam giác âm tạo giữa 2 nhánh K
            - Chữ K: Toàn thể khối logo hiện đại hình tia chớp tri thức
           ======================================================== */}

        {/* 1. Cột đứng (Chữ I trong KAI) */}
        <rect
          x="22"
          y="22"
          width="13"
          height="56"
          rx="6.5"
          fill="url(#kaiStemGrad)"
        />

        {/* Ánh sáng phản chiếu trên cột I */}
        <rect
          x="24.5"
          y="25"
          width="4"
          height="50"
          rx="2"
          fill="#FFFFFF"
          opacity="0.35"
        />

        {/* 2. Nhánh trên K (Bay vút lên, hội tụ tri thức) */}
        <path
          d="M 43 46 
             L 66 23 
             C 68.5 20.5 72.5 20.5 75 23 
             C 77.5 25.5 77.5 29.5 75 32 
             L 55 52 
             C 52.5 54.5 48.5 54.5 46 52 
             L 43 49 
             Z"
          fill="url(#kaiUpperGrad)"
        />

        {/* 3. Nhánh dưới K (Vững chãi, mở rộng sang phải) */}
        <path
          d="M 46 48 
             C 48.5 45.5 52.5 45.5 55 48 
             L 75 68 
             C 77.5 70.5 77.5 74.5 75 77 
             C 72.5 79.5 68.5 79.5 66 77 
             L 43 54 
             Z"
          fill="url(#kaiLowerGrad)"
        />

        {/* 4. Lõi Neural AI / Ngôi sao hội tụ trí tuệ ở giao điểm K-A-I */}
        <circle
          cx="47"
          cy="50"
          r="4.5"
          fill="#FFFFFF"
          filter="url(#kaiCoreGlow)"
        />
        <circle
          cx="47"
          cy="50"
          r="2.5"
          fill="#06B6D4"
        />

        {/* Điểm nhấn Sparkle công nghệ nhỏ góc trên */}
        <circle
          cx="78"
          cy="20"
          r="2.5"
          fill="#38BDF8"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};
