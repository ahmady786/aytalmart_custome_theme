// Render the first paint from the current header and first slide, never a stale .next export.
const path=require('node:path'),React=require('react'),{renderToString}=require('react-dom/server')
module.exports=async function heroShell(esbuild,root){
 const result=await esbuild.build({stdin:{contents:`import {BagProvider} from './components/shop/Bag';import {ShopHeader} from './components/shop/Chrome';import Hero from './components/shop/HeroCarousel';export default function Shell(){return <div className="prayer-shop" id="store-top" tabIndex={-1}><BagProvider><ShopHeader/><main id="shop-main"><Hero/></main></BagProvider></div>}`,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime'],tsconfig:path.join(root,'tsconfig.json'),plugins:[{name:'render-shell',setup(b){
 b.onResolve({filter:/^next\/(link|navigation|image)$/},a=>({path:a.path,namespace:'shell'}))
 b.onLoad({filter:/.*/,namespace:'shell'},a=>({loader:'tsx',contents:a.path==='next/link'?'export default function Link({prefetch,scroll,...p}){return <a {...p}/>}':a.path==='next/image'?'export default function Image({unoptimized,...p}){return <img {...p}/>}':"export const usePathname=()=>'/';"}))
 }}]})
 const mod={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(require,mod,mod.exports)
 return renderToString(React.createElement(mod.exports.default)).replaceAll('/brand/','__AO_ASSETS__/brand/').replaceAll('/shop/optimized/','__AO_ASSETS__/shop/optimized/').replaceAll('href="/collection?','href="__AO_SHOP__?')
}
