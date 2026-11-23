module.exports = {
  reactStrictMode: true,
  async headers() {
    return [{source:'/shop/optimized/:file*',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}]
  },
}
