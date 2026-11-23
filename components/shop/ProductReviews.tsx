type Review={id:number;name:string;text:string;rating:number}
export default function ProductReviews({reviews=[]}:{reviews?:Review[]}){
  if(!reviews.length)return null
  return <section className="shop-section review-showcase" id="product-reviews" aria-labelledby="product-reviews-title">
    <header><h2 id="product-reviews-title">Customer reviews</h2></header>
    <div className="review-grid">{reviews.map(r=><figure key={r.id} className="review-card">
      {r.rating>0&&<div className="review-top"><span role="img" aria-label={r.rating+' out of 5 stars'}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span></div>}
      <blockquote>{r.text}</blockquote><figcaption>{r.name}</figcaption>
    </figure>)}</div></section>
}
