document.querySelectorAll('.am-hero').forEach(hero=>{
  const slides=[...hero.querySelectorAll('.am-slide')];if(slides.length<2)return;
  const bar=document.createElement('div');bar.className='am-controls';
  const label=document.createElement('span');label.setAttribute('aria-live','polite');
  let at=0;function show(i){at=(i+slides.length)%slides.length;slides.forEach((s,n)=>{s.hidden=n!==at;s.classList.toggle('active',n===at)});label.textContent=(at+1)+' / '+slides.length}
  function button(name,glyph,step){const b=document.createElement('button');b.type='button';b.textContent=glyph;b.setAttribute('aria-label',name);b.onclick=()=>show(at+step);return b}
  bar.append(button('Previous offer','←',-1),label,button('Next offer','→',1));hero.append(bar);hero.classList.add('is-ready');show(0);
});
document.querySelectorAll('form.cart').forEach(f=>{if(f.querySelector('.am-packs'))f.classList.add('am-buy-form')});
if(window.jQuery)window.jQuery(document.body).on('change','input[name^="am_qty["]',function(){window.jQuery(document.body).trigger('update_checkout')});
