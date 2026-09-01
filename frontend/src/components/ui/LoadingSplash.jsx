import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GraduationCap, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react'

/**
 * LoadingSplash - Floating animated splash loading page when entering the eLMS website
 */
const LoadingSplash = ({ onFinish }) => {
  const [progress, setProgress] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)
  const [isClosing, setIsClosing] = useState(false)

  const statusMessages = [
    'Initializing eLMS Platform...',
    'Connecting to Academic Workspace...',
    'Loading Courses & Semesters...',
    'Preparing Your Dashboard...',
    'Welcome to eLMS!'
  ]

  useEffect(() => {
    // Smooth progress increment
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 2
      })
    }, 45)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Cycle through status messages
    if (progress < 25) setStatusIndex(0)
    else if (progress < 50) setStatusIndex(1)
    else if (progress < 75) setStatusIndex(2)
    else if (progress < 95) setStatusIndex(3)
    else setStatusIndex(4)

    if (progress >= 100) {
      const timeout = setTimeout(() => {
        setIsClosing(true)
        setTimeout(() => {
          if (onFinish) onFinish()
        }, 600) // matches fade-out animation duration
      }, 400)

      return () => clearTimeout(timeout)
    }
  }, [progress, onFinish])

  return createPortal(
    <div
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/85 backdrop-blur-xl transition-all duration-700 ease-in-out ${
        isClosing ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
    >

      {/* Background Animated Gradient Orbs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-600/25 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Main Floating Glass Container */}
      <div className="relative mx-4 w-full max-w-md rounded-3xl border border-indigo-500/20 bg-slate-900/80 p-8 shadow-2xl shadow-indigo-500/20 backdrop-blur-2xl text-center animate-float">
        
        {/* Floating Sparkle Decorative Badges */}
        <div className="absolute -top-3 -right-3 flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
          <Sparkles size={14} className="text-indigo-400" />
          <span>v1.0 Live</span>
        </div>

        {/* Animated Brand Emblem / Logo */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          {/* Outer Pulsing Glowing Ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-md animate-spin" style={{ animationDuration: '8s' }} />
          
          {/* Inner Ring */}
          <div className="absolute inset-1 rounded-full border border-indigo-400/40 bg-slate-950/80 backdrop-blur-md" />

          {/* Core Logo Icon */}
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/50">
            <GraduationCap className="h-9 w-9 text-white animate-pulse" />
          </div>

          {/* Orbiting Badge */}
          <div className="absolute -bottom-1 -right-1 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 border border-indigo-400/50 shadow-md">
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
          </div>
        </div>

        {/* Title & Brand Name */}
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
            eLMS
          </span>
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
          E-Learning Management System
        </p>
        <p className="mt-3 text-sm text-slate-400">
          Empowering modern university education & interactive courses.
        </p>

        {/* Animated Progress Bar Container */}
        <div className="mt-8">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-150 ease-out shadow-sm shadow-indigo-400"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Progress Percentage & Status Message */}
          <div className="mt-3 flex items-center justify-between text-xs font-medium">
            <span className="text-indigo-300 transition-all duration-300 flex items-center gap-1.5">
              {progress >= 100 ? (
                <CheckCircle2 size={14} className="text-emerald-400 animate-bounce" />
              ) : (
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              )}
              {statusMessages[statusIndex]}
            </span>
            <span className="font-mono text-slate-400 font-semibold">{progress}%</span>
          </div>
        </div>

        {/* Quick Skip Button */}
        <button
          onClick={() => {
            setIsClosing(true)
            setTimeout(() => {
              if (onFinish) onFinish()
            }, 500)
          }}
          className="mt-6 text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-4 cursor-pointer"
        >
          Skip loading
        </button>
      </div>
    </div>
  )
}

export default LoadingSplash
