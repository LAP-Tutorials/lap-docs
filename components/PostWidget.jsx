import React, { useState, useEffect} from 'react'
import moment from 'moment'
import Link from 'next/link'

import { getRecentPosts, getSimilarPosts } from '../services'

const PostWidget = ({ categories, slug}) => {
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!fetched) {
    const fetchPosts = async () => {
      const posts = slug
        ? await getSimilarPosts(categories, slug)
        : await getRecentPosts();
      setRelatedPosts(posts);
    };
    fetchPosts();
  }
  }, [categories, slug]);
  
  return (
    <div className='bg-[#141413] shadow-lg shadow-[#2196f360] border-2 border-[#2196f3] rounded-lg p-8 mb-8'>
      <h3 className='text-xl mb-8 font-semibold border-b border-[#2196f3] pb-4'>
        {slug ? 'Related Posts' : 'Recent Posts'}
      </h3>
    {relatedPosts.map((post) => (
      <div key={post.title} className="flex items-center w-full mb-4">
        <div className='w-16 flex-none'>
          <img alt={post.title}
          height="60px"
          width="60px"
          className='align-middle rounded'
          src={post.featuredImage.url}
          />
        </div>
        <div className="flex-grow ml-4">
          <p className="text-[#d4d4d4] font-xs">
            {moment(post.createdAt).format('MMM DD, YYYY')}
          </p>
          <Link href={`/post/${post.slug}`} key={post.title} className="text-md transition duration-700
hover:text-[#2196f3]" >
            {post.title}
          </Link>
        </div>

      </div>
    ))}
    </div>
  )
}

export default PostWidget