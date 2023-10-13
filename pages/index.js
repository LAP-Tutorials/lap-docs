import Head from 'next/head'
import { PostCard, Categories, PostWidget } from '../components'
import { getPosts } from '../services'
import { FeaturedPosts } from '../sections'
import Script from 'next/script'

export default function Home({ posts }) {
  return (
    <main
      className="container mx-auto px-10 mb-8 "
    >
      <Head>
        {/* <!-- Google tag (gtag.js) --> */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}`} />
        <script dangerouslySetInnerHTML={{
          __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${process.env.GA_MEASUREMENT_ID}',{
    page_path: window.location.pathname,
  });
  `,
        }}
        />

        <title>LAP Docs</title>
        <meta charSet="utf-8" />
        <meta name="language" content="ES" />
        <meta name="robots" content="index,follow" />
        <meta name="author" content="Llewellyn Paintsil" />
        <meta name="keywords" content="LAP, youtube, LAP - Tutorials, lap, LAP Tutorials, technology, software, tutorials, lessons, educational, free tech tutorials,news, cool, simple, easy, easy tutorials, technology, information technology, technology definition, technology articles, technology blogs, YouTube" />
        <link rel="canonical" href="https://lap-docs.vercel.app/" />
        {/* Apple */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="#2196f3" />
        {/* Facebook */}
        <meta property="og:title" content="LAP Docs" />
        <meta property="og:image" content="/Screenshot.png" />
        <meta property='og:description' content='Making learning tech easier for all' />
        {/* Twitter */}
        <meta name="twitter:title" content="LAP Docs" />
        <meta name="twitter:image" content="/Screenshot.png" />
        <meta name="twitter:card" content="/Screenshot.png" />
        <meta name="description" content="Making learning tech easier for all" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* favicon */}
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#2196f3" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content="#2196f3" />

      </Head>
      <FeaturedPosts />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 col-span-1">
          {posts.map((post) =>
            <PostCard post={post.node} key={post.title} />
          )}
        </div>
        <div className="lg:col-span-4 col-span-1">
          <div className="lg:sticky relative top-8">
            <PostWidget />
            <Categories />
          </div>
        </div>
      </div>
    </main>
  )
}

export async function getStaticProps() {
  const posts = (await getPosts()) || [];

  return {
    props: {
      posts
    },
  }
}