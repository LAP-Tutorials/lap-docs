import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { getPosts, getPostDetails } from '../../services'

import { PostDetail, Categories, PostWidget, Author, Comments, CommentsForm, Loader } from '../../components'

const PostDetails = ({ post }) => {
    const router = useRouter();

    if(router.isFallback) {
        return <Loader />
    }
    
    return (
        <div className='container mx-auto px-10 mb-8'>
            {/* Meta Tags */}
            <Head>
                {/* General */}
                <title>{post.title}</title>
                <meta name="description" content={post.excerpt} />
                <meta charSet="utf-8" />
                <meta name="language" content="ES" />
                <meta name="robots" content="index,follow" />
                {/* Apple */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="white" />
                {/* Facebook */}
                <meta property="og:title" content={post.title} />
                <meta property="og:image" content={post.featuredImage.url} />
                <meta property='og:description' content={post.excerpt} />
                {/* Twitter */}
                <meta name="twitter:title" content={post.title} />
                <meta name="twitter:image" content={post.featuredImage.url} />
                <meta name="twitter:card"  content={post.featuredImage.url} />
            </Head>

            <div className='grid grid-cols-1 lg:grid-cols-12 gap-12'>
                <div className='col-span-1 lg:col-span-8'>
                    <PostDetail post={post} />
                    <Author author={post.author} />
                    <CommentsForm slug={post.slug} />
                    <Comments slug={post.slug} />
                </div>
                <div className='col-span-1 lg:col-span-4'>
                    <div className='relative lg:sticky top-8'>
                        <PostWidget slug={post.slug} categories={post.categories.map((category) => category.slug)} />
                        <Categories />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostDetails

export async function getStaticProps({ params }) {
    const data = await getPostDetails(params.slug);

    return {
        props: {
            post: data
        },
    }
}

export async function getStaticPaths() {
    const posts = await getPosts();

    return {
        paths: posts.map(({ node: { slug } }) => ({ params: { slug } })), fallback: true,
    }
}