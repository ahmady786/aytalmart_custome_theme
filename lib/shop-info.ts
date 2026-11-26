import {standOptionLabel} from './catalog'
// Homepage excerpts from the store FAQ; the full imported page is at /pages/faq.
export const questions = [
  ['Do you offer Cash on Delivery?', 'Yes. Cash on Delivery (COD) is available across Pakistan.'],
  ['Is there any delivery charge?', 'No. Aytal Mart currently offers free delivery across Pakistan.'],
  ['How long does delivery take?', 'Processing usually takes one business day after confirmation. Estimated delivery: Lahore 1–2 days, same province 2–3 days, other provinces 4–6 days.'],
] as const
export const footerGroups=[
  {title:'Shop',links:[['Collections','/collections'],[standOptionLabel.set,'/collection?type=set'],[standOptionLabel.single,'/collection?type=single'],['All products','/collections/all']]},
  {title:'Discover',links:[['About Aytal Mart','/pages/about-aytal-mart'],['Stand guide','/guide'],['Care & installation','/pages/care-installation-guide'],['Journal','/blogs/news']]},
  {title:'Customer care',links:[['FAQs','/pages/faq'],['Contact us','/pages/contact-aytal-mart'],['Shipping','/pages/shipping-policy'],['Returns & exchanges','/pages/return-exchange-policy']]},
  {title:'Information',links:[['Privacy','/pages/privacy-policy'],['Terms of service','/pages/terms-of-service'],['Disclaimer','/pages/disclaimer']]},
]
