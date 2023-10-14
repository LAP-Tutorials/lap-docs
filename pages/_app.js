import React, { useEffect, useState } from 'react'
import { Layout } from '../components'

import '@/styles/globals.css';

import '../styles/globals.scss';
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  return (
    <>
    {/* <!-- Google tag (gtag.js) --> */}
<Script
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=G-K80QDVRL35`}
        />
        <Script strategy="lazyOnload">
          {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-K80QDVRL35', {
                    page_path: window.location.pathname,
                    });
                `}
        </Script>
    <Layout>
      <Component {...pageProps} />
    </Layout>
    </>
  )
} 
