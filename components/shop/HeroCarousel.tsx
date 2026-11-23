'use client'

import ShopImage from './ShopImage'
import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties, type TouchEvent } from 'react'
import { kinds, money } from '@/lib/catalog'

const slides = [
  { art: 'hero-01-complete-sets', label: 'Complete Quran & Janamaz sets', kind: 'set' },
  { art: 'hero-02-quran-stands', label: 'Quran stands only', kind: 'single' },
  { art: 'hero-03-golden-gallery', label: 'The Golden Edit: four complete sets', kind: 'set' },
] as const
const labels = slides.map(slide => slide.label)
const wrap = (index: number) => (index + slides.length) % slides.length

export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [hovered, setHovered] = useState(false)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const swallowClick = useRef(false)
  const { art, label, kind } = slides[index]
  const href = '/collection?type=' + kind
  const price = money(kinds[kind].price)
  const shopLabel = kind === 'single' ? 'Shop Quran stands' : 'Shop complete sets'
  const ratio = index === 2 ? 1920 / 1080 : 1920 / 940
  // Same sizes on the artwork and decorative edges: the browser fetches one rendition.
  const sizes = '(max-width: 700px) 100vw, min(90vw, '+Math.round(70*ratio)+'vh, '+Math.round(700*ratio)+'px)'
  const wing = (side:'left'|'right') => <span className={'hero-wing wing-'+side} aria-hidden="true">
    <ShopImage asset={art} mobileAsset={art.replace('hero-','mobile-hero-')} sizes={sizes} alt=""/>
  </span>

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPlaying(!motion.matches)
    const stopIfReduced = () => { if (motion.matches) setPlaying(false) }
    motion.addEventListener('change', stopIfReduced)
    return () => motion.removeEventListener('change', stopIfReduced)
  }, [])

  useEffect(() => {
    if (!playing || hovered) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(i => wrap(i + 1))
    }, 8000)
    return () => window.clearInterval(timer)
  }, [playing, hovered])

  function select(next: number) {
    setPlaying(false)
    setIndex(wrap(next))
  }
  function endSwipe(e: TouchEvent) {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    swallowClick.current = true
    select(index + (dx < 0 ? 1 : -1))
  }

  return <section className="shop-hero" aria-label="Prayer stand offers" aria-roledescription="carousel"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={e => { if (e.target.dataset.rotation !== 'true') setPlaying(false) }}
    onKeyDown={e => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        swallowClick.current = false
        select(index + (e.key === 'ArrowRight' ? 1 : -1))
      }
    }}>
    <h1 className="sr-only">Quran stands and Quran &amp; Janamaz stand sets</h1>
    <div className="hero-phone-title"><span>{index===0?'Quran & Janamaz sets':index===1?'Wall-mounted Quran stands':'The four finishes'}</span></div>
      <div className="hero-stage" role="group" aria-roledescription="slide" aria-label={(index + 1) + ' of ' + labels.length + ': ' + labels[index]}
        onPointerDownCapture={() => { swallowClick.current = false }}
        onTouchStart={e => {
          swallowClick.current = false
          touch.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
        }} onTouchEnd={endSwipe} onTouchCancel={() => { touch.current = null }}
        onClickCapture={e => {
          if (swallowClick.current && e.detail !== 0) { e.preventDefault(); e.stopPropagation() }
          swallowClick.current = false
        }}>
        <Link prefetch={false} href={href} className="hero-photo" style={{'--art-ratio':ratio} as CSSProperties}>
          {wing('left')}
          <span className="hero-artwork"><ShopImage asset={art} mobileAsset={art.replace('hero-','mobile-hero-')} sizes={sizes} eager alt={label + ' in Gold, White, Silver and Black. ' + price + '. ' + shopLabel + '.'}/></span>
          {wing('right')}
        </Link>
      </div>
      <Link prefetch={false} href={href} className="hero-mobile-offer"><span>{shopLabel} →</span><strong>{price} {kinds[kind].original>kinds[kind].price&&<del>{money(kinds[kind].original)}</del>}</strong></Link>
      <div className="hero-controls" role="group" aria-label="Slide controls">
        <div className="hero-pager">
        <button className="hero-arrow" type="button" aria-label="Previous slide" onClick={() => select(index - 1)}>←</button>
        <div className="hero-selectors">{labels.map((label, i) =>
          <button type="button" key={label} aria-current={i === index ? 'true' : undefined} aria-label={'Show ' + label}
            title={label} onClick={() => select(i)}><i aria-hidden="true"/></button>)}</div>
        <button className="hero-arrow" type="button" aria-label="Next slide" onClick={() => select(index + 1)}>→</button>
        </div>
        <button className="hero-play" type="button" data-rotation="true" aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
          onClick={() => setPlaying(p => !p)}>{playing ? 'Ⅱ' : '▷'}</button>
      </div>
      <span className="sr-only" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">{labels[index]}, slide {index + 1} of {labels.length}</span>
  </section>
}
