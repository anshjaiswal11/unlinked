'use client'

import Link from 'next/link'
import { PenLine, Shield, Unlink } from 'lucide-react'
import Avatar from './Avatar'
import ThemeToggle from './ThemeToggle'

interface NavbarProps {
  alias?: string
  avatarSeed?: string
  isAdmin?: boolean
}

export default function Navbar({ alias, avatarSeed, isAdmin }: NavbarProps) {
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link href="/feed" className="nav-logo" aria-label="Unlinked feed">
          <span className="nav-logo-mark">
            <Unlink size={18} strokeWidth={2.4} />
          </span>
          <span className="nav-logo-text">Unlinked</span>
        </Link>

        <div className="nav-actions">
          <ThemeToggle compact />

          {alias ? (
            <>
              <Link href="/post/new" id="compose-btn" className="btn-primary mobile-hide" style={{ minHeight: 40, padding: '0.55rem 0.95rem', fontSize: '0.875rem' }}>
                <PenLine size={16} />
                Post
              </Link>

              {isAdmin && (
                <Link href="/admin" className="btn-ghost" style={{ minHeight: 40, padding: '0.55rem 0.8rem', fontSize: '0.8125rem' }}>
                  <Shield size={15} />
                  <span className="mobile-hide">Mod</span>
                </Link>
              )}

              <Link href="/profile" style={{ textDecoration: 'none' }} aria-label="Profile">
                <Avatar seed={avatarSeed ?? alias} size={34} showRing />
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn-primary" style={{ minHeight: 40, padding: '0.55rem 1rem', fontSize: '0.875rem' }}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
