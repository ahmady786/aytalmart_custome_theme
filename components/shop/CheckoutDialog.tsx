'use client'
import {useEffect,useRef,type ReactNode} from 'react'
import {useRouter} from 'next/navigation'

export default function CheckoutDialog({children}:{children:ReactNode}){
  const ref=useRef<HTMLDialogElement>(null),router=useRouter()
  useEffect(()=>{
    const el=ref.current!,previous=document.activeElement,overflow=document.body.style.overflow
    el.showModal();document.body.style.overflow='hidden'
    return ()=>{el.close();document.body.style.overflow=overflow;if(previous instanceof HTMLElement&&previous.isConnected)previous.focus({preventScroll:true})}
  },[])
  return <dialog className="cod-dialog" ref={ref} aria-labelledby="cod-heading" onCancel={e=>{e.preventDefault();if(!ref.current?.querySelector('[aria-busy="true"]'))router.back()}}>
    <header className="cod-head"><h2 id="cod-heading"><span aria-hidden="true">◇</span> Cash on Delivery</h2>
      <button type="button" aria-label="Close checkout" onClick={()=>{if(!ref.current?.querySelector('[aria-busy="true"]'))router.back()}}>×</button></header>
    {children}
  </dialog>
}
