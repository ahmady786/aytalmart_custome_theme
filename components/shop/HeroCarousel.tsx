'use client'

import ShopImage from './ShopImage'
import Link from 'next/link'
import { useEffect, useRef, useState, type TouchEvent } from 'react'
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
  const title = ['Quran & Janamaz Stand Sets','Wall-Mounted Quran Stands','One set. Four finishes.'][index]
  const sizes = index===2?'(max-width:740px) 100vw, min(64vw, 960px)':'(min-aspect-ratio:2/1) and (max-height:760px) 77vw, min(100vw, 1520px)'

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

  return <section className="shop-hero offer-hero" data-gallery={index===2?'true':'false'} aria-label="Prayer stand offers" aria-roledescription="carousel"
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
        <Link prefetch={false} href={href} className="hero-photo" aria-label={shopLabel+' — '+price}>
          <span className="hero-heading"><small>{index===2?'The golden edit':'The finish collection'}</small><span>{title}</span></span>
          <span className="hero-artwork"><ShopImage asset={art} mobileAsset={art.replace('hero-','mobile-hero-')} sizes={sizes} eager alt={label+' in Gold, White, Silver and Black'}/></span>
          <span className="hero-deal"><span className="hero-values"><small>{kind==='set'?'Per complete set':'Per Quran stand'}</small><span><strong>{price}</strong> <del>{money(kinds[kind].original)}</del></span></span>
            <span className="hero-cta">{shopLabel} <span aria-hidden="true">↗</span></span></span>
        </Link>
      </div>
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
