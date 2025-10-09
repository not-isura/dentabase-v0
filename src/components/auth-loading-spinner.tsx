import React from 'react'
import Image from 'next/image'

export function AuthLoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(258_46%_25%/0.1)] via-[hsl(330_100%_99%)] to-[hsl(36_60%_78%/0.1)] flex items-center justify-center">
      <div className="text-center">
        {/* Loading animation with ripple effect */}
        <div className="relative w-40 h-40 mx-auto mb-6">
          {/* Outer ripple rings - pulse outward */}
          <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-20 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-[hsl(258_46%_25%)] opacity-10 animate-pulse"></div>
          
          {/* Solid purple circle - no animation */}
          <div className="absolute inset-4 bg-[hsl(258_46%_25%)] rounded-full flex items-center justify-center">
            {/* Logo with independent fade animation */}
            <div className="animate-fade-in-out">
              <Image
                src="/logo-white-outline.png"
                alt="DentaBase Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-[hsl(258_46%_25%)] mb-2">
            Checking authentication...
          </h2>
          <p className="text-[hsl(258_22%_50%)] text-sm">
            Please wait a moment
          </p>
        </div>
      </div>
    </div>
  )
}
