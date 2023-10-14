import React, { useEffect, useState } from 'react'
import { Layout } from '../components'

import '@/styles/globals.css';

import '../styles/globals.scss';
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  return (
    <>
    {/* <!-- Google tag (gtag.js) --> */}
    <Script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}`} />
        <Script dangerouslySetInnerHTML={{
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
    <Layout>
      <Component {...pageProps} />
    </Layout>
    </>
  )
} 
