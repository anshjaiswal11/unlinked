'use client'
// components/Avatar.tsx — DiceBear anonymous avatar component

import Image from 'next/image'
import { getAvatarUrl, getAvatarFallbackColor } from '@/lib/avatar'

interface AvatarProps {
  seed: string
  size?: number
  className?: string
  showRing?: boolean
  ringColor?: string
}

export default function Avatar({
  seed,
  size = 40,
  className = '',
  showRing = false,
  ringColor,
}: AvatarProps) {
  const fallbackColor = getAvatarFallbackColor(seed)
  const avatarUrl = getAvatarUrl(seed, size * 2) // 2x for retina

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        background: fallbackColor + '22',
        border: showRing
          ? `2px solid ${ringColor ?? fallbackColor}44`
          : '1.5px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        src={avatarUrl}
        alt={`Avatar for ${seed}`}
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        unoptimized // SVG from DiceBear — no need to optimize
      />
    </div>
  )
}
