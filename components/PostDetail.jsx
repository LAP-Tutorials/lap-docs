import React from 'react'
import moment from 'moment'
import { RichText } from "@graphcms/rich-text-react-renderer";

const PostDetail = ({ post }) => {
    return (
        <div className='bg-[#141413] shadow-[#2196f360]
        border-2 border-[#2196f3] shadow-lg rounded-lg lg:p-8 pb-12 mb-8'>
            <div className="relative overflow-hidden shadow-md mb-6">
                <img src={post.featuredImage.url}
                    alt={post.title}
                    className='object-top h-full w-full rounded-t-lg' />

            </div>
            <div className='px-4 lg:px-0'>
                <div className="flex items-center mb-8 w-full">
                    <div className="flex items-center mb-4 lg:mb-0 w-full lg:w-auto mr-8">
                        <img alt={post.author.name}
                            height="30px"
                            width="30px"
                            className='align-middle rounded-full'
                            src={post.author.photo.url}
                        />
                        <p className="inline align-middle text-[#d4d4d4] ml-2 text-lg">{post.author.name}</p>
                    </div>
                    <div className='font-medium text-[#d4d4d4] mb-2'>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline mr-2 text-[#2196f3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className='align-middle'>
                            {moment(post.createdAt).format('MMM DD, YYYY')}
                        </span>
                    </div>
                </div>
                <h1 className='mb-8 text-3xl font-semibold'>{post.title}</h1>
                <RichText
                    content={post.content.raw.children}
                    renderers={{
                        // Headings
                        h1: ({ children }) => (
                            <h1 className="text-4xl leading-normal mt-0 mb-2 font-semibold">
                                {children}
                            </h1>
                        ),
                        h2: ({ children }) => (
                            <h2 className="text-3xl leading-normal mt-0 mb-2 font-semibold">
                                {children}
                            </h2>
                        ),
                        h3: ({ children }) => (
                            <h3 className="text-2xl leading-normal mt-0 mb-2 font-semibold">
                                {children}
                            </h3>
                        ),
                        h4: ({ children }) => (
                            <h4 className="text-xl leading-normal mt-0 mb-2 font-semibold">
                                {children}
                            </h4>
                        ),
                        h5: ({ children }) => (
                            <h5 className="text-lg leading-normal mt-0 mb-2 font-semibold">
                                {children}
                            </h5>
                        ),
                        h6: ({ children }) => (
                            <h6 className="text-md leading-normal mt-0 mb-2 font-semibold">
                                {children}
                            </h6>
                        ),

                        // Other Elements
                        p: ({ children }) => <p className="mb-8">{children}</p>,
                        a: ({ children, href }) => (
                            <a className="text-md text-[#2196f3] mb-8" href={href} target='_blank'>
                                {children}
                            </a>
                        ),
                        code: ({ children }) => (
                            <code className="bg-[#d4d4d4] text-black p-1 rounded-md">
                                {children}
                            </code>
                        ),
                        code_block: ({ children }) => (
                            <pre className="bg-[#d4d4d4] text-black rounded-md p-2 mb-5 ml-6">
                                <code>{children}</code>
                            </pre>
                        ),
                        img: ({ src, alt }) => (
                            <img
                                className="rounded-lg shadow-lg mb-8 mt-4"
                                src={src}
                                alt={alt}
                                loading='lazy'
                            />
                        ),
                        ul: ({ children }) => (
                            <div className='mb-3'>
                                <l1>{children}</l1>
                            </div>
                        ),
                        ol: ({ children }) => (
                            <div className='mb-3'>
                                <l1>{children}</l1>
                            </div>
                        ),
                        table: ({ children }) => (
                            <table className="table-auto mb-8">
                                <tbody>{children}</tbody>
                            </table>
                        ),
                        table_row: ({ children }) => <tr>{children}</tr>,
                        table_cell: ({ children }) => <td className="border px-4 py-2">{children}</td>,


                        blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-8">
                                {children}
                            </blockquote>
                        ),
                    }}
                />
            </div>
        </div>
    )
}

export default PostDetail