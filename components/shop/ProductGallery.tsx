'use client'
import {useRef,useState} from 'react'
import ShopImage from './ShopImage'
import type {Product} from '@/lib/catalog'
import {galleryFor,type Frame} from '@/lib/product-gallery'

function FrameImage({frame,name,thumb=false,large=false}:{frame:Frame;name:string;thumb?:boolean;large?:boolean}){
  const sizes=thumb?'68px':large?'(max-width:700px) 100vw, 960px':'(max-width:700px) 92vw, (max-width:1450px) 42vw, 610px'
  const alt=thumb?'':name+' · '+frame.label
  if(frame.asset)return <ShopImage asset={frame.asset} alt={alt} sizes={sizes} maxWidth={thumb?192:1920} eager={!thumb}/>
  const base='/shop/angles/'+frame.photo+'-'
  // The photographs are formatted ahead of time; thumbnails never load the large file.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} width={960} height={1707} loading={thumb?'lazy':'eager'} decoding="async" sizes={sizes} src={base+(thumb?112:480)+'.webp'}
    srcSet={thumb?undefined:[112,480,960].map(w=>base+w+'.webp '+w+'w').join(', ')}/>
}
export default function ProductGallery({p}:{p:Product}){
  const frames=galleryFor(p),[index,setIndex]=useState(0),[open,setOpen]=useState(false),[zoom,setZoom]=useState(false)
  const dialog=useRef<HTMLDialogElement>(null),touch=useRef<[number,number]|null>(null),swiped=useRef(false)
  const frame=frames[index],name=p.finish+' '+p.name
  function move(by:number){setIndex(i=>(i+by+frames.length)%frames.length);setZoom(false)}
  function inspect(){setOpen(true);dialog.current?.showModal()}
  return <section className="product-gallery" aria-label={name+' gallery'}>
    <div className="pdp-photos">
      <div className="pdp-thumbs" role="group" aria-label="Product photographs">{frames.map((f,i)=>
        <button key={f.label} type="button" aria-label={f.label} title={f.label} aria-pressed={index===i} onClick={()=>setIndex(i)}>
          <span className={'pdp-thumb-image'+(f.detail?' detail-thumb':'')}><FrameImage frame={f} name={name} thumb/></span>
        </button>)}</div>
      <div className="pdp-view">
        <button type="button" className={'detail-art pdp-stage '+(index===0?'studio-frame':frame.detail?'detail-frame':'')} aria-label={'Inspect finish: '+frame.label} aria-haspopup="dialog"
          onTouchStart={e=>{swiped.current=false;touch.current=[e.touches[0].clientX,e.touches[0].clientY]}}
          onTouchEnd={e=>{if(!touch.current)return;const dx=e.changedTouches[0].clientX-touch.current[0],dy=e.changedTouches[0].clientY-touch.current[1];touch.current=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4){swiped.current=true;move(dx<0?1:-1)}}}
          onClick={e=>{if(e.detail!==0&&swiped.current){swiped.current=false;return}inspect()}}>
          <FrameImage frame={frame} name={name}/><span className="pdp-enlarge" aria-hidden="true">⤢</span>
        </button>
        <div className="pdp-caption"><span aria-live="polite"><small>{String(index+1).padStart(2,'0')} / {String(frames.length).padStart(2,'0')}</small>{frame.label}</span>
          <div><button type="button" aria-label="Previous product photo" onClick={()=>move(-1)}>←</button><button type="button" aria-label="Next product photo" onClick={()=>move(1)}>→</button></div></div>
      </div>
    </div>
    <dialog ref={dialog} className="photo-dialog" aria-labelledby="finish-dialog-title" onClose={()=>{setOpen(false);setZoom(false)}}
      onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}}}
      onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}}>
      {open&&<div><div className="zoom-head"><div><p className="shop-kicker">{frame.label}</p><h2 id="finish-dialog-title">{p.finish} finish</h2></div><button type="button" autoFocus onClick={()=>dialog.current?.close()} aria-label="Close photo">✕</button></div>
        <div className={'zoom-scroll'+(zoom?' magnified':'')}><div className="modal-img"><FrameImage frame={frame} name={name} large/></div></div>
        <div className="zoom-tools"><button type="button" onClick={()=>move(-1)} aria-label="Previous enlarged photo">←</button>
          <button type="button" aria-pressed={zoom} onClick={()=>setZoom(z=>!z)}>{zoom?'Fit to screen':'Zoom in'}</button>
          <button type="button" onClick={()=>move(1)} aria-label="Next enlarged photo">→</button></div></div>}
    </dialog>
  </section>
}
