// Only accepts build-time copy from the allowlisted HTML snapshot (scripts/import-aytal.py).
export default function StoreCopy({html}:{html:string}){
  return <div className="aytal-store-copy" dangerouslySetInnerHTML={{__html:html}}/>
}
